from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from time import perf_counter
from typing import Dict, List

import numpy as np
import pandas as pd
from ml.common.feature_engineering import stable_bucket
from ml.crop.model import (
    REQUEST_FEATURE_COLUMNS,
    build_feature_row,
    explanation_from_feature_values,
    predict_proba,
)
from ml.monitoring.metrics_logger import log_inference_metrics
from ml.crop.predict import clear_crop_bundle_cache, load_or_train_crop_bundle
from ml.crop.train import train_crop_model

from app.data.india_state_registry import INDIA_STATE_REGISTRY
from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.recommendations import CropRecommendationItem, CropRecommendationRequest

logger = get_logger(__name__)


@dataclass
class CropModelBundle:
    model: object
    models: Dict[str, object]
    model_weights: Dict[str, float]
    feature_columns: List[str]
    feature_medians: Dict[str, float]
    version: str
    regional_priors: Dict[str, Dict[str, float]]


class CropRecommender:
    def __init__(self) -> None:
        self._artifact_path = settings.crop_model_artifact_resolved_path
        self._bundle = self._load_or_train()

    def _load_or_train(self) -> CropModelBundle:
        if not self._artifact_path.exists():
            self._artifact_path.parent.mkdir(parents=True, exist_ok=True)
            logger.info("crop_model_missing_training_started", artifact=str(self._artifact_path))
            metadata = train_crop_model(model_path=self._artifact_path)
            logger.info(
                "crop_model_training_completed",
                version=metadata["version"],
                accuracy=metadata["accuracy"],
            )
            clear_crop_bundle_cache()

        payload = load_or_train_crop_bundle()
        return CropModelBundle(
            model=payload.model,
            models=dict(payload.models),
            model_weights=dict(payload.model_weights),
            feature_columns=list(payload.feature_columns),
            feature_medians=dict(payload.feature_medians),
            version=str(payload.version),
            regional_priors=dict(payload.regional_priors),
        )

    def _feature_row(
        self,
        request: CropRecommendationRequest,
        location_context: Dict[str, object] | None = None,
    ) -> pd.DataFrame:
        weather_history = None
        if location_context:
            weather_history = location_context.get("weather_history")
        return build_feature_row(request, weather_history=weather_history)

    def _explanation(self, feature_values: pd.DataFrame) -> str:
        return explanation_from_feature_values(load_or_train_crop_bundle(), feature_values)

    def _apply_personalization(
        self,
        labels: List[str],
        probabilities: np.ndarray,
        personalization_context: Dict[str, object] | None = None,
        request: CropRecommendationRequest | None = None,
    ) -> np.ndarray:
        adjusted = probabilities.astype(float).copy()
        preferred = (personalization_context or {}).get("preferred_crops", {}) or {}
        seasonal = (personalization_context or {}).get("seasonal_preference", {}) or {}

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

        if request:
            regional_bias = self._regional_bias(labels, request)
            for idx, label in enumerate(labels):
                adjusted[idx] *= 1 + regional_bias.get(label.strip().lower(), 0.0)

        total = float(np.sum(adjusted))
        if total <= 0:
            return probabilities
        return adjusted / total

    def _regional_bias(
        self,
        labels: List[str],
        request: CropRecommendationRequest,
    ) -> Dict[str, float]:
        location_label = (request.location or "").strip().lower()
        regional_bias: Dict[str, float] = {}
        if location_label:
            for state in INDIA_STATE_REGISTRY:
                state_name = str(state.get("name", "")).strip().lower()
                if state_name and state_name in location_label:
                    focus_crops = {
                        str(item).strip().lower() for item in state.get("focus_crops", [])
                    }
                    for label in labels:
                        key = label.strip().lower()
                        if key in focus_crops:
                            regional_bias[key] = regional_bias.get(key, 0.0) + 0.12
                    break

        request_frame = self._feature_row(request)
        region_cluster = str(
            int(float(request_frame.iloc[0].get("region_cluster", stable_bucket(location_label))))
        )
        for label, score in self._bundle.regional_priors.get(region_cluster, {}).items():
            key = label.strip().lower()
            regional_bias[key] = regional_bias.get(key, 0.0) + min(float(score), 0.25)
        return regional_bias

    def recommend_many(
        self,
        requests: List[CropRecommendationRequest],
        personalization_contexts: List[Dict[str, object] | None] | None = None,
    ) -> List[Dict[str, object]]:
        contexts = personalization_contexts or [None] * len(requests)
        return [
            self.recommend(request, personalization_context=context)
            for request, context in zip(requests, contexts)
        ]

    def recommend(
        self,
        request: CropRecommendationRequest,
        personalization_context: Dict[str, object] | None = None,
        location_context: Dict[str, object] | None = None,
    ) -> Dict[str, object]:
        started_at = perf_counter()
        if personalization_context:
            hint = personalization_context.get("historical_yield_hint")
            if request.historical_yield is None and isinstance(hint, (float, int)) and hint > 0:
                request = request.model_copy(update={"historical_yield": float(hint)})

        feature_values = self._feature_row(request, location_context=location_context)
        model = self._bundle.model
        if hasattr(model, "n_jobs"):
            setattr(model, "n_jobs", 1)

        model_frame = feature_values[
            [column for column in REQUEST_FEATURE_COLUMNS if column in self._bundle.feature_columns]
        ]
        probabilities = predict_proba(load_or_train_crop_bundle(), model_frame)
        labels = [str(item) for item in load_or_train_crop_bundle().classes]
        adjusted_probabilities = self._apply_personalization(
            labels=labels,
            probabilities=probabilities,
            personalization_context=personalization_context,
            request=request,
        )
        top_indices = np.argsort(adjusted_probabilities)[::-1][:3]
        explanation = self._explanation(feature_values)
        if personalization_context and (
            personalization_context.get("preferred_crops")
            or personalization_context.get("seasonal_preference")
        ):
            explanation = f"{explanation} Personalized using your historical outcomes and seasonal success trends."
        if request.location:
            explanation = (
                f"{explanation} Regional crop patterns for {request.location} were also considered."
            )

        recommendations = [
            CropRecommendationItem(
                crop=labels[int(idx)],
                confidence=round(float(adjusted_probabilities[int(idx)]), 4),
                explanation=explanation,
            )
            for idx in top_indices
        ]

        log_inference_metrics(
            "crop",
            latency_ms=(perf_counter() - started_at) * 1000,
            batch_size=1,
            success=True,
        )
        logger.info("crop_recommendation_generated", model_version=self._bundle.version)
        return {
            "recommendations": recommendations,
            "model_version": self._bundle.version,
            "created_at": datetime.now(timezone.utc),
        }
