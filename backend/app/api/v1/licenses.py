from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models.user import User
from app.schemas.license import LicenseCreate, LicenseStatusUpdate, LicenseResponse
from app.services.licensing_service import LicensingService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/licenses", tags=["Licensing"])

@router.post(
    "",
    response_model=LicenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Issue a new license for a registered digital asset"
)
def create_license(
    license_in: LicenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Module G - Licensing Management:
    Allows a creator to grant Personal, Educational, Commercial, or Custom licenses
    to another registered user.
    """
    new_license = LicensingService.create_license(
        db=db,
        creator_id=current_user.user_id,
        license_in=license_in,
        user_role=current_user.role
    )
    return LicenseResponse(
        license_id=new_license.license_id,
        asset_id=new_license.asset_id,
        asset_title=new_license.asset.title if new_license.asset else None,
        creator_id=new_license.creator_id,
        creator_name=new_license.creator.full_name if new_license.creator else None,
        licensee_id=new_license.licensee_id,
        licensee_name=new_license.licensee.full_name if new_license.licensee else None,
        license_type=new_license.license_type,
        description=new_license.description,
        start_date=new_license.start_date,
        expiry_date=new_license.expiry_date,
        status=new_license.status,
        created_at=new_license.created_at
    )

@router.get(
    "",
    response_model=List[LicenseResponse],
    summary="List licenses with filtering options"
)
def list_licenses(
    asset_id: Optional[str] = Query(None, description="Filter by asset ID"),
    creator_id: Optional[int] = Query(None, description="Filter by creator user ID"),
    licensee_id: Optional[int] = Query(None, description="Filter by licensee user ID"),
    status: Optional[str] = Query(None, description="Filter by status (ACTIVE, EXPIRED, REVOKED)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    licenses = LicensingService.list_licenses(
        db=db,
        asset_id=asset_id,
        creator_id=creator_id,
        licensee_id=licensee_id,
        status=status,
        skip=skip,
        limit=limit
    )
    return [
        LicenseResponse(
            license_id=l.license_id,
            asset_id=l.asset_id,
            asset_title=l.asset.title if l.asset else None,
            creator_id=l.creator_id,
            creator_name=l.creator.full_name if l.creator else None,
            licensee_id=l.licensee_id,
            licensee_name=l.licensee.full_name if l.licensee else None,
            license_type=l.license_type,
            description=l.description,
            start_date=l.start_date,
            expiry_date=l.expiry_date,
            status=l.status,
            created_at=l.created_at
        )
        for l in licenses
    ]

@router.get(
    "/{license_id}",
    response_model=LicenseResponse,
    summary="Retrieve details of a specific license"
)
def get_license(
    license_id: int,
    db: Session = Depends(get_db)
):
    l = LicensingService.get_license_by_id(db, license_id)
    return LicenseResponse(
        license_id=l.license_id,
        asset_id=l.asset_id,
        asset_title=l.asset.title if l.asset else None,
        creator_id=l.creator_id,
        creator_name=l.creator.full_name if l.creator else None,
        licensee_id=l.licensee_id,
        licensee_name=l.licensee.full_name if l.licensee else None,
        license_type=l.license_type,
        description=l.description,
        start_date=l.start_date,
        expiry_date=l.expiry_date,
        status=l.status,
        created_at=l.created_at
    )

@router.patch(
    "/{license_id}/status",
    response_model=LicenseResponse,
    summary="Update license status (Revoke, Expire, Activate)"
)
def update_license_status(
    license_id: int,
    update_data: LicenseStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated = LicensingService.update_license_status(
        db=db,
        license_id=license_id,
        new_status=update_data.status,
        user_id=current_user.user_id,
        user_role=current_user.role
    )
    return LicenseResponse(
        license_id=updated.license_id,
        asset_id=updated.asset_id,
        asset_title=updated.asset.title if updated.asset else None,
        creator_id=updated.creator_id,
        creator_name=updated.creator.full_name if updated.creator else None,
        licensee_id=updated.licensee_id,
        licensee_name=updated.licensee.full_name if updated.licensee else None,
        license_type=updated.license_type,
        description=updated.description,
        start_date=updated.start_date,
        expiry_date=updated.expiry_date,
        status=updated.status,
        created_at=updated.created_at
    )
