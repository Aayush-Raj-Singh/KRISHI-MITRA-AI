from __future__ import annotations

import asyncio
import io
import os
from uuid import uuid4

import asyncpg
from fastapi.testclient import TestClient
from PIL import Image

os.environ.setdefault("POSTGRES_DSN", "postgresql://postgres:postgres@localhost:5432/krishimitra")
os.environ.setdefault("POSTGRES_SCHEMA", "public")

from app.main import app


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
                f'DELETE FROM "{schema}"."disease_history" WHERE doc->> \'user_id\' = $1',
                user_id,
            )
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
    payload = response.json()
    assert payload["success"] is True


def _login(client: TestClient, phone: str, password: str) -> str:
    response = client.post("/api/v1/auth/login", json={"phone": phone, "password": password})
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    return payload["data"]["access_token"]


def _make_image_bytes() -> bytes:
    image = Image.new("RGB", (64, 64), color=(40, 160, 60))
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


def test_disease_prediction_and_history():
    farmer_phone = f"955{uuid4().int % 10000000:07d}"

    with TestClient(app) as client:
        try:
            _register_user(
                client,
                {
                    "name": "Disease Tester",
                    "phone": farmer_phone,
                    "password": "StrongPass123!",
                    "location": "Patna, Bihar",
                    "farm_size": 2.5,
                    "soil_type": "Loamy",
                    "water_source": "canal",
                    "primary_crops": ["rice"],
                    "role": "farmer",
                    "language": "en",
                    "email": "disease@example.com",
                },
            )
            token = _login(client, farmer_phone, "StrongPass123!")
            headers = {"Authorization": f"Bearer {token}"}

            files = {"image": ("leaf.png", _make_image_bytes(), "image/png")}
            response = client.post("/api/v1/disease/predict", headers=headers, files=files)
            assert response.status_code == 200
            payload = response.json()["data"]
            assert payload["crop"]
            assert payload["disease"]
            assert payload["confidence"] >= 0

            history_response = client.get("/api/v1/disease/history", headers=headers)
            assert history_response.status_code == 200
            history = history_response.json()["data"]
            assert isinstance(history, list)
            assert len(history) >= 1
        finally:
            _cleanup_phone(farmer_phone)
