from __future__ import annotations

import json
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from pydantic import AliasChoices, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.core.secrets import load_secrets_into_env

BACKEND_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_ROOT / ".env")
load_dotenv()
load_secrets_into_env()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    project_name: str = "KrishiMitra-AI"
    api_v1_prefix: str = "/api/v1"
    environment: str = Field("development", alias="ENVIRONMENT")
    enforce_secure_secrets: bool = Field(False, alias="ENFORCE_SECURE_SECRETS")
    allow_inmemory_db_fallback: bool = Field(False, alias="ALLOW_INMEMORY_DB_FALLBACK")
    db_connect_max_attempts: int = Field(3, alias="DB_CONNECT_MAX_ATTEMPTS")
    db_connect_retry_delay_seconds: float = Field(1.5, alias="DB_CONNECT_RETRY_DELAY_SECONDS")

    jwt_secret_key: str = Field("change-me", alias="JWT_SECRET_KEY")
    jwt_refresh_secret_key: str = Field("change-me-refresh", alias="JWT_REFRESH_SECRET_KEY")
    jwt_algorithm: str = Field("HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(60 * 24, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(30, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    postgres_dsn: str = Field(
        "postgresql://postgres:password@localhost:5432/krishi_db",
        alias="DATABASE_URL",
        validation_alias=AliasChoices("DATABASE_URL", "POSTGRES_DSN"),
    )
    postgres_schema: str = Field("public", alias="POSTGRES_SCHEMA")
    postgres_min_pool_size: int = Field(1, alias="POSTGRES_MIN_POOL_SIZE")
    postgres_max_pool_size: int = Field(5, alias="POSTGRES_MAX_POOL_SIZE")

    redis_url: Optional[str] = Field(None, alias="REDIS_URL")

    aws_region: str = Field("us-east-1", alias="AWS_REGION")
    aws_secrets_manager_secret_id: Optional[str] = Field(None, alias="AWS_SECRETS_MANAGER_SECRET_ID")
    bedrock_model_id: str = Field("anthropic.claude-3-sonnet-20240229-v1:0", alias="BEDROCK_MODEL_ID")
    bedrock_fallback_model_id: str = Field("anthropic.claude-3-haiku-20240307-v1:0", alias="BEDROCK_FALLBACK_MODEL_ID")
    bedrock_max_tokens: int = Field(800, alias="BEDROCK_MAX_TOKENS")
    bedrock_temperature: float = Field(0.7, alias="BEDROCK_TEMPERATURE")
    aws_translate_enabled: bool = Field(True, alias="AWS_TRANSLATE_ENABLED")
    advisory_timeout_seconds: float = Field(4.8, alias="ADVISORY_TIMEOUT_SECONDS")
    advisory_sla_ms: int = Field(5000, alias="ADVISORY_SLA_MS")
    public_translate_fallback_enabled: bool = Field(True, alias="PUBLIC_TRANSLATE_FALLBACK_ENABLED")
    sagemaker_runtime_enabled: bool = Field(False, alias="SAGEMAKER_RUNTIME_ENABLED")
    sagemaker_crop_endpoint: Optional[str] = Field(None, alias="SAGEMAKER_CROP_ENDPOINT")
    sagemaker_price_endpoint: Optional[str] = Field(None, alias="SAGEMAKER_PRICE_ENDPOINT")

    password_reset_expire_minutes: int = Field(15, alias="PASSWORD_RESET_EXPIRE_MINUTES")
    mfa_enabled: bool = Field(False, alias="MFA_ENABLED")
    mfa_optional: bool = Field(True, alias="MFA_OPTIONAL")
    mfa_otp_expire_minutes: int = Field(5, alias="MFA_OTP_EXPIRE_MINUTES")
    auth_lockout_threshold: int = Field(5, alias="AUTH_LOCKOUT_THRESHOLD")
    auth_lockout_minutes: int = Field(15, alias="AUTH_LOCKOUT_MINUTES")

    otp_provider: str = Field("console", alias="OTP_PROVIDER")
    twilio_mock_mode: bool = Field(True, alias="TWILIO_MOCK_MODE")
    twilio_account_sid: Optional[str] = Field(None, alias="TWILIO_ACCOUNT_SID")
    twilio_auth_token: Optional[str] = Field(None, alias="TWILIO_AUTH_TOKEN")
    twilio_from_number: Optional[str] = Field(None, alias="TWILIO_FROM_NUMBER")
    twilio_status_callback_url: Optional[str] = Field(None, alias="TWILIO_STATUS_CALLBACK_URL")
    smtp_host: Optional[str] = Field(None, alias="SMTP_HOST")
    smtp_port: int = Field(587, alias="SMTP_PORT")
    smtp_username: Optional[str] = Field(None, alias="SMTP_USERNAME")
    smtp_password: Optional[str] = Field(None, alias="SMTP_PASSWORD")
    smtp_from_email: Optional[str] = Field(None, alias="SMTP_FROM_EMAIL")
    smtp_use_tls: bool = Field(True, alias="SMTP_USE_TLS")

    feature_rag_enabled: bool = Field(True, alias="FEATURE_RAG_ENABLED")
    feature_mfa_enabled: bool = Field(False, alias="FEATURE_MFA_ENABLED")
    feature_background_jobs_enabled: bool = Field(True, alias="FEATURE_BACKGROUND_JOBS_ENABLED")
    feature_realtime_enabled: bool = Field(True, alias="FEATURE_REALTIME_ENABLED")
    background_task_backend: str = Field("local", alias="BACKGROUND_TASK_BACKEND")
    rag_backend: str = Field("local_tfidf", alias="RAG_BACKEND")
    rag_top_k: int = Field(3, alias="RAG_TOP_K")

    scheduler_enabled: bool = Field(True, alias="SCHEDULER_ENABLED")
    scheduler_timezone: str = Field("UTC", alias="SCHEDULER_TIMEZONE")
    scheduler_daily_hour: int = Field(1, alias="SCHEDULER_DAILY_HOUR")
    scheduler_weekly_day: str = Field("sun", alias="SCHEDULER_WEEKLY_DAY")
    scheduler_weekly_hour: int = Field(2, alias="SCHEDULER_WEEKLY_HOUR")
    scheduler_quarterly_hour: int = Field(1, alias="SCHEDULER_QUARTERLY_HOUR")

    negative_outcome_retrain_threshold: int = Field(10, alias="NEGATIVE_OUTCOME_RETRAIN_THRESHOLD")

    weather_api_url: Optional[str] = Field(None, alias="WEATHER_API_URL")
    weather_api_key: Optional[str] = Field(None, alias="WEATHER_API_KEY")
    mandi_api_url: Optional[str] = Field(None, alias="MANDI_API_URL")
    mandi_api_key: Optional[str] = Field(None, alias="MANDI_API_KEY")
    external_http_timeout_seconds: float = Field(5.0, alias="EXTERNAL_HTTP_TIMEOUT_SECONDS")

    log_level: str = Field("INFO", alias="LOG_LEVEL")

    cors_origins: str = Field("*", alias="CORS_ORIGINS")
    cors_allow_methods: str = Field("*", alias="CORS_ALLOW_METHODS")
    cors_allow_headers: str = Field("*", alias="CORS_ALLOW_HEADERS")

    rate_limit_enabled: bool = Field(True, alias="RATE_LIMIT_ENABLED")
    rate_limit_global_per_minute: int = Field(120, alias="RATE_LIMIT_GLOBAL_PER_MINUTE")
    rate_limit_auth_per_minute: int = Field(12, alias="RATE_LIMIT_AUTH_PER_MINUTE")
    rate_limit_advisory_per_minute: int = Field(30, alias="RATE_LIMIT_ADVISORY_PER_MINUTE")
    rate_limit_upload_per_minute: int = Field(12, alias="RATE_LIMIT_UPLOAD_PER_MINUTE")
    rate_limit_export_per_minute: int = Field(10, alias="RATE_LIMIT_EXPORT_PER_MINUTE")
    rate_limit_ws_per_minute: int = Field(30, alias="RATE_LIMIT_WS_PER_MINUTE")
    rate_limit_public_per_minute: int = Field(60, alias="RATE_LIMIT_PUBLIC_PER_MINUTE")
    rate_limit_storage_prefix: str = Field("krishimitra:ratelimit", alias="RATE_LIMIT_STORAGE_PREFIX")
    public_api_keys: str = Field("", alias="PUBLIC_API_KEYS")
    external_link_allowlist: str = Field("", alias="EXTERNAL_LINK_ALLOWLIST")

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "staging"}

    @property
    def allow_runtime_fallbacks(self) -> bool:
        return not self.is_production

    def _parse_list(self, raw_value: str) -> List[str]:
        value = (raw_value or "").strip()
        if not value:
            return []
        if value == "*":
            return ["*"]
        if value.startswith("["):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return [str(item).strip() for item in parsed if str(item).strip()]
            except json.JSONDecodeError:
                return []
        return [item.strip() for item in value.split(",") if item.strip()]

    @property
    def cors_origin_list(self) -> List[str]:
        origins = self._parse_list(self.cors_origins)
        if not self.is_production and (not origins or origins == ["*"]):
            return ["*"]
        return origins or ["http://localhost:5173"]

    @property
    def cors_method_list(self) -> List[str]:
        methods = self._parse_list(self.cors_allow_methods)
        if not self.is_production and (not methods or methods == ["*"]):
            return ["*"]
        return methods or ["GET", "POST", "OPTIONS"]

    @property
    def cors_header_list(self) -> List[str]:
        headers = self._parse_list(self.cors_allow_headers)
        if not self.is_production and (not headers or headers == ["*"]):
            return ["*"]
        return headers or ["Authorization", "Content-Type", "Accept"]

    @property
    def public_api_key_list(self) -> List[str]:
        return self._parse_list(self.public_api_keys)

    @property
    def external_link_allowlist_domains(self) -> List[str]:
        return self._parse_list(self.external_link_allowlist)

    @field_validator(
        "rate_limit_global_per_minute",
        "rate_limit_auth_per_minute",
        "rate_limit_advisory_per_minute",
        "rate_limit_upload_per_minute",
        "rate_limit_export_per_minute",
        "rate_limit_ws_per_minute",
        "rate_limit_public_per_minute",
        "mfa_otp_expire_minutes",
        "auth_lockout_threshold",
        "auth_lockout_minutes",
        "negative_outcome_retrain_threshold",
        "rag_top_k",
        "postgres_min_pool_size",
        "postgres_max_pool_size",
        "smtp_port",
        "advisory_sla_ms",
        "db_connect_max_attempts",
    )
    @classmethod
    def validate_positive_numbers(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("Value must be greater than zero")
        return value

    @field_validator("external_http_timeout_seconds", "advisory_timeout_seconds", "db_connect_retry_delay_seconds")
    @classmethod
    def validate_positive_seconds(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("Value must be greater than zero")
        return value

    @field_validator("scheduler_daily_hour", "scheduler_weekly_hour", "scheduler_quarterly_hour")
    @classmethod
    def validate_hours(cls, value: int) -> int:
        if value < 0 or value > 23:
            raise ValueError("Hour must be between 0 and 23")
        return value

    @field_validator("otp_provider", "background_task_backend", "rag_backend")
    @classmethod
    def validate_enums(cls, value: str) -> str:
        return (value or "").strip().lower()

    @model_validator(mode="after")
    def validate_security_settings(self):
        if self.postgres_min_pool_size > self.postgres_max_pool_size:
            raise ValueError("POSTGRES_MIN_POOL_SIZE must be <= POSTGRES_MAX_POOL_SIZE")
        should_enforce = self.enforce_secure_secrets or self.is_production
        if not should_enforce:
            return self

        insecure_values = {"change-me", "change-me-refresh"}
        if self.jwt_secret_key in insecure_values or len(self.jwt_secret_key) < 32:
            raise ValueError("JWT_SECRET_KEY must be set to a strong value (>=32 chars) for secure mode")
        if self.jwt_refresh_secret_key in insecure_values or len(self.jwt_refresh_secret_key) < 32:
            raise ValueError("JWT_REFRESH_SECRET_KEY must be set to a strong value (>=32 chars) for secure mode")
        if self.jwt_secret_key == self.jwt_refresh_secret_key:
            raise ValueError("JWT access and refresh secrets must be different")
        if "*" in self.cors_origin_list:
            raise ValueError("CORS_ORIGINS must not include wildcard origins in secure mode")
        if any("localhost" in origin or "127.0.0.1" in origin for origin in self.cors_origin_list):
            raise ValueError("CORS_ORIGINS must not include localhost in secure mode")
        if self.allow_inmemory_db_fallback:
            raise ValueError("ALLOW_INMEMORY_DB_FALLBACK must be false in secure mode")
        if self.otp_provider == "console":
            raise ValueError("OTP_PROVIDER=console is not allowed in secure mode")
        if self.otp_provider == "twilio" and self.twilio_mock_mode:
            raise ValueError("TWILIO_MOCK_MODE must be false in secure mode")
        if "stub" in self.rag_backend:
            raise ValueError("RAG_BACKEND must not use stub backends in secure mode")
        if self.sagemaker_runtime_enabled and (not self.sagemaker_crop_endpoint or not self.sagemaker_price_endpoint):
            raise ValueError("SageMaker runtime mode requires both crop and price endpoint names")
        return self


settings = Settings()
