from __future__ import annotations

from typing import Any, Dict

import boto3

from app.core.config import settings
from app.core.logging import get_logger
from app.services.bedrock_service import BedrockService

logger = get_logger(__name__)


class AWSValidationService:
    def __init__(self) -> None:
        self._region = settings.aws_region
        self._sts = boto3.client("sts", region_name=self._region)
        self._translate = boto3.client("translate", region_name=self._region)
        self._secrets = boto3.client("secretsmanager", region_name=self._region)
        self._sagemaker = boto3.client("sagemaker", region_name=self._region)

    def validate(self) -> Dict[str, Any]:
        return {
            "region": self._region,
            "identity": self._identity_status(),
            "bedrock": self._bedrock_status(),
            "translate": self._translate_status(),
            "secrets_manager": self._secrets_status(),
            "sagemaker": self._sagemaker_status(),
        }

    def _identity_status(self) -> Dict[str, Any]:
        try:
            payload = self._sts.get_caller_identity()
            return {
                "available": True,
                "account": payload.get("Account"),
                "arn": payload.get("Arn"),
            }
        except Exception as exc:
            logger.warning("aws_identity_validation_failed", error=str(exc))
            return {"available": False, "error": str(exc)}

    def _bedrock_status(self) -> Dict[str, Any]:
        try:
            service = BedrockService()
            result = service.health_check(test_fallback=True)
            result["configured_model"] = settings.bedrock_model_id
            result["configured_fallback_model"] = settings.bedrock_fallback_model_id
            return result
        except Exception as exc:
            logger.warning("aws_bedrock_validation_failed", error=str(exc))
            return {
                "available": False,
                "configured_model": settings.bedrock_model_id,
                "configured_fallback_model": settings.bedrock_fallback_model_id,
                "error": str(exc),
            }

    def _translate_status(self) -> Dict[str, Any]:
        if not settings.aws_translate_enabled:
            return {"available": False, "configured": False, "reason": "AWS translation disabled"}
        try:
            response = self._translate.translate_text(
                Text="Hello farmer",
                SourceLanguageCode="en",
                TargetLanguageCode="hi",
            )
            return {
                "available": True,
                "configured": True,
                "sample": response.get("TranslatedText"),
            }
        except Exception as exc:
            logger.warning("aws_translate_validation_failed", error=str(exc))
            return {"available": False, "configured": True, "error": str(exc)}

    def _secrets_status(self) -> Dict[str, Any]:
        if not settings.aws_secrets_manager_secret_id:
            return {"available": False, "configured": False, "reason": "No secret configured"}
        try:
            response = self._secrets.describe_secret(SecretId=settings.aws_secrets_manager_secret_id)
            return {
                "available": True,
                "configured": True,
                "name": response.get("Name"),
                "arn": response.get("ARN"),
                "rotation_enabled": bool(response.get("RotationEnabled", False)),
            }
        except Exception as exc:
            logger.warning("aws_secrets_validation_failed", error=str(exc))
            return {
                "available": False,
                "configured": True,
                "secret_id": settings.aws_secrets_manager_secret_id,
                "error": str(exc),
            }

    def _sagemaker_status(self) -> Dict[str, Any]:
        endpoints = {
            "crop": settings.sagemaker_crop_endpoint,
            "price": settings.sagemaker_price_endpoint,
        }
        statuses: Dict[str, Any] = {
            "configured": bool(settings.sagemaker_runtime_enabled or any(endpoints.values())),
            "runtime_enabled": settings.sagemaker_runtime_enabled,
            "endpoints": {},
        }

        for key, endpoint_name in endpoints.items():
            if not endpoint_name:
                statuses["endpoints"][key] = {"configured": False}
                continue
            try:
                response = self._sagemaker.describe_endpoint(EndpointName=endpoint_name)
                statuses["endpoints"][key] = {
                    "configured": True,
                    "name": response.get("EndpointName"),
                    "status": response.get("EndpointStatus"),
                    "last_modified_at": response.get("LastModifiedTime").isoformat()
                    if response.get("LastModifiedTime")
                    else None,
                }
            except Exception as exc:
                logger.warning("aws_sagemaker_validation_failed", endpoint=endpoint_name, error=str(exc))
                statuses["endpoints"][key] = {
                    "configured": True,
                    "name": endpoint_name,
                    "available": False,
                    "error": str(exc),
                }
        return statuses
