from __future__ import annotations

from pathlib import Path
from typing import Any

from ml.common.model_registry import (
    REGISTRY_PATH,
    load_registry,
    resolve_model_version,
    rollback_model,
)
from ml.monitoring.metrics_logger import DASHBOARD_PATH

try:
    from data_pipeline.versioning import VERSIONING_ROOT
except Exception:  # pragma: no cover - import guard for test patching
    VERSIONING_ROOT = Path()

import json

from ml.crop.predict import clear_crop_bundle_cache
from ml.price.predict import clear_price_bundle_cache


class MLRuntimeService:
    DATASET_KEYS = ("crop_training", "price_history", "disease_manifest")

    @staticmethod
    def _read_json(path: Path, default: Any) -> Any:
        if not path.exists():
            return default
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return default

    def dashboard(self) -> dict[str, Any]:
        payload = self._read_json(
            DASHBOARD_PATH, {"models": {}, "inference": {}, "updated_at": None}
        )
        payload["path"] = str(DASHBOARD_PATH)
        return payload

    def registry(self) -> dict[str, Any]:
        payload = load_registry()
        models = payload.get("models", {})
        for model_key, info in models.items():
            active_version = info.get("active_version")
            active_entry = resolve_model_version(model_key, version=active_version)
            info["active_artifact_exists"] = bool(
                active_entry
                and active_entry.get("artifact_path")
                and Path(active_entry["artifact_path"]).exists()
            )
        payload["path"] = str(REGISTRY_PATH)
        return payload

    def datasets(self) -> dict[str, Any]:
        manifests: dict[str, Any] = {}
        for dataset_key in self.DATASET_KEYS:
            manifest_path = VERSIONING_ROOT / f"{dataset_key}.json"
            payload = self._read_json(
                manifest_path,
                {"dataset": dataset_key, "versions": [], "active_version": None},
            )
            payload["path"] = str(manifest_path)
            manifests[dataset_key] = payload
        return {
            "datasets": manifests,
            "path": str(VERSIONING_ROOT),
        }

    def summary(self) -> dict[str, Any]:
        registry = self.registry()
        dashboard = self.dashboard()
        datasets = self.datasets()
        return {
            "registry": registry,
            "dashboard": dashboard,
            "datasets": datasets,
        }

    def rollback(self, model_key: str, version: str) -> dict[str, Any]:
        result = rollback_model(model_key, version)
        self.invalidate_runtime_cache(model_key)
        active = resolve_model_version(model_key, version=version)
        return {
            "model_key": model_key,
            "active_version": version,
            "artifact_path": active.get("artifact_path") if active else None,
            "metadata_path": active.get("metadata_path") if active else None,
            "registry_entry": result,
        }

    def invalidate_runtime_cache(self, model_key: str | None = None) -> None:
        from app.core.dependencies import (
            get_crop_recommender,
            get_disease_detection_service,
            get_price_forecaster,
        )

        normalized = (model_key or "").strip().lower()
        if not normalized or normalized == "crop":
            clear_crop_bundle_cache()
            get_crop_recommender.cache_clear()
        if not normalized or normalized == "disease":
            get_disease_detection_service.cache_clear()
        if not normalized or normalized == "price" or normalized.startswith("price/"):
            clear_price_bundle_cache()
            get_price_forecaster.cache_clear()
