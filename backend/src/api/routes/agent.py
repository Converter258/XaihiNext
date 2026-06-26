import asyncio
import json
import uuid
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from backend.src.api.dependencies import executor

router = APIRouter(prefix="/v1", tags=["chat"])

TIMEOUT_SECONDS = 60

# ── In-memory task store (single-user desktop app) ──
_tasks: dict[str, dict[str, Any]] = {}


class ChatRequest(BaseModel):
    thread_id: Optional[str] = None
    messages: list
    attachments: list = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str
    thread_id: str


class StartResponse(BaseModel):
    thread_id: str


def _build_initial_state(req: ChatRequest) -> dict[str, Any]:
    return {
        "messages": req.messages,
        "current_step": "idle",
        "step_count": 0,
    }


# ── Blocking endpoint (backward compat) ──
@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    thread_id = req.thread_id or str(uuid.uuid4())
    initial_state = _build_initial_state(req)

    try:
        result = await asyncio.wait_for(
            executor.arun(initial_state), timeout=TIMEOUT_SECONDS
        )
    except asyncio.TimeoutError:
        return {
            "status": "processing",
            "hint": "任务较大，未来将支持异步",
            "thread_id": thread_id,
        }

    last_msg = result["messages"][-1]
    return ChatResponse(answer=last_msg.content, thread_id=thread_id)


# ── Streaming: start ──
@router.post("/chat/start", response_model=StartResponse)
async def chat_start(req: ChatRequest):
    thread_id = str(uuid.uuid4())
    initial_state = _build_initial_state(req)
    _tasks[thread_id] = initial_state
    return StartResponse(thread_id=thread_id)


# ── Streaming: SSE ──
@router.get("/chat/stream/{thread_id}")
async def chat_stream(thread_id: str):
    state = _tasks.pop(thread_id, None)
    if state is None:
        raise HTTPException(
            status_code=404,
            detail="Thread not found or already consumed.",
        )

    async def event_generator():
        try:
            async for chunk in executor.astream(state):
                yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"
        finally:
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
