from __future__ import annotations

from app.core.config import settings
from app.services.aws_validation_service import AWSValidationService


def test_aws_validation_uses_mock_mode_without_credentials(monkeypatch):
    monkeypatch.setattr(settings, "aws_profile", None)
    monkeypatch.setattr(settings, "aws_validation_mock_mode", True)
    monkeypatch.setattr(settings, "environment", "development")
    monkeypatch.setattr(settings, "llm_provider", "bedrock")
    monkeypatch.setattr(settings, "translation_provider", "aws")
    monkeypatch.setattr(settings, "aws_translate_enabled", True)
    monkeypatch.setattr(
        AWSValidationService,
        "_credential_status",
        lambda self: {
            "available": False,
            "profile": None,
            "reason": "No AWS credentials resolved from test override",
        },
    )

    service = AWSValidationService()
    payload = service.validate()

    assert payload["credentials"]["available"] is False
    assert payload["mock_mode"] is True
    assert payload["bedrock"]["skipped"] is True
    assert payload["summary"]["ok"] is True


def test_aws_validation_validates_bedrock_and_translate_when_runtime_is_active(monkeypatch):
    monkeypatch.setattr(settings, "llm_provider", "bedrock")
    monkeypatch.setattr(settings, "translation_provider", "aws")
    monkeypatch.setattr(settings, "aws_translate_enabled", True)
    monkeypatch.setattr(
        AWSValidationService,
        "_credential_status",
        lambda self: {
            "available": True,
            "profile": "test",
            "source": "shared-credentials-file",
            "access_key_suffix": "1234",
        },
    )
    monkeypatch.setattr(
        AWSValidationService, "_identity_status", lambda self: {"available": True, "account": "1"}
    )
    monkeypatch.setattr(
        AWSValidationService, "_iam_status", lambda self: {"available": True, "configured": True}
    )
    monkeypatch.setattr(
        AWSValidationService,
        "_bedrock_status",
        lambda self: {"available": True, "configured": True, "configured_model": "bedrock-model"},
    )
    monkeypatch.setattr(
        AWSValidationService,
        "_translate_status",
        lambda self: {"available": True, "configured": True, "sample": "Namaste kisan"},
    )
    monkeypatch.setattr(
        AWSValidationService,
        "_s3_status",
        lambda self: {"available": True, "configured": False, "bucket_count": 0},
    )
    monkeypatch.setattr(
        AWSValidationService,
        "_secrets_status",
        lambda self: {"available": False, "configured": False, "reason": "No secret configured"},
    )
    monkeypatch.setattr(
        AWSValidationService,
        "_sagemaker_status",
        lambda self: {"configured": False, "runtime_enabled": False, "endpoints": {}},
    )

    service = AWSValidationService()
    payload = service.validate()

    assert payload["bedrock"]["available"] is True
    assert payload["translate"]["available"] is True
    assert payload["summary"]["ok"] is True
