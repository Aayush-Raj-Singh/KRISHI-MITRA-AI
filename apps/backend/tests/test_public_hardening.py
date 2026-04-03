from __future__ import annotations

import os

from fastapi.testclient import TestClient

os.environ.setdefault("POSTGRES_DSN", "postgresql://postgres:postgres@localhost:5432/krishimitra")
os.environ.setdefault("POSTGRES_SCHEMA", "public")
os.environ.setdefault("REDIS_URL", "")
os.environ.setdefault("CLIENT_ERROR_INGEST_ENABLED", "true")

from app.core.dependencies import get_db
from app.main import app


class _FakeInsertResult:
    inserted_id = "evt-123"


class _FakeCollection:
    def __init__(self) -> None:
        self.inserted = []

    async def insert_one(self, document):
        self.inserted.append(document)
        return _FakeInsertResult()


class _FakeDB:
    def __init__(self) -> None:
        self.collections = {}

    def __getitem__(self, name: str):
        collection = self.collections.get(name)
        if collection is None:
            collection = _FakeCollection()
            self.collections[name] = collection
        return collection


def test_safe_redirect_blocks_unverified_domains():
    fake_db = _FakeDB()
    app.dependency_overrides[get_db] = lambda: fake_db
    try:
        with TestClient(app) as client:
            response = client.get(
                "/redirect",
                params={"url": "https://example.com/resource"},
                follow_redirects=False,
            )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 400
    assert response.json()["message"] == "Domain is not on the verified allowlist"


def test_client_error_ingest_redacts_sensitive_fields():
    fake_db = _FakeDB()
    app.dependency_overrides[get_db] = lambda: fake_db
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/public/client-errors",
                json={
                    "source": "web",
                    "message": "Fetch failed with Bearer abc.def.ghi and password=hunter2",
                    "stack": "Authorization: Bearer qwerty",
                    "route": "/advisory?token=abc123",
                    "url": "https://krishimitra.example/advisory?access_token=abc123&tab=chat",
                    "extra": {
                        "access_token": "abc123",
                        "headers": {"authorization": "Bearer nested-token"},
                        "password": "hunter2",
                    },
                },
                headers={"x-request-id": "req-1"},
            )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    stored = fake_db["client_error_events"].inserted[0]
    assert stored["message"] == "Fetch failed with Bearer [REDACTED] and password=[REDACTED]"
    assert stored["stack"] == "Authorization: Bearer [REDACTED]"
    assert stored["route"] == "/advisory?token=[REDACTED]"
    assert stored["url"] == "https://krishimitra.example/advisory"
    assert stored["extra"] == {
        "access_token": "[REDACTED]",
        "headers": {"authorization": "[REDACTED]"},
        "password": "[REDACTED]",
    }
    assert stored["request_id"] == "req-1"
    assert stored["source_ip"] == "testclient"
