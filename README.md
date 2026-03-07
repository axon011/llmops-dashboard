# LLMOps Dashboard - AI Coding Usage Analytics

A full-stack dashboard for tracking and visualizing AI coding tool usage. Displays real token consumption from OpenCode, with multi-model support and provider breakdown.

## 🎯 Problem Statement

Developers using AI coding assistants like OpenCode, GitHub Copilot, or Claude Code often have no visibility into their token consumption, costs, or usage patterns. This leads to:
- Unexpected quota exhaustion mid-work
- Uncertainty about which models are being used most
- No insight into token efficiency (cache hit rates, input/output ratios)
- Difficulty optimizing prompts and workflows

**Solution:** A centralized dashboard that reads directly from local tool databases and provides comprehensive usage analytics.

## ✨ Features

### Core Functionality
- **Real OpenCode Integration** - Reads directly from OpenCode's SQLite database
- **Real-time Metrics** - Token usage, model breakdown, daily trends
- **Multi-Provider Support** - Tracks usage across opencode, github-copilot, zai-coding-plan
- **Interactive Dashboard** - React with Recharts visualizations
- **Tabbed Interface** - OpenCode Usage + Langfuse Metrics views
- **Fully Containerized** - Docker Compose for easy deployment

### Dashboard Capabilities

#### OpenCode Usage Tab
- **Hero Stats Cards** - Animated cards showing:
  - Total tokens consumed
  - Number of coding sessions
  - Total API calls made
  - Estimated cost (shows "free" for free models)
- **Model Distribution Chart** - Interactive pie chart showing:
  - Token share per model
  - Provider color coding
  - Hover tooltips with exact counts
- **Token Breakdown** - Progress bars for:
  - Input tokens
  - Output tokens
  - Reasoning tokens (for reasoning-capable models)
  - Cache read/write (for efficiency tracking)
- **Daily Usage Trends** - Bar chart showing:
  - 14-day history
  - Gradient fills
  - Date-based filtering
- **Model Rankings** - Cards showing:
  - Each model's total usage
  - Number of calls
  - Input/output split
  - Mini progress bars per model

#### Langfuse Metrics Tab (Demo)
- Session metrics visualization
- Token usage by session charts
- Mock data for demonstration purposes

### UI/UX Features
- **Modern Design** - Gradient backgrounds, glassmorphism, smooth animations
- **Animated Stat Cards** - Staggered entrance with hover lift effects
- **Gradient Progress Bars** - Colored bars with smooth transitions
- **Responsive Layout** - Works on desktop and tablet screens
- **Live Status Indicator** - Shows when data is current
- **Area Chart** - Recent 7-day activity with gradient fills
- **Better Tooltips** - Rounded corners, shadows, formatted values
- **Model Cards** - Numbered ranking with visual hierarchy

## 🏗️ Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     User (Browser)                      │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  React Dashboard                       │
│  (App.tsx, StatCard, ProgressBar, ModelCard)     │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI Backend                       │
│  (main.py, routes/opencode.py, routes/metrics.py) │
└───────────────────────────┬─────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                   │
        ▼                                   ▼
┌───────────────────┐              ┌──────────────────┐
│ OpenCode SQLite  │              │   PostgreSQL     │
│ opencode.db     │              │ (sessions db)   │
└───────────────────┘              └──────────────────┘
        │
        ▼
  Mounted via Docker volume
  from host machine
```

### Component Structure

```
llmops-dashboard/
├── app/
│   ├── main.py                    # FastAPI entrypoint
│   └── routes/
│       ├── chat.py               # /chat endpoint (LLM requests)
│       ├── metrics.py            # /metrics endpoints (Langfuse mock)
│       └── opencode.py          # /opencode/metrics (real OpenCode data)
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # Main dashboard with tabs
│   │   ├── index.css           # Tailwind directives
│   │   └── main.tsx           # React entry point
│   ├── dist/                     # Built static files
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── tests/
│   └── test_routes.py           # API endpoint tests
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── README.md
```

## 🚀 Quickstart

### Prerequisites
- Docker and Docker Compose installed
- OpenCode has been used at least once (to generate opencode.db)

### Running the Dashboard

```bash
# Clone the repository
git clone https://github.com/your-repo/llmops-dashboard
cd llmops-dashboard

