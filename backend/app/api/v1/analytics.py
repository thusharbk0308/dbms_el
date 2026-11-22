from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.analytics import (
    OverviewMetricsResponse,
    CategoryBreakdownItem,
    MonthlyRegistrationItem,
    VerificationDistributionItem,
    CreatorLeaderboardItem
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get(
    "/overview",
    response_model=OverviewMetricsResponse,
    summary="Platform-wide aggregate metrics overview"
)
def get_overview_metrics(db: Session = Depends(get_db)):
    """
    Module J - Analytics:
    Database-backed aggregations for assets, creators, verifications, licenses, and disputes.
    """
    return AnalyticsService.get_overview_metrics(db)

@router.get(
    "/categories",
    response_model=List[CategoryBreakdownItem],
    summary="Asset distribution and storage volume by category"
)
def get_category_analytics(db: Session = Depends(get_db)):
    return AnalyticsService.get_category_breakdown(db)

@router.get(
    "/registrations",
    response_model=List[MonthlyRegistrationItem],
    summary="Monthly registration trends broken down by status"
)
def get_monthly_registration_trends(db: Session = Depends(get_db)):
    return AnalyticsService.get_monthly_registrations(db)

@router.get(
    "/verifications",
    response_model=List[VerificationDistributionItem],
    summary="Verification attempt distribution by result"
)
def get_verification_analytics(db: Session = Depends(get_db)):
    return AnalyticsService.get_verification_distribution(db)

@router.get(
    "/creators",
    response_model=List[CreatorLeaderboardItem],
    summary="Most active creators ranked by registered asset count"
)
def get_creator_leaderboard(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_creator_leaderboard(db, limit=limit)
