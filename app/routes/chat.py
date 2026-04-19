import os
import time

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.trace_logger import log_trace

router = APIRouter()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")


class ChatRequest(BaseModel):
    message: str
    user_id: str = "anonymous"
    session_id: str | None = None


class ChatResponse(BaseModel):
    response: str
    user_id: str
    trace_id: str
    latency_ms: float
    tokens_used: int


@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    start = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                json={
                    "model": OPENAI_MODEL,
                    "messages": [
                        {"role": "system", "content": "You are a helpful AI assistant. Be concise."},
                        {"role": "user", "content": req.message},
                    ],
                },
            )
            resp.raise_for_status()
            data = resp.json()

        latency_ms = (time.perf_counter() - start) * 1000
        usage = data.get("usage", {})
        answer = data["choices"][0]["message"]["content"]

        trace_id = await log_trace(
            model=OPENAI_MODEL,
            provider="openai",
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            latency_ms=latency_ms,
            status="success",
            prompt_preview=req.message,
            response_preview=answer,
            session_id=req.session_id,
            user_id=req.user_id,
        )

        return ChatResponse(
            response=answer,
            user_id=req.user_id,
            trace_id=str(trace_id),
            latency_ms=round(latency_ms, 1),
            tokens_used=usage.get("total_tokens", 0),
        )

    except httpx.HTTPStatusError as e:
        latency_ms = (time.perf_counter() - start) * 1000
        await log_trace(
            model=OPENAI_MODEL,
            provider="openai",
            prompt_tokens=0,
            completion_tokens=0,
            latency_ms=latency_ms,
            status="error",
            error_message=str(e),
            prompt_preview=req.message,
            session_id=req.session_id,
            user_id=req.user_id,
        )
        raise HTTPException(status_code=502, detail=f"LLM API error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
