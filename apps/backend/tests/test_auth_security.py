from __future__ import annotations

import os
from uuid import uuid4

from fastapi.testclient import TestClient

os.environ.setdefault("POSTGRES_DSN", "postgresql://postgres:postgres@localhost:5432/krishimitra")
os.environ.setdefault("POSTGRES_SCHEMA", "public")

from app.main import app


def test_public_registration_rejects_privileged_roles():
    phone = f"933{uuid4().int % 10000000:07d}"

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/register",
            json={
                "name": "Blocked Admin",
                "phone": phone,
                "password": "StrongPass123!",
                "location": "Patna, Bihar",
                "farm_size": 2.0,
                "soil_type": "Loamy",
                "water_source": "canal",
                "primary_crops": ["rice"],
                "role": "admin",
                "language": "en",
                "email": "blocked-admin@example.com",
            },
        )

    assert response.status_code == 403
    payload = response.json()
    assert payload["success"] is False
    assert payload["message"] == "Privileged roles cannot be self-registered"
