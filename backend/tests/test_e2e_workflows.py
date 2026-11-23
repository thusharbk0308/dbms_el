"""
ChainProof - End-to-End Application Test Suite
Formally verifies all 14 required Phase 5 workflows:
1. User registration and login (TC-01)
2. Creator asset registration (TC-02)
3. SHA-256 fingerprint generation (TC-03)
4. Blockchain transaction submission (TC-04)
5. Asset retrieval and details (TC-05)
6. Exact file verification (TC-06)
7. Modified file verification (TC-07)
8. Hash-based verification (TC-08)
9. Multiple asset versions (TC-09)
10. License creation and revocation (TC-10)
11. Dispute submission and resolution (TC-11)
12. Claim transfer and ownership history (TC-12)
13. Admin user and asset management (TC-13)
14. Analytics and audit log retrieval (TC-14)
"""

import io
import hashlib
from datetime import datetime, timezone, timedelta
import pytest

# 1. User registration and login (TC-01)
def test_tc01_user_registration_and_login(client):
    email = "test_creator_e2e@chainproof.io"
    password = "SecurePassword123!"

    # Registration
    reg_res = client.post("/api/v1/auth/register", json={
        "full_name": "E2E Creator",
        "email": email,
        "password": password,
        "role": "CREATOR"
    })
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    assert user_data["email"] == email
    assert user_data["role"] == "CREATOR"

    # Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["role"] == "CREATOR"

# 2. Creator asset registration & 3. SHA-256 fingerprint generation (TC-02, TC-03)
def test_tc02_tc03_asset_registration_and_fingerprint(client, creator_token):
    content = b"print('Hello, Decentralized Intellectual Property!')\n"
    expected_hash = hashlib.sha256(content).hexdigest()

    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "E2E Script Asset", "category_id": 1, "visibility": "PUBLIC"},
        files={"file": ("hello.py", io.BytesIO(content), "text/x-python")}
    )
    assert reg_res.status_code == 201
    asset = reg_res.json()
    assert asset["title"] == "E2E Script Asset"
    asset_id = asset["asset_id"]

    # Retrieve asset details to verify SHA-256 fingerprint
    detail_res = client.get(f"/api/v1/assets/{asset_id}")
    assert detail_res.status_code == 200
    asset_detail = detail_res.json()
    assert asset_detail["current_version"]["file_hash"] == expected_hash  # Deterministic SHA-256 match
    assert asset_detail["registration_status"] in ["CONFIRMED", "PENDING"]

# 4. Blockchain transaction submission & 5. Asset retrieval and details (TC-04, TC-05)
def test_tc04_tc05_blockchain_submission_and_retrieval(client, creator_token):
    content = b"Contract Source v1.0"
    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Blockchain Detail Target", "category_id": 1},
        files={"file": ("target.py", io.BytesIO(content), "text/x-python")}
    )
    assert reg_res.status_code == 201
    asset_id = reg_res.json()["asset_id"]

    # Retrieval
    detail_res = client.get(f"/api/v1/assets/{asset_id}")
    assert detail_res.status_code == 200
    asset_detail = detail_res.json()
    assert asset_detail["asset_id"] == asset_id
    assert asset_detail["current_version"]["version_number"] == 1
    assert "versions" in asset_detail

    # Blockchain records endpoint
    bc_res = client.get(f"/api/v1/blockchain/records/{asset_id}")
    assert bc_res.status_code == 200
    assert isinstance(bc_res.json(), list)

# 6. Exact file verification (TC-06)
def test_tc06_exact_file_verification(client, creator_token):
    file_bytes = b"Exact match verification sample code"
    client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Exact Verification File", "category_id": 1},
        files={"file": ("verify_exact.py", io.BytesIO(file_bytes), "text/x-python")}
    )

    # Verification upload
    v_res = client.post(
        "/api/v1/verification/exact",
        files={"file": ("uploaded_same.py", io.BytesIO(file_bytes), "text/x-python")}
    )
    assert v_res.status_code == 200
    data = v_res.json()
    assert data["verification_result"] == "EXACT_MATCH"
    assert data["is_match"] is True
    assert data["matched_asset"]["title"] == "Exact Verification File"
    assert "legal_disclaimer" in data

