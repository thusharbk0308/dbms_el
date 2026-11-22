from typing import Optional, List
from sqlalchemy.orm import Session
from app.database.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

class UserRepository:
    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.user_id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email.lower().strip()).first()

    @staticmethod
    def create(db: Session, user_in: UserCreate) -> User:
        user = User(
            full_name=user_in.full_name.strip(),
            email=user_in.email.lower().strip(),
            password_hash=get_password_hash(user_in.password),
            role=user_in.role.value if hasattr(user_in.role, 'value') else user_in.role,
            account_status="ACTIVE"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def list_all(db: Session, skip: int = 0, limit: int = 50) -> List[User]:
        return db.query(User).offset(skip).limit(limit).all()
