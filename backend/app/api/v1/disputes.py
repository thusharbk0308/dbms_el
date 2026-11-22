from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models.user import User
from app.schemas.dispute import DisputeResponse, DisputeStatusUpdate, DisputeStatusEnum
from app.services.dispute_service import DisputeService
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/disputes", tags=["Disputes"])

@router.post(
    "",
    response_model=DisputeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a dispute report against a registered digital asset"
)
async def submit_dispute(
    asset_id: str = Form(..., description="ID of the asset in dispute"),
    description: str = Form(..., min_length=10, max_length=2000, description="Detailed explanation of the IP conflict"),
    evidence_file: Optional[UploadFile] = File(None, description="Optional supporting document or evidence file"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Module I - Dispute Management:
    Allows registered creators or users to report copyright infringement or conflicting claims.
    """
    evidence_stream = evidence_file.file if evidence_file else None
    evidence_name = evidence_file.filename if evidence_file else None

    disp = DisputeService.submit_dispute(
        db=db,
        reporter_id=current_user.user_id,
        asset_id=asset_id,
        description=description,
        evidence_stream=evidence_stream,
        evidence_filename=evidence_name
    )
    return DisputeResponse(
        dispute_id=disp.dispute_id,
        asset_id=disp.asset_id,
        asset_title=disp.asset.title if disp.asset else None,
        reporter_id=disp.reporter_id,
        reporter_name=disp.reporter.full_name if disp.reporter else None,
        description=disp.description,
        evidence_path=disp.evidence_path,
        dispute_status=disp.dispute_status,
        created_at=disp.created_at,
        resolved_at=disp.resolved_at
    )

@router.get(
    "",
    response_model=List[DisputeResponse],
    summary="List submitted disputes with filtering"
)
def list_disputes(
    asset_id: Optional[str] = Query(None),
    reporter_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    disputes = DisputeService.list_disputes(
        db=db,
        asset_id=asset_id,
        reporter_id=reporter_id,
        status=status,
        skip=skip,
        limit=limit
    )
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
    "/{dispute_id}",
    response_model=DisputeResponse,
    summary="Retrieve details of a specific dispute"
)
def get_dispute(
    dispute_id: int,
    db: Session = Depends(get_db)
):
    d = DisputeService.get_dispute_by_id(db, dispute_id)
    return DisputeResponse(
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

@router.patch(
    "/{dispute_id}/status",
    response_model=DisputeResponse,
    summary="Review or resolve dispute (Administrator only)"
)
def resolve_dispute(
    dispute_id: int,
    update_data: DisputeStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("ADMINISTRATOR"))
):
    updated = DisputeService.resolve_dispute(
        db=db,
        admin_id=admin.user_id,
        admin_role=admin.role,
        dispute_id=dispute_id,
        new_status=update_data.dispute_status,
        resolution_notes=update_data.resolution_notes
    )
    return DisputeResponse(
        dispute_id=updated.dispute_id,
        asset_id=updated.asset_id,
        asset_title=updated.asset.title if updated.asset else None,
        reporter_id=updated.reporter_id,
        reporter_name=updated.reporter.full_name if updated.reporter else None,
        description=updated.description,
        evidence_path=updated.evidence_path,
        dispute_status=updated.dispute_status,
        created_at=updated.created_at,
        resolved_at=updated.resolved_at,
        resolution_notes=update_data.resolution_notes
    )