# 7. Modified file verification (TC-07)
def test_tc07_modified_file_verification(client, creator_token):
    orig_bytes = b"Unmodified original text"
    client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Avalanche Test File", "category_id": 3},
        files={"file": ("orig.txt", io.BytesIO(orig_bytes), "text/plain")}
    )

    # Modified file with a single character altered
    modified_bytes = b"Unmodified original text."
    v_res = client.post(
        "/api/v1/verification/exact",
        files={"file": ("mod.txt", io.BytesIO(modified_bytes), "text/plain")}
    )
    assert v_res.status_code == 200
    data = v_res.json()
    assert data["verification_result"] == "NOT_REGISTERED"
    assert data["is_match"] is False
    assert data["matched_asset"] is None

# 8. Hash-based verification (TC-08)
def test_tc08_hash_based_verification(client, creator_token):
    content = b"Direct hash lookup text"
    target_hash = hashlib.sha256(content).hexdigest()

    client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Hash Target", "category_id": 3},
        files={"file": ("hash_target.txt", io.BytesIO(content), "text/plain")}
    )

    v_res = client.post(
        "/api/v1/verification/hash",
        data={"submitted_hash": target_hash}
    )
    assert v_res.status_code == 200
    data = v_res.json()
    assert data["verification_result"] == "EXACT_MATCH"
    assert data["is_match"] is True
    assert data["submitted_hash"] == target_hash

# 9. Multiple asset versions (TC-09)
def test_tc09_multiple_asset_versions(client, creator_token):
    v1_content = b"Version 1.0 Code"
    v2_content = b"Version 2.0 Patched Code"

    # Register v1
    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Versioning Target", "category_id": 1},
        files={"file": ("code_v1.py", io.BytesIO(v1_content), "text/x-python")}
    )
    asset_id = reg_res.json()["asset_id"]

    # Upload v2
    v2_res = client.post(
        f"/api/v1/assets/{asset_id}/versions",
        headers={"Authorization": f"Bearer {creator_token}"},
        files={"file": ("code_v2.py", io.BytesIO(v2_content), "text/x-python")}
    )
    assert v2_res.status_code == 201
    new_version = v2_res.json()
    assert new_version["version_number"] == 2

    # Check detail endpoint reflects both versions
    details = client.get(f"/api/v1/assets/{asset_id}").json()
    assert len(details["versions"]) == 2

# 10. License creation and revocation (TC-10)
def test_tc10_license_creation_and_revocation(client, creator_token):
    # Register distinct licensee user
    client.post(
        "/api/v1/auth/register",
        json={"full_name": "Licensee Person", "email": "licensee_e2e@test.com", "password": "Password123!", "role": "CREATOR"}
    )
    lic_login = client.post("/api/v1/auth/login", json={"email": "licensee_e2e@test.com", "password": "Password123!"})
    licensee_id = lic_login.json()["user_id"]

    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Licensed Asset", "category_id": 1},
        files={"file": ("license_target.py", io.BytesIO(b"code"), "text/x-python")}
    )
    asset_id = reg_res.json()["asset_id"]

    start = datetime.now(timezone.utc)
    expiry = start + timedelta(days=365)

    # Issue license
    lic_res = client.post(
        "/api/v1/licenses",
        headers={"Authorization": f"Bearer {creator_token}"},
        json={
            "asset_id": asset_id,
            "licensee_id": licensee_id,
            "license_type": "Commercial",
            "description": "Full production rights",
            "start_date": start.isoformat(),
            "expiry_date": expiry.isoformat()
        }
    )
    assert lic_res.status_code == 201
    lic_id = lic_res.json()["license_id"]
    assert lic_res.json()["status"] == "ACTIVE"

    # Revoke license
    revoke_res = client.patch(
        f"/api/v1/licenses/{lic_id}/status",
        headers={"Authorization": f"Bearer {creator_token}"},
        json={"status": "REVOKED"}
    )
    assert revoke_res.status_code == 200
    assert revoke_res.json()["status"] == "REVOKED"

