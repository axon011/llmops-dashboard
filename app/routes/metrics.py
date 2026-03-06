from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class SessionMetric(BaseModel):
    session_id: str
    total_calls: int
    avg_latency_ms: float
    total_tokens: int
    estimated_cost_usd: float


@router.get("/sessions", response_model=list[SessionMetric])
def get_session_metrics():
    """Returns aggregated metrics per session. In production this reads from Langfuse API."""
    return [
        SessionMetric(
            session_id="session-001",
            total_calls=24,
            avg_latency_ms=312.5,
            total_tokens=18400,
            estimated_cost_usd=0.047,
        ),
        SessionMetric(
            session_id="session-002",
            total_calls=11,
            avg_latency_ms=287.0,
            total_tokens=8200,
            estimated_cost_usd=0.021,
        ),
    ]


@router.get("/health")
def metrics_health():
    return {"langfuse": "connected"}
