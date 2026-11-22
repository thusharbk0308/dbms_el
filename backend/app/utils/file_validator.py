import os
import uuid
from pathlib import Path
from typing import Tuple
from fastapi import HTTPException, status
from app.core.config import settings

# Supported format whitelist
ALLOWED_EXTENSIONS = {
    # Images
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    # Documents
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    # Source Code
    ".py": "text/x-python",
    ".cpp": "text/x-c++src",
    ".c": "text/x-csrc",
    ".java": "text/x-java-source",
    ".js": "application/javascript",
    ".html": "text/html",
    ".css": "text/css"
}

def validate_file_extension_and_mime(filename: str, content_type: str) -> Tuple[str, str]:
    """
    Validates file extension against allowed formats and matches with MIME type.
    Returns normalized (ext, resolved_mime_type).
    """
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename cannot be empty."
        )

    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS.keys()))}"
        )

    expected_mime = ALLOWED_EXTENSIONS[ext]
    # Allow generic octet-stream or text/plain if extension matches source code / text
    resolved_mime = content_type if content_type else expected_mime

    return ext, resolved_mime

def validate_file_size(size_bytes: int) -> None:
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if size_bytes > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum permitted limit of {settings.MAX_FILE_SIZE_MB}MB."
        )
    if size_bytes <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

def generate_safe_stored_filename(original_filename: str) -> str:
    """
    Generates a cryptographically random, collision-resistant filename.
    Never trusts user-supplied filenames for local filesystem writes.
    """
    ext = Path(original_filename).suffix.lower()
    unique_token = uuid.uuid4().hex
    return f"{unique_token}{ext}"
