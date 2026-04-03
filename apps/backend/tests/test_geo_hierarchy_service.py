from __future__ import annotations

import asyncio

from app.services.geo_hierarchy_service import GeoHierarchyService


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


def test_geo_hierarchy_resolves_locality_from_postal_code():
    db = _FakeDatabase(
        {
            "geo_hierarchy_nodes": _FakeCollection(
                [
                    {
                        "level": "village",
                        "state": "Bihar",
                        "district": "Patna",
                        "block": "Phulwari",
                        "village": "Sabalpur",
                        "postal_code": "800001",
                        "state_norm": "bihar",
                        "district_norm": "patna",
                        "block_norm": "phulwari",
                        "village_norm": "sabalpur",
                    }
                ]
            )
        }
    )

    response = asyncio.run(
        GeoHierarchyService(db).resolve(
            state="Bihar",
            district="Patna",
            postal_code="800001",
            source="test",
        )
    )

    assert response.state == "Bihar"
    assert response.block == "Phulwari"
    assert response.village == "Sabalpur"
    assert response.source == "test+hierarchy"
