import json
import os
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

OPENCODE_DB_PATH = os.environ.get("OPENCODE_DB", "/opencode_data/opencode.db")


class ModelUsage(BaseModel):
    model: str
    provider: str
    total_tokens: int
    total_input: int
    total_output: int
    total_reasoning: int
    total_cache_read: int
    total_cache_write: int
    calls: int


class DailyUsage(BaseModel):
    date: str
    total_tokens: int
    calls: int


class OpenCodeMetrics(BaseModel):
    total_tokens: int
    total_input: int
    total_output: int
    total_reasoning: int
    total_cache_read: int
    total_cache_write: int
    total_calls: int
    by_model: list[ModelUsage]
    by_day: list[DailyUsage]
    session_count: int


def get_opencode_metrics() -> OpenCodeMetrics:
    db_path = OPENCODE_DB_PATH
    
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail=f"OpenCode database not found at {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, session_id, data FROM message")
        messages = cursor.fetchall()
        
        model_usage = {}
        daily_usage = {}
        sessions = set()
        
        for msg in messages:
            try:
                data = json.loads(msg[2])
            except (json.JSONDecodeError, TypeError):
                continue
            
            if data.get("role") != "assistant":
                continue
            
            model_id = data.get("modelID", "unknown")
            provider_id = data.get("providerID", "unknown")
            tokens = data.get("tokens", {})
            time_created = data.get("time", {}).get("created")
            session_id = msg[1]
            
            if session_id:
                sessions.add(session_id)
            
            key = f"{model_id}|{provider_id}"
            
            if key not in model_usage:
                model_usage[key] = {
                    "model": model_id,
                    "provider": provider_id,
                    "total_tokens": 0,
                    "total_input": 0,
                    "total_output": 0,
                    "total_reasoning": 0,
                    "total_cache_read": 0,
                    "total_cache_write": 0,
                    "calls": 0,
                }
            
            model_usage[key]["total_tokens"] += tokens.get("total", 0)
            model_usage[key]["total_input"] += tokens.get("input", 0)
            model_usage[key]["total_output"] += tokens.get("output", 0)
            model_usage[key]["total_reasoning"] += tokens.get("reasoning", 0)
            model_usage[key]["total_cache_read"] += tokens.get("cache", {}).get("read", 0)
            model_usage[key]["total_cache_write"] += tokens.get("cache", {}).get("write", 0)
            model_usage[key]["calls"] += 1
            
            if time_created:
                date = datetime.fromtimestamp(time_created / 1000).strftime("%Y-%m-%d")
                if date not in daily_usage:
                    daily_usage[date] = {"date": date, "total_tokens": 0, "calls": 0}
                daily_usage[date]["total_tokens"] += tokens.get("total", 0)
                daily_usage[date]["calls"] += 1
        
        conn.close()
        
        total_tokens = sum(m["total_tokens"] for m in model_usage.values())
        total_input = sum(m["total_input"] for m in model_usage.values())
        total_output = sum(m["total_output"] for m in model_usage.values())
        total_reasoning = sum(m["total_reasoning"] for m in model_usage.values())
        total_cache_read = sum(m["total_cache_read"] for m in model_usage.values())
        total_cache_write = sum(m["total_cache_write"] for m in model_usage.values())
        total_calls = sum(m["calls"] for m in model_usage.values())
        
        by_model = [
            ModelUsage(
                model=m["model"],
                provider=m["provider"],
                total_tokens=m["total_tokens"],
                total_input=m["total_input"],
                total_output=m["total_output"],
                total_reasoning=m["total_reasoning"],
                total_cache_read=m["total_cache_read"],
                total_cache_write=m["total_cache_write"],
                calls=m["calls"],
            )
            for m in sorted(model_usage.values(), key=lambda x: x["total_tokens"], reverse=True)
        ]
        
        by_day = [
            DailyUsage(date=d["date"], total_tokens=d["total_tokens"], calls=d["calls"])
            for d in sorted(daily_usage.values(), key=lambda x: x["date"], reverse=True)
        ]
        
        return OpenCodeMetrics(
            total_tokens=total_tokens,
            total_input=total_input,
            total_output=total_output,
            total_reasoning=total_reasoning,
            total_cache_read=total_cache_read,
            total_cache_write=total_cache_write,
            total_calls=total_calls,
            by_model=by_model,
            by_day=by_day,
            session_count=len(sessions),
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading OpenCode database: {str(e)}")


@router.get("/metrics", response_model=OpenCodeMetrics)
def get_opencode_metrics_endpoint():
    """Get OpenCode usage metrics from local SQLite database."""
    return get_opencode_metrics()


@router.get("/health")
def opencode_health():
    """Check OpenCode database availability."""
    db_path = OPENCODE_DB_PATH
    if os.path.exists(db_path):
        return {"status": "ok", "database_found": True}
    return {"status": "not_found", "database_found": False}
