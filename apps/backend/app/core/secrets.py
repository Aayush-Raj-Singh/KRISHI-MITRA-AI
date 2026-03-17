from __future__ import annotations

import json
import os
from typing import Dict

import boto3
from botocore.exceptions import ClientError

from app.core.logging import get_logger

logger = get_logger(__name__)


def _strict_mode() -> bool:
    environment = (os.getenv("ENVIRONMENT") or "development").strip().lower()
    secure_flag = (os.getenv("ENFORCE_SECURE_SECRETS") or "").strip().lower()
    return environment in {"production", "staging"} or secure_flag in {"1", "true", "yes", "on"}


def load_secrets_into_env() -> None:
    secret_id = os.getenv("AWS_SECRETS_MANAGER_SECRET_ID")
    if not secret_id:
        return

    region = os.getenv("AWS_REGION", "us-east-1")
    try:
        client = boto3.client("secretsmanager", region_name=region)
        response = client.get_secret_value(SecretId=secret_id)
        secret_string = response.get("SecretString")
        if not secret_string:
            logger.warning("secrets_manager_empty", secret_id=secret_id)
            return
        payload = json.loads(secret_string)
        if not isinstance(payload, dict):
            logger.warning("secrets_manager_invalid_payload", secret_id=secret_id)
            return
    except ClientError as exc:
        if _strict_mode():
            raise RuntimeError("Failed to load application secrets from AWS Secrets Manager") from exc
        logger.warning("secrets_manager_fetch_failed", error=str(exc))
        return
    except Exception as exc:
        if _strict_mode():
            raise RuntimeError("Failed to load application secrets from AWS Secrets Manager") from exc
        logger.warning("secrets_manager_unexpected_error", error=str(exc))
        return

    applied: Dict[str, str] = {}
    for key, value in payload.items():
        if key in os.environ:
            continue
        if value is None:
            continue
        os.environ[str(key)] = str(value)
        applied[str(key)] = "***"

    if applied:
        logger.info("secrets_manager_loaded", secret_id=secret_id, keys=list(applied.keys()))
