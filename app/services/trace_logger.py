import json
import uuid

from app.db import get_pool
from app.models.pricing import calculate_cost


async def log_trace(
    *,
    model: str,
    provider: str,
    prompt_tokens: int,
    completion_tokens: int,
    latency_ms: float,
    status: str = "success",
    error_message: str | None = None,
    prompt_preview: str | None = None,
    response_preview: str | None = None,
    session_id: str | None = None,
    user_id: str = "anonymous",
    metadata: dict | None = None,
) -> uuid.UUID:
    pool = get_pool()
    total_tokens = prompt_tokens + completion_tokens
    cost = calculate_cost(model, prompt_tokens, completion_tokens)

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO llm_traces
                (session_id, user_id, model, provider, prompt_tokens, completion_tokens,
                 total_tokens, latency_ms, estimated_cost_usd, status, error_message,
                 prompt_preview, response_preview, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING trace_id
            """,
            session_id,
            user_id,
            model,
            provider,
            prompt_tokens,
            completion_tokens,
            total_tokens,
            latency_ms,
            cost,
            status,
            error_message,
            (prompt_preview[:200] if prompt_preview else None),
            (response_preview[:200] if response_preview else None),
            json.dumps(metadata or {}),
        )
    return row["trace_id"]
