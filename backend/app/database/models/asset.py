from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, BigInteger, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base

class Asset(Base):
    __tablename__ = "assets"

    asset_id = Column(String(64), primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.user_id", ondelete="RESTRICT"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.category_id", ondelete="RESTRICT"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), unique=True, nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String(100), nullable=False)
    visibility = Column(String(50), nullable=False, default="PUBLIC")  # PUBLIC, PRIVATE, UNLISTED
    registration_status = Column(String(50), nullable=False, default="PENDING", index=True)  # PENDING, CONFIRMED, FAILED
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    registered_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    creator = relationship("User", back_populates="assets", foreign_keys=[creator_id])
    category = relationship("Category", back_populates="assets")
    versions = relationship("AssetVersion", back_populates="asset", cascade="all, delete-orphan", order_by="AssetVersion.version_number")
    blockchain_records = relationship("BlockchainRecord", back_populates="asset")
    licenses = relationship("License", back_populates="asset", cascade="all, delete-orphan")
    verifications = relationship("Verification", back_populates="asset")
    disputes = relationship("Dispute", back_populates="asset")
    ownership_history = relationship("OwnershipHistory", back_populates="asset")
