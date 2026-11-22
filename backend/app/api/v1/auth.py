from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.token import Token
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new creator, verifier, or user account"
)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new user in PostgreSQL with a securely hashed bcrypt password.
    Enforces unique email constraints and role assignment.
    """
    created_user = AuthService.register_user(db, user_in)
    return created_user

@router.post(
    "/login",
    response_model=Token,
    summary="Authenticate user and return JWT bearer token"
)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates email and password credentials, returning a signed JWT access token.
    """
    return AuthService.authenticate_user(db, login_data)

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Retrieve profile of the currently authenticated user"
)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Returns the authenticated user's ID, full name, email, role, account status, and creation date.
    """
    return current_user
