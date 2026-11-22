from datetime import datetime, timezone
from typing import Optional, List, BinaryIO
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database.models.dispute import Dispute
from app.database.models.asset import Asset
from app.database.models.audit_log import AuditLog
from app.services.storage_service import storage_service
from app.utils.file_validator import generate_safe_stored_filename
from app.schemas.dispute import DisputeStatusEnum

class DisputeService:
    @staticmethod
    def submit_dispute(
        db: Session,
        reporter_id: int,
        asset_id: str,
        description: str,
        evidence_stream: Optional[BinaryIO] = None,
        evidence_filename: Optional[str] = None
    ) -> Dispute:
        asset = db.query(Asset).filter(Asset.asset_id == asset_id).first()
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Asset with ID '{asset_id}' not found."
            )

        evidence_rel_path = None
        if evidence_stream and evidence_filename:
            stored_name = generate_safe_stored_filename(evidence_filename)
            try:
                evidence_rel_path, _ = storage_service.save_file_stream(evidence_stream, stored_name)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to store dispute evidence file: {str(e)}"
                )

        new_dispute = Dispute(
            asset_id=asset_id,
            reporter_id=reporter_id,
            description=description.strip(),
            evidence_path=evidence_rel_path,
            dispute_status="PENDING",
            created_at=datetime.now(timezone.utc),
            resolved_at=None
        )
        db.add(new_dispute)
        db.flush()

        audit = AuditLog(
            user_id=reporter_id,
            action="SUBMIT_DISPUTE",
            entity_type="DISPUTE",
            entity_id=str(new_dispute.dispute_id),
            details=f"Dispute filed against asset '{asset.title}'"
        )
        db.add(audit)
        db.commit()
        db.refresh(new_dispute)
        return new_dispute

    @staticmethod
    def get_dispute_by_id(db: Session, dispute_id: int) -> Dispute:
        disp = (
            db.query(Dispute)
            .options(
                joinedload(Dispute.asset),
                joinedload(Dispute.reporter)
            )
            .filter(Dispute.dispute_id == dispute_id)
            .first()
        )
        if not disp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dispute ID {dispute_id} not found."
            )
        return disp

    @staticmethod
    def resolve_dispute(
        db: Session,
        admin_id: int,
        admin_role: str,
        dispute_id: int,
        new_status: DisputeStatusEnum,
        resolution_notes: Optional[str] = None
    ) -> Dispute:
        if admin_role != "ADMINISTRATOR":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators are authorized to review or resolve disputes."
            )

        disp = DisputeService.get_dispute_by_id(db, dispute_id)
        old_status = disp.dispute_status
        status_val = new_status.value if hasattr(new_status, "value") else str(new_status)
        disp.dispute_status = status_val

        if status_val in ["RESOLVED", "REJECTED"]:
            disp.resolved_at = datetime.now(timezone.utc)

        audit_msg = f"Dispute status changed from {old_status} to {status_val}"
        if resolution_notes:
            audit_msg += f" | Notes: {resolution_notes.strip()}"

        audit = AuditLog(
            user_id=admin_id,
            action="RESOLVE_DISPUTE",
            entity_type="DISPUTE",
            entity_id=str(dispute_id),
            details=audit_msg
        )
        db.add(audit)
        db.commit()
        db.refresh(disp)
        return disp

    @staticmethod
    def list_disputes(
        db: Session,
        asset_id: Optional[str] = None,
        reporter_id: Optional[int] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[Dispute]:
        query = db.query(Dispute).options(
            joinedload(Dispute.asset),
            joinedload(Dispute.reporter)
        )
        if asset_id:
            query = query.filter(Dispute.asset_id == asset_id)
        if reporter_id:
            query = query.filter(Dispute.reporter_id == reporter_id)
        if status:
            query = query.filter(Dispute.dispute_status == status)

        return query.order_by(Dispute.created_at.desc()).offset(skip).limit(limit).all()
