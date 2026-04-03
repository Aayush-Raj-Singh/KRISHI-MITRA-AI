from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone

from app.services.external_data_service import ExternalDataService
from app.services.operations_service import OperationsService


class _FakeCursor:
    def __init__(self, docs):
        self._docs = list(docs)
        self._limit = None

    def sort(self, key, direction=1):
        reverse = direction == -1
        self._docs.sort(key=lambda item: item.get(key), reverse=reverse)
        return self

    def limit(self, limit):
        self._limit = limit
        return self

    async def to_list(self, length=None):
        limit = self._limit if self._limit is not None else length
        if limit is None:
            return list(self._docs)
        return list(self._docs[:limit])


class _FakeCollection:
    def __init__(self, docs=None):
        self._docs = list(docs or [])

    def find(self, filter_spec=None, projection=None):
        filter_spec = filter_spec or {}
        docs = list(self._docs)
        event = filter_spec.get("event")
        if event is not None:
            docs = [doc for doc in docs if doc.get("event") == event]
        crop = filter_spec.get("crop")
        if crop is not None:
            docs = [doc for doc in docs if doc.get("crop") == crop]
        market = filter_spec.get("market")
        if market is not None:
            docs = [doc for doc in docs if doc.get("market") == market]
        date_filter = filter_spec.get("date")
        if isinstance(date_filter, dict) and "$gte" in date_filter:
            docs = [doc for doc in docs if str(doc.get("date", "")) >= str(date_filter["$gte"])]
        return _FakeCursor(docs)

    async def insert_one(self, document):
        self._docs.append(document)


class _FakeDatabase:
    def __init__(self, collections=None):
        self._collections = collections or {}

    def __getitem__(self, name):
        return self._collections.setdefault(name, _FakeCollection())


def test_fetch_mandi_prices_uses_cached_live_actuals_before_unavailable(monkeypatch):
    now = datetime.now(timezone.utc)
    db = _FakeDatabase(
        {
            "integration_audit": _FakeCollection(),
            "price_actuals": _FakeCollection(
                [
                    {
                        "crop": "rice",
                        "market": "muzaffarpur",
                        "date": (now.date() - timedelta(days=offset)).isoformat(),
                        "price": 2200 + offset * 8,
                        "source": ExternalDataService.DEFAULT_MANDI_API_URL,
                        "fetched_at": now - timedelta(hours=3),
                        "updated_at": now - timedelta(hours=2),
                    }
                    for offset in range(4)
                ]
            ),
        }
    )
    service = ExternalDataService(db)

    async def _no_custom(*args, **kwargs):
        return []

    async def _no_live(*args, **kwargs):
        return []

    monkeypatch.setattr(service, "_fetch_custom_mandi", _no_custom)
    monkeypatch.setattr(service, "_fetch_data_gov_mandi", _no_live)

    result = asyncio.run(service.fetch_mandi_prices("Rice", "Muzaffarpur", days=3))

    assert result.cached is True
    assert result.source == ExternalDataService.DEFAULT_MANDI_API_URL
    assert result.stale_data_warning is not None
    assert "last synced market prices" in result.stale_data_warning
    assert len(result.prices) == 3
    assert all(point.price > 0 for point in result.prices)


def test_fetch_mandi_prices_uses_approved_entries_before_cached_actuals(monkeypatch):
    now = datetime.now(timezone.utc)
    db = _FakeDatabase(
        {
            "integration_audit": _FakeCollection(),
            "mandi_entries": _FakeCollection(
                [
                    {
                        "commodity": "Rice",
                        "market": "Muzaffarpur",
                        "district": "Muzaffarpur",
                        "arrival_date": (now.date() - timedelta(days=offset)).isoformat(),
                        "modal_price": 2100 + offset * 5,
                        "status": "approved",
                    }
                    for offset in range(5)
                ]
            ),
            "price_actuals": _FakeCollection(),
        }
    )
    service = ExternalDataService(db)

    async def _no_custom(*args, **kwargs):
        return []

    async def _no_live(*args, **kwargs):
        return []

    monkeypatch.setattr(service, "_fetch_custom_mandi", _no_custom)
    monkeypatch.setattr(service, "_fetch_data_gov_mandi", _no_live)

    result = asyncio.run(service.fetch_mandi_prices("Rice", "Muzaffarpur", days=4))

    assert result.cached is False
    assert result.source == "approved_mandi_entries"
    assert result.stale_data_warning is None
    assert len(result.prices) == 4
    assert result.prices[-1].price > 0