# 11. Dispute submission and resolution (TC-11)
def test_tc11_dispute_submission_and_resolution(client, creator_token, admin_token):
    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Disputed Asset", "category_id": 2},
        files={"file": ("art.png", io.BytesIO(b"image data"), "image/png")}
    )
    asset_id = reg_res.json()["asset_id"]

    # File dispute
    disp_res = client.post(
        "/api/v1/disputes",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"asset_id": asset_id, "description": "Prior art dispute regarding artwork composition"},
        files={"evidence_file": ("evidence.pdf", io.BytesIO(b"evidence"), "application/pdf")}
    )
    assert disp_res.status_code == 201
    dispute_id = disp_res.json()["dispute_id"]
    assert disp_res.json()["dispute_status"] == "PENDING"

    # Admin resolves dispute
    resolve_res = client.patch(
        f"/api/v1/disputes/{dispute_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"dispute_status": "RESOLVED", "resolution_notes": "Evidence verified; claim approved."}
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["dispute_status"] == "RESOLVED"

# 12. Claim transfer and ownership history (TC-12)
def test_tc12_claim_transfer_and_ownership_history(client, creator_token):
    # Register distinct new owner user
    client.post(
        "/api/v1/auth/register",
        json={"full_name": "New Owner User", "email": "new_owner_e2e@test.com", "password": "Password123!", "role": "CREATOR"}
    )
    new_owner_login = client.post("/api/v1/auth/login", json={"email": "new_owner_e2e@test.com", "password": "Password123!"})
    new_owner_id = new_owner_login.json()["user_id"]

    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Transferable Asset", "category_id": 1},
        files={"file": ("transfer.py", io.BytesIO(b"transferrable content"), "text/x-python")}
    )
    asset_id = reg_res.json()["asset_id"]

    # Transfer claim
    transfer_res = client.post(
        f"/api/v1/assets/{asset_id}/transfer-claim",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={
            "new_owner_id": new_owner_id,
            "transaction_reference": "DOC-AGREEMENT-2026-X1"
        }
    )
    assert transfer_res.status_code == 200
    assert transfer_res.json()["new_owner_id"] == new_owner_id

    # Check ownership history
    hist_res = client.get(f"/api/v1/assets/{asset_id}/history")
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) >= 1
    assert history[-1]["new_owner_id"] == new_owner_id

# 13. Admin user and asset management (TC-13)
def test_tc13_admin_management(client, admin_token):
    # List users
    users_res = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert users_res.status_code == 200
    assert len(users_res.json()) >= 1

    # List assets
    assets_res = client.get("/api/v1/admin/assets", headers={"Authorization": f"Bearer {admin_token}"})
    assert assets_res.status_code == 200
    assert isinstance(assets_res.json(), list)

# 14. Analytics and audit log retrieval (TC-14)
def test_tc14_analytics_and_audit_logs(client, admin_token, db_session):
    from app.database.models.audit_log import AuditLog
    db_session.add(AuditLog(
        user_id=1,
        action="TEST_ACTION",
        entity_type="SYSTEM",
        entity_id="SYS-001",
        details="Automated e2e verification audit log test"
    ))
    db_session.commit()

    # Public analytics overview
    ov_res = client.get("/api/v1/analytics/overview")
    assert ov_res.status_code == 200
    data = ov_res.json()
    assert "total_assets" in data
    assert "total_creators" in data

    # Admin audit logs
    audit_res = client.get("/api/v1/admin/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert audit_res.status_code == 200
    assert len(audit_res.json()) >= 1
