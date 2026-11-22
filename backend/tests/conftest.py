import os
import shutil
import tempfile
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Setup test environment variables before importing app
os.environ["ENVIRONMENT"] = "testing"

from app.database.base import Base
from app.database.session import get_db
from app.database.models.category import Category
from app.core.config import settings
from app.main import app

# StaticPool ensures all connections share the same in-memory SQLite database
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_storage():
    """Sets up a temporary storage directory for tests and cleans it up after."""
    temp_dir = tempfile.mkdtemp()
    settings.UPLOAD_DIR = temp_dir
    yield
    shutil.rmtree(temp_dir, ignore_errors=True)

@pytest.fixture(scope="function")
def db_session():
    """Creates a fresh database schema for every test function."""
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()

    # Pre-seed default categories
    default_cats = [
        Category(category_id=1, category_name="Source Code", description="Code repositories"),
        Category(category_id=2, category_name="Digital Art & Photography", description="Visual media"),
        Category(category_id=3, category_name="Documents & Research", description="Research papers"),
    ]
    db.add_all(default_cats)
    db.commit()

    yield db

    db.close()
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(scope="function")
def client(db_session):
    """Provides a TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def creator_token(client):
    """Helper fixture to register and authenticate a creator user."""
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test Creator",
            "email": "creator@test.com",
            "password": "SecurePassword123!",
            "role": "CREATOR"
        }
    )
    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "creator@test.com",
            "password": "SecurePassword123!"
        }
    )
    return login_res.json()["access_token"]

@pytest.fixture
def verifier_token(client):
    """Helper fixture to register and authenticate a verifier user."""
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test Verifier",
            "email": "verifier@test.com",
            "password": "SecurePassword123!",
            "role": "VERIFIER"
        }
    )
    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "verifier@test.com",
            "password": "SecurePassword123!"
        }
    )
    return login_res.json()["access_token"]

@pytest.fixture
def admin_token(client):
    """Helper fixture to register and authenticate an administrator user."""
    client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test Administrator",
            "email": "admin@test.com",
            "password": "SecurePassword123!",
            "role": "ADMINISTRATOR"
        }
    )
    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@test.com",
            "password": "SecurePassword123!"
        }
    )
    return login_res.json()["access_token"]
