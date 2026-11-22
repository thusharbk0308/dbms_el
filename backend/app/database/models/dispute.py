from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class Dispute(Base):
    __tablename__ = "disputes"

    dispute_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    asset_id = Column(String(64), ForeignKey("assets.asset_id", ondelete="RESTRICT"), nullable=False, index=True)
    reporter_id = Column(Integer, ForeignKey("users.user_id", ondelete="RESTRICT"), nullable=False)
    description = Column(Text, nullable=False)
    evidence_path = Column(String(500), nullable=True)
    dispute_status = Column(String(50), nullable=False, default="PENDING", index=True)  # PENDING, UNDER_REVIEW, RESOLVED, REJECTED
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    asset = relationship("Asset", back_populates="disputes")
    reporter = relationship("User", back_populates="reported_disputes")
