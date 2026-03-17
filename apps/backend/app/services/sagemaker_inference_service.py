from __future__ import annotations

import json
from typing import Any

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import settings
from app.core.exceptions import ExternalServiceUnavailableError
from app.core.logging import get_logger
from app.schemas.recommendations import CropRecommendationResponse, PriceForecastResponse

logger = get_logger(__name__)


class SageMakerInferenceService:
    def __init__(self) -> None:
        self._client = boto3.client("sagemaker-runtime", region_name=settings.aws_region)

    def _invoke_endpoint(self, endpoint_name: str, payload: dict[str, Any]) -> dict[str, Any]:
        try:
            response = self._client.invoke_endpoint(
                EndpointName=endpoint_name,
                ContentType="application/json",
                Accept="application/json",
                Body=json.dumps(payload, default=str).encode("utf-8"),
            )
            body = response["Body"].read().decode("utf-8")
            parsed = json.loads(body) if body else {}
            if not isinstance(parsed, dict):
                raise ValueError("SageMaker response must be a JSON object")
            return parsed
        except (BotoCoreError, ClientError, ValueError, json.JSONDecodeError) as exc:
            logger.warning("sagemaker_invoke_failed", endpoint=endpoint_name, error=str(exc))
            raise ExternalServiceUnavailableError("SageMaker inference is unavailable") from exc

    @staticmethod
    def _normalize_response_payload(payload: dict[str, Any]) -> dict[str, Any]:
        if "data" in payload and isinstance(payload["data"], dict):
            return payload["data"]
        return payload

    def crop_recommend(self, payload: dict[str, Any]) -> CropRecommendationResponse:
        endpoint_name = settings.sagemaker_crop_endpoint
        if not endpoint_name:
            raise ExternalServiceUnavailableError("Crop SageMaker endpoint is not configured")
        raw = self._normalize_response_payload(self._invoke_endpoint(endpoint_name, payload))
        return CropRecommendationResponse.model_validate(raw)

    def price_forecast(self, payload: dict[str, Any]) -> PriceForecastResponse:
        endpoint_name = settings.sagemaker_price_endpoint
        if not endpoint_name:
            raise ExternalServiceUnavailableError("Price SageMaker endpoint is not configured")
        raw = self._normalize_response_payload(self._invoke_endpoint(endpoint_name, payload))
        return PriceForecastResponse.model_validate(raw)
