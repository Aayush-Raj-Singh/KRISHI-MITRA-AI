from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

import joblib
import numpy as np
import pandas as pd

from ml.common.config import CROP_PATHS
from ml.common.feature_engineering import add_crop_features
from ml.common.preprocessing import location_score, season_index

MODEL_FEATURE_COLUMNS = [
    "soil_n",
    "soil_p",
    "soil_k",
    "temperature_c",
    "humidity_pct",
    "soil_ph",
    "rainfall_mm",
    "soil_fertility_index",
    "nutrient_balance_score",
    "weather_7d_avg",
    "weather_30d_avg",
    "region_cluster",
]

REQUEST_FEATURE_COLUMNS = MODEL_FEATURE_COLUMNS + [
    "season_index",
    "location_score",
    "historical_yield",
]


@dataclass
class CropModelBundle:
    model: object
    models: Dict[str, object]
    model_weights: Dict[str, float]
    feature_columns: List[str]
    feature_medians: Dict[str, float]
    version: str
    classes: List[str]
    regional_priors: Dict[str, Dict[str, float]]


def load_bundle(path=None) -> CropModelBundle:
    artifact_path = path or CROP_PATHS.model_path
    payload = joblib.load(artifact_path)
    models = payload.get("models")
    model_weights = payload.get("model_weights")
    if not models:
        primary_model = payload["model"]
        models = {"primary": primary_model}
        model_weights = {"primary": 1.0}
    primary_key = max(model_weights, key=model_weights.get) if model_weights else next(iter(models))
    return CropModelBundle(
        model=models[primary_key],
        models=models,
        model_weights={key: float(value) for key, value in (model_weights or {}).items()},
        feature_columns=list(payload["feature_columns"]),
        feature_medians={key: float(value) for key, value in payload["feature_medians"].items()},
        version=str(payload["version"]),
        classes=[str(item) for item in payload["classes"]],
        regional_priors={
            str(key): {str(label): float(score) for label, score in value.items()}
            for key, value in payload.get("regional_priors", {}).items()
        },
    )


def build_feature_row(request, weather_history=None) -> pd.DataFrame:
    historical_yield = request.historical_yield if request.historical_yield is not None else 0.0
    if 0 < historical_yield < 50:
        historical_yield = historical_yield * 1000
    row = {
        "soil_n": request.soil_n,
        "soil_p": request.soil_p,
        "soil_k": request.soil_k,
        "temperature_c": request.temperature_c,
        "humidity_pct": request.humidity_pct,
        "soil_ph": request.soil_ph,
        "rainfall_mm": request.rainfall_mm,
        "location": getattr(request, "location", "") or "",
        "season_index": season_index(request.season),
        "location_score": location_score(request.location),
        "historical_yield": historical_yield,
    }
    frame = pd.DataFrame([row])
    frame = add_crop_features(frame, location_column="location", weather_history=weather_history)
    frame["season_index"] = float(row["season_index"])
    frame["location_score"] = float(row["location_score"])
    frame["historical_yield"] = float(row["historical_yield"])
    return frame[REQUEST_FEATURE_COLUMNS].copy()


def build_model_feature_frame(frame: pd.DataFrame) -> pd.DataFrame:
    location_column = None
    for candidate in ("location", "state", "district"):
        if candidate in frame.columns:
            location_column = candidate
            break
    engineered = add_crop_features(frame, location_column=location_column)
    return engineered[MODEL_FEATURE_COLUMNS].copy()


def predict_proba(bundle: CropModelBundle, frame: pd.DataFrame) -> np.ndarray:
    outputs: list[np.ndarray] = []
    weights: list[float] = []
    for key, model in bundle.models.items():
        if not hasattr(model, "predict_proba"):
            continue
        outputs.append(np.asarray(model.predict_proba(frame)[0], dtype=float))
        weights.append(float(bundle.model_weights.get(key, 1.0)))
    if not outputs:
        raise ValueError("Crop model bundle does not contain a probability model")
    normalized = np.asarray(weights, dtype=float)
    normalized = (
        normalized / normalized.sum()
        if normalized.sum() > 0
        else np.ones(len(outputs)) / len(outputs)
    )
    stacked = np.vstack(outputs)
    return np.average(stacked, axis=0, weights=normalized)


def explanation_from_feature_values(bundle: CropModelBundle, request_frame: pd.DataFrame) -> str:
    model = bundle.model
    request_point = request_frame.iloc[0]
    medians = bundle.feature_medians
    importances = np.array(
        getattr(model, "feature_importances_", np.zeros(len(MODEL_FEATURE_COLUMNS))),
        dtype=float,
    )
    deltas = np.array(
        [
            abs(float(request_point[column]) - float(medians.get(column, 0.0)))
            / (abs(float(medians.get(column, 0.0))) + 1.0)
            for column in MODEL_FEATURE_COLUMNS
        ],
        dtype=float,
    )
    scores = importances * deltas
    top_indices = np.argsort(scores)[::-1][:3]
    labels = {
        "soil_n": "soil nitrogen",
        "soil_p": "soil phosphorus",
        "soil_k": "soil potassium",
        "temperature_c": "temperature",
        "humidity_pct": "humidity",
        "soil_ph": "soil pH",
        "rainfall_mm": "rainfall",
    }
    phrases: list[str] = []
    for idx in top_indices:
        name = MODEL_FEATURE_COLUMNS[int(idx)]
        value = float(request_point[name])
        baseline = float(medians.get(name, 0.0))
        direction = "higher" if value > baseline else "lower"
        phrases.append(f"{labels.get(name, name)} is {direction} than the learned baseline")
    return "Key drivers: " + "; ".join(phrases) + "."
