from __future__ import annotations

import os
from datetime import date, timedelta
from uuid import uuid4

from fastapi.testclient import TestClient
from pymongo import MongoClient

os.environ.setdefault("MONGODB_SERVER_SELECTION_TIMEOUT_MS", "500")

from app.main import app  # noqa: E402


def _cleanup_phone(phone: str) -> None:
    client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
    db = client[os.getenv("MONGODB_DB", "krishimitra")]
    user = db["users"].find_one({"phone": phone})
    if user:
        user_id = str(user["_id"])
        db["users"].delete_one({"_id": user["_id"]})
        db["feedback"].delete_many({"user_id": user_id})
        db["recommendations"].delete_many({"user_id": user_id})
        db["conversations"].delete_many({"user_id": user_id})
        db["refresh_tokens"].delete_many({"user_id": user_id})
        db["password_resets"].delete_many({"user_id": user_id})
        db["mfa_challenges"].delete_many({"user_id": user_id})
    client.close()


def _register_user(client: TestClient, payload: dict) -> dict:
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    return data["data"]


def _login(client: TestClient, phone: str, password: str) -> str:
    response = client.post("/api/v1/auth/login", json={"phone": phone, "password": password})
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    return payload["data"]["access_token"]


def test_end_to_end_user_journey():
    farmer_phone = f"900{uuid4().int % 10000000:07d}"
    officer_phone = f"901{uuid4().int % 10000000:07d}"

    with TestClient(app) as client:
        try:
            farmer_payload = {
                "name": "Journey Farmer",
                "phone": farmer_phone,
                "password": "StrongPass123",
                "location": "Patna, Bihar",
                "farm_size": 3.5,
                "soil_type": "Loamy",
                "water_source": "canal",
                "primary_crops": ["rice", "wheat"],
                "role": "farmer",
                "language": "en",
                "email": "farmer@example.com",
            }
            _register_user(client, farmer_payload)
            farmer_token = _login(client, farmer_phone, "StrongPass123")
            farmer_headers = {"Authorization": f"Bearer {farmer_token}"}

            crop_response = client.post(
                "/api/v1/recommendations/crop",
                headers=farmer_headers,
                json={
                    "soil_n": 60,
                    "soil_p": 40,
                    "soil_k": 35,
                    "soil_ph": 6.7,
                    "temperature_c": 28,
                    "humidity_pct": 67,
                    "rainfall_mm": 120,
                    "location": "Patna",
                    "season": "kharif",
                    "historical_yield": 2100,
                },
            )
            assert crop_response.status_code == 200
            crop_payload = crop_response.json()["data"]
            assert len(crop_payload["recommendations"]) == 3

            price_response = client.post(
                "/api/v1/recommendations/price-forecast",
                headers=farmer_headers,
                json={"crop": "rice", "market": "Patna", "currency": "INR"},
            )
            assert price_response.status_code == 200
            assert price_response.json()["data"]["series"]

            forecast = []
            for idx in range(5):
                forecast.append(
                    {
                        "date": (date.today() + timedelta(days=idx + 1)).isoformat(),
                        "rainfall_mm": 2 + idx,
                        "temperature_c": 27 + idx * 0.5,
                    }
                )
            water_response = client.post(
                "/api/v1/recommendations/water-optimization",
                headers=farmer_headers,
                json={
                    "crop": "rice",
                    "growth_stage": "vegetative",
                    "soil_moisture_pct": 55,
                    "water_source": "canal",
                    "field_area_acres": 3,
                    "forecast": forecast,
                },
            )
            assert water_response.status_code == 200
            assert water_response.json()["data"]["schedule"]

            advisory_response = client.post(
                "/api/v1/advisory/chat",
                headers=farmer_headers,
                json={"message": "How should I manage irrigation this week?", "language": "en"},
            )
            assert advisory_response.status_code == 200
            assert advisory_response.json()["data"]["reply"]

            feedback_response = client.post(
                "/api/v1/feedback/outcome",
                headers=farmer_headers,
                json={
                    "recommendation_id": crop_payload["recommendation_id"],
                    "rating": 1,
                    "yield_kg_per_acre": 900,
                    "income_inr": 32000,
                    "water_usage_l_per_acre": 620000,
                    "fertilizer_kg_per_acre": 180,
                    "notes": "Yield was far below target",
                },
            )
            assert feedback_response.status_code == 200
            assert feedback_response.json()["data"]["sustainability_score"] >= 0

            officer_payload = {
                "name": "Journey Officer",
                "phone": officer_phone,
                "password": "StrongPass123",
                "location": "Patna, Bihar",
                "farm_size": 1.0,
                "soil_type": "Loamy",
                "water_source": "canal",
                "primary_crops": ["rice"],
                "role": "extension_officer",
                "language": "en",
                "assigned_regions": ["Patna, Bihar"],
                "email": "officer@example.com",
            }
            _register_user(client, officer_payload)
            officer_token = _login(client, officer_phone, "StrongPass123")
            officer_headers = {"Authorization": f"Bearer {officer_token}"}

            analytics_response = client.get("/api/v1/analytics/overview", headers=officer_headers)
            assert analytics_response.status_code == 200
            attention_response = client.get(
                "/api/v1/analytics/farmers-needing-attention",
                headers=officer_headers,
                params={"location": "Patna", "limit": 10},
            )
            assert attention_response.status_code == 200
            assert isinstance(attention_response.json()["data"], list)
        finally:
            _cleanup_phone(farmer_phone)
            _cleanup_phone(officer_phone)
