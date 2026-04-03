from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from app.services.state_portal_service import StatePortalService


class _FakeCollection:
    def __init__(self, docs=None):
        self._docs = list(docs or [])

    async def find_one(self, filter_spec=None, projection=None, sort=None):
        filter_spec = filter_spec or {}
        for doc in self._docs:
            if all(doc.get(key) == value for key, value in filter_spec.items()):
                return dict(doc)
        return None

    async def update_one(self, filter_spec, update, upsert=False):
        payload = dict(update.get("$set") or {})
        for index, doc in enumerate(self._docs):
            if all(doc.get(key) == value for key, value in filter_spec.items()):
                merged = dict(doc)
                merged.update(payload)
                self._docs[index] = merged
                return
        if upsert:
            merged = dict(filter_spec)
            merged.update(payload)
            self._docs.append(merged)


class _FakeDatabase:
    def __init__(self, collections=None):
        self._collections = collections or {}

    def __getitem__(self, name):
        return self._collections.setdefault(name, _FakeCollection())


class _TestStatePortalService(StatePortalService):
    async def _fetch_snapshot(self, source):
        html = """
        <html>
          <head><title>Bihar State Portal</title><meta name="description" content="Agriculture services and notices"/></head>
          <body>
            <a href="https://state.bihar.gov.in/agriculture">Agriculture Department</a>
            <a href="https://state.bihar.gov.in/mandi-notice">Mandi Notice Update</a>
            <a href="https://example.com/unrelated">Unrelated</a>
          </body>
        </html>
        """
        return self._parse_test_html(source.url, html)

    @staticmethod
    def _parse_test_html(url: str, html: str):
        from app.utils.html_extract import extract_html_snapshot

        return extract_html_snapshot(html, base_url=url)


def test_state_portal_sync_returns_ranked_links_and_notices():
    db = _FakeDatabase({"state_portal_snapshots": _FakeCollection()})
    seed = {
        "code": "BR",
        "name": "Bihar",
        "official_portal_url": "https://state.bihar.gov.in/",
        "agriculture_directory_url": "https://www.india.gov.in/",
        "capital": "Patna",
    }

    summaries = asyncio.run(_TestStatePortalService(db).sync_state(seed, force=True))

    assert summaries
    assert summaries[0].status in {"live", "pending"}
    assert any(link.category == "department" for link in summaries[0].links)
    assert any("Notice" in notice.title for notice in summaries[0].notices)


def test_state_portal_sync_uses_cached_snapshot_on_failure():
    cached_doc = {
        "state_code": "BR",
        "state_name": "Bihar",
        "source_id": "state_portal_br",
        "name": "Bihar State Portal",
        "category": "portal",
        "url": "https://state.bihar.gov.in/",
        "discovered_from": "state_registry",
        "status": "live",
        "description": "Cached portal snapshot",
        "last_synced_at": datetime.now(timezone.utc),
        "notices": [],
        "links": [
            {
                "title": "Agriculture Department",
                "url": "https://state.bihar.gov.in/agriculture",
                "category": "department",
            }
        ],
    }

    class _FailingService(StatePortalService):
        async def _fetch_snapshot(self, source):
            raise RuntimeError("upstream unavailable")

    db = _FakeDatabase({"state_portal_snapshots": _FakeCollection([cached_doc])})
    seed = {
        "code": "BR",
        "name": "Bihar",
        "official_portal_url": "https://state.bihar.gov.in/",
        "agriculture_directory_url": "https://www.india.gov.in/",
        "capital": "Patna",
    }

    summaries = asyncio.run(_FailingService(db).sync_state(seed, force=True))

    assert summaries[0].status == "degraded"
    assert summaries[0].links
