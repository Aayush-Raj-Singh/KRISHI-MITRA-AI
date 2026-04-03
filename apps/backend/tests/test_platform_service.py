from __future__ import annotations

import asyncio
from datetime import date, datetime, timezone

from app.schemas.integrations import (
    LocationLookupResponse,
    MandiPricePoint,
    MandiPriceResponse,
    WeatherResponse,
)
from app.schemas.recommendations import WeatherDay
from app.schemas.state_engine import StatePortalLinkSummary, StatePortalUpdateSummary
from app.services.geo_hierarchy_service import ResolvedHierarchy
from app.services.platform_service import PlatformService
from app.services.state_engine_service import StateEngineService


class _FakeCursor:
    def __init__(self, docs):
        self._docs = list(docs)

    async def to_list(self, length=None):
        if length is None:
            return list(self._docs)
        return list(self._docs[:length])


class _FakeCollection:
    def __init__(self, docs=None):
        self._docs = list(docs or [])

    def find(self, filter_spec=None, projection=None):
        return _FakeCursor(self._docs)


class _FakeDatabase:
    def __init__(self, collections=None):
        self._collections = collections or {}

    def __getitem__(self, name):
        return self._collections.setdefault(name, _FakeCollection())


class _FakeExternalDataService:
    async def reverse_geocode(self, lat: float, lon: float) -> LocationLookupResponse:
        return LocationLookupResponse(
            latitude=lat,
            longitude=lon,
            label="Patna, Bihar",
            source="test",
            city="Patna",
            state="Bihar",
            country="India",
        )

    async def fetch_weather(self, location: str, days: int = 5) -> WeatherResponse:
        return WeatherResponse(
            location=location,
            source="imd-test",
            forecast=[WeatherDay(date=date(2026, 4, 3), rainfall_mm=10, temperature_c=30)],
            fetched_at=datetime.now(timezone.utc),
            cached=False,
        )

    async def fetch_mandi_prices(self, crop: str, market: str, days: int = 7) -> MandiPriceResponse:
        return MandiPriceResponse(
            crop=crop,
            market=market,
            source="agmarknet-test",
            prices=[
                MandiPricePoint(date=date(2026, 4, 2), price=2200),
                MandiPricePoint(date=date(2026, 4, 3), price=2250),
            ],
            fetched_at=datetime.now(timezone.utc),
            cached=False,
        )


class _FakeGeoHierarchyService:
    async def resolve(self, **kwargs) -> ResolvedHierarchy:
        return ResolvedHierarchy(
            state="Bihar",
            district="Patna",
            block="Phulwari",
            village="Sabalpur",
            postal_code="800001",
            label="Sabalpur, Phulwari, Patna, Bihar",
            source="test-hierarchy",
            latitude=kwargs.get("lat"),
            longitude=kwargs.get("lon"),
        )


class _FakeStatePortalService:
    async def sync_state(self, seed: dict, *, force: bool = False):
        return [
            StatePortalUpdateSummary(
                source_id=f"state_portal_{seed['code'].lower()}",
                name=f"{seed['name']} State Portal",
                category="portal",
                url=seed["official_portal_url"],
                discovered_from="state_registry",
                status="live",
                description="Official state portal snapshot",
                last_synced_at=datetime.now(timezone.utc),
                notices=[],
                links=[
                    StatePortalLinkSummary(
                        title="Agriculture", url=seed["official_portal_url"], category="department"
                    )
                ],
            )
        ]


def _service() -> PlatformService:
    db = _FakeDatabase(
        {
            "market_profiles": _FakeCollection(
                [
                    {
                        "state": "Bihar",
                        "district": "Patna",
                        "name": "Patna",
                        "commodities": ["Rice", "Wheat"],
                    }
                ]
            ),
            "mandi_entries": _FakeCollection(
                [
                    {
                        "state": "Bihar",
                        "district": "Patna",
                        "market": "Patna",
                        "commodity": "Rice",
                        "arrival_date": "2026-04-03",
                    }
                ]
            ),
        }
    )
    external = _FakeExternalDataService()
    geo = _FakeGeoHierarchyService()
    portal = _FakeStatePortalService()
    return PlatformService(StateEngineService(db, external, geo, portal), external, geo)


def test_platform_blueprint_exposes_personas_and_public_apis():
    response = _service().blueprint()

    assert len(response.personas) == 4
    assert any(item.id == "government_agency" for item in response.personas)
    assert any(item.id == "mandi_data_api" for item in response.public_apis)
    assert any(item.id == "etl_service" for item in response.microservices)


def test_platform_workspace_is_persona_aware():
    response = asyncio.run(
        _service().workspace(persona="fpo", state="Bihar", district="Patna", crop="Rice")
    )

    assert response.persona.id == "fpo"
    assert response.intelligence.location.state.name == "Bihar"
    assert response.hierarchy.district == "Patna"
    assert response.hierarchy.block == "Phulwari"
    assert response.hierarchy.village == "Sabalpur"
    assert response.actions
