from datetime import datetime

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.db import get_pool

router = APIRouter()


class OverallStats(BaseModel):
    total_traces: int
    total_tokens: int
    total_cost_usd: float
    avg_latency_ms: float
    error_rate: float
    models_used: int
    traces_today: int
    cost_today: float


class SessionSummary(BaseModel):
    session_id: str
    total_calls: int
    avg_latency_ms: float
    total_tokens: int
    estimated_cost_usd: float
    first_call: datetime
    last_call: datetime
    error_count: int


class TraceDetail(BaseModel):
    trace_id: str
    session_id: str | None
    model: str
    provider: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    latency_ms: float
    estimated_cost_usd: float
    status: str
    prompt_preview: str | None
    response_preview: str | None
    created_at: datetime


class ModelCost(BaseModel):
    model: str
    provider: str
    total_cost_usd: float
    total_tokens: int
    call_count: int


class DailyCost(BaseModel):
    date: str
    total_cost_usd: float
    call_count: int


class CostBreakdown(BaseModel):
    total_cost_usd: float
    by_model: list[ModelCost]
    by_day: list[DailyCost]


@router.get("/stats", response_model=OverallStats)
async def get_stats():
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT
                COUNT(*) as total_traces,
                COALESCE(SUM(total_tokens), 0) as total_tokens,
                COALESCE(SUM(estimated_cost_usd), 0) as total_cost_usd,
                COALESCE(AVG(latency_ms), 0) as avg_latency_ms,
                COALESCE(AVG(CASE WHEN status = 'error' THEN 1.0 ELSE 0.0 END), 0) as error_rate,
                COUNT(DISTINCT model) as models_used,
                COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) as traces_today,
                COALESCE(SUM(estimated_cost_usd) FILTER (WHERE created_at::date = CURRENT_DATE), 0) as cost_today
            FROM llm_traces
        """)
    return OverallStats(
        total_traces=row["total_traces"],
        total_tokens=row["total_tokens"],
        total_cost_usd=float(row["total_cost_usd"]),
        avg_latency_ms=float(row["avg_latency_ms"]),
        error_rate=float(row["error_rate"]),
        models_used=row["models_used"],
        traces_today=row["traces_today"],
        cost_today=float(row["cost_today"]),
    )


@router.get("/sessions", response_model=list[SessionSummary])
async def get_sessions(limit: int = Query(50, ge=1, le=200)):
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT
                COALESCE(session_id, 'no-session') as session_id,
                COUNT(*) as total_calls,
                AVG(latency_ms) as avg_latency_ms,
                SUM(total_tokens) as total_tokens,
                SUM(estimated_cost_usd) as estimated_cost_usd,
                MIN(created_at) as first_call,
                MAX(created_at) as last_call,
                COUNT(*) FILTER (WHERE status = 'error') as error_count
            FROM llm_traces
            GROUP BY session_id
            ORDER BY MAX(created_at) DESC
            LIMIT $1
        """, limit)
    return [
        SessionSummary(
            session_id=r["session_id"],
            total_calls=r["total_calls"],
            avg_latency_ms=float(r["avg_latency_ms"]),
            total_tokens=r["total_tokens"],
            estimated_cost_usd=float(r["estimated_cost_usd"]),
            first_call=r["first_call"],
            last_call=r["last_call"],
            error_count=r["error_count"],
        )
        for r in rows
    ]


@router.get("/recent", response_model=list[TraceDetail])
async def get_recent(limit: int = Query(50, ge=1, le=200)):
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT trace_id, session_id, model, provider, prompt_tokens,
                   completion_tokens, total_tokens, latency_ms, estimated_cost_usd,
                   status, prompt_preview, response_preview, created_at
            FROM llm_traces
            ORDER BY created_at DESC
            LIMIT $1
        """, limit)
    return [
        TraceDetail(
            trace_id=str(r["trace_id"]),
            session_id=r["session_id"],
            model=r["model"],
            provider=r["provider"],
            prompt_tokens=r["prompt_tokens"],
            completion_tokens=r["completion_tokens"],
            total_tokens=r["total_tokens"],
            latency_ms=r["latency_ms"],
            estimated_cost_usd=float(r["estimated_cost_usd"]),
            status=r["status"],
            prompt_preview=r["prompt_preview"],
            response_preview=r["response_preview"],
            created_at=r["created_at"],
        )
        for r in rows
    ]


@router.get("/costs", response_model=CostBreakdown)
async def get_costs(days: int = Query(30, ge=1, le=365)):
    pool = get_pool()
    async with pool.acquire() as conn:
        model_rows = await conn.fetch("""
            SELECT model, provider,
                   SUM(estimated_cost_usd) as total_cost_usd,
                   SUM(total_tokens) as total_tokens,
                   COUNT(*) as call_count
            FROM llm_traces
            WHERE created_at >= NOW() - make_interval(days => $1)
            GROUP BY model, provider
            ORDER BY SUM(estimated_cost_usd) DESC
        """, days)

        day_rows = await conn.fetch("""
            SELECT created_at::date::text as date,
                   SUM(estimated_cost_usd) as total_cost_usd,
                   COUNT(*) as call_count
            FROM llm_traces
            WHERE created_at >= NOW() - make_interval(days => $1)
            GROUP BY created_at::date
            ORDER BY created_at::date
        """, days)

    total = sum(float(r["total_cost_usd"]) for r in model_rows)

    return CostBreakdown(
        total_cost_usd=total,
        by_model=[
            ModelCost(
                model=r["model"],
                provider=r["provider"],
                total_cost_usd=float(r["total_cost_usd"]),
                total_tokens=r["total_tokens"],
                call_count=r["call_count"],
            )
            for r in model_rows
        ],
        by_day=[
            DailyCost(
                date=r["date"],
                total_cost_usd=float(r["total_cost_usd"]),
                call_count=r["call_count"],
            )
            for r in day_rows
        ],
    )
