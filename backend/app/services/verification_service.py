from datetime import datetime, timezone
from typing import BinaryIO, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database.models.asset import Asset
from app.database.models.asset_version import AssetVersion
from app.database.models.blockchain_record import BlockchainRecord
from app.database.models.verification import Verification
from app.database.models.audit_log import AuditLog
from app.services.hashing_service import HashingService
from app.services.blockchain_service import blockchain_service
from app.schemas.verification import (
    VerificationResponse,
    MatchedAssetSummary,
    MatchedVersionSummary,
    BlockchainVerificationSummary
)

class VerificationService:
    @staticmethod
    def verify_file_stream(
        db: Session,
        file_stream: BinaryIO,
        verifier_id: Optional[int] = None
    ) -> VerificationResponse:
        """
        File Verification Workflow (Module E):
        1. Generates SHA-256 fingerprint from uploaded stream.
        2. Queries database for an exact registered hash in ASSET_VERSIONS.
        3. If not found, records NOT_REGISTERED result.
        4. If found, retrieves metadata and associated blockchain record.
        5. Independently queries Solidity smart contract on-chain.
        6. Persists verification attempt in VERIFICATIONS table.
        7. Returns structured verification response.
        """
        submitted_hash = HashingService.compute_sha256_from_stream(file_stream)
        return VerificationService.verify_by_hash(db, submitted_hash, verifier_id)

    @staticmethod
    def verify_by_hash(
        db: Session,
        submitted_hash: str,
        verifier_id: Optional[int] = None
    ) -> VerificationResponse:
        submitted_hash = submitted_hash.lower().strip()
        verified_at = datetime.now(timezone.utc)

        # 1. Search database for registered version
        matched_version = (
            db.query(AssetVersion)
            .options(
                joinedload(AssetVersion.asset).joinedload(Asset.creator),
                joinedload(AssetVersion.asset).joinedload(Asset.category),
                joinedload(AssetVersion.blockchain_records)
            )
            .filter(AssetVersion.file_hash == submitted_hash)
            .first()
        )

        # 2. Case: NOT_REGISTERED
        if not matched_version:
            v_record = Verification(
                verifier_id=verifier_id,
                asset_id=None,
                submitted_hash=submitted_hash,
                verification_result="NOT_REGISTERED",
                verified_at=verified_at
            )
            db.add(v_record)
            db.commit()
            db.refresh(v_record)

            return VerificationResponse(
                verification_id=v_record.verification_id,
                submitted_hash=submitted_hash,
                verification_result="NOT_REGISTERED",
                is_match=False,
                matched_asset=None,
                matched_version=None,
                blockchain_record=None,
                verified_at=verified_at
            )

        asset = matched_version.asset
        bc_record = matched_version.blockchain_records[0] if matched_version.blockchain_records else None

        # 3. Independent On-Chain Verification
        on_chain_verified = False
        on_chain_fingerprint = None
        verification_result = "EXACT_MATCH"

        if blockchain_service.is_connected() and bc_record:
            try:
                bc_query = blockchain_service.verify_fingerprint_on_chain(
                    asset_id=asset.asset_id,
                    version_number=matched_version.version_number,
                    expected_fingerprint=submitted_hash
                )
                on_chain_fingerprint = bc_query.get("registered_fingerprint")
                if bc_query.get("is_registered") and bc_query.get("is_match"):
                    on_chain_verified = True
                    verification_result = "EXACT_MATCH"
                elif bc_query.get("is_registered") and not bc_query.get("is_match"):
                    verification_result = "BLOCKCHAIN_VERIFICATION_FAILED"
            except Exception:
                # Blockchain node query error; DB match remains valid
                pass

        # 4. Save verification log
        v_record = Verification(
            verifier_id=verifier_id,
            asset_id=asset.asset_id,
            submitted_hash=submitted_hash,
            verification_result=verification_result,
            verified_at=verified_at
        )
        db.add(v_record)

        audit = AuditLog(
            user_id=verifier_id,
            action="VERIFY_FILE",
            entity_type="VERIFICATION",
            entity_id=asset.asset_id,
            details=f"Verification executed. Result: {verification_result} for SHA-256 {submitted_hash}"
        )
        db.add(audit)
        db.commit()
        db.refresh(v_record)

        # 5. Build structured response
        asset_summary = MatchedAssetSummary(
            asset_id=asset.asset_id,
            title=asset.title,
            description=asset.description,
            creator_id=asset.creator_id,
            creator_name=asset.creator.full_name if asset.creator else None,
            category_name=asset.category.category_name if asset.category else None,
            original_filename=asset.original_filename,
            registration_status=asset.registration_status,
            registered_at=asset.registered_at
        )

        version_summary = MatchedVersionSummary(
            version_id=matched_version.version_id,
            version_number=matched_version.version_number,
            file_hash=matched_version.file_hash,
            hash_algorithm=matched_version.hash_algorithm,
            created_at=matched_version.created_at
        )

        bc_summary = None
        if bc_record:
            bc_summary = BlockchainVerificationSummary(
                transaction_hash=bc_record.transaction_hash,
                block_number=bc_record.block_number,
                network_name=bc_record.network_name,
                contract_address=bc_record.contract_address,
                blockchain_timestamp=bc_record.blockchain_timestamp,
                on_chain_fingerprint=on_chain_fingerprint or matched_version.file_hash,
                on_chain_verified=on_chain_verified
            )

        return VerificationResponse(
            verification_id=v_record.verification_id,
            submitted_hash=submitted_hash,
            verification_result=verification_result,
            is_match=(verification_result == "EXACT_MATCH"),
            matched_asset=asset_summary,
            matched_version=version_summary,
            blockchain_record=bc_summary,
            verified_at=verified_at
        )

    @staticmethod
    def get_verification_by_id(db: Session, verification_id: int) -> Verification:
        record = (
            db.query(Verification)
            .options(
                joinedload(Verification.asset),
                joinedload(Verification.verifier)
            )
            .filter(Verification.verification_id == verification_id)
            .first()
        )
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Verification record with ID {verification_id} not found."
            )
        return record
