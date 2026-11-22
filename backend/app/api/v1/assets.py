from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, status, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models.user import User
from app.schemas.asset import (
    AssetResponse, AssetDetailResponse, AssetVersionResponse,
    OwnershipHistoryResponse, AssetVisibility
)
from app.services.asset_service import AssetService
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.post(
    "/register",
    response_model=AssetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new digital asset with cryptographic SHA-256 fingerprint"
)
async def register_asset(
    title: str = Form(..., min_length=2, max_length=255, description="Title of the digital asset"),
    category_id: int = Form(..., description="Foreign key reference to Category ID"),
    description: Optional[str] = Form(None, description="Detailed description of the digital work"),
    visibility: AssetVisibility = Form(AssetVisibility.PUBLIC, description="Public, Private, or Unlisted"),
    file: UploadFile = File(..., description="The digital asset binary file to register"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("CREATOR", "ADMINISTRATOR"))
):
    """
    Module B - Digital Asset Registration Workflow:
    1. Authenticates creator identity.
    2. Validates file extension, size, and MIME content.
    3. Computes 64-character SHA-256 fingerprint via chunked hashing.
    4. Enforces duplicate fingerprint prevention.
    5. Saves binary file securely in persistent storage.
    6. Creates ASSETS record with PENDING status.
    7. Creates initial ASSET_VERSIONS record (v1).
    8. Records initial ownership claim in OWNERSHIP_HISTORY.
    """
    # Read file contents and length
    file_bytes = await file.read()
    file_size = len(file_bytes)
    await file.seek(0)

    asset = AssetService.register_digital_asset(
        db=db,
        creator_id=current_user.user_id,
        title=title,
        description=description,
        category_id=category_id,
        visibility=visibility.value,
        original_filename=file.filename or "unknown",
        file_stream=file.file,
        file_size=file_size,
        content_type=file.content_type or ""
    )
    return asset

@router.get(
    "",
    response_model=List[AssetResponse],
    summary="List registered digital assets with filtering and pagination"
)
def list_assets(
    creator_id: Optional[int] = Query(None, description="Filter assets by creator user ID"),
    category_id: Optional[int] = Query(None, description="Filter assets by category ID"),
    visibility: Optional[str] = Query(None, description="Filter by visibility (PUBLIC, PRIVATE, UNLISTED)"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """Retrieves paginated digital assets matching criteria."""
    assets, _ = AssetService.list_assets(
        db=db,
        creator_id=creator_id,
        category_id=category_id,
        visibility=visibility,
        skip=skip,
        limit=limit
    )
    return assets

@router.get(
    "/{asset_id}",
    response_model=AssetDetailResponse,
    summary="Retrieve detailed metadata and registered versions for an asset"
)
def get_asset_details(
    asset_id: str,
    db: Session = Depends(get_db)
):
    """Returns comprehensive asset details including creator info, versions, and blockchain records."""
    asset = AssetService.get_asset_by_id(db, asset_id)
    
    current_version = asset.versions[-1] if asset.versions else None

    return AssetDetailResponse(
        asset_id=asset.asset_id,
        creator_id=asset.creator_id,
        category_id=asset.category_id,
        title=asset.title,
        description=asset.description,
        original_filename=asset.original_filename,
        stored_filename=asset.stored_filename,
        file_size=asset.file_size,
        mime_type=asset.mime_type,
        visibility=asset.visibility,
        registration_status=asset.registration_status,
        created_at=asset.created_at,
        registered_at=asset.registered_at,
        creator_name=asset.creator.full_name if asset.creator else None,
        category_name=asset.category.category_name if asset.category else None,
        current_version=current_version,
        versions=asset.versions,
        blockchain_records=asset.blockchain_records
    )

@router.get(
    "/{asset_id}/versions",
    response_model=List[AssetVersionResponse],
    summary="Retrieve version history and cryptographic hashes for an asset"
)
def get_asset_versions(
    asset_id: str,
    db: Session = Depends(get_db)
):
    """Retrieves all version records and associated SHA-256 fingerprints for the specified asset."""
    return AssetService.get_asset_versions(db, asset_id)

@router.post(
    "/{asset_id}/versions",
    response_model=AssetVersionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload an updated version of an existing asset"
)
async def create_asset_version(
    asset_id: str,
    file: UploadFile = File(..., description="Binary payload of the updated version"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Module F - Version Management:
    Registers an updated version, generates a new SHA-256 fingerprint, increments version number,
    and anchors the new version on the blockchain.
    """
    file_bytes = await file.read()
    file_size = len(file_bytes)
    await file.seek(0)

    new_version = AssetService.create_asset_version(
        db=db,
        asset_id=asset_id,
        user_id=current_user.user_id,
        user_role=current_user.role,
        original_filename=file.filename or "unknown",
        file_stream=file.file,
        file_size=file_size,
        content_type=file.content_type or ""
    )
    return new_version

@router.post(
    "/{asset_id}/transfer-claim",
    response_model=OwnershipHistoryResponse,
    summary="Transfer registered ownership claim to another user"
)
def transfer_asset_claim(
    asset_id: str,
    new_owner_id: int = Form(..., description="User ID of the transferee"),
    transaction_reference: Optional[str] = Form(None, description="Legal or contract reference code"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Module H - Ownership History:
    Reassigns the registered claim to a new user account, recording an immutable history record.
    """
    from app.services.ownership_service import OwnershipService
    history_rec = OwnershipService.transfer_registered_claim(
        db=db,
        current_user_id=current_user.user_id,
        user_role=current_user.role,
        asset_id=asset_id,
        new_owner_id=new_owner_id,
        transaction_reference=transaction_reference
    )
    return OwnershipHistoryResponse(
        history_id=history_rec.history_id,
        asset_id=history_rec.asset_id,
        previous_owner_id=history_rec.previous_owner_id,
        new_owner_id=history_rec.new_owner_id,
        previous_owner_name=history_rec.previous_owner.full_name if history_rec.previous_owner else None,
        new_owner_name=history_rec.new_owner.full_name if history_rec.new_owner else None,
        transaction_reference=history_rec.transaction_reference,
        changed_at=history_rec.changed_at
    )

@router.get(
    "/{asset_id}/history",
    response_model=List[OwnershipHistoryResponse],
    summary="Retrieve audit trail of registered ownership claims"
)
def get_asset_history(
    asset_id: str,
    db: Session = Depends(get_db)
):
    """Retrieves the ownership history log for an asset."""
    history_entries = AssetService.get_asset_history(db, asset_id)
    results = []
    for entry in history_entries:
        results.append(OwnershipHistoryResponse(
            history_id=entry.history_id,
            asset_id=entry.asset_id,
            previous_owner_id=entry.previous_owner_id,
            new_owner_id=entry.new_owner_id,
            previous_owner_name=entry.previous_owner.full_name if entry.previous_owner else None,
            new_owner_name=entry.new_owner.full_name if entry.new_owner else None,
            transaction_reference=entry.transaction_reference,
            changed_at=entry.changed_at
        ))
    return results
