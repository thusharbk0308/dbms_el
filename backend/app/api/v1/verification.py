from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models.user import User
from app.schemas.verification import VerificationResponse
from app.services.verification_service import VerificationService
from app.core.dependencies import get_current_user
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(prefix="/verification", tags=["Verification"])

oauth2_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

def get_optional_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_optional)
) -> Optional[User]:
    if not token:
        return None
    try:
        from app.core.security import decode_access_token
        from app.repositories.user_repository import UserRepository
        payload = decode_access_token(token)
        if not payload:
            return None
        user_id = int(payload.get("sub"))
        return UserRepository.get_by_id(db, user_id)
    except Exception:
        return None

@router.post(
    "/exact",
    response_model=VerificationResponse,
    summary="Upload a file to verify integrity against database and blockchain records"
)
async def verify_uploaded_file(
    file: UploadFile = File(..., description="File binary to verify for exact match"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Module E - File Verification Service:
    1. Reads uploaded file and computes SHA-256 fingerprint.
    2. Searches PostgreSQL for an exact registered version hash.
    3. If registered, reads corresponding on-chain fingerprint from smart contract.
    4. Compares file, database, and blockchain fingerprints.
    5. Records verification attempt in VERIFICATIONS table.
    6. Returns structured verification result (EXACT_MATCH, HASH_MISMATCH, NOT_REGISTERED).
    """
    verifier_id = current_user.user_id if current_user else None
    return VerificationService.verify_file_stream(db, file.file, verifier_id)

@router.post(
    "/hash",
    response_model=VerificationResponse,
    summary="Verify a submitted SHA-256 hexadecimal hash"
)
def verify_hash(
    submitted_hash: str = Form(..., min_length=64, max_length=64, description="64-character SHA-256 hex string"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Verifies a 64-character SHA-256 hash directly without re-uploading the file payload.
    """
    verifier_id = current_user.user_id if current_user else None
    return VerificationService.verify_by_hash(db, submitted_hash, verifier_id)

@router.get(
    "/{verification_id}",
    summary="Retrieve a historical verification record by ID"
)
def get_verification_record(
    verification_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieves a past verification log including submitted hash, matched asset, and timestamp.
    """
    v = VerificationService.get_verification_by_id(db, verification_id)
    return {
        "verification_id": v.verification_id,
        "verifier_id": v.verifier_id,
        "asset_id": v.asset_id,
        "asset_title": v.asset.title if v.asset else None,
        "submitted_hash": v.submitted_hash,
        "verification_result": v.verification_result,
        "verified_at": v.verified_at
    }
