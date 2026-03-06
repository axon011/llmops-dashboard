from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.middleware.langfuse_tracer import traced_llm_call

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    user_id: str = "anonymous"
    prompt_version: str = "v1"


class ChatResponse(BaseModel):
    response: str
    user_id: str
    prompt_version: str


@router.post("/", response_model=ChatResponse)
def chat(req: ChatRequest):
    try:
        answer = traced_llm_call(req.message, req.user_id, req.prompt_version)
        return ChatResponse(
            response=answer,
            user_id=req.user_id,
            prompt_version=req.prompt_version,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
