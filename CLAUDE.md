# LLMOps Dashboard

## Overview
Full-stack observability dashboard with two data sources: OpenCode SQLite (read-only token analytics) and PostgreSQL (LLM call tracing with cost tracking). No external observability services required.

## Architecture
```
Browser → React Dashboard (App.tsx)
              ↓
         FastAPI Backend (main.py)
              ↓
    ┌─────────┴─────────┐
    ↓                    ↓
OpenCode SQLite      PostgreSQL
(opencode.db, RO)    (llm_traces table)
```

## Tech Stack
- **Backend**: FastAPI, asyncpg, httpx, Pydantic, Python 3.11
- **Frontend**: React 18 + TypeScript, Recharts, TailwindCSS, Vite
- **Database**: PostgreSQL 16 (traces), SQLite3 (OpenCode, read-only)
- **Infrastructure**: Docker (multi-stage), GitHub Actions CI

## Project Structure
```
app/
├── main.py              # FastAPI app with lifespan (db init/close)
├── db.py                # asyncpg pool, auto-migration on startup
├── models/pricing.py    # Per-model cost lookup, fuzzy matching
├── services/trace_logger.py  # log_trace() → PostgreSQL
└── routes/
    ├── chat.py          # POST /chat → OpenAI via httpx, logs trace
    ├── opencode.py      # GET /opencode/metrics → SQLite
    └── traces.py        # GET /traces/{stats,sessions,recent,costs}
frontend/src/
├── App.tsx              # Dashboard shell, OpenCode tab, Trace Explorer tab
├── main.tsx             # React entry
└── vite-env.d.ts        # Vite types
migrations/
└── 001_create_traces.sql
scripts/
└── seed_traces.py       # 100 demo traces
tests/
├── test_pricing.py      # 7 tests
├── test_opencode.py     # 3 tests
└── test_routes.py       # 2 tests
```

## Endpoints
| Method | Path | Source |
|--------|------|--------|
| GET | /opencode/metrics | SQLite |
| GET | /traces/stats | PostgreSQL |
| GET | /traces/sessions | PostgreSQL |
| GET | /traces/recent | PostgreSQL |
| GET | /traces/costs | PostgreSQL |
| POST | /chat | OpenAI API → PostgreSQL |

## Common Commands
```bash
docker compose up --build
pytest tests/ -v
python scripts/seed_traces.py
cd frontend && npm run dev
```
