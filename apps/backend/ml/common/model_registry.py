from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ml.common.config import MODELS_ROOT

REGISTRY_PATH = MODELS_ROOT / "registry.json"


def load_registry() -> dict[str, Any]:
    if not REGISTRY_PATH.exists():
        return {"models": {}, "updated_at": None}
    try:
        return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {"models": {}, "updated_at": None}


def save_registry(payload: dict[str, Any]) -> Path:
    REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    REGISTRY_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return REGISTRY_PATH


def register_model(
    model_key: str,
    *,
    version: str,
    artifact_path: Path,
    metadata_path: Path | None = None,
    metrics: dict[str, Any] | None = None,
    extra: dict[str, Any] | None = None,
    activate: bool = True,
) -> dict[str, Any]:
    registry = load_registry()
    models = registry.setdefault("models", {})
    entry = models.setdefault(model_key, {"active_version": None, "versions": []})
    version_payload = {
        "version": version,
        "artifact_path": str(artifact_path),
        "metadata_path": str(metadata_path) if metadata_path else None,
        "metrics": metrics or {},
        "extra": extra or {},
        "registered_at": datetime.now(timezone.utc).isoformat(),
    }
    versions = [item for item in entry.get("versions", []) if item.get("version") != version]
    versions.append(version_payload)
    entry["versions"] = versions[-20:]
    if activate or not entry.get("active_version"):
        entry["active_version"] = version
    registry["updated_at"] = datetime.now(timezone.utc).isoformat()
    save_registry(registry)
    return version_payload


def resolve_model_version(model_key: str, version: str | None = None) -> dict[str, Any] | None:
    registry = load_registry()
    entry = registry.get("models", {}).get(model_key)
    if not entry:
        return None
    target_version = version or entry.get("active_version")
    for item in entry.get("versions", []):
        if item.get("version") == target_version:
            return item
    return None


def resolve_artifact_path(model_key: str, version: str | None = None) -> Path | None:
    entry = resolve_model_version(model_key, version=version)
    if not entry:
        return None
    artifact_path = entry.get("artifact_path")
    if not artifact_path:
        return None
    path = Path(artifact_path)
    return path if path.exists() else None


def rollback_model(model_key: str, version: str) -> dict[str, Any]:
    registry = load_registry()
    entry = registry.get("models", {}).get(model_key)
    if not entry:
        raise ValueError(f"Unknown model key: {model_key}")
    if not any(item.get("version") == version for item in entry.get("versions", [])):
        raise ValueError(f"Unknown version for {model_key}: {version}")
    entry["active_version"] = version
    registry["updated_at"] = datetime.now(timezone.utc).isoformat()
    save_registry(registry)
    return entry
