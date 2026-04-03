from __future__ import annotations

import re
from datetime import datetime
from typing import List, Optional

from pydantic import Field, field_validator

from app.schemas.base import StrictSchema


def _normalize_name(value: str) -> str:
    cleaned = " ".join((value or "").strip().split())
    if len(cleaned) < 2:
        raise ValueError("Name must be at least 2 characters")
    return cleaned


def _validate_phone_digits(value: str) -> str:
    digits = re.sub(r"\D", "", value or "")
    if not re.fullmatch(r"\d{10}", digits):
        raise ValueError("Phone number must be 10 digits")
    return digits


def _validate_email_address(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    if len(cleaned) > 254 or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", cleaned):
        raise ValueError("Invalid email address")
    local_part, _, domain_part = cleaned.rpartition("@")
    if not local_part or not domain_part or ".." in cleaned:
        raise ValueError("Invalid email address")
    return cleaned.lower()


def _validate_profile_image_url(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    allowed_prefixes = ("http://", "https://", "/")
    if cleaned.startswith("data:"):
        if not cleaned.lower().startswith("data:image/"):
            raise ValueError("Profile image must be an image URL")
        return cleaned
    if not cleaned.startswith(allowed_prefixes):
        raise ValueError("Profile image must use http, https, root-relative, or data:image URL")
    return cleaned


def _validate_password_strength(value: str) -> str:
    checks = [
        ("an uppercase letter", re.search(r"[A-Z]", value)),
        ("a lowercase letter", re.search(r"[a-z]", value)),
        ("a number", re.search(r"[0-9]", value)),
        ("a special character", re.search(r"[^A-Za-z0-9]", value)),
    ]
    missing = [label for label, ok in checks if not ok]
    if missing:
        raise ValueError(f"Password must include {', '.join(missing)}")
    return value


class RegisterRequest(StrictSchema):
    name: str = Field(min_length=2)
    phone: str = Field(min_length=8)
    email: Optional[str] = None
    password: str = Field(min_length=8, max_length=72)
    location: str
    farm_size: float = Field(gt=0)
    soil_type: str
    water_source: str
    primary_crops: List[str] = Field(min_length=1)
    role: str = Field(default="farmer")
    language: str = Field(default="en")
    assigned_regions: List[str] = Field(default_factory=list)
    risk_view_consent: bool = Field(
        default=False,
        description="Consent to show personally identifiable risk details in officer dashboards",
    )

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return _normalize_name(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return _validate_phone_digits(value)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        return _validate_email_address(value)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        return _validate_password_strength(value)

    @field_validator("primary_crops")
    @classmethod
    def normalize_primary_crops(cls, value: List[str]) -> List[str]:
        cleaned = [item.strip() for item in value if item and item.strip()]
        if not cleaned:
            raise ValueError("Primary crops is required")
        return cleaned

    @field_validator("assigned_regions")
    @classmethod
    def normalize_assigned_regions(cls, value: List[str]) -> List[str]:
        return [item.strip() for item in value if item and item.strip()]


class LoginRequest(StrictSchema):
    phone: str
    password: str = Field(min_length=8, max_length=72)
    mfa_code: Optional[str] = Field(default=None, min_length=4, max_length=12)

    @field_validator("phone")
    @classmethod
    def validate_login_phone(cls, value: str) -> str:
        return _validate_phone_digits(value)


class TokenResponse(StrictSchema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    mfa_required: bool = False


class UserPublic(StrictSchema):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    profile_image_url: Optional[str] = None
    role: str
    location: str
    farm_size: float
    soil_type: str
    water_source: str
    primary_crops: List[str]
    language: str
    assigned_regions: List[str] = Field(default_factory=list)
    risk_view_consent: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    preferences: Optional[dict] = None


class FarmProfile(StrictSchema):
    location: str
    farm_size: float
    soil_type: str
    water_source: str
    primary_crops: List[str]


class UserPreferencesUpdate(StrictSchema):
    notifications: Optional[bool] = None
    voice_input: Optional[bool] = None


class UserProfileUpdate(StrictSchema):
    name: Optional[str] = Field(default=None, min_length=2)
    email: Optional[str] = None
    profile_image_url: Optional[str] = None
    location: Optional[str] = None
    farm_size: Optional[float] = Field(default=None, gt=0)
    soil_type: Optional[str] = None
    water_source: Optional[str] = None
    primary_crops: Optional[List[str]] = Field(default=None, min_length=1)
    language: Optional[str] = None
    risk_view_consent: Optional[bool] = None
    preferences: Optional[UserPreferencesUpdate] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return _normalize_name(value)

    @field_validator("email")
    @classmethod
    def validate_profile_email(cls, value: Optional[str]) -> Optional[str]:
        return _validate_email_address(value)

    @field_validator("profile_image_url")
    @classmethod
    def validate_profile_image(cls, value: Optional[str]) -> Optional[str]:
        return _validate_profile_image_url(value)

    @field_validator("primary_crops")
    @classmethod
    def validate_profile_crops(cls, value: Optional[List[str]]) -> Optional[List[str]]:
        if value is None:
            return None
        cleaned = [item.strip() for item in value if item and item.strip()]
        if not cleaned:
            raise ValueError("Primary crops is required")
        return cleaned


class AuthResponse(StrictSchema):
    user: UserPublic
    token: Optional[TokenResponse] = None


class PasswordResetRequest(StrictSchema):
    phone: str
    channel: str = Field(default="sms", description="sms or email")

    @field_validator("phone")
    @classmethod
    def validate_reset_phone(cls, value: str) -> str:
        return _validate_phone_digits(value)

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, value: str) -> str:
        normalized = (value or "").strip().lower()
        if normalized not in {"sms", "email"}:
            raise ValueError("channel must be 'sms' or 'email'")
        return normalized


class PasswordResetConfirm(StrictSchema):
    phone: str
    otp: str = Field(min_length=4, max_length=12)
    new_password: str = Field(min_length=8, max_length=72)

    @field_validator("phone")
    @classmethod
    def validate_confirm_phone(cls, value: str) -> str:
        return _validate_phone_digits(value)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return _validate_password_strength(value)


class RefreshTokenRequest(StrictSchema):
    refresh_token: str = Field(min_length=16)


class LogoutRequest(StrictSchema):
    refresh_token: str = Field(min_length=16)
