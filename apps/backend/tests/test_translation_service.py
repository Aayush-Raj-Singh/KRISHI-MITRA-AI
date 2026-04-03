from __future__ import annotations

import asyncio

from app.services.translation_service import TranslationService


def test_translation_service_uses_aws_provider(monkeypatch):
    class DummyAWSTranslateService:
        def translate_text(self, text, source_language, target_language):
            assert source_language == "en"
            assert target_language == "hi"
            return "Namaste kisan"

    monkeypatch.setattr(
        "app.services.translation_service.AWSTranslateService", DummyAWSTranslateService
    )
    monkeypatch.setattr("app.services.translation_service.settings.translation_provider", "aws")
    monkeypatch.setattr("app.services.translation_service.settings.aws_translate_enabled", True)
    monkeypatch.setattr("app.services.translation_service.settings.environment", "development")
    monkeypatch.setattr(TranslationService, "_AWS_TRANSLATE_AVAILABLE", None)

    service = TranslationService()

    payload = asyncio.run(service.translate_many(["Hello farmer"], "en", "hi"))

    assert payload["Hello farmer"] == "Namaste kisan"


def test_translation_health_check_reports_active_aws_provider(monkeypatch):
    class DummyAWSTranslateService:
        def translate_text(self, text, source_language, target_language):
            return "Namaste kisan"

    monkeypatch.setattr(
        "app.services.translation_service.AWSTranslateService", DummyAWSTranslateService
    )
    monkeypatch.setattr("app.services.translation_service.settings.translation_provider", "aws")
    monkeypatch.setattr("app.services.translation_service.settings.aws_translate_enabled", True)
    monkeypatch.setattr("app.services.translation_service.settings.environment", "development")
    monkeypatch.setattr(TranslationService, "_AWS_TRANSLATE_AVAILABLE", None)

    service = TranslationService()

    payload = asyncio.run(service.health_check())

    assert payload["provider"] == "aws"
    assert payload["available"] is True
    assert payload["sample"] == "Namaste kisan"


def test_translation_health_check_supports_mock_runtime_validation(monkeypatch):
    monkeypatch.setattr("app.services.translation_service.settings.translation_provider", "aws")
    monkeypatch.setattr("app.services.translation_service.settings.aws_translate_enabled", True)
    monkeypatch.setattr(
        "app.services.translation_service.settings.runtime_validation_mock_mode", True
    )
    monkeypatch.setattr("app.services.translation_service.settings.environment", "test")
    monkeypatch.setattr(TranslationService, "_AWS_TRANSLATE_AVAILABLE", None)

    service = TranslationService()
    monkeypatch.setattr(
        service,
        "translate_many",
        lambda *args, **kwargs: (_ for _ in ()).throw(
            AssertionError("mock validation should not translate live")
        ),
    )

    payload = asyncio.run(service.health_check())

    assert payload["provider"] == "aws"
    assert payload["available"] is True
    assert payload["mocked"] is True
    assert isinstance(payload["sample"], str)
    assert payload["sample"]
