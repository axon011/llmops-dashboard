import os
from pathlib import Path

import asyncpg

_pool: asyncpg.Pool | None = None

MIGRATION_SQL = (Path(__file__).parent.parent / "migrations" / "001_create_traces.sql").read_text()


async def init_db():
    global _pool
    raw_url = os.getenv("DATABASE_URL", "")
    raw_url = raw_url.replace("postgresql+asyncpg://", "postgresql://")
    if not raw_url:
        return
    _pool = await asyncpg.create_pool(raw_url, min_size=2, max_size=10)
    async with _pool.acquire() as conn:
        await conn.execute(MIGRATION_SQL)


async def close_db():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("Database not initialized. Set DATABASE_URL and restart.")
    return _pool
