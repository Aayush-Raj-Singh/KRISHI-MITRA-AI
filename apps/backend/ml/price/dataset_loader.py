from __future__ import annotations

import os
from datetime import timedelta
from pathlib import Path
from typing import Iterable, List

import httpx
import numpy as np
import pandas as pd

from data_pipeline.versioning import (
    file_checksum,
    load_dataset_manifest,
    merge_incremental_rows,
    record_dataset_version,
)
from ml.common.config import PRICE_DATA_GOV_RESOURCE_URL, PRICE_PATHS, ensure_ml_directories
from ml.common.preprocessing import parse_date_column

EXPECTED_SOURCE_COLUMNS = [
    "arrival_date",
    "commodity",
    "state",
    "district",
    "market",
    "modal_price",
]


def _resolved_api_key() -> str | None:
    return (
        os.getenv("MANDI_API_KEY", "").strip()
        or os.getenv("MANDI_DEMO_API_KEY", "").strip()
        or None
    )


def _bootstrap_price_history() -> pd.DataFrame:
    rng = np.random.default_rng(42)
    start = pd.Timestamp.utcnow().normalize() - pd.Timedelta(days=420)
    profiles = {
        ("rice", "patna", "Bihar", "Patna"): 2280,
        ("wheat", "lucknow", "Uttar Pradesh", "Lucknow"): 2420,
        ("maize", "nagpur", "Maharashtra", "Nagpur"): 1980,
    }
    rows = []
    for (crop, market, state, district), base_price in profiles.items():
        for day in range(420):
            current = start + pd.Timedelta(days=day)
            weekly = 18 * np.sin(2 * np.pi * day / 7)
            monthly = 55 * np.sin(2 * np.pi * day / 30)
            yearly = 90 * np.sin(2 * np.pi * day / 365)
            drift = day * 0.25
            noise = rng.normal(0, 12)
            rows.append(
                {
                    "ds": current.date().isoformat(),
                    "y": round(
                        float(max(100, base_price + weekly + monthly + yearly + drift + noise)), 2
                    ),
                    "crop": crop,
                    "market": market,
                    "state": state,
                    "district": district,
                }
            )
    return pd.DataFrame(rows)


def fetch_data_gov_price_records(
    *,
    api_key: str | None = None,
    max_pages: int = 20,
    page_limit: int = 1000,
) -> pd.DataFrame:
    api_key = api_key or _resolved_api_key()
    if not api_key:
        raise RuntimeError("MANDI_API_KEY or MANDI_DEMO_API_KEY is required to fetch price history")

    collected: List[dict] = []
    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        for page_index in range(max_pages):
            params = {
                "api-key": api_key,
                "format": "json",
                "offset": page_index * page_limit,
                "limit": page_limit,
            }
            response = client.get(PRICE_DATA_GOV_RESOURCE_URL, params=params)
            response.raise_for_status()
            payload = response.json()
            records = payload.get("records", payload.get("data", []))
            if not isinstance(records, list) or not records:
                break
            collected.extend(records)
            if len(records) < page_limit:
                break

    if not collected:
        raise RuntimeError("No mandi price records were returned by data.gov.in")
    return pd.DataFrame(collected)


def fetch_incremental_price_records(
    *,
    api_key: str,
    start_date: str,
    end_date: str | None = None,
    per_day_limit: int = 1000,
) -> pd.DataFrame:
    end = pd.to_datetime(end_date or pd.Timestamp.utcnow().date(), errors="coerce")
    start = pd.to_datetime(start_date, errors="coerce")
    if pd.isna(start) or pd.isna(end) or start > end:
        return pd.DataFrame()

    collected: List[dict] = []
    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        cursor = start.normalize()
        while cursor <= end.normalize():
            for page_index in range(3):
                params = {
                    "api-key": api_key,
                    "format": "json",
                    "offset": page_index * per_day_limit,
                    "limit": per_day_limit,
                    "filters[arrival_date]": cursor.date().isoformat(),
                }
                response = client.get(PRICE_DATA_GOV_RESOURCE_URL, params=params)
                response.raise_for_status()
                payload = response.json()
                records = payload.get("records", payload.get("data", []))
                if not isinstance(records, list) or not records:
                    break
                collected.extend(records)
                if len(records) < per_day_limit:
                    break
            cursor = cursor + timedelta(days=1)

    return pd.DataFrame(collected)


