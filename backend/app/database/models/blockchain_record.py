from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class BlockchainRecord(Base):
    __tablename__ = "blockchain_records"

    record_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    asset_id = Column(String(64), ForeignKey("assets.asset_id", ondelete="RESTRICT"), nullable=False, index=True)
    version_id = Column(Integer, ForeignKey("asset_versions.version_id", ondelete="RESTRICT"), nullable=False, index=True)
    transaction_hash = Column(String(66), unique=True, nullable=False, index=True)
    block_number = Column(BigInteger, nullable=False)
    network_name = Column(String(100), nullable=False)
    contract_address = Column(String(42), nullable=False)
    blockchain_timestamp = Column(DateTime(timezone=True), nullable=False)
    transaction_status = Column(String(50), nullable=False, default="CONFIRMED")  # PENDING, CONFIRMED, FAILED
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    asset = relationship("Asset", back_populates="blockchain_records")
    version = relationship("AssetVersion", back_populates="blockchain_records")
