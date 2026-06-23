from fastapi import FastAPI

from backend.src.api.routes.agent import router as agent_router


def create_app() -> FastAPI:
    app = FastAPI(title="XN Agent API", version="0.1.0")
    app.include_router(agent_router)
    return app


app = create_app()
