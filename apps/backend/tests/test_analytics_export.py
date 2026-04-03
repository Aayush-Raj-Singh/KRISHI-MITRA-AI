from __future__ import annotations

import asyncio
import os
from uuid import uuid4

import asyncpg
from fastapi.testclient import TestClient

os.environ.setdefault("POSTGRES_DSN", "postgresql://postgres:postgres@localhost:5432/krishimitra")
os.environ.setdefault("POSTGRES_SCHEMA", "public")

from app.main import app
from app.testing.auth_helpers import seed_user


def _cleanup_phone(phone: str) -> None:
    dsn = os.getenv("POSTGRES_DSN", "postgresql://postgres:postgres@localhost:5432/krishimitra")
    schema = os.getenv("POSTGRES_SCHEMA", "public")

    async def _cleanup() -> None:
        conn = await asyncpg.connect(dsn)
        try:
            row = await conn.fetchrow(
                f'SELECT id FROM "{schema}"."users" WHERE doc->> \'phone\' = $1',
                phone,
            )
            if not row:
                return
            user_id = row["id"]
            await conn.execute(
                f'DELETE FROM "{schema}"."refresh_tokens" WHERE doc->> \'user_id\' = $1',
                user_id,
            )
            await conn.execute(
                f'DELETE FROM "{schema}"."users" WHERE id = $1',
                user_id,
            )
        finally:
            await conn.close()

    try:
        asyncio.run(_cleanup())
    except Exception:
        return


def _register_user(client: TestClient, payload: dict) -> None:
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 200
    assert response.json()["success"] is True


def _login(client: TestClient, phone: str, password: str) -> str:
    response = client.post("/api/v1/auth/login", json={"phone": phone, "password": password})
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    return payload["data"]["access_token"]


def test_analytics_exports_support_pdf_and_xlsx():
    admin_phone = f"944{uuid4().int % 10000000:07d}"

    with TestClient(app) as client:
        try:
            asyncio.run(
                seed_user(
                    payload={
                        "name": "Export Admin",
                        "phone": admin_phone,
                        "password": "StrongPass123!",
                        "location": "Patna, Bihar",
                        "farm_size": 5.0,
                        "soil_type": "Loamy",
                        "water_source": "canal",
                        "primary_crops": ["rice"],
                        "role": "admin",
                        "language": "en",
                        "email": "export-admin@example.com",
                        "assigned_regions": ["Patna, Bihar"],
                    },
                )
            )
            token = _login(client, admin_phone, "StrongPass123!")
            headers = {"Authorization": f"Bearer {token}"}

            pdf_response = client.get(
                "/api/v1/analytics/export",
                headers=headers,
                params={"format": "pdf", "location": "Patna", "crop": "rice"},
            )
            assert pdf_response.status_code == 200
            assert "application/pdf" in pdf_response.headers["content-type"]
            assert pdf_response.headers["content-disposition"].endswith('.pdf"')
            assert pdf_response.content.startswith(b"%PDF")

            xlsx_response = client.get(
                "/api/v1/analytics/export",
                headers=headers,
                params={"format": "xlsx", "location": "Patna", "crop": "rice"},
            )
            assert xlsx_response.status_code == 200
            assert (
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                in xlsx_response.headers["content-type"]
            )
            assert xlsx_response.headers["content-disposition"].endswith('.xlsx"')
            assert xlsx_response.content[:2] == b"PK"
        finally:
            _cleanup_phone(admin_phone)
