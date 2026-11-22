from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.database.models.asset import Asset
from app.database.models.user import User
from app.database.models.ownership_history import OwnershipHistory
from app.database.models.audit_log import AuditLog
from app.repositories.asset_repository import AssetRepository

class OwnershipService:
    @staticmethod
    def transfer_registered_claim(
        db: Session,
        current_user_id: int,
        user_role: str,
        asset_id: str,
        new_owner_id: int,
        transaction_reference: Optional[str] = None
    ) -> OwnershipHistory:
        """
        Module H - Ownership History:
        Transfers registered claim from current registered owner to a new user.
        Records an immutable event in OWNERSHIP_HISTORY and logs an audit record.
        """
        asset = AssetRepository.get_by_id(db, asset_id)
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Asset '{asset_id}' not found."
            )

        if asset.creator_id != current_user_id and user_role != "ADMINISTRATOR":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the current registered owner or an administrator can transfer this claim."
            )

        if asset.creator_id == new_owner_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New claimant cannot be identical to the current registered owner."
            )

        new_owner = db.query(User).filter(User.user_id == new_owner_id).first()
        if not new_owner:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"New owner user ID {new_owner_id} not found."
            )
        if new_owner.account_status != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot transfer claim to an inactive or suspended user."
            )

        previous_owner_id = asset.creator_id
        asset.creator_id = new_owner_id

        history_entry = OwnershipHistory(
            asset_id=asset.asset_id,
            previous_owner_id=previous_owner_id,
            new_owner_id=new_owner_id,
            transaction_reference=transaction_reference or "TRANSFER_CLAIM_REQUEST",
            changed_at=datetime.now(timezone.utc)
        )
        db.add(history_entry)

        audit = AuditLog(
            user_id=current_user_id,
            action="TRANSFER_CLAIM",
            entity_type="ASSET",
            entity_id=asset.asset_id,
            details=f"Transferred registered claim from User {previous_owner_id} to User {new_owner_id}"
        )
        db.add(audit)
        db.commit()
        db.refresh(history_entry)
        return history_entry