def test_fetch_mandi_prices_returns_empty_when_no_verified_history_exists(monkeypatch):
    db = _FakeDatabase(
        {
            "integration_audit": _FakeCollection(),
            "price_actuals": _FakeCollection(),
            "mandi_entries": _FakeCollection(),
        }
    )
    service = ExternalDataService(db)

    async def _no_custom(*args, **kwargs):
        return []

    async def _no_live(*args, **kwargs):
        return []

    monkeypatch.setattr(service, "_fetch_custom_mandi", _no_custom)
    monkeypatch.setattr(service, "_fetch_data_gov_mandi", _no_live)

    result = asyncio.run(service.fetch_mandi_prices("Rice", "Muzaffarpur", days=30))

    assert result.cached is True
    assert result.source == "unavailable"
    assert result.prices == []
    assert result.stale_data_warning is not None
    assert "No verified 30-day mandi history" in result.stale_data_warning


def test_fetch_data_gov_mandi_uses_explicit_demo_key_in_development(monkeypatch):
    service = ExternalDataService()
    captured: dict = {}

    class _FakeAsyncClient:
        def __init__(self, *args, **kwargs):
            self.headers = kwargs.get("headers", {})

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

    async def _fake_fetch(self, client, url, params):
        captured["headers"] = dict(client.headers)
        captured["params"] = dict(params)
        return [
            {
                "arrival_date": "2026-03-25",
                "modal_price": "2210",
                "market": "Muzaffarpur",
                "district": "Muzaffarpur",
            }
        ]

    monkeypatch.setattr("app.services.external_data_service.settings.environment", "development")
    monkeypatch.setattr("app.services.external_data_service.settings.mandi_api_key", None)
    monkeypatch.setattr(
        "app.services.external_data_service.settings.mandi_demo_api_key", "demo-key"
    )
    monkeypatch.setattr("app.services.external_data_service.httpx.AsyncClient", _FakeAsyncClient)
    monkeypatch.setattr(ExternalDataService, "_fetch_data_gov_records", _fake_fetch)

    result = asyncio.run(service._fetch_data_gov_mandi("Rice", "Muzaffarpur", days=1))

    assert len(result) == 1
    assert captured["params"]["api-key"] == "demo-key"
    assert captured["headers"] == {}


def test_daily_refresh_prefers_recently_requested_mandi_pairs():
    now = datetime.now(timezone.utc)
    db = _FakeDatabase(
        {
            "operations_runs": _FakeCollection(),
            "integration_audit": _FakeCollection(
                [
                    {
                        "event": "mandi_fetch",
                        "payload": {"crop": "Rice", "market": "Muzaffarpur"},
                        "created_at": now,
                    },
                    {
                        "event": "mandi_fetch",
                        "payload": {"crop": "Tomato", "market": "Patna"},
                        "created_at": now - timedelta(minutes=5),
                    },
                    {
                        "event": "mandi_fetch",
                        "payload": {"crop": "Rice", "market": "Muzaffarpur"},
                        "created_at": now - timedelta(minutes=10),
                    },
                ]
            ),
        }
    )
    service = OperationsService(db)

    pairs = asyncio.run(service._recent_mandi_pairs(limit_pairs=5))

    assert pairs[0] == ("Rice", "Muzaffarpur")
    assert ("Tomato", "Patna") in pairs
    assert pairs.count(("Rice", "Muzaffarpur")) == 1


def test_build_verified_mandi_points_filters_to_requested_market():
    service = ExternalDataService()

    points = service._build_verified_mandi_points(
        [
            {
                "market": "Muzaffarpur",
                "district": "Muzaffarpur",
                "arrival_date": "2026-03-22",
                "modal_price": "2200",
            },
            {
                "market": "Muzaffarpur",
                "district": "Muzaffarpur",
                "arrival_date": "2026-03-22",
                "modal_price": "2240",
            },
            {
                "market": "Patna",
                "district": "Patna",
                "arrival_date": "2026-03-21",
                "modal_price": "2100",
            },
            {
                "market": "Muzaffarpur",
                "district": "Muzaffarpur",
                "arrival_date": "2026-03-20",
                "modal_price": "2180",
            },
        ],
        market="Muzaffarpur",
        days=30,
    )

    assert len(points) == 2
    assert points[0].date.isoformat() == "2026-03-20"
    assert points[1].date.isoformat() == "2026-03-22"
    assert points[1].price == 2220.0
