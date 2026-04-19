"""Seed the llm_traces table with realistic demo data."""

import asyncio
import random
import uuid
from datetime import datetime, timedelta, timezone

import asyncpg

MODELS = [
    ("gpt-4o", "openai"),
    ("gpt-4o-mini", "openai"),
    ("claude-sonnet-4", "anthropic"),
    ("claude-haiku-4", "anthropic"),
    ("gpt-4.1-mini", "openai"),
]

PROMPTS = [
    "Explain the difference between REST and GraphQL",
    "Write a Python function to parse CSV files",
    "How does connection pooling work in PostgreSQL?",
    "Generate unit tests for a FastAPI endpoint",
    "What are the best practices for Docker multi-stage builds?",
    "Explain async/await in Python with examples",
    "How to implement rate limiting in an API?",
    "Write a SQL query to find duplicate records",
    "What is the CAP theorem?",
    "How does HNSW indexing work in vector databases?",
    "Explain transformer attention mechanism",
    "Write a bash script to monitor disk usage",
    "How to set up CI/CD with GitHub Actions?",
    "Explain the difference between OLTP and OLAP",
    "Write a React component with TypeScript",
]

RESPONSES = [
    "Here's a detailed explanation with code examples...",
    "The key difference is in how they handle data fetching...",
    "You can implement this using the following approach...",
    "Based on best practices, I'd recommend...",
    "Here's a complete implementation with error handling...",
]

PRICING = {
    "gpt-4o": (2.50, 10.00),
    "gpt-4o-mini": (0.15, 0.60),
    "claude-sonnet-4": (3.00, 15.00),
    "claude-haiku-4": (0.80, 4.00),
    "gpt-4.1-mini": (0.40, 1.60),
}


async def seed(db_url: str = "postgresql://user:password@localhost:5432/llmops", count: int = 100):
    conn = await asyncpg.connect(db_url)

    now = datetime.now(timezone.utc)
    sessions = [str(uuid.uuid4()) for _ in range(8)]

    for _ in range(count):
        model, provider = random.choice(MODELS)
        prompt_tokens = random.randint(50, 2000)
        completion_tokens = random.randint(20, 1500)
        total_tokens = prompt_tokens + completion_tokens
        latency_ms = random.uniform(200, 3000)
        is_error = random.random() < 0.05
        status = "error" if is_error else "success"

        input_price, output_price = PRICING[model]
        cost = (prompt_tokens * input_price + completion_tokens * output_price) / 1_000_000

        created_at = now - timedelta(
            days=random.randint(0, 14),
            hours=random.randint(0, 23),
            minutes=random.randint(0, 59),
        )

        await conn.execute(
            """
            INSERT INTO llm_traces
                (session_id, user_id, model, provider, prompt_tokens, completion_tokens,
                 total_tokens, latency_ms, estimated_cost_usd, status, error_message,
                 prompt_preview, response_preview, metadata, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            """,
            random.choice(sessions),
            "demo-user",
            model,
            provider,
            prompt_tokens,
            completion_tokens,
            total_tokens,
            latency_ms,
            round(cost, 6),
            status,
            "API timeout after 30s" if is_error else None,
            random.choice(PROMPTS),
            None if is_error else random.choice(RESPONSES),
            "{}",
            created_at,
        )

    await conn.close()
    print(f"Seeded {count} traces across {len(sessions)} sessions.")


if __name__ == "__main__":
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else "postgresql://user:password@localhost:5432/llmops"
    asyncio.run(seed(url))
