import io
import pytest

def test_dispute_submission_and_resolution(client, creator_token, admin_token):
    # Creator 1 creates asset
    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Disputed Graphic Artwork", "category_id": 2},
        files={"file": ("artwork.png", io.BytesIO(b"graphic artwork bytes"), "image/png")}
    )
    asset_id = reg_res.json()["asset_id"]

    # Creator 2 submits dispute
    client.post(
        "/api/v1/auth/register",
        json={"full_name": "Disputing Creator", "email": "disputer@test.com", "password": "Password123!", "role": "CREATOR"}
    )
    login2 = client.post("/api/v1/auth/login", json={"email": "disputer@test.com", "password": "Password123!"})
    token2 = login2.json()["access_token"]

    evidence_file = io.BytesIO(b"Evidence showing prior art creation timestamp")
    disp_res = client.post(
        "/api/v1/disputes",
        headers={"Authorization": f"Bearer {token2}"},
        data={
            "asset_id": asset_id,
            "description": "This asset uses identical background vector composition created earlier."
        },
        files={"evidence_file": ("evidence.pdf", evidence_file, "application/pdf")}
    )
    assert disp_res.status_code == 201
    disp_data = disp_res.json()
    assert disp_data["dispute_status"] == "PENDING"
    assert disp_data["asset_id"] == asset_id
    dispute_id = disp_data["dispute_id"]

    # Creator 1 (non-admin) cannot resolve the dispute
    unauth_patch = client.patch(
        f"/api/v1/disputes/{dispute_id}/status",
        headers={"Authorization": f"Bearer {creator_token}"},
        json={"dispute_status": "RESOLVED", "resolution_notes": "Trying to resolve myself"}
    )
    assert unauth_patch.status_code == 403

    # Admin reviews and resolves dispute
    admin_patch = client.patch(
        f"/api/v1/disputes/{dispute_id}/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "dispute_status": "RESOLVED",
            "resolution_notes": "Both parties aligned; evidence reviewed and validated."
        }
    )
    assert admin_patch.status_code == 200
    assert admin_patch.json()["dispute_status"] == "RESOLVED"
    assert admin_patch.json()["resolved_at"] is not None

    # List disputes filter by status
    list_res = client.get("/api/v1/disputes?status=RESOLVED")
    assert list_res.status_code == 200
    assert any(d["dispute_id"] == dispute_id for d in list_res.json())
