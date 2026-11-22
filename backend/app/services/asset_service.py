import uuid
import logging
from typing import BinaryIO, Optional, List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.database.models.asset import Asset
from app.database.models.asset_version import AssetVersion
from app.database.models.category import Category
from app.database.models.audit_log import AuditLog
from app.database.models.blockchain_record import BlockchainRecord
from app.repositories.asset_repository import AssetRepository
from app.services.hashing_service import HashingService
from app.services.storage_service import storage_service
from app.services.blockchain_service import (
    blockchain_service,
    BlockchainError,
    BlockchainConnectionError,
    BlockchainTransactionError
)
from app.utils.file_validator import (
    validate_file_extension_and_mime,
    validate_file_size,
    generate_safe_stored_filename
)

logger = logging.getLogger("chainproof.assets")

class AssetService:
    @staticmethod
    def register_digital_asset(
        db: Session,
        creator_id: int,
        title: str,
        description: Optional[str],
        category_id: int,
        visibility: str,
        original_filename: str,
        file_stream: BinaryIO,
        file_size: int,
        content_type: str
    ) -> Asset:
        # 1. Validate category existence
        category = db.query(Category).filter(Category.category_id == category_id).first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category ID {category_id} does not exist."
            )

        # 2. Validate file metadata and contents
        ext, resolved_mime = validate_file_extension_and_mime(original_filename, content_type)
        validate_file_size(file_size)

        # 3. Compute SHA-256 fingerprint before saving
        fingerprint = HashingService.compute_sha256_from_stream(file_stream)

        # 4. Conflict detection: Check for existing identical fingerprint
        existing_version = AssetRepository.get_version_by_hash(db, fingerprint)
        is_conflict = False
        conflict_details = None

        if existing_version:
            # If same creator tries to register identical file
            if existing_version.asset.creator_id == creator_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Identical file fingerprint ({fingerprint}) is already registered under your asset '{existing_version.asset_id}' (Version {existing_version.version_number})."
                )
            # Competing claim from different creator or separate entity: preserve claim and flag conflict
            is_conflict = True
            conflict_details = (
                f"POTENTIAL_CLAIM_CONFLICT: Identical fingerprint was previously registered "
                f"under Asset ID '{existing_version.asset_id}' by User {existing_version.asset.creator_id} "
                f"at {existing_version.created_at.isoformat()}."
            )
            logger.warning(conflict_details)

        # 5. Generate secure asset ID and safe storage path
        asset_id = f"ast-{uuid.uuid4().hex[:12]}"
        stored_filename = generate_safe_stored_filename(original_filename)

        # 6. Save stream to persistent safe storage
        try:
            rel_path, bytes_written = storage_service.save_file_stream(file_stream, stored_filename)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to securely store uploaded file: {str(e)}"
            )

        # 7. Construct Asset entity with PENDING status
        new_asset = Asset(
            asset_id=asset_id,
            creator_id=creator_id,
            category_id=category_id,
            title=title.strip(),
            description=description.strip() if description else None,
            original_filename=original_filename,
            stored_filename=stored_filename,
            file_path=rel_path,
            file_size=file_size if file_size > 0 else bytes_written,
            mime_type=resolved_mime,
            visibility=visibility,
            registration_status="PENDING",
            registered_at=None
        )

        # 8. Construct initial AssetVersion (v1)
        initial_version = AssetVersion(
            asset_id=asset_id,
            version_number=1,
            file_hash=fingerprint,
            hash_algorithm="SHA-256",
            file_path=rel_path
        )

        audit_msg = f"Asset registered with SHA-256: {fingerprint}"
        if is_conflict and conflict_details:
            audit_msg += f" | {conflict_details}"

        # 9. Atomically persist to database
        try:
            created_asset = AssetRepository.create_asset_with_initial_version(
                db=db,
                asset=new_asset,
                initial_version=initial_version,
                audit_details=audit_msg
            )
        except Exception as e:
            storage_service.delete_file(stored_filename)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database registration failed: {str(e)}"
            )

        # 10. Attempt blockchain registration if node is available
        AssetService._attempt_blockchain_submission(db, created_asset, initial_version)
        db.refresh(created_asset)
        return created_asset

    @staticmethod
    def _attempt_blockchain_submission(
        db: Session,
        asset: Asset,
        version: AssetVersion
    ) -> None:
        """
        Attempts to submit the asset fingerprint to the smart contract.
        Handles errors separately so database state is preserved even if blockchain node is offline.
        """
        try:
            if not blockchain_service.is_connected():
                logger.info(f"Local blockchain node is offline. Asset {asset.asset_id} remains in PENDING status.")
                audit = AuditLog(
                    user_id=asset.creator_id,
                    action="BLOCKCHAIN_QUEUED",
                    entity_type="ASSET",
                    entity_id=asset.asset_id,
                    details="Local blockchain node unreachable; queued for subsequent confirmation."
                )
                db.add(audit)
                db.commit()
                return

            # Submit on-chain
            bc_result = blockchain_service.register_fingerprint_on_chain(
                asset_id=asset.asset_id,
                version_number=version.version_number,
                fingerprint=version.file_hash
            )

            # Record on-chain confirmation in database
            AssetRepository.add_blockchain_record(
                db=db,
                asset_id=asset.asset_id,
                version_id=version.version_id,
                transaction_hash=bc_result["transaction_hash"],
                block_number=bc_result["block_number"],
                network_name=bc_result["network_name"],
                contract_address=bc_result["contract_address"],
                blockchain_timestamp=bc_result["blockchain_timestamp"],
                transaction_status="CONFIRMED"
            )

            # Update asset confirmation status
            asset.registration_status = "CONFIRMED"
            asset.registered_at = bc_result["blockchain_timestamp"]

            audit = AuditLog(
                user_id=asset.creator_id,
                action="BLOCKCHAIN_CONFIRMED",
                entity_type="BLOCKCHAIN_RECORD",
                entity_id=bc_result["transaction_hash"],
                details=f"Smart contract confirmed on block {bc_result['block_number']}"
            )
            db.add(audit)
            db.commit()
            logger.info(f"Asset {asset.asset_id} confirmed on-chain in tx {bc_result['transaction_hash']}")

        except BlockchainError as be:
            logger.error(f"Blockchain submission error for asset {asset.asset_id}: {be}")
            asset.registration_status = "FAILED"
            audit = AuditLog(
                user_id=asset.creator_id,
                action="BLOCKCHAIN_FAILED",
                entity_type="ASSET",
                entity_id=asset.asset_id,
                details=f"Blockchain submission failed: {str(be)}"
            )
            db.add(audit)
            db.commit()
        except Exception as ex:
            logger.error(f"Unexpected error during blockchain submission for {asset.asset_id}: {ex}")
            asset.registration_status = "FAILED"
            audit = AuditLog(
                user_id=asset.creator_id,
                action="BLOCKCHAIN_FAILED",
                entity_type="ASSET",
                entity_id=asset.asset_id,
                details=f"Unexpected submission error: {str(ex)}"
            )
            db.add(audit)
            db.commit()

    @staticmethod
    def retry_blockchain_submission(
        db: Session,
        asset_id: str,
        version_number: int = 1
    ) -> Dict[str, Any]:
        """
        Retries blockchain fingerprint registration for a pending or failed asset version.
        Safe and idempotent: checks existing blockchain records and on-chain state before submitting.
        """
        asset = AssetService.get_asset_by_id(db, asset_id)
        version = next((v for v in asset.versions if v.version_number == version_number), None)
        if not version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Version {version_number} of asset '{asset_id}' not found."
            )

        # Check if already confirmed in database
        existing_bc = db.query(BlockchainRecord).filter(
            BlockchainRecord.asset_id == asset_id,
            BlockchainRecord.version_id == version.version_id,
            BlockchainRecord.transaction_status == "CONFIRMED"
        ).first()

        if existing_bc and asset.registration_status == "CONFIRMED":
            return {
                "asset_id": asset_id,
                "version_number": version_number,
                "status": "ALREADY_CONFIRMED",
                "transaction_hash": existing_bc.transaction_hash,
                "block_number": existing_bc.block_number,
                "blockchain_timestamp": existing_bc.blockchain_timestamp,
                "message": "Asset version is already confirmed on-chain."
            }

        if not blockchain_service.is_connected():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Local blockchain network is unreachable. Ensure 'npx hardhat node' is running."
            )

        try:
            bc_result = blockchain_service.register_fingerprint_on_chain(
                asset_id=asset_id,
                version_number=version.version_number,
                fingerprint=version.file_hash
            )

            # Save or update blockchain record
            if not existing_bc:
                AssetRepository.add_blockchain_record(
                    db=db,
                    asset_id=asset.asset_id,
                    version_id=version.version_id,
                    transaction_hash=bc_result["transaction_hash"],
                    block_number=bc_result["block_number"],
                    network_name=bc_result["network_name"],
                    contract_address=bc_result["contract_address"],
                    blockchain_timestamp=bc_result["blockchain_timestamp"],
                    transaction_status="CONFIRMED"
                )
            else:
                existing_bc.transaction_status = "CONFIRMED"
                existing_bc.transaction_hash = bc_result["transaction_hash"]
                existing_bc.block_number = bc_result["block_number"]
                existing_bc.blockchain_timestamp = bc_result["blockchain_timestamp"]
                db.commit()

            asset.registration_status = "CONFIRMED"
            asset.registered_at = bc_result["blockchain_timestamp"]
            audit = AuditLog(
                user_id=asset.creator_id,
                action="BLOCKCHAIN_RETRY_CONFIRMED",
                entity_type="ASSET",
                entity_id=asset.asset_id,
                details=f"Retry succeeded: on-chain record confirmed on block {bc_result['block_number']}"
            )
            db.add(audit)
            db.commit()

            return {
                "asset_id": asset_id,
                "version_number": version_number,
                "status": "CONFIRMED",
                "transaction_hash": bc_result["transaction_hash"],
                "block_number": bc_result["block_number"],
                "blockchain_timestamp": bc_result["blockchain_timestamp"],
                "message": "Blockchain registration successfully confirmed."
            }

        except BlockchainError as be:
            asset.registration_status = "FAILED"
            audit = AuditLog(
                user_id=asset.creator_id,
                action="BLOCKCHAIN_RETRY_FAILED",
                entity_type="ASSET",
                entity_id=asset.asset_id,
                details=f"Retry failed: {str(be)}"
            )
            db.add(audit)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Blockchain retry failed: {str(be)}"
            )

    @staticmethod
    def verify_version_on_chain(
        db: Session,
        version_id: int
    ) -> Dict[str, Any]:
        """
        Reads an asset version and checks on-chain cryptographic fingerprint integrity.
        """
        version = AssetRepository.get_version_by_id(db, version_id)
        if not version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Version ID {version_id} not found."
            )

        asset = version.asset
        if not blockchain_service.is_connected():
            return {
                "version_id": version.version_id,
                "asset_id": version.asset_id,
                "version_number": version.version_number,
                "database_fingerprint": version.file_hash,
                "blockchain_verification_result": "NODE_OFFLINE",
                "is_match": False,
                "message": "Blockchain node is currently unreachable."
            }

        try:
            bc_data = blockchain_service.verify_fingerprint_on_chain(
                asset_id=version.asset_id,
                version_number=version.version_number,
                expected_fingerprint=version.file_hash
            )

            result_label = "NOT_REGISTERED"
            if bc_data["is_registered"]:
                result_label = "EXACT_MATCH" if bc_data["is_match"] else "HASH_MISMATCH"

            return {
                "version_id": version.version_id,
                "asset_id": version.asset_id,
                "version_number": version.version_number,
                "database_fingerprint": version.file_hash,
                "blockchain_fingerprint": bc_data["registered_fingerprint"],
                "blockchain_verification_result": result_label,
                "is_match": bc_data["is_match"],
                "is_registered": bc_data["is_registered"],
                "blockchain_timestamp": bc_data["blockchain_timestamp"],
                "contract_address": bc_data["contract_address"],
                "registrant": bc_data["registrant"]
            }
        except BlockchainError as be:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Blockchain verification query failed: {str(be)}"
            )

    @staticmethod
    def get_asset_by_id(db: Session, asset_id: str) -> Asset:
        asset = AssetRepository.get_by_id(db, asset_id)
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Asset with ID '{asset_id}' not found."
            )
        return asset

    @staticmethod
    def list_assets(
        db: Session,
        creator_id: Optional[int] = None,
        category_id: Optional[int] = None,
        visibility: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Asset], int]:
        return AssetRepository.list_assets(
            db=db,
            creator_id=creator_id,
            category_id=category_id,
            visibility=visibility,
            skip=skip,
            limit=limit
        )

    @staticmethod
    def get_asset_versions(db: Session, asset_id: str) -> List[AssetVersion]:
        asset = AssetService.get_asset_by_id(db, asset_id)
        return asset.versions

    @staticmethod
    def create_asset_version(
        db: Session,
        asset_id: str,
        user_id: int,
        user_role: str,
        original_filename: str,
        file_stream: BinaryIO,
        file_size: int,
        content_type: str
    ) -> AssetVersion:
        """
        Module F - Asset Version Management:
        Uploads an updated version of an existing asset, computes its SHA-256 fingerprint,
        increments the version counter, saves version history, and submits it to the smart contract.
        """
        asset = AssetService.get_asset_by_id(db, asset_id)
        if asset.creator_id != user_id and user_role != "ADMINISTRATOR":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the registered creator or an administrator can add new versions."
            )

        validate_file_extension_and_mime(original_filename, content_type)
        validate_file_size(file_size)

        fingerprint = HashingService.compute_sha256_from_stream(file_stream)

        # Reject identical re-upload of the same version on this asset
        for v in asset.versions:
            if v.file_hash == fingerprint:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"This exact file content is already registered as Version {v.version_number} of this asset."
                )

        next_version_num = max([v.version_number for v in asset.versions], default=0) + 1
        stored_filename = generate_safe_stored_filename(original_filename)

        try:
            rel_path, bytes_written = storage_service.save_file_stream(file_stream, stored_filename)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to store version file: {str(e)}"
            )

        new_version = AssetVersion(
            asset_id=asset.asset_id,
            version_number=next_version_num,
            file_hash=fingerprint,
            hash_algorithm="SHA-256",
            file_path=rel_path
        )
        db.add(new_version)
        db.flush()

        audit = AuditLog(
            user_id=user_id,
            action="ADD_VERSION",
            entity_type="ASSET_VERSION",
            entity_id=f"{asset.asset_id}_v{next_version_num}",
            details=f"Version {next_version_num} registered with SHA-256: {fingerprint}"
        )
        db.add(audit)
        db.commit()
        db.refresh(new_version)

        # Attempt on-chain registration for the new version
        AssetService._attempt_blockchain_submission(db, asset, new_version)
        db.refresh(new_version)
        return new_version

    @staticmethod
    def get_asset_history(db: Session, asset_id: str):
        AssetService.get_asset_by_id(db, asset_id)
        return AssetRepository.get_ownership_history(db, asset_id)
