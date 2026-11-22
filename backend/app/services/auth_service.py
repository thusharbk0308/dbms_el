from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserLogin
from app.schemas.token import Token
from app.core.security import verify_password, create_access_token

class AuthService:
    @staticmethod
    def register_user(db: Session, user_in: UserCreate):
        existing_user = UserRepository.get_by_email(db, user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"An account with email '{user_in.email}' is already registered."
            )
        return UserRepository.create(db, user_in)

    @staticmethod
    def authenticate_user(db: Session, login_data: UserLogin) -> Token:
        user = UserRepository.get_by_email(db, login_data.email)
        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        if user.account_status != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User account is {user.account_status.lower()}."
            )

        token = create_access_token(subject=user.user_id, role=user.role)
        return Token(
            access_token=token,
            token_type="bearer",
            user_id=user.user_id,
            role=user.role,
            email=user.email
        )
