from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel

class VerificationResultEnum(str, Enum):
    EXACT_MATCH = "EXACT_MATCH"
    HASH_MISMATCH = "HASH_MISMATCH"
    NOT_REGISTERED = "NOT_REGISTERED"
    BLOCKCHAIN_VERIFICATION_FAILED = "BLOCKCHAIN_VERIFICATION_FAILED"

class MatchedAssetSummary(BaseModel):
    asset_id: str
    title: str
    description: Optional[str] = None
    creator_id: int
    creator_name: Optional[str] = None
    category_name: Optional[str] = None
    original_filename: str
    registration_status: str
    registered_at: Optional[datetime] = None

class MatchedVersionSummary(BaseModel):
    version_id: int
    version_number: int
    file_hash: str
    hash_algorithm: str
    created_at: datetime

class BlockchainVerificationSummary(BaseModel):
    transaction_hash: Optional[str] = None
    block_number: Optional[int] = None
    network_name: Optional[str] = None
    contract_address: Optional[str] = None
    blockchain_timestamp: Optional[datetime] = None
    on_chain_fingerprint: Optional[str] = None
    on_chain_verified: bool = False

class VerificationResponse(BaseModel):
    verification_id: Optional[int] = None
    submitted_hash: str
    verification_result: str
    is_match: bool
    matched_asset: Optional[MatchedAssetSummary] = None
    matched_version: Optional[MatchedVersionSummary] = None
    blockchain_record: Optional[BlockchainVerificationSummary] = None
    verified_at: datetime
    legal_disclaimer: str = (
        "Cryptographic match confirms file integrity and timestamped registration. "
        "Blockchain registration does not independently constitute legal proof of authorship or ownership."
    )

    class Config:
        from_attributes = True
