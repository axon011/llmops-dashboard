from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import chat, metrics

app = FastAPI(
    title="LLMOps Observability Dashboard",
    description="Langfuse-powered LLM tracing and metrics API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(metrics.router, prefix="/metrics", tags=["metrics"])


@app.get("/health")
def health():
    return {"status": "ok"}
