from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.base import Base

class AssetVersion(Base):
    __tablename__ = "asset_versions"

    version_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    asset_id = Column(String(64), ForeignKey("assets.asset_id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    file_hash = Column(String(64), nullable=False, index=True)
    hash_algorithm = Column(String(32), nullable=False, default="SHA-256")
    file_path = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("asset_id", "version_number", name="uq_asset_version"),
    )

    # Relationships
    asset = relationship("Asset", back_populates="versions")
    blockchain_records = relationship("BlockchainRecord", back_populates="version")
