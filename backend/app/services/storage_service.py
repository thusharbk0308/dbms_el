import os
import shutil
from pathlib import Path
from typing import BinaryIO
from app.core.config import settings

class StorageService:
    def __init__(self, base_upload_dir: str | None = None):
        self.upload_dir = Path(base_upload_dir or settings.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def save_file_stream(self, file_stream: BinaryIO, stored_filename: str) -> tuple[str, int]:
        """
        Saves stream into secure storage directory using chunked writes.
        Returns (relative_file_path, total_bytes_written).
        """
        destination_path = self.upload_dir / stored_filename
        total_bytes = 0

        if hasattr(file_stream, "seek"):
            try:
                file_stream.seek(0)
            except Exception:
                pass

        with open(destination_path, "wb") as buffer:
            while chunk := file_stream.read(65536):
                buffer.write(chunk)
                total_bytes += len(chunk)

        # Reset stream position after write
        if hasattr(file_stream, "seek"):
            try:
                file_stream.seek(0)
            except Exception:
                pass

        # Store path relative to base uploads for database persistence
        relative_path = str(Path("uploads") / stored_filename).replace("\\", "/")
        return relative_path, total_bytes

    def delete_file(self, stored_filename: str) -> bool:
        """Removes stored file upon rollback or error."""
        file_path = self.upload_dir / stored_filename
        if file_path.exists():
            file_path.unlink()
            return True
        return False

    def get_absolute_path(self, relative_path: str) -> Path:
        filename = Path(relative_path).name
        return self.upload_dir / filename

storage_service = StorageService()
