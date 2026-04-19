import pytest

from app.models.pricing import calculate_cost


def test_known_model():
    cost = calculate_cost("gpt-4o", 1_000_000, 0)
    assert cost == pytest.approx(2.50, abs=0.01)


def test_known_model_output():
    cost = calculate_cost("gpt-4o", 0, 1_000_000)
    assert cost == pytest.approx(10.00, abs=0.01)


def test_mixed_tokens():
    cost = calculate_cost("gpt-4o", 1000, 500)
    expected = (1000 * 2.50 + 500 * 10.00) / 1_000_000
    assert cost == pytest.approx(expected, abs=1e-6)


def test_unknown_model_uses_default():
    cost = calculate_cost("some-unknown-model", 1_000_000, 0)
    assert cost == pytest.approx(1.0, abs=0.01)


def test_fuzzy_match():
    cost = calculate_cost("gpt-4o-2024-08-06", 1_000_000, 0)
    assert cost == pytest.approx(2.50, abs=0.01)


def test_zero_tokens():
    cost = calculate_cost("gpt-4o", 0, 0)
    assert cost == 0.0


def test_claude_model():
    cost = calculate_cost("claude-sonnet-4", 1_000_000, 1_000_000)
    expected = (1_000_000 * 3.00 + 1_000_000 * 15.00) / 1_000_000
    assert cost == pytest.approx(expected, abs=0.01)
