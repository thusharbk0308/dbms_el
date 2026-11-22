import io
import pytest

def test_ownership_claim_transfer(client, creator_token):
    # Register Buyer Creator
    client.post(
        "/api/v1/auth/register",
        json={"full_name": "New Owner", "email": "newowner@test.com", "password": "Password123!", "role": "CREATOR"}
    )
    buyer_res = client.post("/api/v1/auth/login", json={"email": "newowner@test.com", "password": "Password123!"})
    new_owner_id = buyer_res.json()["user_id"]

    # Initial Creator registers asset
    reg_res = client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Ownership Transfer Asset", "category_id": 1},
        files={"file": ("transfer.py", io.BytesIO(b"ownership code"), "text/x-python")}
    )
    asset_id = reg_res.json()["asset_id"]

    # 1. Transfer claim
    transfer_res = client.post(
        f"/api/v1/assets/{asset_id}/transfer-claim",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={
            "new_owner_id": new_owner_id,
            "transaction_reference": "TX-ASSIGNMENT-2026-001"
        }
    )
    assert transfer_res.status_code == 200
    t_data = transfer_res.json()
    assert t_data["new_owner_id"] == new_owner_id
    assert t_data["transaction_reference"] == "TX-ASSIGNMENT-2026-001"

    # 2. Check asset history reflects the transfer
    history_res = client.get(f"/api/v1/assets/{asset_id}/history")
    assert history_res.status_code == 200
    history = history_res.json()
    assert len(history) == 2  # 1: Initial, 2: Transfer
    assert history[1]["transaction_reference"] == "TX-ASSIGNMENT-2026-001"

    # 3. Check updated asset details shows new creator
    details = client.get(f"/api/v1/assets/{asset_id}").json()
    assert details["creator_id"] == new_owner_id

def test_analytics_endpoints(client, creator_token):
    # Create sample asset
    client.post(
        "/api/v1/assets/register",
        headers={"Authorization": f"Bearer {creator_token}"},
        data={"title": "Analytics Sample", "category_id": 1},
        files={"file": ("sample.py", io.BytesIO(b"analytics test payload"), "text/x-python")}
    )

    # 1. Overview metrics
    overview_res = client.get("/api/v1/analytics/overview")
    assert overview_res.status_code == 200
    ov = overview_res.json()
    assert ov["total_assets"] >= 1
    assert ov["total_creators"] >= 1
    assert "active_licenses" in ov
    assert "pending_disputes" in ov

    # 2. Categories breakdown
    cat_res = client.get("/api/v1/analytics/categories")
    assert cat_res.status_code == 200
    assert isinstance(cat_res.json(), list)

    # 3. Monthly registrations
    month_res = client.get("/api/v1/analytics/registrations")
    assert month_res.status_code == 200
    assert isinstance(month_res.json(), list)

    # 4. Verifications distribution
    v_res = client.get("/api/v1/analytics/verifications")
    assert v_res.status_code == 200
    assert isinstance(v_res.json(), list)

    # 5. Creator leaderboard
    lead_res = client.get("/api/v1/analytics/creators")
    assert lead_res.status_code == 200
    assert isinstance(lead_res.json(), list)

def test_admin_dashboard_endpoints(client, admin_token, creator_token, db_session):
    from app.database.models.audit_log import AuditLog
    db_session.add(AuditLog(
        user_id=1,
        action="LOGIN_ATTEMPT",
        entity_type="AUTH",
        entity_id="1",
        details='{"status": "success"}'
    ))
    db_session.commit()

    # Admin gets user list
    users_res = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert users_res.status_code == 200
    assert len(users_res.json()) >= 1

    # Non-admin rejected
    unauth_users = client.get("/api/v1/admin/users", headers={"Authorization": f"Bearer {creator_token}"})
    assert unauth_users.status_code == 403

    # Admin gets audit logs
    audit_res = client.get("/api/v1/admin/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert audit_res.status_code == 200
    assert isinstance(audit_res.json(), list)
    assert len(audit_res.json()) >= 1
