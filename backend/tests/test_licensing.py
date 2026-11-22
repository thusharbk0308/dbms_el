import io
from datetime import datetime, timedelta, timezone
import pytest

def test_license_management_flow(client, creator_token, verifier_token):
    # Register licensee user
    client.post(
        "/api/v1/auth/register",
        json={"full_name": "Licensee User", "email": "licensee@test.com", "password": "Password123!", "role": "CREATOR"}
    )
    user_res = client.post("/api/v1/auth/login", json={"email": "licensee@test.com", "password": "Password123!"})
    licensee_id = user_res.json()["user_id"]

    # Creator creates asset
    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Licensed Asset Software", "category_id": 1},
        files={"file": ("lib.py", io.BytesIO(b"library code"), "text/x-python")}
    )
    asset_id = reg_res.json()["asset_id"]

    # 1. Issue Commercial License
    start_date = datetime.now(timezone.utc)
    expiry_date = start_date + timedelta(days=365)
    lic_res = client.post(
        "/api/v1/licenses",
        headers={"Authorization": f"Bearer {creator_token}"},
        json={
            "asset_id": asset_id,
            "licensee_id": licensee_id,
            "license_type": "Commercial",
            "description": "Standard 1-year commercial deployment license",
            "start_date": start_date.isoformat(),
            "expiry_date": expiry_date.isoformat()
        }
    )
    assert lic_res.status_code == 201
    lic_data = lic_res.json()
    assert lic_data["license_type"] == "Commercial"
    assert lic_data["status"] == "ACTIVE"
    license_id = lic_data["license_id"]

    # 2. Get license by ID
    get_res = client.get(f"/api/v1/licenses/{license_id}")
    assert get_res.status_code == 200
    assert get_res.json()["license_id"] == license_id

    # 3. Update status to REVOKED
    patch_res = client.patch(
        f"/api/v1/licenses/{license_id}/status",
        headers={"Authorization": f"Bearer {creator_token}"},
        json={"status": "REVOKED"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "REVOKED"

    # 4. List licenses
    list_res = client.get(f"/api/v1/licenses?asset_id={asset_id}")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

def test_license_invalid_assignments(client, creator_token):
    # Creator creates asset
    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Self License Asset", "category_id": 1},
        files={"file": ("self.py", io.BytesIO(b"self code"), "text/x-python")}
    )
    asset_id = reg_res.json()["asset_id"]
    creator_id = reg_res.json()["creator_id"]

    # Creator cannot license to self
    self_lic_res = client.post(
        "/api/v1/licenses",
        headers={"Authorization": f"Bearer {creator_token}"},
        json={"asset_id": asset_id, "licensee_id": creator_id, "license_type": "Personal"}
    )
    assert self_lic_res.status_code == 400
    assert "cannot grant a license to themselves" in self_lic_res.json()["detail"].lower()

    # Invalid dates: expiry before start
    now = datetime.now(timezone.utc)
    date_res = client.post(
        "/api/v1/licenses",
        headers={"Authorization": f"Bearer {creator_token}"},
        json={
            "asset_id": asset_id,
            "licensee_id": 9999,
            "license_type": "Personal",
            "start_date": now.isoformat(),
            "expiry_date": (now - timedelta(days=1)).isoformat()
        }
    )
    assert date_res.status_code in [400, 404]
