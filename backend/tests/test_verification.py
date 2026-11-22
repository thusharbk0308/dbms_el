import io
import pytest
from unittest.mock import patch
from app.services.blockchain_service import blockchain_service

def test_file_verification_exact_match(client, creator_token):
    file_bytes = b"def calculate_total(prices): return sum(prices)"
    file_obj = io.BytesIO(file_bytes)

    # 1. Register asset
    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Pricing Calculation Library", "category_id": 1},
        files={"file": ("pricing.py", file_obj, "text/x-python")}
    )
    assert reg_res.status_code == 201
    asset_id = reg_res.json()["asset_id"]

    # 2. Upload identical file for verification
    verify_file = io.BytesIO(file_bytes)
    v_res = client.post(
        "/api/v1/verification/exact",
        files={"file": ("check_pricing.py", verify_file, "text/x-python")}
    )
    assert v_res.status_code == 200
    data = v_res.json()
    assert data["verification_result"] == "EXACT_MATCH"
    assert data["is_match"] is True
    assert data["matched_asset"]["asset_id"] == asset_id
    assert data["matched_asset"]["title"] == "Pricing Calculation Library"
    assert data["matched_version"]["version_number"] == 1
    assert "verification_id" in data
    assert "legal_disclaimer" in data

    # 3. Retrieve historical verification record
    history_res = client.get(f"/api/v1/verification/{data['verification_id']}")
    assert history_res.status_code == 200
    assert history_res.json()["verification_result"] == "EXACT_MATCH"

def test_file_verification_modified_file_not_registered(client, creator_token):
    original_bytes = b"Original uncompromised document text"
    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Original Document", "category_id": 3},
        files={"file": ("original.txt", io.BytesIO(original_bytes), "text/plain")}
    )
    assert reg_res.status_code == 201

    # Tampered/altered document
    altered_bytes = b"Tampered and modified document text!"
    v_res = client.post(
        "/api/v1/verification/exact",
        files={"file": ("tampered.txt", io.BytesIO(altered_bytes), "text/plain")}
    )
    assert v_res.status_code == 200
    data = v_res.json()
    assert data["verification_result"] == "NOT_REGISTERED"
    assert data["is_match"] is False
    assert data["matched_asset"] is None

def test_hash_string_verification(client, creator_token):
    content = b"Content to test direct SHA-256 hash lookup"
    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Hash Lookup Target", "category_id": 1},
        files={"file": ("target.py", io.BytesIO(content), "text/x-python")}
    )
    asset_id = reg_res.json()["asset_id"]
    details = client.get(f"/api/v1/assets/{asset_id}").json()
    target_hash = details["current_version"]["file_hash"]

    # Verify by 64-char hash
    v_res = client.post(
        "/api/v1/verification/hash",
        data={"submitted_hash": target_hash}
    )
    assert v_res.status_code == 200
    data = v_res.json()
    assert data["is_match"] is True
    assert data["verification_result"] == "EXACT_MATCH"
    assert data["matched_asset"]["asset_id"] == asset_id

def test_blockchain_mismatch_verification_result(client, creator_token, db_session):
    content = b"Content for testing on-chain mismatch condition"
    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Mismatch Target", "category_id": 1},
        files={"file": ("mismatch.py", io.BytesIO(content), "text/x-python")}
    )
    asset_id = reg_res.json()["asset_id"]

    # Mock blockchain reporting a mismatch (on-chain hash does not equal DB hash)
    mock_bc_mismatch = {
        "is_match": False,
        "is_registered": True,
        "registered_fingerprint": "0000000000000000000000000000000000000000000000000000000000000000",
        "blockchain_timestamp": None,
        "registrant": "0x0",
        "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    }

    # Attach a mock blockchain record in DB to trigger on-chain check
    from app.database.models.blockchain_record import BlockchainRecord
    from app.database.models.asset_version import AssetVersion
    from datetime import datetime, timezone

    ver = db_session.query(AssetVersion).filter(AssetVersion.asset_id == asset_id).first()
    b_rec = BlockchainRecord(
        asset_id=asset_id,
        version_id=ver.version_id,
        transaction_hash="0xmocktxhash123",
        block_number=1,
        network_name="hardhat_local",
        contract_address="0x5FbDB2315678afecb367f032d93F642f64180aa3",
        blockchain_timestamp=datetime.now(timezone.utc),
        transaction_status="CONFIRMED"
    )
    db_session.add(b_rec)
    db_session.commit()

    with patch.object(blockchain_service, "is_connected", return_value=True), \
         patch.object(blockchain_service, "verify_fingerprint_on_chain", return_value=mock_bc_mismatch):
        v_res = client.post(
            "/api/v1/verification/exact",
            files={"file": ("check_mismatch.py", io.BytesIO(content), "text/x-python")}
        )
        assert v_res.status_code == 200
        assert v_res.json()["verification_result"] == "BLOCKCHAIN_VERIFICATION_FAILED"
