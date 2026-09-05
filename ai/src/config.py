"""Configuration settings for the NWDP government data ingestion and risk pipeline."""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    """Application settings loaded from environment variables with safe defaults."""

    # NWDP / NWIC Datastore settings
    NWDP_BASE_URL: str = os.getenv("NWDP_BASE_URL", "https://nwdp.nwic.gov.in").rstrip(
        "/"
    )
    NWDP_RESOURCE_ID: str = os.getenv(
        "NWDP_RESOURCE_ID", "8b406187-0fee-40b9-8cd9-a249e0ce1903"
    )
    NWDP_PAGE_SIZE: int = int(os.getenv("NWDP_PAGE_SIZE", "100"))
    NWDP_TIMEOUT_SECONDS: float = float(os.getenv("NWDP_TIMEOUT_SECONDS", "30.0"))

    # In-memory cache TTL
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "300"))

    # Prototype rainfall thresholds (hourly accumulation)
    RAINFALL_MODERATE_MM: float = float(os.getenv("RAINFALL_MODERATE_MM", "25.0"))
    RAINFALL_HIGH_MM: float = float(os.getenv("RAINFALL_HIGH_MM", "50.0"))
    RAINFALL_CRITICAL_MM: float = float(os.getenv("RAINFALL_CRITICAL_MM", "80.0"))

    # Prototype rolling accumulation thresholds
    RAINFALL_6H_ELEVATED_MM: float = float(os.getenv("RAINFALL_6H_ELEVATED_MM", "50.0"))
    RAINFALL_6H_SEVERE_MM: float = float(os.getenv("RAINFALL_6H_SEVERE_MM", "100.0"))
    RAINFALL_24H_ELEVATED_MM: float = float(
        os.getenv("RAINFALL_24H_ELEVATED_MM", "75.0")
    )
    RAINFALL_24H_SEVERE_MM: float = float(os.getenv("RAINFALL_24H_SEVERE_MM", "150.0"))

    # Disclaimer
    PROTOTYPE_DISCLAIMER: str = (
        "Prototype/demonstration risk thresholds for testing only. "
        "These are NOT official IMD or CWC disaster declaration thresholds."
    )


settings = Settings()
