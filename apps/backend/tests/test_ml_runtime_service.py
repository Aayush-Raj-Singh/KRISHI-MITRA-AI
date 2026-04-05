from __future__ import annotations

import json
from pathlib import Path
from types import SimpleNamespace

from app.core import dependencies as dependencies_module
from app.services import ml_runtime_service as runtime_module
from app.services.ml_runtime_service import MLRuntimeService


def test_ml_runtime_service_summary_reads_registry_dashboard_and_manifests(
    monkeypatch, tmp_path: Path
) -> None:
    dashboard_path = tmp_path / "evaluation_dashboard.json"
    dashboard_path.write_text(
        json.dumps({"models": {"crop": {"latest": {"metrics": {"accuracy": 0.91}}}}}),
        encoding="utf-8",
    )
    versioning_root = tmp_path / "versioning"
    versioning_root.mkdir(parents=True, exist_ok=True)
    (versioning_root / "crop_training.json").write_text(
        json.dumps({"dataset": "crop_training", "active_version": "crop-v1", "versions": []}),
        encoding="utf-8",
    )
    (versioning_root / "price_history.json").write_text(
        json.dumps({"dataset": "price_history", "active_version": "price-v2", "versions": []}),
        encoding="utf-8",
    )
    (versioning_root / "disease_manifest.json").write_text(
        json.dumps({"dataset": "disease_manifest", "active_version": "disease-v3", "versions": []}),
        encoding="utf-8",
    )
    registry_path = tmp_path / "registry.json"
    registry_path.write_text(
        json.dumps(
            {
                "models": {
                    "crop": {
                        "active_version": "crop-model-v1",
                        "versions": [
                            {
                                "version": "crop-model-v1",
                                "artifact_path": str(tmp_path / "crop.joblib"),
                            }
                        ],
                    }
                }
            }
        ),
        encoding="utf-8",
    )
    (tmp_path / "crop.joblib").write_bytes(b"artifact")

    monkeypatch.setattr(runtime_module, "DASHBOARD_PATH", dashboard_path)
    monkeypatch.setattr(runtime_module, "VERSIONING_ROOT", versioning_root)
    monkeypatch.setattr(runtime_module, "REGISTRY_PATH", registry_path)
    monkeypatch.setattr(
        runtime_module,
        "load_registry",
        lambda: json.loads(registry_path.read_text(encoding="utf-8")),
    )
    monkeypatch.setattr(
        runtime_module,
        "resolve_model_version",
        lambda model_key, version=None: {
            "version": version or "crop-model-v1",
            "artifact_path": str(tmp_path / "crop.joblib"),
        },
    )

    service = MLRuntimeService()
    summary = service.summary()

    assert summary["registry"]["models"]["crop"]["active_artifact_exists"] is True
    assert summary["dashboard"]["models"]["crop"]["latest"]["metrics"]["accuracy"] == 0.91
    assert summary["datasets"]["datasets"]["crop_training"]["active_version"] == "crop-v1"
    assert summary["datasets"]["datasets"]["price_history"]["active_version"] == "price-v2"


def test_ml_runtime_service_rollback_invalidates_runtime_caches(
    monkeypatch, tmp_path: Path
) -> None:
    calls: list[str] = []

    monkeypatch.setattr(
        runtime_module,
        "rollback_model",
        lambda model_key, version: {"active_version": version, "versions": []},
    )
    monkeypatch.setattr(
        runtime_module,
        "resolve_model_version",
        lambda model_key, version=None: {
            "artifact_path": str(tmp_path / "artifact.joblib"),
            "metadata_path": str(tmp_path / "metadata.json"),
        },
    )
    monkeypatch.setattr(
        runtime_module, "clear_crop_bundle_cache", lambda: calls.append("crop_bundle")
    )
    monkeypatch.setattr(
        runtime_module, "clear_price_bundle_cache", lambda: calls.append("price_bundle")
    )
    monkeypatch.setattr(
        dependencies_module,
        "get_crop_recommender",
        SimpleNamespace(cache_clear=lambda: calls.append("crop_service")),
    )
    monkeypatch.setattr(
        dependencies_module,
        "get_price_forecaster",
        SimpleNamespace(cache_clear=lambda: calls.append("price_service")),
    )
    monkeypatch.setattr(
        dependencies_module,
        "get_disease_detection_service",
        SimpleNamespace(cache_clear=lambda: calls.append("disease_service")),
    )

    service = MLRuntimeService()
    response = service.rollback("price/rice__patna", "price-model-v3")

    assert response["active_version"] == "price-model-v3"
    assert "price_bundle" in calls
    assert "price_service" in calls