# Option 1: Build and run with Docker
docker build -t llmops-dashboard-app .
docker run -d --name llmops-dashboard-app \
  -p 8000:8000 \
  --env-file .env \
  -v "C:/Users/YOUR_USER/.local/share/opencode:/opencode_data:ro" \
  llmops-dashboard-app

# Option 2: Use Docker Compose (recommended)
docker-compose up -d --build
```

### Access the Dashboard
- **Frontend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

### Stopping the Dashboard

```bash
# Stop containers
docker-compose down

# Or stop individual container
docker stop llmops-dashboard-app
```

## 📊 Dashboard Features

### Metrics Displayed

| Metric | Description | Source |
|---------|-------------|---------|
| Total Tokens | Cumulative token consumption across all models | OpenCode SQLite |
| Sessions | Number of unique coding sessions | OpenCode SQLite |
| API Calls | Total LLM API requests made | OpenCode SQLite |
| Cost | Estimated monetary cost | Free models = $0.00 |
| Model Breakdown | Token usage per model/provider | OpenCode SQLite |
| Daily Trends | Token usage over time | OpenCode SQLite |
| Token Types | Input, output, reasoning, cache | OpenCode SQLite |

### Tracked Providers
- **opencode** - MiniMax-M2.5, GLM-5, Kimi-K2.5
- **github-copilot** - Claude Opus 4.6, Claude Sonnet 4.5
- **zai-coding-plan** - GLM-4.7, Kimi-K2.5

### Visual Components

#### StatCard Component
- Icon with colored background
- Large value display
- Subtitle for context
- Hover lift animation
- Staggered entrance animation

#### ProgressBar Component
- Gradient fills (color to lighter shade)
- Smooth width transitions (1000ms)
- Label and value display
- Percentage calculation

#### ModelCard Component
- Ranking number badge
- Model name with provider badge
- Mini progress bars for input/output
- Hover border highlight

## 🔌 API Documentation

### Endpoints

| Method | Endpoint | Description | Response |
|---------|-----------|-------------|------------|
| `GET` | `/` | React dashboard UI | HTML page |
| `GET` | `/opencode/metrics` | OpenCode usage metrics | JSON |
| `GET` | `/metrics/sessions` | Langfuse session metrics | JSON |
| `GET` | `/health` | Health check | JSON |
| `POST` | `/chat` | Chat with LLM | JSON |

### `/opencode/metrics` Response Schema

```json
{
  "total_tokens": 62187142,
  "total_input": 11701606,
  "total_output": 357497,
  "total_reasoning": 7797,
  "total_cache_read": 47885326,
  "total_cache_write": 2242713,
  "total_calls": 938,
  "by_model": [
    {
      "model": "minimax-m2.5-free",
      "provider": "opencode",
      "total_tokens": 30877636,
      "total_input": 804416,
      "total_output": 93643,
      "total_reasoning": 3581,
      "total_cache_read": 27736864,
      "total_cache_write": 2242713,
      "calls": 455
    }
  ],
  "by_day": [
    {
      "date": "2026-03-07",
      "total_tokens": 8631581,
      "calls": 171
    }
  ],
  "session_count": 25
}
```

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework
- **Python 3.11** - Stable Python version
- **SQLite3** - Reading OpenCode database
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - Latest React with hooks
- **TypeScript** - Type safety
- **Recharts** - Data visualization library
- **TailwindCSS** - Utility-first CSS
- **Vite** - Fast build tool
- **Axios** - HTTP client

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **PostgreSQL** - Persistent session storage
- **Volume Mounts** - Host-to-container data sharing

## 🔐 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL Configuration
POSTGRES_USER=llmops
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=llmops_db

# LLM Provider Keys (for /chat endpoint)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# OpenCode Database Path
OPENCODE_DB=/opencode_data/opencode.db
```

### Data Source Location

The dashboard reads usage data from OpenCode's local SQLite database:

| Platform | Default Path |
|----------|---------------|
| Windows | `%USERPROFILE%\.local\share\opencode\opencode.db` |
| macOS/Linux | `~/.local/share/opencode/opencode.db` |

**Important:** Mount this directory into the Docker container to see your actual usage data.

## 🎨 UI/UX Design Decisions

