import pytest
from fastapi import HTTPException
from app.utils.file_validator import (
    validate_file_extension_and_mime,
    validate_file_size,
    generate_safe_stored_filename
)

def test_valid_file_extensions():
    valid_samples = [
        ("contract.sol.py", "text/x-python", ".py"),
        ("document.pdf", "application/pdf", ".pdf"),
        ("design.png", "image/png", ".png"),
        ("styles.css", "text/css", ".css"),
        ("code.cpp", "text/x-c++src", ".cpp"),
    ]
    for filename, mime, expected_ext in valid_samples:
        ext, resolved_mime = validate_file_extension_and_mime(filename, mime)
        assert ext == expected_ext
        assert resolved_mime is not None

def test_disallowed_file_extension():
    disallowed_samples = ["malicious.exe", "script.sh", "run.bat", "data.zip"]
    for filename in disallowed_samples:
        with pytest.raises(HTTPException) as exc_info:
            validate_file_extension_and_mime(filename, "application/octet-stream")
        assert exc_info.value.status_code == 400
        assert "unsupported file extension" in exc_info.value.detail.lower()

def test_file_size_limits():
    # Valid size (5 MB)
    validate_file_size(5 * 1024 * 1024)

    # Empty file (0 bytes) rejected
    with pytest.raises(HTTPException) as exc_info:
        validate_file_size(0)
    assert exc_info.value.status_code == 400
    assert "empty" in exc_info.value.detail.lower()

    # Oversized file (> 25MB) rejected
    with pytest.raises(HTTPException) as exc_info:
        validate_file_size(30 * 1024 * 1024)
    assert exc_info.value.status_code == 400
    assert "exceeds maximum permitted limit" in exc_info.value.detail.lower()

def test_generate_safe_stored_filename():
    unsafe_input = "../../etc/passwd/malicious_filename.png"
    safe_name = generate_safe_stored_filename(unsafe_input)

    assert not safe_name.startswith("..")
    assert "/" not in safe_name
    assert "\\" not in safe_name
    assert safe_name.endswith(".png")
    assert len(safe_name) > 32
