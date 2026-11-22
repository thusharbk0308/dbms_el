from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class Verification(Base):
    __tablename__ = "verifications"

    verification_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    verifier_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True, index=True)
    asset_id = Column(String(64), ForeignKey("assets.asset_id", ondelete="SET NULL"), nullable=True, index=True)
    submitted_hash = Column(String(64), nullable=False, index=True)
    verification_result = Column(String(50), nullable=False)  # EXACT_MATCH, HASH_MISMATCH, NOT_REGISTERED, BLOCKCHAIN_VERIFICATION_FAILED
    verified_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    verifier = relationship("User", back_populates="verifications")
    asset = relationship("Asset", back_populates="verifications")
