import io
import pytest

def test_register_asset_success(client, creator_token):
    file_content = b"print('Hello, ChainProof 2026 Academic DBMS Project!')"
    file_obj = io.BytesIO(file_content)

    response = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={
            "title": "ChainProof Demonstration Script",
            "category_id": 1,
            "description": "Python source code demonstrating digital IP registration",
            "visibility": "PUBLIC"
        },
        files={
            "file": ("demo_script.py", file_obj, "text/x-python")
        }
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "ChainProof Demonstration Script"
    assert data["category_id"] == 1
    assert data["original_filename"] == "demo_script.py"
    assert data["registration_status"] == "PENDING"
    assert data["file_size"] == len(file_content)
    assert data["asset_id"].startswith("ast-")
    assert data["registered_at"] is None

def test_duplicate_fingerprint_rejected(client, creator_token):
    file_content = b"identical binary content that should produce duplicate sha256"
    file_obj1 = io.BytesIO(file_content)

    # First registration
    res1 = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Original Work", "category_id": 1},
        files={"file": ("original.py", file_obj1, "text/x-python")}
    )
    assert res1.status_code == 201

    # Attempt to register identical content again
    file_obj2 = io.BytesIO(file_content)
    res2 = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Duplicate Work", "category_id": 1},
        files={"file": ("duplicate.py", file_obj2, "text/x-python")}
    )
    assert res2.status_code == 409
    assert "already registered" in res2.json()["detail"].lower()

def test_unauthorized_verifier_cannot_register_asset(client, verifier_token):
    file_content = b"sample code verifier cannot register"
    file_obj = io.BytesIO(file_content)

    response = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {verifier_token}"},
        data={"title": "Verifier Upload", "category_id": 1},
        files={"file": ("verifier_file.py", file_obj, "text/x-python")}
    )
    assert response.status_code == 403
    assert "access denied" in response.json()["detail"].lower()

def test_anonymous_user_cannot_register_asset(client):
    file_content = b"anonymous upload"
    file_obj = io.BytesIO(file_content)

    response = client.post(
        "/api/v1/assets/register",
        data={"title": "Anonymous Upload", "category_id": 1},
        files={"file": ("anonymous.py", file_obj, "text/x-python")}
    )
    assert response.status_code == 401

def test_invalid_category_rejected(client, creator_token):
    file_content = b"testing invalid category reference"
    file_obj = io.BytesIO(file_content)

    response = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Invalid Category Test", "category_id": 99999},
        files={"file": ("invalid_cat.py", file_obj, "text/x-python")}
    )
    assert response.status_code == 404
    assert "does not exist" in response.json()["detail"].lower()

def test_get_asset_details_and_versions(client, creator_token):
    file_content = b"content for asset retrieval test"
    file_obj = io.BytesIO(file_content)

    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Retrieval Test Asset", "category_id": 1, "description": "Testing asset retrieval"},
        files={"file": ("retrieve_me.py", file_obj, "text/x-python")}
    )
    assert reg_res.status_code == 201
    asset_id = reg_res.json()["asset_id"]

    # 1. Fetch asset details
    detail_res = client.get(f"/api/v1/assets/{asset_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert detail_data["asset_id"] == asset_id
    assert detail_data["title"] == "Retrieval Test Asset"
    assert detail_data["creator_name"] == "Test Creator"
    assert detail_data["category_name"] == "Source Code"
    assert len(detail_data["versions"]) == 1
    assert detail_data["current_version"]["version_number"] == 1

    # 2. Fetch versions endpoint
    versions_res = client.get(f"/api/v1/assets/{asset_id}/versions")
    assert versions_res.status_code == 200
    versions = versions_res.json()
    assert len(versions) == 1
    assert versions[0]["version_number"] == 1
    assert len(versions[0]["file_hash"]) == 64

    # 3. Fetch ownership history endpoint
    history_res = client.get(f"/api/v1/assets/{asset_id}/history")
    assert history_res.status_code == 200
    history = history_res.json()
    assert len(history) == 1
    assert history[0]["transaction_reference"] == "INITIAL_REGISTRATION"
    assert history[0]["previous_owner_id"] is None
    assert history[0]["new_owner_name"] == "Test Creator"

def test_list_assets_pagination_and_filter(client, creator_token):
    for i in range(3):
        file_obj = io.BytesIO(f"content file index {i}".encode())
        client.post(
            "/api/v1/assets/register",
            headers={"Authorization": f"Bearer {creator_token}"},
            data={"title": f"Batch Asset {i}", "category_id": 1},
            files={"file": (f"batch_{i}.py", file_obj, "text/x-python")}
        )

    list_res = client.get("/api/v1/assets?limit=2&skip=0")
    assert list_res.status_code == 200
    assets = list_res.json()
    assert len(assets) == 2
