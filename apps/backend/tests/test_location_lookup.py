from __future__ import annotations

import os

from fastapi.testclient import TestClient

os.environ.setdefault("POSTGRES_DSN", "postgresql://postgres:postgres@localhost:5432/krishimitra")
os.environ.setdefault("POSTGRES_SCHEMA", "public")
os.environ.setdefault("REDIS_URL", "")

from app.main import app
from app.services.external_data_service import ExternalDataService


def test_reverse_location_endpoint_returns_place_name(monkeypatch):
    async def fake_reverse_geocode(self, lat: float, lon: float):
        return {
            "latitude": lat,
            "longitude": lon,
            "city": "Patna",
            "state": "Bihar",
            "country": "India",
            "label": "Patna, Bihar, India",
            "source": "test",
        }

    monkeypatch.setattr(ExternalDataService, "reverse_geocode", fake_reverse_geocode)

    with TestClient(app) as client:
        response = client.get(
            "/api/v1/data/location/reverse", params={"lat": 25.5941, "lon": 85.1376}
        )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["label"] == "Patna, Bihar, India"
    assert payload["city"] == "Patna"
