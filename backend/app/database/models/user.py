from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.database.base import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="CREATOR")  # CREATOR, VERIFIER, ADMINISTRATOR
    account_status = Column(String(50), nullable=False, default="ACTIVE")  # ACTIVE, SUSPENDED, DEACTIVATED
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    assets = relationship("Asset", back_populates="creator", foreign_keys="Asset.creator_id")
    issued_licenses = relationship("License", back_populates="creator", foreign_keys="License.creator_id")
    received_licenses = relationship("License", back_populates="licensee", foreign_keys="License.licensee_id")
    verifications = relationship("Verification", back_populates="verifier")
    reported_disputes = relationship("Dispute", back_populates="reporter")
    audit_logs = relationship("AuditLog", back_populates="user")
