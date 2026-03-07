# LLMOps Dashboard - AI Coding Usage Analytics

A full-stack dashboard for tracking and visualizing AI coding tool usage. Displays real token consumption from OpenCode, with multi-model support and provider breakdown.

## Features

- **OpenCode Integration** - Reads directly from OpenCode's SQLite database
- **Real-time Metrics** - Token usage, model breakdown, daily trends
- **Multi-Provider Support** - Tracks usage across opencode, github-copilot, zai-coding-plan
- **Interactive Dashboard** - React with Recharts visualizations
- **Tabbed Interface** - OpenCode Usage + Langfuse Metrics views
- **Fully Containerized** - Docker Compose for easy deployment

## Architecture

```
OpenCode SQLite → FastAPI Backend → React Dashboard
                      ↓
                PostgreSQL (sessions)
```

## Quickstart

```bash
# Clone and run
git clone https://github.com/your-repo/llmops-dashboard
cd llmops-dashboard

# Build and run with Docker
docker build -t llmops-dashboard-app .
docker run -d --name llmops-dashboard-app -p 8000:8000 --env-file .env -v "C:/Users/YOUR_USER/.local/share/opencode:/opencode_data:ro" llmops-dashboard-app
```

**Dashboard:** http://localhost:8000

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | React dashboard UI |
| `GET /opencode/metrics` | Real OpenCode usage metrics |
| `GET /metrics/sessions` | Session metrics (mock) |
| `POST /chat` | Chat with LLM (requires API keys) |
| `GET /health` | Health check |

## Tech Stack

- **Backend:** FastAPI, Python 3.11, SQLite
- **Frontend:** React 18, TypeScript, Recharts, TailwindCSS
- **Database:** PostgreSQL, SQLite (OpenCode)
- **Container:** Docker, Docker Compose

## Environment Variables

```env
POSTGRES_USER=llmops
POSTGRES_PASSWORD=your_password
POSTGRES_DB=llmops_db
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Data Source

The dashboard reads usage data from OpenCode's local SQLite database:
- **Windows:** `%USERPROFILE%\.local\share\opencode\opencode.db`
- **Mac/Linux:** `~/.local/share/opencode/opencode.db`

Mount this directory into the container to see your actual usage data.

## Screenshots

The dashboard displays:
- Total tokens, sessions, API calls
- Usage by model (pie chart)
- Token breakdown (input/output/reasoning/cache)
- Daily usage trends (bar chart)
- Detailed model statistics

## License

MIT
