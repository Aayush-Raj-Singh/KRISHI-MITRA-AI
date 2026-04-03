from __future__ import annotations

from app.services.bedrock_service import BedrockService


def test_bedrock_health_check_supports_mock_runtime_validation(monkeypatch):
    monkeypatch.setattr("app.services.bedrock_service.settings.runtime_validation_mock_mode", True)
    monkeypatch.setattr("app.services.bedrock_service.settings.environment", "test")
    monkeypatch.setattr(
        "app.services.bedrock_service.settings.bedrock_model_id",
        "anthropic.claude-3-sonnet-20240229-v1:0",
    )
    monkeypatch.setattr(
        "app.services.bedrock_service.settings.bedrock_fallback_model_id",
        "anthropic.claude-3-haiku-20240307-v1:0",
    )
    monkeypatch.setattr(
        "app.services.bedrock_service.boto3.client", lambda *args, **kwargs: object()
    )

    service = BedrockService()
    monkeypatch.setattr(
        service,
        "_invoke_converse",
        lambda *args, **kwargs: (_ for _ in ()).throw(
            AssertionError("mock validation should not invoke Bedrock")
        ),
    )
    monkeypatch.setattr(
        service,
        "_invoke_model",
        lambda *args, **kwargs: (_ for _ in ()).throw(
            AssertionError("mock validation should not invoke fallback")
        ),
    )

    payload = service.health_check(test_fallback=True)

    assert payload["available"] is True
    assert payload["mocked"] is True
    assert payload["primary_model"]["sample"] == "OK"
    assert payload["fallback_model"]["mocked"] is True
