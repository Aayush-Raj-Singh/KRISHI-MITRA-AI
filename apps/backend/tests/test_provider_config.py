from __future__ import annotations

from pathlib import Path

import pytest
from app.core.config import DEFAULT_MODEL_ARTIFACTS_ROOT, Settings


def test_provider_defaults_preserve_current_runtime_behavior(monkeypatch):
    for env_key in (
        "LLM_PROVIDER",
        "TRANSLATION_PROVIDER",
        "BEDROCK_MODEL_ID",
        "BEDROCK_FALLBACK_MODEL_ID",
        "LLM_MAX_TOKENS",
        "BEDROCK_MAX_TOKENS",
        "LLM_TEMPERATURE",
        "BEDROCK_TEMPERATURE",
        "AWS_TRANSLATE_ENABLED",
        "PUBLIC_TRANSLATE_FALLBACK_ENABLED",
        "RUNTIME_VALIDATION_MOCK_MODE",
    ):
        monkeypatch.delenv(env_key, raising=False)

    config = Settings(_env_file=None)

    assert config.llm_provider == "bedrock"
    assert config.translation_provider == "aws"
    assert config.public_translate_fallback_enabled is False
    assert config.llm_max_tokens == 800
    assert config.llm_temperature == 0.7
    assert config.runtime_validation_mock_mode is False
    assert config.should_mock_runtime_validation is False
    assert config.model_artifacts_root == DEFAULT_MODEL_ARTIFACTS_ROOT
    assert (
        config.crop_model_artifact_resolved_path
        == DEFAULT_MODEL_ARTIFACTS_ROOT / "crop_model" / "crop_model.joblib"
    )


def test_llm_provider_is_forced_to_bedrock(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "legacy-provider")
    monkeypatch.setenv("TRANSLATION_PROVIDER", "aws")

    config = Settings(_env_file=None)

    assert config.llm_provider == "bedrock"


def test_provider_values_are_normalized_and_validated(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "BEDROCK")
    monkeypatch.setenv("TRANSLATION_PROVIDER", "AWS")

    config = Settings(_env_file=None)

    assert config.llm_provider == "bedrock"
    assert config.translation_provider == "aws"


def test_legacy_translation_provider_values_are_coerced_to_aws(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "bedrock")
    monkeypatch.setenv("TRANSLATION_PROVIDER", "public")

    config = Settings(_env_file=None)

    assert config.translation_provider == "aws"


def test_generic_llm_tuning_aliases_override_legacy_bedrock_names(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "bedrock")
    monkeypatch.setenv("TRANSLATION_PROVIDER", "aws")
    monkeypatch.setenv("BEDROCK_MAX_TOKENS", "900")
    monkeypatch.setenv("LLM_MAX_TOKENS", "1200")
    monkeypatch.setenv("BEDROCK_TEMPERATURE", "0.4")
    monkeypatch.setenv("LLM_TEMPERATURE", "0.9")

    config = Settings(_env_file=None)

    assert config.llm_max_tokens == 1200
    assert config.llm_temperature == 0.9


def test_runtime_validation_mock_mode_is_disabled_in_secure_envs(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "bedrock")
    monkeypatch.setenv("TRANSLATION_PROVIDER", "aws")
    monkeypatch.setenv("RUNTIME_VALIDATION_MOCK_MODE", "true")
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("JWT_SECRET_KEY", "x" * 32)
    monkeypatch.setenv("JWT_REFRESH_SECRET_KEY", "y" * 32)
    monkeypatch.setenv("CORS_ORIGINS", "https://krishimitra.example.com")
    monkeypatch.setenv("OTP_PROVIDER", "twilio")
    monkeypatch.setenv("TWILIO_MOCK_MODE", "false")
    monkeypatch.setenv("PUBLIC_TRANSLATE_FALLBACK_ENABLED", "false")

    config = Settings(_env_file=None)

    assert config.runtime_validation_mock_mode is True
    assert config.should_mock_runtime_validation is False


def test_ml_artifact_paths_can_be_overridden(monkeypatch, tmp_path):
    artifact_root = tmp_path / "artifacts"
    crop_path = artifact_root / "custom" / "crop.joblib"
    price_dir = artifact_root / "price-cache"

    monkeypatch.setenv("MODEL_ARTIFACTS_ROOT", str(artifact_root))
    monkeypatch.setenv("CROP_MODEL_ARTIFACT_PATH", str(crop_path))
    monkeypatch.setenv("PRICE_ARTIFACT_DIR", str(price_dir))

    config = Settings(_env_file=None)

    assert config.model_artifacts_root == Path(artifact_root)
    assert config.crop_model_artifact_resolved_path == Path(crop_path)
    assert config.price_artifact_dir_resolved_path == Path(price_dir)
