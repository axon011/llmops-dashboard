import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.db import close_db, init_db
from app.routes import chat, opencode, traces


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="LLMOps Observability Dashboard",
    description="LLM call tracing and usage analytics",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_path = os.getenv("FRONTEND_PATH", "/app/static")

assets_path = os.path.join(frontend_path, "assets")
if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

if os.path.exists(frontend_path):
    index_path = os.path.join(frontend_path, "index.html")

    @app.get("/")
    def serve_frontend():
        return FileResponse(index_path)

app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(opencode.router, prefix="/opencode", tags=["opencode"])
app.include_router(traces.router, prefix="/traces", tags=["traces"])


@app.get("/health")
async def health():
    return {"status": "ok"}
