import io
import pytest
from app.services.hashing_service import HashingService

def test_sha256_deterministic_consistency():
    content = b"ChainProof Digital Intellectual Property Fingerprint Test Data 2026"
    hash1 = HashingService.compute_sha256_from_bytes(content)
    hash2 = HashingService.compute_sha256_from_bytes(content)
    assert hash1 == hash2
    assert len(hash1) == 64
    assert isinstance(hash1, str)

def test_chunked_streaming_matches_direct_bytes():
    # Large 256KB binary payload to test chunk boundary processing
    large_payload = b"abcdefghijklmnopqrstuvwxyz0123456789!@#$" * 6500
    expected_hash = HashingService.compute_sha256_from_bytes(large_payload)

    stream = io.BytesIO(large_payload)
    stream_hash = HashingService.compute_sha256_from_stream(stream)

    assert stream_hash == expected_hash

def test_avalanche_effect():
    content_a = b"Original source code function calculate_hash() { return true; }"
    content_b = b"Original source code function calculate_hash() { return false;}"

    hash_a = HashingService.compute_sha256_from_bytes(content_a)
    hash_b = HashingService.compute_sha256_from_bytes(content_b)

    assert hash_a != hash_b
    # Even subtle changes should change majority of hex positions
    differing_chars = sum(1 for a, b in zip(hash_a, hash_b) if a != b)
    assert differing_chars > 30
