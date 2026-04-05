from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ml.common.config import ML_ROOT

DASHBOARD_PATH = ML_ROOT / "monitoring" / "evaluation_dashboard.json"


def _load_dashboard() -> dict[str, Any]:
    if not DASHBOARD_PATH.exists():
        return {"models": {}, "updated_at": None}
    try:
        return json.loads(DASHBOARD_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {"models": {}, "updated_at": None}


def _save_dashboard(payload: dict[str, Any]) -> Path:
    DASHBOARD_PATH.parent.mkdir(parents=True, exist_ok=True)
    DASHBOARD_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return DASHBOARD_PATH


def log_training_metrics(
    model_key: str,
    *,
    version: str,
    metrics: dict[str, Any],
    dataset_version: str | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    dashboard = _load_dashboard()
    models = dashboard.setdefault("models", {})
    history = models.setdefault(model_key, {"latest": None, "history": []})
    record = {
        "version": version,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "dataset_version": dataset_version,
        "metrics": metrics,
        "extra": extra or {},
    }
    existing = [item for item in history.get("history", []) if item.get("version") != version]
    existing.append(record)
    history["history"] = existing[-25:]
    history["latest"] = record
    dashboard["updated_at"] = record["recorded_at"]
    _save_dashboard(dashboard)
    return record


def log_inference_metrics(
    model_key: str,
    *,
    latency_ms: float,
    batch_size: int = 1,
    success: bool = True,
) -> dict[str, Any]:
    dashboard = _load_dashboard()
    inference = dashboard.setdefault("inference", {})
    model_entry = inference.setdefault(
        model_key,
        {
            "count": 0,
            "batch_size_total": 0,
            "latency_ms_total": 0.0,
            "error_count": 0,
        },
    )
    model_entry["count"] += 1
    model_entry["batch_size_total"] += int(batch_size)
    model_entry["latency_ms_total"] += float(latency_ms)
    if not success:
        model_entry["error_count"] += 1
    model_entry["avg_latency_ms"] = round(
        model_entry["latency_ms_total"] / max(1, model_entry["count"]), 3
    )
    model_entry["avg_batch_size"] = round(
        model_entry["batch_size_total"] / max(1, model_entry["count"]), 3
    )
    model_entry["updated_at"] = datetime.now(timezone.utc).isoformat()
    dashboard["updated_at"] = model_entry["updated_at"]
    _save_dashboard(dashboard)
    return model_entry
