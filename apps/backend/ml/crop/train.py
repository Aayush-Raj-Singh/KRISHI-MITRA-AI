from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold, train_test_split
from sklearn.preprocessing import LabelEncoder

from data_pipeline.versioning import load_dataset_manifest
from ml.common.config import CROP_PATHS, ensure_ml_directories
from ml.common.model_registry import register_model
from ml.common.utils import atomic_write_json
from ml.crop.dataset_loader import build_crop_training_dataset
from ml.crop.model import MODEL_FEATURE_COLUMNS, build_model_feature_frame
from ml.monitoring.metrics_logger import log_training_metrics

try:
    from xgboost import XGBClassifier
except Exception as exc:  # pragma: no cover - dependency import guard
    XGBClassifier = None
    XGBOOST_IMPORT_ERROR = exc
else:
    XGBOOST_IMPORT_ERROR = None

try:
    from lightgbm import LGBMClassifier
except Exception as exc:  # pragma: no cover - dependency import guard
    LGBMClassifier = None
    LIGHTGBM_IMPORT_ERROR = exc
else:
    LIGHTGBM_IMPORT_ERROR = None


def _build_search(engine: str) -> RandomizedSearchCV:
    if engine == "xgboost" and XGBClassifier is not None:
        estimator = XGBClassifier(
            objective="multi:softprob",
            eval_metric="mlogloss",
            tree_method="hist",
            random_state=42,
            n_estimators=220,
            verbosity=0,
        )
        search_space = {
            "max_depth": [4, 5, 6, 8],
            "learning_rate": [0.03, 0.05, 0.08, 0.1],
            "subsample": [0.75, 0.85, 1.0],
            "colsample_bytree": [0.7, 0.85, 1.0],
            "min_child_weight": [1, 2, 4],
            "reg_alpha": [0.0, 0.01, 0.1],
            "reg_lambda": [0.8, 1.0, 1.2],
        }
    elif engine == "lightgbm" and LGBMClassifier is not None:
        estimator = LGBMClassifier(
            objective="multiclass",
            random_state=42,
            n_estimators=220,
            verbosity=-1,
        )
        search_space = {
            "num_leaves": [15, 31, 63],
            "max_depth": [-1, 5, 7, 9],
            "learning_rate": [0.03, 0.05, 0.08, 0.1],
            "subsample": [0.75, 0.9, 1.0],
            "colsample_bytree": [0.7, 0.85, 1.0],
            "reg_alpha": [0.0, 0.01, 0.1],
            "reg_lambda": [0.8, 1.0, 1.2],
        }
    else:
        estimator = HistGradientBoostingClassifier(
            random_state=42,
            max_iter=250,
            early_stopping=False,
        )
        search_space = {
            "learning_rate": [0.03, 0.05, 0.08, 0.1],
            "max_depth": [4, 6, 8, None],
            "max_leaf_nodes": [15, 31, 63],
            "min_samples_leaf": [10, 20, 30],
            "l2_regularization": [0.0, 0.01, 0.1],
        }
    return RandomizedSearchCV(
        estimator=estimator,
        param_distributions=search_space,
        n_iter=8,
        scoring="accuracy",
        cv=StratifiedKFold(n_splits=3, shuffle=True, random_state=42),
        n_jobs=1,
        random_state=42,
        verbose=0,
    )


def _regional_priors(
    source_frame: pd.DataFrame, encoded_target: np.ndarray, classes: list[str]
) -> dict:
    if "region_cluster" not in source_frame.columns:
        return {}
    enriched = source_frame.copy()
    enriched["target"] = encoded_target
    priors: dict[str, dict[str, float]] = {}
    for region_value, group in enriched.groupby("region_cluster", dropna=False):
        counts = (
            group["target"]
            .value_counts(normalize=True)
            .sort_index()
            .reindex(range(len(classes)), fill_value=0.0)
        )
        priors[str(int(float(region_value)))] = {
            classes[idx]: round(float(score), 6)
            for idx, score in counts.items()
            if float(score) > 0
        }
    return priors


