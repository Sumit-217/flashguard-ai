"""Centralized API configuration for FlashGuard AI dashboard and mobile clients."""

import os

# Backend API base URL - configurable via environment
API_BASE_URL = os.getenv("VITE_API_BASE_URL", "http://localhost:8000")

# API endpoints
class APIEndpoints:
    """Centralized API endpoint definitions."""

    # Health & Status
    HEALTH = "/health"
    
    # Risk & Telemetry
    RAINFALL_UTTARAKHAND = "/api/v1/rainfall/uttarakhand"
    RISK_UTTARAKHAND = "/api/v1/risk/uttarakhand"
    RISK_DISTRICT = "/api/v1/risk/district"
    RISK_STATION = "/api/v1/risk/station"
    RISK_GEOJSON = "/api/v1/risk/uttarakhand/geojson"
    DEMO_RISK = "/api/v1/demo/risk/uttarakhand"
    
    # Demo Risk Assessment
    DEMO_RISK_ASSESSMENT = "/api/v1/demo/risk-assessment"
    
    # Alerts
    ALERTS = "/api/v1/alerts"
    ALERT_DETAIL = "/api/v1/alerts/{alert_id}"
    
    @staticmethod
    def full_url(endpoint: str) -> str:
        """Get full URL for an endpoint."""
        return f"{API_BASE_URL}{endpoint}"
