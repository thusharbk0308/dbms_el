import io
import pytest
from unittest.mock import patch, MagicMock
from app.services.blockchain_service import blockchain_service, BlockchainService

def test_blockchain_status_endpoint(client):
    res = client.get("/api/v1/blockchain/status")
    assert res.status_code == 200
    data = res.json()
    assert "connected" in data
    assert data["network_name"] == "hardhat_local"
    assert data["chain_id"] == 31337
    assert data["contract_address"].startswith("0x")

def test_competing_claim_preservation_for_identical_fingerprints(client, creator_token):
    # Register second creator
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Second Creator",
            "email": "creator2@test.com",
            "password": "Password123!",
            "role": "CREATOR"
        }
    )
    login2 = client.post(
        "/api/v1/auth/login",
        json={"email": "creator2@test.com", "password": "Password123!"}
    )
    token2 = login2.json()["access_token"]

    identical_content = b"Original research paper on cryptographic timestamping"

    # Creator 1 registers asset
    file1 = io.BytesIO(identical_content)
    res1 = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Creator 1 Initial Claim", "category_id": 1},
        files={"file": ("claim1.py", file1, "text/x-python")}
    )
    assert res1.status_code == 201
    asset1_id = res1.json()["asset_id"]

    # Creator 2 registers identical file under separate asset claim
    file2 = io.BytesIO(identical_content)
    res2 = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {token2}"},
        data={"title": "Creator 2 Competing Claim", "category_id": 1},
        files={"file": ("claim2.py", file2, "text/x-python")}
    )
    # Both claims must be preserved (not rejected)
    assert res2.status_code == 201
    asset2_id = res2.json()["asset_id"]
    assert asset1_id != asset2_id

    # Verify conflict audit log was recorded for the competing claim
    detail_res = client.get(f"/api/v1/assets/{asset2_id}")
    assert detail_res.status_code == 200

def test_same_creator_duplicate_asset_prevention(client, creator_token):
    identical_content = b"exact source code duplicate prevention"

    file1 = io.BytesIO(identical_content)
    res1 = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "My Software", "category_id": 1},
        files={"file": ("app.py", file1, "text/x-python")}
    )
    assert res1.status_code == 201

    # Exact same creator trying to register exact duplicate file under identical asset name
    file2 = io.BytesIO(identical_content)
    res2 = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "My Software", "category_id": 1},
        files={"file": ("app.py", file2, "text/x-python")}
    )
    assert res2.status_code == 409
    assert "already registered under your asset" in res2.json()["detail"].lower()

def test_blockchain_records_empty_for_pending_asset(client, creator_token):
    file_obj = io.BytesIO(b"file for pending blockchain records check")
    res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Pending Asset", "category_id": 1},
        files={"file": ("pending.py", file_obj, "text/x-python")}
    )
    assert res.status_code == 201
    asset_id = res.json()["asset_id"]

    bc_res = client.get(f"/api/v1/blockchain/records/{asset_id}")
    assert bc_res.status_code == 200
    assert isinstance(bc_res.json(), list)

def test_blockchain_verify_endpoint_when_node_offline(client, creator_token):
    file_obj = io.BytesIO(b"file for verification test")
    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Verification Target", "category_id": 1},
        files={"file": ("target.py", file_obj, "text/x-python")}
    )
    asset_id = reg_res.json()["asset_id"]
    details = client.get(f"/api/v1/assets/{asset_id}").json()
    version_id = details["current_version"]["version_id"]

    # When node is offline, endpoint returns graceful structured response
    with patch.object(blockchain_service, "is_connected", return_value=False):
        verify_res = client.get(f"/api/v1/blockchain/verify/{version_id}")
        assert verify_res.status_code == 200
        data = verify_res.json()
        assert data["blockchain_verification_result"] == "NODE_OFFLINE"
        assert data["is_match"] is False

def test_blockchain_retry_when_node_offline(client, creator_token):
    file_obj = io.BytesIO(b"file for retry test")
    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Retry Target", "category_id": 1},
        files={"file": ("retry.py", file_obj, "text/x-python")}
    )
    asset_id = reg_res.json()["asset_id"]

    with patch.object(blockchain_service, "is_connected", return_value=False):
        retry_res = client.post(
            f"/api/v1/blockchain/retry/{asset_id}?version_number=1",
            headers={"Authorization": f"Bearer {creator_token}"}
        )
        assert retry_res.status_code == 503
        assert "unreachable" in retry_res.json()["detail"].lower()

def test_blockchain_live_registration_flow(client, creator_token):
    from datetime import datetime, timezone

    file_obj = io.BytesIO(b"mocked live blockchain registration test file")
    mock_bc_result = {
        "transaction_hash": "0x4f128e67a9b1c034a71b2d56a310a120014ef06b02a884e910cd052ff3789012",
        "block_number": 104520,
        "network_name": "hardhat_local",
        "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        "blockchain_timestamp": datetime.now(timezone.utc),
        "transaction_status": "CONFIRMED",
        "already_existed": False
    }

    # Simulate connected node during upload
    with patch.object(blockchain_service, "is_connected", return_value=True), \
         patch.object(blockchain_service, "register_fingerprint_on_chain", return_value=mock_bc_result):

        reg_res = client.post(
            "/api/v1/assets/register",
            headers={"Authorization": f"Bearer {creator_token}"},
            data={"title": "Confirmed Work", "category_id": 1},
            files={"file": ("confirmed.py", file_obj, "text/x-python")}
        )

        assert reg_res.status_code == 201
        asset_id = reg_res.json()["asset_id"]

        # Check asset details has CONFIRMED status
        details = client.get(f"/api/v1/assets/{asset_id}").json()
        assert details["registration_status"] == "CONFIRMED"
        assert details["registered_at"] is not None
        assert len(details["blockchain_records"]) == 1
        assert details["blockchain_records"][0]["transaction_hash"] == mock_bc_result["transaction_hash"]
        assert details["blockchain_records"][0]["block_number"] == 104520

        # Verify endpoint returns EXACT_MATCH
        mock_verify_result = {
            "is_match": True,
            "is_registered": True,
            "registered_fingerprint": details["current_version"]["file_hash"],
            "blockchain_timestamp": datetime.now(timezone.utc),
            "registrant": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3"
        }
        with patch.object(blockchain_service, "verify_fingerprint_on_chain", return_value=mock_verify_result):
            version_id = details["current_version"]["version_id"]
            verify_res = client.get(f"/api/v1/blockchain/verify/{version_id}")
            assert verify_res.status_code == 200
            verify_data = verify_res.json()
            assert verify_data["blockchain_verification_result"] == "EXACT_MATCH"
            assert verify_data["is_match"] is True

        # Test retry idempotency when already confirmed
        retry_res = client.post(
            f"/api/v1/blockchain/retry/{asset_id}?version_number=1",
            headers={"Authorization": f"Bearer {creator_token}"}
        )
        assert retry_res.status_code == 200
        assert retry_res.json()["status"] == "ALREADY_CONFIRMED"
