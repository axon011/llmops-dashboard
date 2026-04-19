MODEL_PRICING: dict[str, dict[str, float]] = {
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "gpt-4-turbo": {"input": 10.00, "output": 30.00},
    "gpt-4.1": {"input": 2.00, "output": 8.00},
    "gpt-4.1-mini": {"input": 0.40, "output": 1.60},
    "gpt-4.1-nano": {"input": 0.10, "output": 0.40},
    "gpt-3.5-turbo": {"input": 0.50, "output": 1.50},
    "o3": {"input": 2.00, "output": 8.00},
    "o3-mini": {"input": 1.10, "output": 4.40},
    "o4-mini": {"input": 1.10, "output": 4.40},
    "claude-opus-4": {"input": 15.00, "output": 75.00},
    "claude-sonnet-4": {"input": 3.00, "output": 15.00},
    "claude-haiku-4": {"input": 0.80, "output": 4.00},
    "claude-3.5-sonnet": {"input": 3.00, "output": 15.00},
    "claude-3-haiku": {"input": 0.25, "output": 1.25},
    "gemini-2.5-pro": {"input": 1.25, "output": 10.00},
    "gemini-2.5-flash": {"input": 0.15, "output": 0.60},
    "deepseek-v3": {"input": 0.27, "output": 1.10},
    "deepseek-r1": {"input": 0.55, "output": 2.19},
    "_default": {"input": 1.00, "output": 3.00},
}


def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    pricing = MODEL_PRICING.get(model)
    if pricing is None:
        model_lower = model.lower()
        for key, val in MODEL_PRICING.items():
            if key != "_default" and key in model_lower:
                pricing = val
                break
    if pricing is None:
        pricing = MODEL_PRICING["_default"]
    cost = (prompt_tokens * pricing["input"] + completion_tokens * pricing["output"]) / 1_000_000
    return round(cost, 6)
