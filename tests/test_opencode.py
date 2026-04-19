import json
import os
import sqlite3
import tempfile
from unittest.mock import patch

import pytest


def create_mock_db(path, messages=None):
    conn = sqlite3.connect(path)
    conn.execute("CREATE TABLE message (id TEXT, session_id TEXT, data TEXT)")
    if messages is None:
        messages = [
            ("1", "sess-1", json.dumps({
                "role": "assistant",
                "modelID": "gpt-4o",
                "providerID": "opencode",
                "tokens": {"total": 100, "input": 60, "output": 40, "reasoning": 0,
                           "cache": {"read": 10, "write": 5}},
                "time": {"created": 1710000000000}
            })),
            ("2", "sess-1", json.dumps({
                "role": "assistant",
                "modelID": "gpt-4o",
                "providerID": "opencode",
                "tokens": {"total": 200, "input": 120, "output": 80, "reasoning": 0,
                           "cache": {"read": 20, "write": 10}},
                "time": {"created": 1710000000000}
            })),
            ("3", "sess-2", json.dumps({
                "role": "user",
                "modelID": "gpt-4o",
                "providerID": "opencode",
                "tokens": {"total": 50, "input": 50, "output": 0},
            })),
        ]
    conn.executemany("INSERT INTO message VALUES (?, ?, ?)", messages)
    conn.commit()
    conn.close()


@pytest.fixture
def mock_db(tmp_path):
    db_path = str(tmp_path / "test.db")
    return db_path


def test_aggregation(mock_db):
    create_mock_db(mock_db)
    with patch.dict(os.environ, {"OPENCODE_DB": mock_db}):
        from app.routes.opencode import get_opencode_metrics
        metrics = get_opencode_metrics()
        assert metrics.total_tokens == 300
        assert metrics.total_input == 180
        assert metrics.total_output == 120
        assert metrics.total_calls == 2
        assert metrics.session_count == 1
        assert len(metrics.by_model) == 1
        assert metrics.by_model[0].model == "gpt-4o"
        assert metrics.by_model[0].calls == 2
        assert metrics.total_estimated_cost_usd > 0


def test_empty_db(mock_db):
    create_mock_db(mock_db, messages=[])
    with patch.dict(os.environ, {"OPENCODE_DB": mock_db}):
        from app.routes.opencode import get_opencode_metrics
        metrics = get_opencode_metrics()
        assert metrics.total_tokens == 0
        assert metrics.total_calls == 0
        assert len(metrics.by_model) == 0


def test_malformed_json(mock_db):
    create_mock_db(mock_db, messages=[
        ("1", "sess-1", "not-valid-json"),
        ("2", "sess-1", json.dumps({
            "role": "assistant",
            "modelID": "gpt-4o",
            "providerID": "opencode",
            "tokens": {"total": 50, "input": 30, "output": 20},
            "time": {"created": 1710000000000}
        })),
    ])
    with patch.dict(os.environ, {"OPENCODE_DB": mock_db}):
        from app.routes.opencode import get_opencode_metrics
        metrics = get_opencode_metrics()
        assert metrics.total_tokens == 50
        assert metrics.total_calls == 1