### Color Palette
- **Green** (#10b981) - Primary actions, success states
- **Blue** (#3b82f6) - Input tokens, primary links
- **Purple** (#8b5cf6) - Reasoning tokens
- **Amber** (#f59e0b) - Cache metrics
- **Gray** (#6b7280) - Neutral elements
- **Emerald** (#22c55e) - Free models, cost display

### Typography
- **Inter** - Clean, readable sans-serif
- **Tabular nums** - Monospaced for numbers
- **Gradient text** - Main title with gray-to-gray gradient

### Animation Strategy
- **Staggered entrances** - Cards animate in sequence (0ms, 100ms, 200ms, 300ms)
- **Hover effects** - Cards lift (-y-1px) and shadow increases
- **Smooth transitions** - 1000ms for progress bars, 300ms for UI elements
- **Loading states** - Spinners for async operations

## 📈 Performance Considerations

### Data Fetching
- API calls are cached on the client side
- Loading states prevent double-fetching
- Error handling with user-friendly messages

### Rendering
- React 18 concurrent features for smooth updates
- Memoization for expensive calculations
- Virtualization not needed (reasonable dataset size)

### Docker Optimization
- Layer caching for faster rebuilds
- Minimal base image (python:3.11-slim)
- Read-only volume mounts for security

## 🧪 Development

### Setting Up Local Development

```bash
# Install backend dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install

# Start backend
uvicorn app.main:app --reload --port 8000

# Start frontend (in another terminal)
cd frontend
npm run dev
```

### Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_routes.py -v

# Run with coverage
pytest --cov=app tests/
```

### Code Style

```bash
# Check linting
ruff check app/

# Format code
ruff format app/
```

## 🚧 Troubleshooting

### OpenCode Data Not Found
**Problem:** Dashboard shows "OpenCode database not found"

**Solutions:**
1. Ensure OpenCode has been used at least once
2. Verify volume mount path in docker-compose.yml
3. Check file permissions on the OpenCode directory
4. Run: `ls -la ~/.local/share/opencode/opencode.db`

### Docker Volume Issues
**Problem:** Changes not reflected in dashboard

**Solutions:**
1. Restart container after volume mount changes: `docker restart llmops-dashboard-app`
2. Verify mount with: `docker inspect llmops-dashboard-app`
3. Use read-only mount for security: `:ro`

### Port Conflicts
**Problem:** Port 8000 already in use

**Solutions:**
1. Stop conflicting service: `docker stop <service-name>`
2. Change port in docker-compose.yml: `8001:8000`
3. Find process using port: `netstat -ano | findstr :8000`

## 🎓 Future Enhancements

### Planned Features
- [ ] Real Langfuse integration (replace mock data)
- [ ] Cost estimation with actual provider pricing
- [ ] Export metrics to CSV/JSON
- [ ] Custom date range picker
- [ ] User preferences (default tab, theme)
- [ ] Alert thresholds (daily/monthly limits)
- [ ] Comparison views (week-over-week, month-over-month)
- [ ] Mobile-responsive design
- [ ] Dark mode toggle

### Performance Improvements
- [ ] WebSocket for real-time updates
- [ ] Data caching with Redis
- [ ] Pagination for large datasets
- [ ] Lazy loading of chart components

## 📚 Learning Outcomes

### Technical Skills Demonstrated
- **Full-stack Development** - React + FastAPI integration
- **Database Integration** - Reading external SQLite databases
- **Docker Orchestration** - Volume mounts, multi-container setup
- **Data Visualization** - Creating interactive charts
- **API Design** - RESTful endpoints with proper error handling
- **State Management** - React hooks for complex UI state
- **TypeScript** - Type-safe component development
- **CSS Animation** - Smooth, performant animations

### Problem-Solving
- **Data Access** - Read OpenCode's database format (JSON columns in SQLite)
- **Container Networking** - Configure volume mounts correctly
- **UI/UX** - Create intuitive, visually appealing interface
- **Performance** - Optimize rendering for smooth experience

## 📄 License

MIT License - feel free to use this project for learning or as a starting point.

## 🙏 Acknowledgments

- **OpenCode** - For the SQLite database schema
- **Recharts** - For the excellent charting library
- **TailwindCSS** - For the utility-first CSS framework
- **FastAPI** - For the modern web framework

## 📞 Contact & Support

For questions or contributions:
- Open an issue on GitHub
- Check the documentation at [project-url/docs](https://docs.example.com)
- Review the code structure in this README

---

**Built with ❤️ using React + FastAPI**
