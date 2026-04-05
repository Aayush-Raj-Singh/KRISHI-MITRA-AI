from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import pandas as pd

from ml.common.config import PRICE_PATHS
from ml.common.model_registry import resolve_artifact_path as resolve_registered_artifact_path
from ml.common.utils import read_json, slugify
from ml.price.dataset_loader import build_price_history_dataset
from ml.price.model import forecast_from_bundle, load_bundle
from ml.price.train import retrain_price_models, train_price_model_for_pair


def pair_key(crop: str, market: str) -> str:
    return f"{slugify(crop)}__{slugify(market)}"


def resolve_artifact_path(crop: str, market: str) -> Path | None:
    candidate = resolve_artifact_path_from_registry(crop, market)
    if candidate is not None:
        return candidate
    candidate = PRICE_PATHS.artifact_dir / f"{pair_key(crop, market)}.joblib"
    return candidate if candidate.exists() else None


def resolve_artifact_path_from_registry(crop: str, market: str) -> Path | None:
    return resolve_registered_artifact_path(f"price/{pair_key(crop, market)}")


def load_history_frame() -> pd.DataFrame:
    return build_price_history_dataset(force_refresh=False)


@lru_cache(maxsize=64)
def load_cached_bundle(path_str: str, mtime_ns: int):
    return load_bundle(Path(path_str))


def clear_price_bundle_cache() -> None:
    load_cached_bundle.cache_clear()


def _find_metadata(key: str) -> dict:
    metadata = read_json(PRICE_PATHS.metadata_path, {"models": []})
    for item in metadata.get("models", []):
        if item.get("key") == key:
            return item
    return {"key": key, "version": "prophet-untrained", "mape": 0.0}


def load_or_train_price_bundle(crop: str, market: str):
    artifact_path = resolve_artifact_path(crop, market)
    key = pair_key(crop, market)
    metadata: dict | None = None
    if artifact_path is None:
        history = load_history_frame()
        try:
            metadata = train_price_model_for_pair(history, crop, market, PRICE_PATHS.artifact_dir)
        except ValueError:
            retrain_price_models(requested_pairs=[(crop, market)])
        artifact_path = resolve_artifact_path(crop, market)
        if artifact_path is None:
            grouped = history.groupby(["crop", "market"]).size().sort_values(ascending=False)
            if grouped.empty:
                raise ValueError("No price history is available for forecasting")
            fallback_crop, fallback_market = grouped.index[0]
            artifact_path = resolve_artifact_path(str(fallback_crop), str(fallback_market))
            key = pair_key(str(fallback_crop), str(fallback_market))
            if artifact_path is None:
                train_price_model_for_pair(
                    history, str(fallback_crop), str(fallback_market), PRICE_PATHS.artifact_dir
                )
                artifact_path = resolve_artifact_path(str(fallback_crop), str(fallback_market))
        if artifact_path is None:
            raise ValueError("Unable to resolve a price forecast model artifact")
    bundle = load_cached_bundle(str(artifact_path), artifact_path.stat().st_mtime_ns)
    return bundle, metadata or _find_metadata(key)


def predict_price(crop: str, market: str, periods: int = 90) -> tuple[pd.DataFrame, dict]:
    bundle, metadata = load_or_train_price_bundle(crop, market)
    forecast = forecast_from_bundle(bundle, periods=periods)
    return forecast, metadata
