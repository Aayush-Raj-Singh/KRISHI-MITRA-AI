from __future__ import annotations

from functools import lru_cache

import numpy as np

from ml.common.config import CROP_PATHS
from ml.common.model_registry import resolve_artifact_path
from ml.crop.model import (
    REQUEST_FEATURE_COLUMNS,
    build_feature_row,
    explanation_from_feature_values,
    load_bundle,
    predict_proba,
)
from ml.crop.train import train_crop_model


@lru_cache(maxsize=4)
def _load_cached_bundle(path_str: str, mtime_ns: int):
    return load_bundle(path_str)


def load_or_train_crop_bundle():
    artifact_path = resolve_artifact_path("crop") or CROP_PATHS.model_path
    if not artifact_path.exists():
        train_crop_model()
        artifact_path = resolve_artifact_path("crop") or CROP_PATHS.model_path
    return _load_cached_bundle(str(artifact_path), artifact_path.stat().st_mtime_ns)


def clear_crop_bundle_cache() -> None:
    _load_cached_bundle.cache_clear()


def predict_crop_probabilities(request) -> dict:
    bundle = load_or_train_crop_bundle()
    request_frame = build_feature_row(request)
    model_frame = request_frame[
        [column for column in REQUEST_FEATURE_COLUMNS if column in bundle.feature_columns]
    ]
    probabilities = predict_proba(bundle, model_frame)
    labels = [str(item) for item in bundle.classes]
    top_indices = np.argsort(probabilities)[::-1][:3]
    explanation = explanation_from_feature_values(bundle, request_frame)
    ranked = [
        {
            "crop": labels[int(index)],
            "confidence": round(float(probabilities[int(index)]), 4),
            "explanation": explanation,
        }
        for index in top_indices
    ]
    return {
        "recommendations": ranked,
        "model_version": bundle.version,
    }
