from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from app.database.models.asset import Asset
from app.database.models.asset_version import AssetVersion
from app.database.models.blockchain_record import BlockchainRecord
from app.database.models.ownership_history import OwnershipHistory
from app.database.models.audit_log import AuditLog

class AssetRepository:
    @staticmethod
    def get_by_id(db: Session, asset_id: str) -> Optional[Asset]:
        return (
            db.query(Asset)
            .options(
                joinedload(Asset.creator),
                joinedload(Asset.category),
                joinedload(Asset.versions),
                joinedload(Asset.blockchain_records),
            )
            .filter(Asset.asset_id == asset_id)
            .first()
        )

    @staticmethod
    def get_version_by_id(db: Session, version_id: int) -> Optional[AssetVersion]:
        return (
            db.query(AssetVersion)
            .options(
                joinedload(AssetVersion.asset),
                joinedload(AssetVersion.blockchain_records)
            )
            .filter(AssetVersion.version_id == version_id)
            .first()
        )

    @staticmethod
    def get_version_by_hash(db: Session, file_hash: str) -> Optional[AssetVersion]:
        return (
            db.query(AssetVersion)
            .options(joinedload(AssetVersion.asset))
            .filter(AssetVersion.file_hash == file_hash.lower())
            .first()
        )

    @staticmethod
    def list_assets(
        db: Session,
        creator_id: Optional[int] = None,
        category_id: Optional[int] = None,
        visibility: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Asset], int]:
        query = db.query(Asset)
        if creator_id is not None:
            query = query.filter(Asset.creator_id == creator_id)
        if category_id is not None:
            query = query.filter(Asset.category_id == category_id)
        if visibility is not None:
            query = query.filter(Asset.visibility == visibility)
        
        total = query.count()
        assets = query.order_by(Asset.created_at.desc()).offset(skip).limit(limit).all()
        return assets, total

    @staticmethod
    def create_asset_with_initial_version(
        db: Session,
        asset: Asset,
        initial_version: AssetVersion,
        audit_details: Optional[str] = None
    ) -> Asset:
        try:
            db.add(asset)
            db.flush()  # Populates asset.asset_id before version insertion
            initial_version.asset_id = asset.asset_id
            db.add(initial_version)

            # Record initial ownership claim
            history_record = OwnershipHistory(
                asset_id=asset.asset_id,
                previous_owner_id=None,
                new_owner_id=asset.creator_id,
                transaction_reference="INITIAL_REGISTRATION"
            )
            db.add(history_record)

            # Audit log
            audit = AuditLog(
                user_id=asset.creator_id,
                action="REGISTER_ASSET",
                entity_type="ASSET",
                entity_id=asset.asset_id,
                details=audit_details or f"Initial registration for asset '{asset.title}'"
            )
            db.add(audit)

            db.commit()
            db.refresh(asset)
            return asset
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def add_blockchain_record(
        db: Session,
        asset_id: str,
        version_id: int,
        transaction_hash: str,
        block_number: int,
        network_name: str,
        contract_address: str,
        blockchain_timestamp: datetime,
        transaction_status: str = "CONFIRMED"
    ) -> BlockchainRecord:
        record = BlockchainRecord(
            asset_id=asset_id,
            version_id=version_id,
            transaction_hash=transaction_hash,
            block_number=block_number,
            network_name=network_name,
            contract_address=contract_address,
            blockchain_timestamp=blockchain_timestamp,
            transaction_status=transaction_status
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def get_blockchain_records(db: Session, asset_id: str) -> List[BlockchainRecord]:
        return (
            db.query(BlockchainRecord)
            .filter(BlockchainRecord.asset_id == asset_id)
            .order_by(BlockchainRecord.created_at.asc())
            .all()
        )

    @staticmethod
    def get_ownership_history(db: Session, asset_id: str) -> List[OwnershipHistory]:
        return (
            db.query(OwnershipHistory)
            .options(
                joinedload(OwnershipHistory.previous_owner),
                joinedload(OwnershipHistory.new_owner)
            )
            .filter(OwnershipHistory.asset_id == asset_id)
            .order_by(OwnershipHistory.changed_at.asc())
            .all()
        )
