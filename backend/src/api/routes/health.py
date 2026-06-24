from fastapi import APIRouter

from backend.config.settings import settings

router = APIRouter(prefix="/v1", tags=["health"])


@router.get("/health")
async def health():
    return {"status": "ok", "model": settings.MODEL_NAME}
