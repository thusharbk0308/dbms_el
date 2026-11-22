from typing import List, Dict, Optional
from pydantic import BaseModel

class OverviewMetricsResponse(BaseModel):
    total_assets: int
    total_creators: int
    confirmed_assets: int
    pending_assets: int
    failed_assets: int
    total_verifications: int
    exact_match_verifications: int
    active_licenses: int
    expired_licenses: int
    pending_disputes: int

class CategoryBreakdownItem(BaseModel):
    category_id: int
    category_name: str
    asset_count: int
    total_storage_bytes: int

class MonthlyRegistrationItem(BaseModel):
    month: str
    total_registrations: int
    confirmed_count: int
    pending_count: int

class VerificationDistributionItem(BaseModel):
    result: str
    count: int

class CreatorLeaderboardItem(BaseModel):
    user_id: int
    full_name: str
    email: str
    total_assets: int
    confirmed_assets: int
    total_licenses_issued: int
