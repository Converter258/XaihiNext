import asyncio
import uuid
from typing import Any, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.src.api.dependencies import executor

router = APIRouter(prefix="/v1", tags=["chat"])

TIMEOUT_SECONDS = 60


class ChatRequest(BaseModel):
    thread_id: Optional[str] = None
    messages: list
    attachments: list = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str
    thread_id: str


def _build_initial_state(req: ChatRequest) -> dict[str, Any]:
    return {
        "messages": req.messages,
        "current_step": "idle",
        "step_count": 0,
    }


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    thread_id = req.thread_id or str(uuid.uuid4())
    initial_state = _build_initial_state(req)

    try:
        result = await asyncio.wait_for(executor.arun(initial_state), timeout=TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        return {
            "status": "processing",
            "hint": "任务较大，未来将支持异步",
            "thread_id": thread_id,
        }

    last_msg = result["messages"][-1]
    return ChatResponse(answer=last_msg.content, thread_id=thread_id)
