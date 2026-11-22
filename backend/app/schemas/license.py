from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class LicenseTypeEnum(str, Enum):
    Personal = "Personal"
    Educational = "Educational"
    Commercial = "Commercial"
    Custom = "Custom"

class LicenseStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"

class LicenseCreate(BaseModel):
    asset_id: str
    licensee_id: int
    license_type: LicenseTypeEnum
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None

class LicenseStatusUpdate(BaseModel):
    status: LicenseStatusEnum

class LicenseResponse(BaseModel):
    license_id: int
    asset_id: str
    asset_title: Optional[str] = None
    creator_id: int
    creator_name: Optional[str] = None
    licensee_id: int
    licensee_name: Optional[str] = None
    license_type: str
    description: Optional[str] = None
    start_date: datetime
    expiry_date: Optional[datetime] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
