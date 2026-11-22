from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database.models.license import License
from app.database.models.asset import Asset
from app.database.models.user import User
from app.database.models.audit_log import AuditLog
from app.schemas.license import LicenseCreate, LicenseStatusEnum

class LicensingService:
    @staticmethod
    def create_license(
        db: Session,
        creator_id: int,
        license_in: LicenseCreate,
        user_role: str = "CREATOR"
    ) -> License:
        # 1. Validate asset existence and creator ownership
        asset = db.query(Asset).filter(Asset.asset_id == license_in.asset_id).first()
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Asset '{license_in.asset_id}' not found."
            )
        if asset.creator_id != creator_id and user_role != "ADMINISTRATOR":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the registered creator or an administrator can issue licenses for this asset."
            )

        # 2. Validate licensee existence
        licensee = db.query(User).filter(User.user_id == license_in.licensee_id).first()
        if not licensee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Licensee user ID {license_in.licensee_id} does not exist."
            )
        if licensee.user_id == asset.creator_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Creator cannot grant a license to themselves."
            )

        # 3. Validate dates
        start_date = license_in.start_date or datetime.now(timezone.utc)
        if license_in.expiry_date and license_in.expiry_date < start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="License expiry date cannot precede start date."
            )

        # 4. Construct and save license
        license_type_val = license_in.license_type.value if hasattr(license_in.license_type, "value") else str(license_in.license_type)
        new_license = License(
            asset_id=license_in.asset_id,
            creator_id=asset.creator_id,
            licensee_id=license_in.licensee_id,
            license_type=license_type_val,
            description=license_in.description.strip() if license_in.description else None,
            start_date=start_date,
            expiry_date=license_in.expiry_date,
            status="ACTIVE"
        )
        db.add(new_license)
        db.flush()

        audit = AuditLog(
            user_id=creator_id,
            action="ISSUE_LICENSE",
            entity_type="LICENSE",
            entity_id=str(new_license.license_id),
            details=f"Issued {license_type_val} license for asset '{asset.title}' to User {licensee.user_id}"
        )
        db.add(audit)
        db.commit()
        db.refresh(new_license)
        return new_license

    @staticmethod
    def get_license_by_id(db: Session, license_id: int) -> License:
        lic = (
            db.query(License)
            .options(
                joinedload(License.asset),
                joinedload(License.creator),
                joinedload(License.licensee)
            )
            .filter(License.license_id == license_id)
            .first()
        )
        if not lic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"License ID {license_id} not found."
            )
        return lic

    @staticmethod
    def update_license_status(
        db: Session,
        license_id: int,
        new_status: LicenseStatusEnum,
        user_id: int,
        user_role: str
    ) -> License:
        lic = LicensingService.get_license_by_id(db, license_id)
        if lic.creator_id != user_id and user_role != "ADMINISTRATOR":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the granting creator or an administrator can update license status."
            )

        old_status = lic.status
        status_val = new_status.value if hasattr(new_status, "value") else str(new_status)
        lic.status = status_val

        audit = AuditLog(
            user_id=user_id,
            action="UPDATE_LICENSE_STATUS",
            entity_type="LICENSE",
            entity_id=str(license_id),
            details=f"License status changed from {old_status} to {status_val}"
        )
        db.add(audit)
        db.commit()
        db.refresh(lic)
        return lic

    @staticmethod
    def list_licenses(
        db: Session,
        asset_id: Optional[str] = None,
        creator_id: Optional[int] = None,
        licensee_id: Optional[int] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[License]:
        query = db.query(License).options(
            joinedload(License.asset),
            joinedload(License.creator),
            joinedload(License.licensee)
        )
        if asset_id:
            query = query.filter(License.asset_id == asset_id)
        if creator_id:
            query = query.filter(License.creator_id == creator_id)
        if licensee_id:
            query = query.filter(License.licensee_id == licensee_id)
        if status:
            query = query.filter(License.status == status)

        return query.order_by(License.created_at.desc()).offset(skip).limit(limit).all()
