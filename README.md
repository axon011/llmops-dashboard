# LLMOps Dashboard - AI Coding Usage Analytics

A full-stack dashboard for tracking and visualizing AI coding tool usage. Displays real token consumption from OpenCode, with multi-model support and provider breakdown.

## Features

- **OpenCode Integration** - Reads directly from OpenCode's SQLite database
- **Real-time Metrics** - Token usage, model breakdown, daily trends
- **Multi-Provider Support** - Tracks usage across opencode, github-copilot, zai-coding-plan
- **Interactive Dashboard** - React with Recharts visualizations
- **Tabbed Interface** - OpenCode Usage + Langfuse Metrics views
- **Modern UI** - Gradient backgrounds, glassmorphism, animated cards
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

## Dashboard Features

### OpenCode Usage Tab
- **Hero Stats** - Total tokens, coding sessions, API calls, total cost
- **Model Distribution** - Pie chart showing token usage by model
- **Token Breakdown** - Progress bars for input, output, reasoning, cache read
- **Daily Trends** - Bar chart showing 14-day usage history
- **Model Rankings** - Cards with mini progress bars showing input/output split

### Langfuse Metrics Tab
- Session metrics visualization
- Token usage by session charts
- Mock data for demo purposes

### UI/UX Features
- Gradient background with glassmorphism header
- Animated stat cards with hover lift effect
- Gradient progress bars with smooth transitions
- Area chart for recent activity trends
- Responsive design with TailwindCSS
- Live indicator badge

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
- **Frontend:** React 18, TypeScript, Recharts, TailwindCSS, Vite
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

## Components

### Frontend Components
- `App.tsx` - Main dashboard with tabbed interface
- `StatCard` - Animated stat card with icon
- `ProgressBar` - Gradient progress bar component
- `ModelCard` - Model ranking card with mini progress bars

### Backend Routes
- `/opencode/metrics` - OpenCode usage endpoint
- `/metrics/sessions` - Langfuse session metrics endpoint
- `/chat` - LLM chat endpoint
- `/health` - Health check endpoint

## Screenshots

The dashboard displays:
- Total tokens, sessions, API calls, cost
- Usage by model (pie chart with legend)
- Token breakdown (input/output/reasoning/cache)
- Daily usage trends (bar chart with gradient)
- Model details with provider badges

## Running with Docker Compose

```bash
# Start all services
docker-compose up -d --build

# View logs
docker logs llmops-dashboard-app -f

# Stop services
docker-compose down
```

## License

MIT
