import hashlib
from typing import BinaryIO
from pathlib import Path

class HashingService:
    CHUNK_SIZE = 65536  # 64 KB

    @classmethod
    def compute_sha256_from_stream(cls, stream: BinaryIO) -> str:
        """
        Reads a binary stream in chunks and generates a deterministic SHA-256 hexadecimal digest.
        Resets stream cursor to beginning before and after hashing if seekable.
        """
        hasher = hashlib.sha256()
        if hasattr(stream, "seekable") and stream.seekable():
            stream.seek(0)

        while chunk := stream.read(cls.CHUNK_SIZE):
            hasher.update(chunk)

        if hasattr(stream, "seekable") and stream.seekable():
            stream.seek(0)

        return hasher.hexdigest()

    @classmethod
    def compute_sha256_from_bytes(cls, data: bytes) -> str:
        """Computes SHA-256 digest directly from in-memory byte sequence."""
        return hashlib.sha256(data).hexdigest()

    @classmethod
    def compute_sha256_from_file(cls, file_path: str | Path) -> str:
        """Reads a file from filesystem in chunks and returns SHA-256 hexadecimal fingerprint."""
        hasher = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(cls.CHUNK_SIZE):
                hasher.update(chunk)
        return hasher.hexdigest()
