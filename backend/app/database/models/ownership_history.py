from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class OwnershipHistory(Base):
    __tablename__ = "ownership_history"

    history_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    asset_id = Column(String(64), ForeignKey("assets.asset_id", ondelete="RESTRICT"), nullable=False, index=True)
    previous_owner_id = Column(Integer, ForeignKey("users.user_id", ondelete="RESTRICT"), nullable=True)
    new_owner_id = Column(Integer, ForeignKey("users.user_id", ondelete="RESTRICT"), nullable=False)
    transaction_reference = Column(String(100), nullable=True)
    changed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    asset = relationship("Asset", back_populates="ownership_history")
    previous_owner = relationship("User", foreign_keys=[previous_owner_id])
    new_owner = relationship("User", foreign_keys=[new_owner_id])
