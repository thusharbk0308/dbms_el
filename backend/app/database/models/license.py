from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database.base import Base

class License(Base):
    __tablename__ = "licenses"

    license_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    asset_id = Column(String(64), ForeignKey("assets.asset_id", ondelete="CASCADE"), nullable=False, index=True)
    creator_id = Column(Integer, ForeignKey("users.user_id", ondelete="RESTRICT"), nullable=False)
    licensee_id = Column(Integer, ForeignKey("users.user_id", ondelete="RESTRICT"), nullable=False, index=True)
    license_type = Column(String(50), nullable=False)  # Personal, Educational, Commercial, Custom
    description = Column(Text, nullable=True)
    start_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expiry_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), nullable=False, default="ACTIVE")  # ACTIVE, EXPIRED, REVOKED
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint("expiry_date IS NULL OR expiry_date >= start_date", name="chk_license_dates"),
    )

    # Relationships
    asset = relationship("Asset", back_populates="licenses")
    creator = relationship("User", back_populates="issued_licenses", foreign_keys=[creator_id])
    licensee = relationship("User", back_populates="received_licenses", foreign_keys=[licensee_id])
