from __future__ import annotations

import asyncio
import os
from datetime import date, timedelta
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
                f'DELETE FROM "{schema}"."feedback" WHERE doc->> \'user_id\' = $1',
                user_id,
            )
            await conn.execute(
                f'DELETE FROM "{schema}"."recommendations" WHERE doc->> \'user_id\' = $1',
                user_id,
            )
            await conn.execute(
                f'DELETE FROM "{schema}"."conversations" WHERE doc->> \'user_id\' = $1',
                user_id,
            )
            await conn.execute(
                f'DELETE FROM "{schema}"."refresh_tokens" WHERE doc->> \'user_id\' = $1',
                user_id,
            )
            await conn.execute(
                f'DELETE FROM "{schema}"."password_resets" WHERE doc->> \'user_id\' = $1',
                user_id,
            )
            await conn.execute(
                f'DELETE FROM "{schema}"."mfa_challenges" WHERE doc->> \'user_id\' = $1',
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
                "password": "StrongPass123!",
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
            farmer_token = _login(client, farmer_phone, "StrongPass123!")
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
            assert advisory_response.json()["data"]["provider"] == "bedrock"

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

            hero_summary_response = client.get(
                "/api/v1/dashboard/hero-summary", headers=farmer_headers
            )
            assert hero_summary_response.status_code == 200
            hero_summary = hero_summary_response.json()["data"]
            assert hero_summary["latest_recommendation_id"]
            assert hero_summary["latest_recommendation_kind"] == "water"
            assert hero_summary["total_recommendations"] >= 3
            assert hero_summary["water_recommendation_count"] >= 1
            assert hero_summary["latest_water_savings_percent"] is not None
            assert hero_summary["latest_sustainability_score"] is not None
            assert hero_summary["total_feedback"] >= 1

            market_price_response = client.get(
                "/api/v1/dashboard/market-prices",
                headers=farmer_headers,
                params={"commodity": "rice", "page": 1, "page_size": 10},
            )
            assert market_price_response.status_code == 200
            market_price_payload = market_price_response.json()["data"]
            assert isinstance(market_price_payload["items"], list)
            assert market_price_payload["page"] == 1
            assert market_price_payload["page_size"] == 10

            officer_payload = {
                "name": "Journey Officer",
                "phone": officer_phone,
                "password": "StrongPass123!",
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
            asyncio.run(seed_user(payload=officer_payload))
            officer_token = _login(client, officer_phone, "StrongPass123!")
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

            excel_report_response = client.get(
                "/api/v1/analytics/export",
                headers=officer_headers,
                params={"location": "Patna", "format": "xlsx"},
            )
            assert excel_report_response.status_code == 200
            assert (
                excel_report_response.headers["content-type"]
                == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            assert excel_report_response.headers["content-disposition"].endswith('.xlsx"')
            assert excel_report_response.content[:2] == b"PK"

            pdf_report_response = client.get(
                "/api/v1/analytics/export",
                headers=officer_headers,
                params={"location": "Patna", "format": "pdf"},
            )
            assert pdf_report_response.status_code == 200
            assert pdf_report_response.headers["content-type"] == "application/pdf"
            assert pdf_report_response.headers["content-disposition"].endswith('.pdf"')
            assert pdf_report_response.content.startswith(b"%PDF")
        finally:
            _cleanup_phone(farmer_phone)
            _cleanup_phone(officer_phone)
