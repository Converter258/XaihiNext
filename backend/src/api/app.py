from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.src.api.routes.agent import router as agent_router
from backend.src.api.routes.health import router as health_router


def create_app() -> FastAPI:
    app = FastAPI(title="XN Agent API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(agent_router)
    app.include_router(health_router)
    return app


app = create_app()
