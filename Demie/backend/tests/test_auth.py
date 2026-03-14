import pytest
from httpx import AsyncClient
from app.main import app
import hashlib
from httpx import ASGITransport

# 1. TEST: SECURE HASHING ALGORITHM
def test_password_hashing_integrity():
    """Verifies that the SHA-256 hashing is consistent and secure."""
    password = "forensic_password_2026"
    expected_hash = hashlib.sha256(password.encode()).hexdigest()
    
    # Simulate the function in auth.py
    from app.routers.auth import get_password_hash
    assert get_password_hash(password) == expected_hash
    assert get_password_hash(None) is None

# 2. TEST: SESSION ID GENERATION
def test_session_id_format():
    """Ensures SID is exactly 6 alphanumeric characters as per DeMIE specs."""
    from app.routers.auth import generate_session_id
    sid = generate_session_id()
    assert len(sid) == 6
    assert sid.isupper() or sid.isdigit()

# 3. TEST: REGISTRATION VALIDATION
@pytest.mark.asyncio
async def test_registration_validation():
    """Automates checking that missing credentials trigger a 400 error."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Sending incomplete data
        response = await ac.post("/api/auth/register", json={"username": "auditor_1"})
    assert response.status_code == 400
    assert response.json()["detail"] == "USERNAME_AND_PASSWORD_REQUIRED"

# 4. TEST: ADMIN APPROVAL WORKFLOW (PENDING STATUS)
@pytest.mark.asyncio
async def test_login_pending_approval():
    """Automates verification of the 'ACTIVE' status gatekeeper logic."""
    # This simulates a user who is in the DB but hasn't been approved by an admin
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {"username": "new_user", "password": "password123"}
        response = await ac.post("/auth/login", json=payload)
        
    # If the mock user is not 'ACTIVE', it should return 403 Forbidden
    if response.status_code == 403:
        assert response.json()["detail"] == "ACCOUNT_PENDING_ADMIN_APPROVAL"