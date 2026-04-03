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
        forecast = [
            WeatherDay(date=(date(2026, 4, 3)), rainfall_mm=12, temperature_c=31),
            WeatherDay(date=(date(2026, 4, 4)), rainfall_mm=44, temperature_c=33),
        ]
        return WeatherResponse(
            location=location,
            source="imd-test",
            forecast=forecast,
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
                MandiPricePoint(date=date(2026, 4, 3), price=2140),
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


def test_state_engine_catalog_covers_all_states_and_uts():
    db = _FakeDatabase()
    service = StateEngineService(
        db, _FakeExternalDataService(), _FakeGeoHierarchyService(), _FakeStatePortalService()
    )

    response = asyncio.run(service.catalog())

    assert len(response.states) == 36
    assert any(item.name == "Bihar" for item in response.states)
    assert any(item.name == "Ladakh" for item in response.states)


def test_state_engine_intelligence_resolves_dynamic_state_context():
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
                        "modal_price": 2140,
                    }
                ]
            ),
        }
    )
    service = StateEngineService(
        db, _FakeExternalDataService(), _FakeGeoHierarchyService(), _FakeStatePortalService()
    )

    response = asyncio.run(service.intelligence(state="Bihar", district="Patna", crop="Rice"))

    assert response.location.state.name == "Bihar"
    assert response.location.district == "Patna"
    assert response.location.block == "Phulwari"
    assert response.location.village == "Sabalpur"
    assert response.market is not None
    assert response.market.market == "Patna"
    assert response.market.change_percent is not None
    assert len(response.official_sources) >= 9
    assert response.portal_updates
    assert any(item.id == "pm_kisan" for item in response.schemes)
