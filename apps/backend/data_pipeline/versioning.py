from __future__ import annotations

import hashlib
import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import pandas as pd

from ml.common.config import DATA_ROOT

VERSIONING_ROOT = DATA_ROOT / "versioning"


def _manifest_path(dataset_key: str) -> Path:
    safe_key = "".join(ch.lower() if ch.isalnum() else "_" for ch in dataset_key).strip("_")
    return VERSIONING_ROOT / f"{safe_key}.json"


def file_checksum(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            chunk = handle.read(chunk_size)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def dataframe_checksum(frame: pd.DataFrame, columns: Iterable[str] | None = None) -> str:
    selected = frame.copy()
    if columns is not None:
        selected = selected[list(columns)].copy()
    selected = selected.sort_values(list(selected.columns)).reset_index(drop=True)
    csv_bytes = selected.to_csv(index=False).encode("utf-8")
    return hashlib.sha256(csv_bytes).hexdigest()


def load_dataset_manifest(dataset_key: str) -> dict[str, Any]:
    path = _manifest_path(dataset_key)
    if not path.exists():
        return {"dataset": dataset_key, "versions": [], "active_version": None}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {"dataset": dataset_key, "versions": [], "active_version": None}


def save_dataset_manifest(dataset_key: str, payload: dict[str, Any]) -> Path:
    path = _manifest_path(dataset_key)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return path


def _normalize_date(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    parsed = pd.to_datetime(value, errors="coerce")
    if pd.isna(parsed):
        return None
    return parsed.date().isoformat()


def record_dataset_version(
    dataset_key: str,
    *,
    dataset_path: Path,
    row_count: int,
    checksum: str | None = None,
    incremental: bool = False,
    latest_observation: Any = None,
    source_ref: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    manifest = load_dataset_manifest(dataset_key)
    checksum = checksum or file_checksum(dataset_path)
    version_id = (
        f"{dataset_key}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{checksum[:12]}"
    )
    entry = {
        "version": version_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "dataset_path": str(dataset_path),
        "checksum": checksum,
        "row_count": int(row_count),
        "incremental": bool(incremental),
        "latest_observation": _normalize_date(latest_observation),
        "source_ref": source_ref,
        "metadata": metadata or {},
    }

    versions = [item for item in manifest.get("versions", []) if item.get("checksum") != checksum]
    versions.append(entry)
    versions = versions[-20:]
    manifest["versions"] = versions
    manifest["active_version"] = version_id
    manifest["latest_checksum"] = checksum
    manifest["latest_observation"] = entry["latest_observation"]
    manifest["updated_at"] = entry["created_at"]
    save_dataset_manifest(dataset_key, manifest)
    return entry


def merge_incremental_rows(
    existing: pd.DataFrame,
    incoming: pd.DataFrame,
    *,
    dedupe_columns: Iterable[str],
    sort_columns: Iterable[str],
) -> pd.DataFrame:
    if existing.empty:
        merged = incoming.copy()
    elif incoming.empty:
        merged = existing.copy()
    else:
        merged = pd.concat([existing, incoming], ignore_index=True)
    merged = merged.drop_duplicates(subset=list(dedupe_columns), keep="last")
    merged = merged.sort_values(list(sort_columns)).reset_index(drop=True)
    return merged
