from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class DisputeStatusEnum(str, Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"

class DisputeCreate(BaseModel):
    asset_id: str
    description: str = Field(..., min_length=10, max_length=2000)

class DisputeStatusUpdate(BaseModel):
    dispute_status: DisputeStatusEnum
    resolution_notes: Optional[str] = None

class DisputeResponse(BaseModel):
    dispute_id: int
    asset_id: str
    asset_title: Optional[str] = None
    reporter_id: int
    reporter_name: Optional[str] = None
    description: str
    evidence_path: Optional[str] = None
    dispute_status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None

    class Config:
        from_attributes = True
