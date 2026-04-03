from __future__ import annotations

import os
from typing import Any, Dict

import boto3
from botocore.exceptions import ProfileNotFound

from app.core.config import settings
from app.core.logging import get_logger
from app.services.bedrock_service import BedrockService

logger = get_logger(__name__)


class AWSValidationService:
    def __init__(self) -> None:
        self._region = settings.aws_region
        self._profile = (settings.aws_profile or os.getenv("AWS_PROFILE") or "").strip() or None
        self._mock_mode = bool(settings.aws_validation_mock_mode and not settings.is_production)
        self._session_error: str | None = None
        try:
            session_kwargs: Dict[str, Any] = {"region_name": self._region}
            if self._profile:
                session_kwargs["profile_name"] = self._profile
            self._session = boto3.session.Session(**session_kwargs)
        except ProfileNotFound as exc:
            self._session = None
            self._session_error = str(exc)
        self._clients: Dict[str, Any] = {}

    def validate(self) -> Dict[str, Any]:
        credentials = self._credential_status()
        result: Dict[str, Any] = {
            "region": self._region,
            "profile": self._profile,
            "shared_credentials_file": settings.aws_shared_credentials_file
            or os.getenv("AWS_SHARED_CREDENTIALS_FILE"),
            "mock_mode": self._mock_mode,
            "credentials": credentials,
        }
        if not credentials["available"]:
            reason = (
                credentials.get("reason")
                or credentials.get("error")
                or "AWS credentials unavailable"
            )
            result.update(
                {
                    "identity": self._mocked_status(reason, configured=True),
                    "iam": self._mocked_status(reason, configured=False),
                    "bedrock": self._mocked_status(reason, configured=self._uses_bedrock()),
                    "translate": self._mocked_status(reason, configured=self._uses_aws_translate()),
                    "s3": self._mocked_status(
                        reason, configured=bool(settings.aws_validation_s3_bucket)
                    ),
                    "secrets_manager": self._mocked_status(
                        reason, configured=bool(settings.aws_secrets_manager_secret_id)
                    ),
                    "sagemaker": self._mocked_sagemaker_status(reason),
                }
            )
        else:
            result.update(
                {
                    "identity": self._identity_status(),
                    "iam": self._iam_status(),
                    "bedrock": self._bedrock_status()
                    if self._uses_bedrock()
                    else self._inactive_status("LLM provider is not Bedrock"),
                    "translate": self._translate_status()
                    if self._uses_aws_translate()
                    else self._inactive_status("Translation provider is not AWS"),
                    "s3": self._s3_status(),
                    "secrets_manager": self._secrets_status(),
                    "sagemaker": self._sagemaker_status(),
                }
            )

        result["summary"] = self._summary(result)
        return result

    def _client(self, service_name: str):
        if self._session is None:
            raise RuntimeError(self._session_error or "AWS session is unavailable")
        if service_name not in self._clients:
            self._clients[service_name] = self._session.client(
                service_name, region_name=self._region
            )
        return self._clients[service_name]

    def _credential_status(self) -> Dict[str, Any]:
        if self._session is None:
            return {
                "available": False,
                "profile": self._profile,
                "error": self._session_error or "AWS session could not be created",
            }
        try:
            credentials = self._session.get_credentials()
            if credentials is None:
                return {
                    "available": False,
                    "profile": self._profile,
                    "reason": "No AWS credentials resolved from env, profile, or instance metadata",
                }
            frozen = credentials.get_frozen_credentials()
            method = getattr(credentials, "method", None)
            return {
                "available": True,
                "profile": self._profile,
                "source": method or ("profile" if self._profile else "default"),
                "access_key_suffix": frozen.access_key[-4:] if frozen.access_key else None,
            }
        except Exception as exc:
            logger.warning("aws_credentials_validation_failed", error=str(exc))
            return {
                "available": False,
                "profile": self._profile,
                "error": str(exc),
            }

    def _mocked_status(self, reason: str, *, configured: bool) -> Dict[str, Any]:
        return {
            "available": False,
            "configured": configured,
            "skipped": True,
            "mocked": self._mock_mode,
            "reason": reason,
        }

    @staticmethod
    def _inactive_status(reason: str) -> Dict[str, Any]:
        return {
            "available": False,
            "configured": False,
            "skipped": True,
            "inactive": True,
            "reason": reason,
        }

    @staticmethod
    def _uses_bedrock() -> bool:
        return settings.llm_provider == "bedrock"

    @staticmethod
    def _uses_aws_translate() -> bool:
        return settings.translation_provider == "aws" and settings.aws_translate_enabled

    def _mocked_sagemaker_status(self, reason: str) -> Dict[str, Any]:
        endpoints = {
            "crop": settings.sagemaker_crop_endpoint,
            "price": settings.sagemaker_price_endpoint,
        }
        return {
            "configured": bool(settings.sagemaker_runtime_enabled or any(endpoints.values())),
            "runtime_enabled": settings.sagemaker_runtime_enabled,
            "skipped": True,
            "mocked": self._mock_mode,
            "reason": reason,
            "endpoints": {
                key: {
                    "configured": bool(value),
                    "skipped": True,
                    "mocked": self._mock_mode,
                    "reason": reason,
                }
                for key, value in endpoints.items()
            },
        }

    def _identity_status(self) -> Dict[str, Any]:
        try:
            payload = self._client("sts").get_caller_identity()
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
                "configured": True,
                "configured_model": settings.bedrock_model_id,
                "configured_fallback_model": settings.bedrock_fallback_model_id,
                "error": str(exc),
            }

    def _translate_status(self) -> Dict[str, Any]:
        if not settings.aws_translate_enabled:
            return {"available": False, "configured": False, "reason": "AWS translation disabled"}
        try:
            response = self._client("translate").translate_text(
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

    def _s3_status(self) -> Dict[str, Any]:
        bucket_name = settings.aws_validation_s3_bucket
        s3_client = self._client("s3")
        try:
            if bucket_name:
                s3_client.head_bucket(Bucket=bucket_name)
                return {"available": True, "configured": True, "bucket": bucket_name}
            response = s3_client.list_buckets()
            return {
                "available": True,
                "configured": False,
                "bucket_count": len(response.get("Buckets", [])),
            }
        except Exception as exc:
            logger.warning("aws_s3_validation_failed", error=str(exc), bucket=bucket_name)
            return {
                "available": False,
                "configured": bool(bucket_name),
                "bucket": bucket_name,
                "error": str(exc),
            }

    def _iam_status(self) -> Dict[str, Any]:
        try:
            response = self._client("iam").list_account_aliases(MaxItems=1)
            aliases = response.get("AccountAliases", [])
            return {
                "available": True,
                "configured": True,
                "account_alias": aliases[0] if aliases else None,
            }
        except Exception as exc:
            logger.warning("aws_iam_validation_failed", error=str(exc))
            return {
                "available": False,
                "configured": True,
                "advisory": True,
                "error": str(exc),
            }

    def _secrets_status(self) -> Dict[str, Any]:
        if not settings.aws_secrets_manager_secret_id:
            return {"available": False, "configured": False, "reason": "No secret configured"}
        try:
            response = self._client("secretsmanager").describe_secret(
                SecretId=settings.aws_secrets_manager_secret_id
            )
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
                response = self._client("sagemaker").describe_endpoint(EndpointName=endpoint_name)
                statuses["endpoints"][key] = {
                    "configured": True,
                    "name": response.get("EndpointName"),
                    "status": response.get("EndpointStatus"),
                    "last_modified_at": response.get("LastModifiedTime").isoformat()
                    if response.get("LastModifiedTime")
                    else None,
                }
            except Exception as exc:
                logger.warning(
                    "aws_sagemaker_validation_failed", endpoint=endpoint_name, error=str(exc)
                )
                statuses["endpoints"][key] = {
                    "configured": True,
                    "name": endpoint_name,
                    "available": False,
                    "error": str(exc),
                }
        return statuses

    def _summary(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        blocking_failures = []
        warnings = []

        def evaluate(name: str, status: Dict[str, Any] | None) -> None:
            if not isinstance(status, dict):
                return
            configured = bool(status.get("configured", True))
            available = bool(status.get("available", False))
            skipped = bool(status.get("skipped", False))
            advisory = bool(status.get("advisory", False))
            inactive = bool(status.get("inactive", False))
            error = status.get("error") or status.get("reason")
            if inactive or (skipped and not configured):
                return
            if advisory and error:
                warnings.append(f"{name}: {error}")
                return
            if configured and not available and not skipped:
                blocking_failures.append(f"{name}: {error or 'unavailable'}")
            elif error:
                warnings.append(f"{name}: {error}")

        credentials = (
            payload.get("credentials") if isinstance(payload.get("credentials"), dict) else {}
        )
        if not credentials.get("available") and not payload.get("mock_mode"):
            blocking_failures.append(
                f"credentials: {credentials.get('error') or credentials.get('reason') or 'AWS credentials unavailable'}"
            )
        elif not credentials.get("available"):
            warnings.append(
                credentials.get("error")
                or credentials.get("reason")
                or "AWS credentials unavailable"
            )

        for service_name in ("identity", "iam", "bedrock", "translate", "s3", "secrets_manager"):
            evaluate(service_name, payload.get(service_name))

        sagemaker_status = payload.get("sagemaker")
        if isinstance(sagemaker_status, dict):
            endpoints = sagemaker_status.get("endpoints", {})
            if isinstance(endpoints, dict):
                for endpoint_name, endpoint_status in endpoints.items():
                    evaluate(
                        f"sagemaker.{endpoint_name}",
                        endpoint_status if isinstance(endpoint_status, dict) else None,
                    )

        return {
            "ok": not blocking_failures,
            "blocking_failures": blocking_failures,
            "warnings": warnings,
        }
