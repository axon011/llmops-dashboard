from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    with patch("app.db.init_db", new_callable=AsyncMock), \
         patch("app.db.close_db", new_callable=AsyncMock):
        from app.main import app
        yield TestClient(app)


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_opencode_health(client):
    resp = client.get("/opencode/health")
    assert resp.status_code == 200
    assert "database_found" in resp.json()