def _standardize_price_frame(frame: pd.DataFrame) -> pd.DataFrame:
    missing = [column for column in EXPECTED_SOURCE_COLUMNS if column not in frame.columns]
    if missing:
        raise ValueError("Price dataset missing required columns: " + ", ".join(sorted(missing)))

    standardized = frame[EXPECTED_SOURCE_COLUMNS].copy()
    standardized["ds"] = parse_date_column(standardized["arrival_date"])
    standardized["y"] = pd.to_numeric(standardized["modal_price"], errors="coerce")
    standardized["crop"] = standardized["commodity"].astype(str).str.strip().str.lower()
    standardized["market"] = standardized["market"].astype(str).str.strip().str.lower()
    standardized["state"] = standardized["state"].astype(str).str.strip()
    standardized["district"] = standardized["district"].astype(str).str.strip()
    standardized = standardized.dropna(subset=["ds", "y"])
    standardized = standardized[standardized["crop"] != ""]
    standardized = standardized[standardized["market"] != ""]
    standardized = standardized.groupby(
        ["ds", "crop", "market", "state", "district"], as_index=False
    ).agg({"y": "median"})
    standardized = standardized.sort_values(["crop", "market", "ds"]).reset_index(drop=True)
    return standardized[["ds", "y", "crop", "market", "state", "district"]]


def build_price_history_dataset(
    *,
    force_refresh: bool = False,
    raw_path: Path | None = None,
    processed_path: Path | None = None,
) -> pd.DataFrame:
    ensure_ml_directories()
    raw_path = raw_path or PRICE_PATHS.raw_dataset_path
    processed_path = processed_path or PRICE_PATHS.processed_dataset_path

    cached_frame: pd.DataFrame | None = None
    if processed_path.exists():
        frame = pd.read_csv(processed_path)
        frame["ds"] = parse_date_column(frame["ds"])
        cached_frame = frame.dropna(subset=["ds", "y"]).sort_values(["crop", "market", "ds"])
        if not force_refresh:
            manifest = load_dataset_manifest("price_history")
            if not manifest.get("active_version"):
                record_dataset_version(
                    "price_history",
                    dataset_path=processed_path,
                    row_count=len(cached_frame),
                    checksum=file_checksum(processed_path),
                    incremental=False,
                    latest_observation=cached_frame["ds"].max(),
                    source_ref=PRICE_DATA_GOV_RESOURCE_URL,
                    metadata={"mode": "cached"},
                )
            api_key = _resolved_api_key()
            if api_key and not cached_frame.empty:
                latest_date = pd.to_datetime(cached_frame["ds"], errors="coerce").max()
                incremental_start = (latest_date - timedelta(days=2)).date().isoformat()
                try:
                    incremental_raw = fetch_incremental_price_records(
                        api_key=api_key,
                        start_date=incremental_start,
                    )
                    if not incremental_raw.empty:
                        incremental_processed = _standardize_price_frame(incremental_raw)
                        cached_frame = merge_incremental_rows(
                            cached_frame,
                            incremental_processed,
                            dedupe_columns=["ds", "crop", "market", "state", "district"],
                            sort_columns=["crop", "market", "ds"],
                        )
                        raw_path.parent.mkdir(parents=True, exist_ok=True)
                        processed_path.parent.mkdir(parents=True, exist_ok=True)
                        incremental_raw.to_csv(raw_path, index=False)
                        cached_frame.to_csv(processed_path, index=False)
                        record_dataset_version(
                            "price_history",
                            dataset_path=processed_path,
                            row_count=len(cached_frame),
                            checksum=file_checksum(processed_path),
                            incremental=True,
                            latest_observation=cached_frame["ds"].max(),
                            source_ref=PRICE_DATA_GOV_RESOURCE_URL,
                            metadata={"mode": "incremental"},
                        )
                except Exception:
                    pass
            return cached_frame

    api_key = _resolved_api_key()
    if api_key:
        raw_frame = fetch_data_gov_price_records(api_key=api_key)
        processed = _standardize_price_frame(raw_frame)
    elif os.getenv("ENVIRONMENT", "development").strip().lower() not in {"production", "staging"}:
        raw_frame = _bootstrap_price_history()
        processed = raw_frame.copy()
        processed["ds"] = parse_date_column(processed["ds"])
    else:
        raise RuntimeError("MANDI_API_KEY or MANDI_DEMO_API_KEY is required to fetch price history")
    raw_path.parent.mkdir(parents=True, exist_ok=True)
    processed_path.parent.mkdir(parents=True, exist_ok=True)
    raw_frame.to_csv(raw_path, index=False)
    processed.to_csv(processed_path, index=False)
    record_dataset_version(
        "price_history",
        dataset_path=processed_path,
        row_count=len(processed),
        checksum=file_checksum(processed_path),
        incremental=bool(cached_frame is not None and not force_refresh),
        latest_observation=processed["ds"].max() if "ds" in processed else None,
        source_ref=PRICE_DATA_GOV_RESOURCE_URL if api_key else "bootstrap",
        metadata={"mode": "refreshed" if api_key else "bootstrap"},
    )
    return processed
