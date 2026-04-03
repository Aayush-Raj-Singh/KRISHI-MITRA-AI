from __future__ import annotations

import os

from fastapi.testclient import TestClient

os.environ.setdefault("POSTGRES_DSN", "postgresql://postgres:postgres@localhost:5432/krishi_db")
os.environ.setdefault("POSTGRES_SCHEMA", "public")
os.environ.setdefault("REDIS_URL", "")

from app.main import app


def test_metrics_endpoint_exposes_prometheus_text():
    with TestClient(app) as client:
        health = client.get("/health")
        assert health.status_code == 200

        metrics = client.get("/metrics")

    assert metrics.status_code == 200
    assert "krishimitra_http_requests_total" in metrics.text
    assert 'path="/health"' in metrics.text
    assert "krishimitra_dependency_up" in metrics.text


def test_request_headers_include_request_correlation_metadata():
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.headers.get("x-request-id")
    assert response.headers.get("x-process-time-ms")
