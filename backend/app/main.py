"""FlashGuard AI — Main FastAPI Application Entrypoint."""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai.src.api.routes import router as risk_router
from backend.app.api.v1.demo import router as demo_router

app = FastAPI(
        title="FlashGuard AI Backend",
        description="Disaster Management and Risk Assessment API for SIH 2026",
        version="1.0.0",
    )

    # Enable CORS for dashboard/web integration.
    # Native Flutter mobile apps do not require browser CORS.

allowed_origins = [
        origin.strip()
        for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
        if origin.strip()
    ]

app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "Authorization"],
    )


@app.get(
        "/health",
        tags=["Health"],
        summary="Service Health Check",
    )
def health_check() -> dict[str, str]:
        """Return health status of the FastAPI backend."""
        return {"status": "healthy"}


    # Mount routers under /api/v1
app.include_router(demo_router, prefix="/api/v1")
app.include_router(risk_router, prefix="/api/v1")
