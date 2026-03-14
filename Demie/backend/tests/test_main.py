import pytest
from httpx import AsyncClient,ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_root_endpoint():
    """Automates verification of the global system status."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "DeMIE Backend Online"}

@pytest.mark.asyncio
async def test_api_routing_prefix():
    """Automates verification that /api prefixing is correctly applied."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Testing if auth is reachable under /api
        auth_response = await ac.post("/api/auth/login", json={})
        # Testing if forensics is reachable under /api
        forensics_response = await ac.get("/api/analytics/forensics")
    
    #  expect 400/401 rather than 404, proving the route exists but needs data
    assert auth_response.status_code != 404
    assert forensics_response.status_code != 404