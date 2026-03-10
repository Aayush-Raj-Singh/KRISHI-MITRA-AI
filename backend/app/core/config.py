from __future__ import annotations

import json
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_ROOT / ".env")
load_dotenv()


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

    jwt_secret_key: str = Field("change-me", alias="JWT_SECRET_KEY")
    jwt_refresh_secret_key: str = Field("change-me-refresh", alias="JWT_REFRESH_SECRET_KEY")
    jwt_algorithm: str = Field("HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(60 * 24, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(30, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    mongodb_uri: str = Field("mongodb://localhost:27017", alias="MONGODB_URI")
    mongodb_db: str = Field("krishimitra", alias="MONGODB_DB")
    mongodb_server_selection_timeout_ms: int = Field(5000, alias="MONGODB_SERVER_SELECTION_TIMEOUT_MS")

    redis_url: Optional[str] = Field(None, alias="REDIS_URL")

    aws_region: str = Field("us-east-1", alias="AWS_REGION")
    bedrock_model_id: str = Field("anthropic.claude-3-sonnet-20240229-v1:0", alias="BEDROCK_MODEL_ID")
    bedrock_fallback_model_id: str = Field("amazon.titan-text-express-v1", alias="BEDROCK_FALLBACK_MODEL_ID")
    bedrock_max_tokens: int = Field(800, alias="BEDROCK_MAX_TOKENS")
    bedrock_temperature: float = Field(0.7, alias="BEDROCK_TEMPERATURE")

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
    rag_backend: str = Field("opensearch_stub", alias="RAG_BACKEND")
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

    log_level: str = Field("INFO", alias="LOG_LEVEL")

    cors_origins: str = Field("http://localhost:5173", alias="CORS_ORIGINS")
    cors_allow_methods: str = Field(
        "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        alias="CORS_ALLOW_METHODS",
    )
    cors_allow_headers: str = Field(
        "Authorization,Content-Type,Accept,Origin",
        alias="CORS_ALLOW_HEADERS",
    )

    rate_limit_enabled: bool = Field(True, alias="RATE_LIMIT_ENABLED")
    rate_limit_global_per_minute: int = Field(120, alias="RATE_LIMIT_GLOBAL_PER_MINUTE")
    rate_limit_auth_per_minute: int = Field(12, alias="RATE_LIMIT_AUTH_PER_MINUTE")
    rate_limit_advisory_per_minute: int = Field(30, alias="RATE_LIMIT_ADVISORY_PER_MINUTE")
    rate_limit_ws_per_minute: int = Field(30, alias="RATE_LIMIT_WS_PER_MINUTE")
    rate_limit_storage_prefix: str = Field("krishimitra:ratelimit", alias="RATE_LIMIT_STORAGE_PREFIX")

    @property
    def is_production(self) -> bool:
        return self.environment.lower() in {"production", "staging"}

    def _parse_list(self, raw_value: str) -> List[str]:
        value = (raw_value or "").strip()
        if not value:
            return []
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
        return self._parse_list(self.cors_origins) or ["http://localhost:5173"]

    @property
    def cors_method_list(self) -> List[str]:
        return self._parse_list(self.cors_allow_methods) or ["GET", "POST", "OPTIONS"]

    @property
    def cors_header_list(self) -> List[str]:
        return self._parse_list(self.cors_allow_headers) or ["Authorization", "Content-Type", "Accept"]

    @field_validator(
        "mongodb_server_selection_timeout_ms",
        "rate_limit_global_per_minute",
        "rate_limit_auth_per_minute",
        "rate_limit_advisory_per_minute",
        "rate_limit_ws_per_minute",
        "mfa_otp_expire_minutes",
        "auth_lockout_threshold",
        "auth_lockout_minutes",
        "negative_outcome_retrain_threshold",
        "rag_top_k",
        "smtp_port",
    )
    @classmethod
    def validate_positive_numbers(cls, value: int) -> int:
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
        if any("localhost" in origin for origin in self.cors_origin_list):
            raise ValueError("CORS_ORIGINS must not include localhost in secure mode")
        return self


settings = Settings()
