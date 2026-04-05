from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from ml.pipelines import retrain_all


class _FakeCursor:
    def __init__(self, docs):
        self._docs = docs

    async def to_list(self, length=None):
        return list(self._docs if length is None else self._docs[:length])


class _FakeCollection:
    def __init__(self, docs):
        self._docs = docs

    def find(self, *_args, **_kwargs):
        return _FakeCursor(self._docs)

    async def find_one(self, filter_spec):
        doc_id = filter_spec.get("_id")
        for item in self._docs:
            if item.get("_id") == doc_id:
                return item
        return None


class _FakeDatabase:
    def __init__(self, feedback_docs, recommendation_docs):
        self._collections = {
            "feedback": _FakeCollection(feedback_docs),
            "recommendations": _FakeCollection(recommendation_docs),
        }

    def __getitem__(self, name):
        return self._collections[name]


def test_run_pipeline_reuses_provided_database_without_closing_global_pool(monkeypatch, tmp_path):
    feedback_docs = [
        {
            "_id": "feedback-1",
            "recommendation_id": "rec-1",
            "created_at": datetime.now(timezone.utc),
            "outcomes": {"yield_kg_per_acre": 1200},
        }
    ]
    recommendation_docs = [
        {
            "_id": "rec-1",
            "kind": "crop",
            "request_payload": {
                "soil_n": 60,
                "soil_p": 40,
                "soil_k": 35,
                "soil_ph": 6.7,
                "temperature_c": 28,
                "humidity_pct": 67,
                "rainfall_mm": 120,
                "season": "kharif",
                "location": "Patna",
            },
            "response_payload": {"recommendations": [{"crop": "rice"}]},
        }
    ]
    db = _FakeDatabase(feedback_docs, recommendation_docs)

    close_called = False

    async def _fake_close_postgres():
        nonlocal close_called
        close_called = True

    monkeypatch.setattr(retrain_all, "close_postgres", _fake_close_postgres)
    monkeypatch.setattr(retrain_all, "train_crop_model", lambda: {"status": "ok"})
    monkeypatch.setattr(
        retrain_all,
        "retrain_price_models",
        lambda requested_pairs: {"models": list(requested_pairs), "failures": []},
    )
    monkeypatch.setattr(retrain_all, "_should_retrain", lambda *args, **kwargs: (True, "forced"))
    monkeypatch.setattr(retrain_all, "_load_dashboard", lambda: {"models": {}})
    monkeypatch.setattr(retrain_all, "_load_pipeline_state", lambda: {"models": {}})
    monkeypatch.setattr(retrain_all, "_save_pipeline_state", lambda payload: None)
    monkeypatch.setattr(
        retrain_all,
        "load_dataset_manifest",
        lambda dataset_key: {"active_version": f"{dataset_key}-v1"},
    )

    result = asyncio.run(retrain_all.run_pipeline(db=db))

    assert result["augmented_crop_rows"] == 1
    assert result["price_models_failed"] == 0
    assert close_called is False
