from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field

class AssetVisibility(str, Enum):
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"
    UNLISTED = "UNLISTED"

class RegistrationStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    FAILED = "FAILED"

class AssetVersionResponse(BaseModel):
    version_id: int
    asset_id: str
    version_number: int
    file_hash: str
    hash_algorithm: str
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True

class BlockchainRecordSummary(BaseModel):
    record_id: int
    transaction_hash: str
    block_number: int
    network_name: str
    contract_address: str
    blockchain_timestamp: datetime
    transaction_status: str

    class Config:
        from_attributes = True

class AssetBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    category_id: int
    visibility: AssetVisibility = AssetVisibility.PUBLIC

class AssetCreate(AssetBase):
    pass

class AssetResponse(BaseModel):
    asset_id: str
    creator_id: int
    category_id: int
    title: str
    description: Optional[str] = None
    original_filename: str
    stored_filename: str
    file_size: int
    mime_type: str
    visibility: str
    registration_status: str
    created_at: datetime
    registered_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AssetDetailResponse(AssetResponse):
    creator_name: Optional[str] = None
    category_name: Optional[str] = None
    current_version: Optional[AssetVersionResponse] = None
    versions: List[AssetVersionResponse] = []
    blockchain_records: List[BlockchainRecordSummary] = []

    class Config:
        from_attributes = True

class OwnershipHistoryResponse(BaseModel):
    history_id: int
    asset_id: str
    previous_owner_id: Optional[int] = None
    new_owner_id: int
    previous_owner_name: Optional[str] = None
    new_owner_name: Optional[str] = None
    transaction_reference: Optional[str] = None
    changed_at: datetime

    class Config:
        from_attributes = True
