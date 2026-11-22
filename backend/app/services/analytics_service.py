from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc
from app.database.models.asset import Asset
from app.database.models.user import User
from app.database.models.category import Category
from app.database.models.verification import Verification
from app.database.models.license import License
from app.database.models.dispute import Dispute
from app.schemas.analytics import (
    OverviewMetricsResponse,
    CategoryBreakdownItem,
    MonthlyRegistrationItem,
    VerificationDistributionItem,
    CreatorLeaderboardItem
)

class AnalyticsService:
    @staticmethod
    def get_overview_metrics(db: Session) -> OverviewMetricsResponse:
        total_assets = db.query(func.count(Asset.asset_id)).scalar() or 0
        total_creators = db.query(func.count(User.user_id)).filter(User.role == "CREATOR").scalar() or 0
        confirmed_assets = db.query(func.count(Asset.asset_id)).filter(Asset.registration_status == "CONFIRMED").scalar() or 0
        pending_assets = db.query(func.count(Asset.asset_id)).filter(Asset.registration_status == "PENDING").scalar() or 0
        failed_assets = db.query(func.count(Asset.asset_id)).filter(Asset.registration_status == "FAILED").scalar() or 0

        total_verifications = db.query(func.count(Verification.verification_id)).scalar() or 0
        exact_matches = db.query(func.count(Verification.verification_id)).filter(Verification.verification_result == "EXACT_MATCH").scalar() or 0

        active_licenses = db.query(func.count(License.license_id)).filter(License.status == "ACTIVE").scalar() or 0
        expired_licenses = db.query(func.count(License.license_id)).filter(License.status == "EXPIRED").scalar() or 0
        pending_disputes = db.query(func.count(Dispute.dispute_id)).filter(Dispute.dispute_status == "PENDING").scalar() or 0

        return OverviewMetricsResponse(
            total_assets=total_assets,
            total_creators=total_creators,
            confirmed_assets=confirmed_assets,
            pending_assets=pending_assets,
            failed_assets=failed_assets,
            total_verifications=total_verifications,
            exact_match_verifications=exact_matches,
            active_licenses=active_licenses,
            expired_licenses=expired_licenses,
            pending_disputes=pending_disputes
        )

    @staticmethod
    def get_category_breakdown(db: Session) -> List[CategoryBreakdownItem]:
        results = (
            db.query(
                Category.category_id,
                Category.category_name,
                func.count(Asset.asset_id).label("asset_count"),
                func.coalesce(func.sum(Asset.file_size), 0).label("total_storage_bytes")
            )
            .outerjoin(Asset, Category.category_id == Asset.category_id)
            .group_by(Category.category_id, Category.category_name)
            .order_by(desc("asset_count"))
            .all()
        )
        return [
            CategoryBreakdownItem(
                category_id=r[0],
                category_name=r[1],
                asset_count=r[2],
                total_storage_bytes=int(r[3])
            )
            for r in results
        ]

    @staticmethod
    def get_monthly_registrations(db: Session) -> List[MonthlyRegistrationItem]:
        # Formats month across SQLite and PostgreSQL
        month_expr = func.strftime("%Y-%m", Asset.created_at) if db.bind.dialect.name == "sqlite" else func.to_char(Asset.created_at, "YYYY-MM")
        results = (
            db.query(
                month_expr.label("month"),
                func.count(Asset.asset_id).label("total"),
                func.count(case((Asset.registration_status == "CONFIRMED", Asset.asset_id))).label("confirmed"),
                func.count(case((Asset.registration_status == "PENDING", Asset.asset_id))).label("pending")
            )
            .group_by(month_expr)
            .order_by(month_expr.desc())
            .limit(12)
            .all()
        )
        return [
            MonthlyRegistrationItem(
                month=r[0] or "Unknown",
                total_registrations=r[1],
                confirmed_count=r[2],
                pending_count=r[3]
            )
            for r in results
        ]

    @staticmethod
    def get_verification_distribution(db: Session) -> List[VerificationDistributionItem]:
        results = (
            db.query(
                Verification.verification_result,
                func.count(Verification.verification_id)
            )
            .group_by(Verification.verification_result)
            .all()
        )
        return [
            VerificationDistributionItem(result=r[0], count=r[1])
            for r in results
        ]

    @staticmethod
    def get_creator_leaderboard(db: Session, limit: int = 10) -> List[CreatorLeaderboardItem]:
        results = (
            db.query(
                User.user_id,
                User.full_name,
                User.email,
                func.count(Asset.asset_id).label("total_assets"),
                func.count(case((Asset.registration_status == "CONFIRMED", Asset.asset_id))).label("confirmed_assets"),
                func.count(func.distinct(License.license_id)).label("licenses_issued")
            )
            .join(Asset, User.user_id == Asset.creator_id)
            .outerjoin(License, Asset.asset_id == License.asset_id)
            .group_by(User.user_id, User.full_name, User.email)
            .order_by(desc("total_assets"))
            .limit(limit)
            .all()
        )
        return [
            CreatorLeaderboardItem(
                user_id=r[0],
                full_name=r[1],
                email=r[2],
                total_assets=r[3],
                confirmed_assets=r[4],
                total_licenses_issued=r[5]
            )
            for r in results
        ]
