# LLMOps Observability Dashboard

A full-stack LLMOps observability system that automatically traces every LLM call, surfaces token costs, latency trends, and user feedback scores in a real-time React dashboard.

## Features
- **FastAPI middleware** auto-logs every LLM call to [Langfuse](https://langfuse.com) with structured metadata
- **A/B prompt comparison** without code changes — swap prompt versions via API
- **React/TypeScript dashboard** for real-time cost, latency, and quality metrics
- **PostgreSQL** for persistent session and feedback storage
- Fully containerized with Docker Compose
- GitHub Actions CI/CD

## Architecture

```
Your App → FastAPI Middleware → Langfuse (tracing)
                    ↓
              PostgreSQL (sessions)
                    ↑
           React Dashboard (reads metrics via API)
```

## Quickstart

```bash
git clone https://github.com/axon011/llmops-dashboard
cd llmops-dashboard
cp .env.example .env   # fill in Langfuse + OpenAI keys
docker-compose up --build
```

- Backend API + docs: `http://localhost:8000/docs`
- Frontend dashboard: `http://localhost:3000`

## API

```bash
# Send a tracked LLM request
curl -X POST http://localhost:8000/chat \
  -H 'Content-Type: application/json' \
  -d '{"message": "Explain RAG", "user_id": "u1", "prompt_version": "v2"}'

# Get session metrics
curl http://localhost:8000/metrics/sessions
```

## Stack
- FastAPI, Python 3.11, Langfuse SDK, LangChain, OpenAI
- React 18, TypeScript, Recharts, TailwindCSS
- PostgreSQL, Docker Compose, GitHub Actions
