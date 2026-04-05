from __future__ import annotations

from io import StringIO
from pathlib import Path
from typing import Iterable

import httpx
import pandas as pd

from data_pipeline.versioning import file_checksum, load_dataset_manifest, record_dataset_version
from ml.common.config import CROP_DATASET_URLS, CROP_PATHS, ensure_ml_directories
from ml.common.preprocessing import normalize_label

CANONICAL_COLUMNS = {
    "n": "soil_n",
    "nitrogen": "soil_n",
    "soil_n": "soil_n",
    "p": "soil_p",
    "phosphorus": "soil_p",
    "soil_p": "soil_p",
    "k": "soil_k",
    "potassium": "soil_k",
    "soil_k": "soil_k",
    "temperature": "temperature_c",
    "temperature_c": "temperature_c",
    "humidity": "humidity_pct",
    "humidity_pct": "humidity_pct",
    "ph": "soil_ph",
    "soil_ph": "soil_ph",
    "rainfall": "rainfall_mm",
    "rainfall_mm": "rainfall_mm",
    "label": "crop",
    "crop": "crop",
}

REQUIRED_COLUMNS = [
    "soil_n",
    "soil_p",
    "soil_k",
    "temperature_c",
    "humidity_pct",
    "soil_ph",
    "rainfall_mm",
    "crop",
]


def _download_csv(url: str) -> pd.DataFrame:
    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        response = client.get(url)
        response.raise_for_status()
    return pd.read_csv(StringIO(response.text))


def _rename_columns(frame: pd.DataFrame) -> pd.DataFrame:
    normalized = {
        column: CANONICAL_COLUMNS.get(str(column).strip().lower(), str(column).strip().lower())
        for column in frame.columns
    }
    return frame.rename(columns=normalized)


def _standardize_crop_frame(frame: pd.DataFrame) -> pd.DataFrame:
    frame = _rename_columns(frame)
    missing = [column for column in REQUIRED_COLUMNS if column not in frame.columns]
    if missing:
        raise ValueError(f"Crop dataset missing required columns: {', '.join(sorted(missing))}")

    standardized = frame[REQUIRED_COLUMNS].copy()
    for column in REQUIRED_COLUMNS[:-1]:
        standardized[column] = pd.to_numeric(standardized[column], errors="coerce")
    standardized["crop"] = standardized["crop"].map(normalize_label).str.lower()
    standardized = standardized.dropna(subset=REQUIRED_COLUMNS)
    standardized = standardized[standardized["crop"] != ""]
    return standardized.reset_index(drop=True)


def fetch_crop_datasets(urls: Iterable[str] | None = None) -> pd.DataFrame:
    frames: list[pd.DataFrame] = []
    failures: list[str] = []
    for url in urls or CROP_DATASET_URLS:
        try:
            frames.append(_standardize_crop_frame(_download_csv(url)))
        except Exception as exc:
            failures.append(f"{url}: {exc}")

    if not frames:
        raise RuntimeError("Unable to fetch any crop datasets: " + " | ".join(failures))

    merged = pd.concat(frames, ignore_index=True)
    merged = merged.drop_duplicates().reset_index(drop=True)
    return merged


def build_crop_training_dataset(
    *,
    force_refresh: bool = False,
    raw_path: Path | None = None,
    processed_path: Path | None = None,
) -> pd.DataFrame:
    ensure_ml_directories()
    raw_path = raw_path or CROP_PATHS.raw_dataset_path
    processed_path = processed_path or CROP_PATHS.processed_dataset_path

    if processed_path.exists() and not force_refresh:
        cached = _standardize_crop_frame(pd.read_csv(processed_path))
        manifest = load_dataset_manifest("crop_training")
        if not manifest.get("active_version"):
            record_dataset_version(
                "crop_training",
                dataset_path=processed_path,
                row_count=len(cached),
                checksum=file_checksum(processed_path),
                incremental=False,
                source_ref=",".join(CROP_DATASET_URLS),
                metadata={"mode": "cached"},
            )
        return cached

    frame = fetch_crop_datasets()
    raw_path.parent.mkdir(parents=True, exist_ok=True)
    processed_path.parent.mkdir(parents=True, exist_ok=True)
    frame.to_csv(raw_path, index=False)
    frame.to_csv(processed_path, index=False)
    record_dataset_version(
        "crop_training",
        dataset_path=processed_path,
        row_count=len(frame),
        checksum=file_checksum(processed_path),
        incremental=False,
        source_ref=",".join(CROP_DATASET_URLS),
        metadata={"mode": "refreshed"},
    )
    return frame
