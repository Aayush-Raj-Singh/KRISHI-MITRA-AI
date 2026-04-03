from __future__ import annotations

import os

from fastapi.testclient import TestClient

os.environ.setdefault("POSTGRES_DSN", "postgresql://postgres:postgres@localhost:5432/krishimitra")
os.environ.setdefault("POSTGRES_SCHEMA", "public")
os.environ.setdefault("REDIS_URL", "")

from app.core.security import create_access_token, create_refresh_token, decode_token
from app.main import app


def test_health_endpoint_response_format():
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "healthy"
    assert payload["data"]["status"] == "ok"


def test_database_health_endpoint_response_format():
    with TestClient(app) as client:
        response = client.get("/health/db")

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["message"] == "database healthy"
    assert payload["data"]["status"] == "ok"
    for table in ("users", "recommendations", "feedback", "conversations", "outcomes"):
        assert payload["data"]["required_tables"][table] is True


def test_required_routes_registered():
    routes = {route.path for route in app.routes}
    expected_routes = {
        "/api/v1/auth/register",
        "/api/v1/auth/login",
        "/api/v1/recommendations/crop",
        "/api/v1/recommendations/price-forecast",
        "/api/v1/recommendations/water-optimization",
        "/api/v1/advisory/chat",
        "/api/v1/diagnostics/llm",
        "/api/v1/diagnostics/runtime-profile",
        "/api/v1/diagnostics/translation",
        "/api/v1/feedback/outcome",
        "/api/v1/platform/blueprint",
        "/api/v1/state-engine/catalog",
        "/api/v1/public/weather",
        "/api/v1/public/state-intelligence",
        "/health",
        "/health/db",
    }
    missing = expected_routes - routes
    assert not missing, f"Missing required routes: {missing}"


def test_jwt_token_claims_include_type_and_jti():
    access_token = create_access_token("user123", "farmer")
    refresh_token = create_refresh_token("user123", "farmer")

    access_payload = decode_token(access_token, token_type="access")
    refresh_payload = decode_token(refresh_token, token_type="refresh")

    assert access_payload["sub"] == "user123"
    assert access_payload["type"] == "access"
    assert "jti" in access_payload

    assert refresh_payload["sub"] == "user123"
    assert refresh_payload["type"] == "refresh"
    assert "jti" in refresh_payload and refresh_payload["jti"]
