import pytest

def test_user_registration_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Alice Developer",
            "email": "alice@example.com",
            "password": "Password123!",
            "role": "CREATOR"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "alice@example.com"
    assert data["full_name"] == "Alice Developer"
    assert data["role"] == "CREATOR"
    assert data["account_status"] == "ACTIVE"
    assert "user_id" in data
    assert "password" not in data
    assert "password_hash" not in data

def test_duplicate_email_registration_rejected(client):
    user_payload = {
        "full_name": "Bob Creator",
        "email": "bob@example.com",
        "password": "Password123!",
        "role": "CREATOR"
    }
    # First registration
    res1 = client.post("/api/v1/auth/register", json=user_payload)
    assert res1.status_code == 201

    # Second registration with same email
    res2 = client.post("/api/v1/auth/register", json=user_payload)
    assert res2.status_code == 409
    assert "already registered" in res2.json()["detail"].lower()

def test_login_successful_jwt_generation(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Carol Creator",
            "email": "carol@example.com",
            "password": "SecurePassword123!",
            "role": "CREATOR"
        }
    )

    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "carol@example.com",
            "password": "SecurePassword123!"
        }
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["role"] == "CREATOR"
    assert token_data["email"] == "carol@example.com"

def test_login_invalid_password(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "David Creator",
            "email": "david@example.com",
            "password": "CorrectPassword123!",
            "role": "CREATOR"
        }
    )

    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "david@example.com",
            "password": "WrongPassword999!"
        }
    )
    assert login_res.status_code == 401
    assert "invalid email or password" in login_res.json()["detail"].lower()

def test_get_current_user_profile(client, creator_token):
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {creator_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "creator@test.com"
    assert data["role"] == "CREATOR"

def test_unauthenticated_profile_access_rejected(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
