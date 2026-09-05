"""FlashGuard AI — Main FastAPI Application Entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.v1.demo import router as demo_router

app = FastAPI(
    title="FlashGuard AI Backend",
    description="Disaster Management and Risk Assessment API for SIH 2026",
    version="1.0.0",
)

# Enable CORS for dashboard and mobile integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/health",
    tags=["Health"],
    summary="Service Health Check",
)
def health_check() -> dict[str, str]:
    """Return health status of the FastAPI backend."""
    return {"status": "healthy"}


# Mount v1 demo router under /api/v1
app.include_router(demo_router, prefix="/api/v1")
