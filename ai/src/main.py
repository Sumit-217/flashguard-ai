"""Standalone FastAPI entrypoint for the FlashGuard AI Risk Pipeline."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai.src.api.routes import router as risk_router

app = FastAPI(
    title="FlashGuard AI — Government Risk Engine",
    description="NWDP Telemetry Ingestion and Disaster Risk Assessment for Uttarakhand",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount health check and v1 endpoints
app.include_router(risk_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    """Service health check."""
    return {"status": "healthy"}
