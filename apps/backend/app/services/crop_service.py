from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List

import joblib
import numpy as np
import pandas as pd
from ml.training.train_crop_model import FEATURE_COLUMNS, train_crop_model

from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.recommendations import CropRecommendationItem, CropRecommendationRequest

logger = get_logger(__name__)


@dataclass
class CropModelBundle:
    model: object
    feature_columns: List[str]
    feature_medians: Dict[str, float]
    version: str


class CropRecommender:
    def __init__(self) -> None:
        self._artifact_path = settings.crop_model_artifact_resolved_path
        self._legacy_artifact_path = settings.crop_model_legacy_artifact_path
        self._bundle = self._load_or_train()

    @staticmethod
    def _season_index(season: str | None) -> float:
        if not season:
            return 0.0
        season_map = {"kharif": 1.0, "rabi": 2.0, "zaid": 3.0}
        return season_map.get(season.strip().lower(), 0.0)

    @staticmethod
    def _location_score(location: str) -> float:
        return (sum(ord(char) for char in (location or "")) % 1000) / 1000.0

    def _load_or_train(self) -> CropModelBundle:
        artifact_path = self._artifact_path
        if not artifact_path.exists() and self._legacy_artifact_path.exists():
            artifact_path = self._legacy_artifact_path

        if not artifact_path.exists():
            self._artifact_path.parent.mkdir(parents=True, exist_ok=True)
            logger.info("crop_model_missing_training_started", artifact=str(self._artifact_path))
            metadata = train_crop_model(model_path=self._artifact_path)
            logger.info(
                "crop_model_training_completed",
                version=metadata["version"],
                accuracy=metadata["accuracy"],
            )
            artifact_path = self._artifact_path

        payload = joblib.load(artifact_path)
        return CropModelBundle(
            model=payload["model"],
            feature_columns=list(payload["feature_columns"]),
            feature_medians={
                key: float(value) for key, value in payload["feature_medians"].items()
            },
            version=str(payload.get("version", "rf-crop-v1")),
        )

    def _feature_row(self, request: CropRecommendationRequest) -> pd.DataFrame:
        historical_yield = request.historical_yield if request.historical_yield is not None else 0.0
        if 0 < historical_yield < 50:
            historical_yield = historical_yield * 1000
        feature_map = {
            "soil_n": request.soil_n,
            "soil_p": request.soil_p,
            "soil_k": request.soil_k,
            "soil_ph": request.soil_ph,
            "temperature_c": request.temperature_c,
            "humidity_pct": request.humidity_pct,
            "rainfall_mm": request.rainfall_mm,
            "season_index": self._season_index(request.season),
            "location_score": self._location_score(request.location),
            "historical_yield": historical_yield,
        }
        values = [
            float(feature_map.get(column, self._bundle.feature_medians.get(column, 0.0)))
            for column in FEATURE_COLUMNS
        ]
        return pd.DataFrame([values], columns=FEATURE_COLUMNS)

    def _explanation(self, feature_values: pd.DataFrame) -> str:
        model = self._bundle.model
        importances = np.array(
            getattr(model, "feature_importances_", np.zeros(len(FEATURE_COLUMNS))), dtype=float
        )
        medians = np.array(
            [self._bundle.feature_medians.get(name, 0.0) for name in FEATURE_COLUMNS], dtype=float
        )
        point = feature_values.iloc[0].to_numpy(dtype=float)
        delta = np.abs(point - medians) / (np.abs(medians) + 1.0)
        contribution = importances * delta
        top_indices = np.argsort(contribution)[::-1][:3]

        phrases: List[str] = []
        for idx in top_indices:
            name = FEATURE_COLUMNS[int(idx)]
            value = point[int(idx)]
            median = medians[int(idx)]
            direction = "higher" if value > median else "lower"
            label_map = {
                "soil_n": "soil nitrogen",
                "soil_p": "soil phosphorus",
                "soil_k": "soil potassium",
                "soil_ph": "soil pH",
                "temperature_c": "temperature",
                "humidity_pct": "humidity",
                "rainfall_mm": "rainfall",
                "season_index": "seasonal pattern",
                "location_score": "location suitability",
                "historical_yield": "historical yield",
            }
            phrases.append(f"{label_map.get(name, name)} is {direction} than baseline")

        return "Key drivers: " + "; ".join(phrases) + "."

    def _apply_personalization(
        self,
        labels: List[str],
        probabilities: np.ndarray,
        personalization_context: Dict[str, object] | None = None,
    ) -> np.ndarray:
        if not personalization_context:
            return probabilities

        adjusted = probabilities.astype(float).copy()
        preferred = personalization_context.get("preferred_crops", {}) or {}
        seasonal = personalization_context.get("seasonal_preference", {}) or {}

        if isinstance(preferred, dict):
            for idx, label in enumerate(labels):
                key = label.strip().lower()
                weight = float(preferred.get(key, 0.0))
                if weight > 0:
                    adjusted[idx] *= 1 + min(weight, 0.7) * 0.2

        if isinstance(seasonal, dict):
            for idx, label in enumerate(labels):
                key = label.strip().lower()
                weight = float(seasonal.get(key, 0.0))
                if weight > 0:
                    adjusted[idx] *= 1 + min(weight, 0.8) * 0.25

        total = float(np.sum(adjusted))
        if total <= 0:
            return probabilities
        return adjusted / total

    def recommend(
        self,
        request: CropRecommendationRequest,
        personalization_context: Dict[str, object] | None = None,
    ) -> Dict[str, object]:
        if personalization_context:
            hint = personalization_context.get("historical_yield_hint")
            if request.historical_yield is None and isinstance(hint, (float, int)) and hint > 0:
                request = request.model_copy(update={"historical_yield": float(hint)})

        feature_values = self._feature_row(request)
        model = self._bundle.model
        if hasattr(model, "n_jobs"):
            setattr(model, "n_jobs", 1)

        probabilities = model.predict_proba(feature_values)[0]
        labels = [str(item) for item in model.classes_]
        adjusted_probabilities = self._apply_personalization(
            labels=labels,
            probabilities=probabilities,
            personalization_context=personalization_context,
        )
        top_indices = np.argsort(adjusted_probabilities)[::-1][:3]
        explanation = self._explanation(feature_values)
        if personalization_context and (
            personalization_context.get("preferred_crops")
            or personalization_context.get("seasonal_preference")
        ):
            explanation = f"{explanation} Personalized using your historical outcomes and seasonal success trends."

        recommendations = [
            CropRecommendationItem(
                crop=labels[int(idx)],
                confidence=round(float(adjusted_probabilities[int(idx)]), 4),
                explanation=explanation,
            )
            for idx in top_indices
        ]

        logger.info("crop_recommendation_generated", model_version=self._bundle.version)
        return {
            "recommendations": recommendations,
            "model_version": self._bundle.version,
            "created_at": datetime.now(timezone.utc),
        }
