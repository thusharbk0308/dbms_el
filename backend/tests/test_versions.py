import io
import pytest

def test_asset_version_lifecycle(client, creator_token):
    # 1. Register asset v1
    v1_content = b"print('Version 1 of application codebase')"
    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Multi-version Web App", "category_id": 1},
        files={"file": ("app_v1.py", io.BytesIO(v1_content), "text/x-python")}
    )
    assert reg_res.status_code == 201
    asset_id = reg_res.json()["asset_id"]

    # 2. Upload updated Version 2
    v2_content = b"print('Version 2 of application codebase with performance improvements')"
    v2_res = client.post(
        f"/api/v1/assets/{asset_id}/versions",
        headers={"Authorization": f"Bearer {creator_token}"},
        files={"file": ("app_v2.py", io.BytesIO(v2_content), "text/x-python")}
    )
    assert v2_res.status_code == 201
    v2_data = v2_res.json()
    assert v2_data["version_number"] == 2
    assert v2_data["asset_id"] == asset_id
    assert len(v2_data["file_hash"]) == 64

    # 3. Retrieve versions list
    versions_res = client.get(f"/api/v1/assets/{asset_id}/versions")
    assert versions_res.status_code == 200
    versions = versions_res.json()
    assert len(versions) == 2
    assert versions[0]["version_number"] == 1
    assert versions[1]["version_number"] == 2
    assert versions[0]["file_hash"] != versions[1]["file_hash"]

    # 4. Reject duplicate version upload of identical v2 content
    dup_res = client.post(
        f"/api/v1/assets/{asset_id}/versions",
        headers={"Authorization": f"Bearer {creator_token}"},
        files={"file": ("app_v2_dup.py", io.BytesIO(v2_content), "text/x-python")}
    )
    assert dup_res.status_code == 409
    assert "already registered as version 2" in dup_res.json()["detail"].lower()

def test_unauthorized_user_cannot_add_version(client, creator_token):
    # Creator 1 creates asset
    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Private Creator Work", "category_id": 1},
        files={"file": ("app.py", io.BytesIO(b"content"), "text/x-python")}
    )
    asset_id = reg_res.json()["asset_id"]

    # Creator 2 logs in
    client.post(
        "/api/v1/auth/register",
        json={"full_name": "Intruder Creator", "email": "intruder@test.com", "password": "Password123!", "role": "CREATOR"}
    )
    login2 = client.post("/api/v1/auth/login", json={"email": "intruder@test.com", "password": "Password123!"})
    token2 = login2.json()["access_token"]

    # Creator 2 attempts to add version to Creator 1's asset
    res = client.post(
        f"/api/v1/assets/{asset_id}/versions",
        headers={"Authorization": f"Bearer {token2}"},
        files={"file": ("unauthorized.py", io.BytesIO(b"unauthorized version"), "text/x-python")}
    )
    assert res.status_code == 403
    assert "only the registered creator" in res.json()["detail"].lower()