def train_crop_model(
    *,
    csv_path: Path | None = None,
    model_path: Path | None = None,
    metadata_path: Path | None = None,
    force_refresh_dataset: bool = False,
) -> dict:
    ensure_ml_directories()
    csv_path = csv_path or CROP_PATHS.processed_dataset_path
    model_path = model_path or CROP_PATHS.model_path
    metadata_path = metadata_path or CROP_PATHS.metadata_path

    df = build_crop_training_dataset(
        force_refresh=force_refresh_dataset,
        processed_path=csv_path,
    )
    features = build_model_feature_frame(df)
    target = df["crop"].astype(str).str.lower()

    encoder = LabelEncoder()
    encoded_target = encoder.fit_transform(target)

    x_train, x_test, y_train, y_test = train_test_split(
        features,
        encoded_target,
        test_size=0.2,
        random_state=42,
        stratify=encoded_target,
    )

    trained_models: dict[str, object] = {}
    model_weights: dict[str, float] = {}
    model_metrics: dict[str, dict[str, float | dict]] = {}
    for engine in ("xgboost", "lightgbm", "hist_gradient_boosting"):
        if engine == "xgboost" and XGBClassifier is None:
            continue
        if engine == "lightgbm" and LGBMClassifier is None:
            continue
        search = _build_search(engine)
        search.fit(x_train, y_train)
        model = search.best_estimator_
        predictions = model.predict(x_test)
        accuracy = float(accuracy_score(y_test, predictions))
        trained_models[engine] = model
        model_metrics[engine] = {
            "accuracy": round(accuracy, 4),
            "cv_score": round(float(search.best_score_), 4),
            "best_params": search.best_params_,
        }
        model_weights[engine] = max(float(search.best_score_), 0.01)

    if not trained_models:
        raise RuntimeError("Crop training failed to build any model")

    normalized_weight_total = sum(model_weights.values()) or 1.0
    model_weights = {
        key: round(value / normalized_weight_total, 6) for key, value in model_weights.items()
    }
    primary_key = max(model_weights, key=model_weights.get)
    probabilities = np.average(
        np.stack([model.predict_proba(x_test) for model in trained_models.values()], axis=0),
        axis=0,
        weights=[model_weights[key] for key in trained_models],
    )
    accuracy = float(accuracy_score(y_test, np.argmax(probabilities, axis=1)))
    version = f"crop-ensemble-v{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    regional_priors = _regional_priors(features, encoded_target, encoder.classes_.tolist())

    bundle = {
        "model": trained_models[primary_key],
        "models": trained_models,
        "model_weights": model_weights,
        "feature_columns": MODEL_FEATURE_COLUMNS,
        "feature_medians": features.median(numeric_only=True).to_dict(),
        "version": version,
        "classes": encoder.classes_.tolist(),
        "best_params": {
            key: metrics["best_params"]
            for key, metrics in model_metrics.items()
            if "best_params" in metrics
        },
        "cv_score": round(
            float(np.mean([metrics["cv_score"] for metrics in model_metrics.values()])), 4
        ),
        "regional_priors": regional_priors,
    }
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, model_path)

    dataset_manifest = load_dataset_manifest("crop_training")
    metadata = {
        "version": version,
        "engine": "ensemble",
        "ensemble_members": list(trained_models.keys()),
        "ensemble_weights": model_weights,
        "accuracy": round(accuracy, 4),
        "cv_score": bundle["cv_score"],
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "samples": int(len(df)),
        "feature_columns": MODEL_FEATURE_COLUMNS,
        "classes": encoder.classes_.tolist(),
        "best_params": bundle["best_params"],
        "dataset_path": str(csv_path),
        "dataset_version": dataset_manifest.get("active_version"),
        "model_metrics": model_metrics,
    }
    atomic_write_json(metadata_path, metadata)
    register_model(
        "crop",
        version=version,
        artifact_path=model_path,
        metadata_path=metadata_path,
        metrics={
            "accuracy": metadata["accuracy"],
            "cv_score": metadata["cv_score"],
        },
        extra={
            "ensemble_members": metadata["ensemble_members"],
            "dataset_version": metadata["dataset_version"],
        },
    )
    log_training_metrics(
        "crop",
        version=version,
        metrics={
            "accuracy": metadata["accuracy"],
            "cv_score": metadata["cv_score"],
            "precision_proxy": metadata["accuracy"],
            "recall_proxy": metadata["accuracy"],
        },
        dataset_version=metadata["dataset_version"],
        extra={"ensemble_members": metadata["ensemble_members"]},
    )
    return metadata


if __name__ == "__main__":
    result = train_crop_model(force_refresh_dataset=False)
    print(json.dumps(result, indent=2))
