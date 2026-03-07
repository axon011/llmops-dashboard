from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routes import chat, metrics, opencode
import os

app = FastAPI(
    title="LLMOps Observability Dashboard",
    description="Langfuse-powered LLM tracing and metrics API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_path = "/app/static"

app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="assets")

@app.get("/")
def serve_frontend():
    return FileResponse(os.path.join(frontend_path, "index.html"))

app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
app.include_router(opencode.router, prefix="/opencode", tags=["opencode"])


@app.get("/health")
def health():
    return {"status": "ok"}
