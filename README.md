# LLMOps Dashboard

Full-stack observability dashboard for AI coding tools. Two data sources: reads token usage from OpenCode's local SQLite database, and traces LLM API calls to PostgreSQL with cost tracking.

## Architecture

```
Browser (React + Recharts)
         │
    FastAPI Backend
         │
   ┌─────┴─────┐
   │            │
OpenCode     PostgreSQL
SQLite (RO)  (traces, costs)
```

**OpenCode tab** — reads the local OpenCode SQLite database to show per-model token consumption, daily trends, cache efficiency, and estimated costs across all AI coding sessions.

**LLM Traces tab** — every call through the `/chat` endpoint is logged to PostgreSQL with latency, token counts, and cost. The dashboard shows session summaries, cost breakdowns by model, and an expandable trace explorer.

## Key Features

- Real-time token analytics from OpenCode SQLite (read-only)
- Built-in LLM call tracing to PostgreSQL (no external observability service needed)
- Cost estimation using per-model pricing (GPT-4o, Claude, Gemini, DeepSeek, etc.)
- Session grouping, error tracking, latency distribution
- Expandable trace explorer with prompt/response previews
- Multi-stage Docker build with GPU-free deployment
- 12 tests covering pricing, data parsing, and API routes

## Tech Stack

**Backend:** FastAPI, Python 3.11, asyncpg, httpx, Pydantic

**Frontend:** React 18, TypeScript, Recharts, TailwindCSS, Vite

**Infrastructure:** PostgreSQL 16, Docker (multi-stage), GitHub Actions CI

## Quick Start

### Docker (recommended)

```bash
cp .env.example .env
# Edit .env with your OPENAI_API_KEY and adjust OPENCODE_PATH

docker compose up --build
```

Dashboard at `http://localhost:8000`. PostgreSQL auto-initializes on first start.

### Seed demo data

```bash
python scripts/seed_traces.py
```

Populates 100 realistic traces across 8 sessions spanning 14 days.

### Local development

```bash
# Backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

Vite dev server proxies API calls to `localhost:8000`.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Dashboard UI |
| `GET` | `/health` | Health check |
| `GET` | `/opencode/metrics` | Token usage from OpenCode SQLite |
| `GET` | `/opencode/health` | Database availability check |
| `POST` | `/chat` | LLM chat (logs trace to PostgreSQL) |
| `GET` | `/traces/stats` | Overall trace statistics |
| `GET` | `/traces/sessions` | Session summaries |
| `GET` | `/traces/recent` | Recent traces with details |
| `GET` | `/traces/costs` | Cost breakdown by model and day |

## Project Structure

```
├── app/
│   ├── main.py                 # FastAPI app with lifespan (db init/close)
│   ├── db.py                   # asyncpg connection pool + auto-migration
│   ├── models/
│   │   └── pricing.py          # Per-model cost lookup with fuzzy matching
│   ├── services/
│   │   └── trace_logger.py     # Insert traces to PostgreSQL
│   └── routes/
│       ├── chat.py             # POST /chat — direct httpx to OpenAI, logs trace
│       ├── opencode.py         # GET /opencode/metrics — reads SQLite
│       └── traces.py           # GET /traces/* — query PostgreSQL
├── frontend/
│   └── src/App.tsx             # Dashboard: OpenCode tab + Trace Explorer tab
├── migrations/
│   └── 001_create_traces.sql   # llm_traces schema
├── scripts/
│   └── seed_traces.py          # Demo data seeder
├── tests/                      # 12 tests (pricing, parsing, routes)
├── docker-compose.yml          # app + PostgreSQL
├── Dockerfile                  # Multi-stage: Node build + Python runtime
└── requirements.txt            # 8 dependencies (no LangChain, no Langfuse)
```

## Design Decisions

**Built-in tracing over Langfuse/external SaaS** — Building the trace store from scratch demonstrates understanding of observability fundamentals: what to capture (latency, tokens, cost, errors), schema design with proper indexes, and efficient SQL aggregation. No external account or API key required beyond OpenAI.

**asyncpg over SQLAlchemy** — For 4 queries and 1 insert, raw asyncpg is more transparent and faster. Shows understanding of connection pools without ORM abstraction.

**httpx over LangChain** — One `httpx.post()` call does what LangChain needed 3 heavyweight packages to do. Reduces dependencies from 12 to 8.

**Cost calculation with fuzzy matching** — Pricing map covers GPT-4o, Claude, Gemini, DeepSeek families. Fuzzy matching handles versioned model names (e.g., `gpt-4o-2024-08-06` matches `gpt-4o`).

## Tests

```bash
pytest tests/ -v
```

12 tests covering:
- Model pricing calculation (known, unknown, fuzzy, zero tokens)
- OpenCode SQLite parsing (aggregation, empty DB, malformed JSON)
- API route health checks

## License

MIT
