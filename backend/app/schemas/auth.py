from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class RegisterRequest(BaseModel):
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


class LoginRequest(BaseModel):
    phone: str
    password: str = Field(min_length=8, max_length=72)
    mfa_code: Optional[str] = Field(default=None, min_length=4, max_length=12)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    mfa_required: bool = False


class UserPublic(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
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


class AuthResponse(BaseModel):
    user: UserPublic
    token: Optional[TokenResponse] = None


class PasswordResetRequest(BaseModel):
    phone: str
    channel: str = Field(default="sms", description="sms or email")

    @field_validator("channel")
    @classmethod
    def validate_channel(cls, value: str) -> str:
        normalized = (value or "").strip().lower()
        if normalized not in {"sms", "email"}:
            raise ValueError("channel must be 'sms' or 'email'")
        return normalized


class PasswordResetConfirm(BaseModel):
    phone: str
    otp: str = Field(min_length=4, max_length=12)
    new_password: str = Field(min_length=8, max_length=72)


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(min_length=16)


class LogoutRequest(BaseModel):
    refresh_token: str = Field(min_length=16)
