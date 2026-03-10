from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from uuid import uuid4

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _create_token(
    subject: str,
    role: str,
    expires_delta: timedelta,
    secret_key: str,
    token_type: str,
    jti: str | None = None,
) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    issued_at = datetime.now(timezone.utc)
    to_encode: Dict[str, Any] = {
        "sub": subject,
        "role": role,
        "type": token_type,
        "jti": jti or uuid4().hex,
        "iat": issued_at,
        "exp": expire,
    }
    return jwt.encode(to_encode, secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str, role: str, jti: str | None = None) -> str:
    return _create_token(
        subject,
        role,
        timedelta(minutes=settings.access_token_expire_minutes),
        settings.jwt_secret_key,
        "access",
        jti=jti,
    )


def create_refresh_token(subject: str, role: str, jti: str | None = None) -> str:
    return _create_token(
        subject,
        role,
        timedelta(days=settings.refresh_token_expire_days),
        settings.jwt_refresh_secret_key,
        "refresh",
        jti=jti,
    )


def decode_token(token: str, token_type: str = "access") -> Dict[str, Any]:
    secret = settings.jwt_secret_key if token_type == "access" else settings.jwt_refresh_secret_key
    payload = jwt.decode(token, secret, algorithms=[settings.jwt_algorithm])
    if payload.get("type") != token_type:
        raise JWTError("Invalid token type")
    if token_type == "refresh" and not payload.get("jti"):
        raise JWTError("Refresh token missing jti")
    return payload
