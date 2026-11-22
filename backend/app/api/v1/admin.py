from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session, joinedload
from app.database.session import get_db
from app.database.models.user import User
from app.database.models.asset import Asset
from app.database.models.dispute import Dispute
from app.database.models.audit_log import AuditLog
from app.schemas.user import UserResponse
from app.schemas.asset import AssetDetailResponse, AssetVersionResponse, BlockchainRecordSummary
from app.schemas.dispute import DisputeResponse
from app.schemas.audit_log import AuditLogResponse
from app.core.dependencies import require_roles

router = APIRouter(prefix="/admin", tags=["Administrator Operations"])

@router.get(
    "/users",
    response_model=List[UserResponse],
    summary="List all platform users with role and status filtering (Admin only)"
)
def list_users(
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("ADMINISTRATOR"))
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.account_status == status)
    return query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

@router.get(
    "/assets",
    response_model=List[AssetDetailResponse],
    summary="List all digital assets including versions and blockchain state (Admin only)"
)
def list_all_assets_admin(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("ADMINISTRATOR"))
):
    query = db.query(Asset).options(
        joinedload(Asset.creator),
        joinedload(Asset.category),
        joinedload(Asset.versions),
        joinedload(Asset.blockchain_records)
    )
    if status:
        query = query.filter(Asset.registration_status == status)

    assets = query.order_by(Asset.created_at.desc()).offset(skip).limit(limit).all()
    results = []
    for a in assets:
        results.append(AssetDetailResponse(
            asset_id=a.asset_id,
            creator_id=a.creator_id,
            category_id=a.category_id,
            title=a.title,
            description=a.description,
            original_filename=a.original_filename,
            stored_filename=a.stored_filename,
            file_size=a.file_size,
            mime_type=a.mime_type,
            visibility=a.visibility,
            registration_status=a.registration_status,
            created_at=a.created_at,
            registered_at=a.registered_at,
            creator_name=a.creator.full_name if a.creator else None,
            category_name=a.category.category_name if a.category else None,
            current_version=a.versions[-1] if a.versions else None,
            versions=a.versions,
            blockchain_records=a.blockchain_records
        ))
    return results

@router.get(
    "/disputes",
    response_model=List[DisputeResponse],
    summary="Review open dispute queue (Admin only)"
)
def list_disputes_admin(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("ADMINISTRATOR"))
):
    query = db.query(Dispute).options(
        joinedload(Dispute.asset),
        joinedload(Dispute.reporter)
    )
    if status:
        query = query.filter(Dispute.dispute_status == status)
    else:
        # Default prioritize unresolved disputes
        query = query.filter(Dispute.dispute_status.in_(["PENDING", "UNDER_REVIEW"]))

    disputes = query.order_by(Dispute.created_at.asc()).offset(skip).limit(limit).all()
    return [
        DisputeResponse(
            dispute_id=d.dispute_id,
            asset_id=d.asset_id,
            asset_title=d.asset.title if d.asset else None,
            reporter_id=d.reporter_id,
            reporter_name=d.reporter.full_name if d.reporter else None,
            description=d.description,
            evidence_path=d.evidence_path,
            dispute_status=d.dispute_status,
            created_at=d.created_at,
            resolved_at=d.resolved_at
        )
        for d in disputes
    ]

@router.get(
    "/audit-logs",
    response_model=List[AuditLogResponse],
    summary="Access immutable platform audit logs (Admin only)"
)
def list_audit_logs(
    entity_type: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("ADMINISTRATOR"))
):
    query = db.query(AuditLog).options(joinedload(AuditLog.user))
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return [
        AuditLogResponse(
            log_id=log.log_id,
            user_id=log.user_id,
            user_email=log.user.email if log.user else None,
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            details=log.details,
            created_at=log.created_at
        )
        for log in logs
    ]
