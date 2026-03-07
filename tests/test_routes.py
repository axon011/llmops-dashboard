import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_metrics_sessions():
    resp = client.get("/metrics/sessions")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "avg_latency_ms" in data[0]


def test_opencode_health():
    resp = client.get("/opencode/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "database_found" in data
