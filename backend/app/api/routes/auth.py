from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.dependencies import get_db
from app.core.security import get_password_hash
from app.core.security import verify_password
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserPublic,
    PasswordResetRequest,
    PasswordResetConfirm,
    RefreshTokenRequest,
    LogoutRequest,
)
from app.schemas.response import APIResponse
from app.services.auth_service import AuthService
from app.utils.responses import success_response

router = APIRouter()


def _to_public_user(user) -> UserPublic:
    return UserPublic(
        id=user.id,
        name=user.name,
        phone=user.phone,
        email=getattr(user, "email", None),
        role=user.role,
        location=user.location,
        farm_size=user.farm_size,
        soil_type=user.soil_type,
        water_source=user.water_source,
        primary_crops=user.primary_crops,
        language=user.language,
        assigned_regions=getattr(user, "assigned_regions", []),
        risk_view_consent=user.risk_view_consent,
        created_at=user.created_at,
    )


@router.post("/register", response_model=APIResponse[AuthResponse])
async def register(payload: RegisterRequest, db: AsyncIOMotorDatabase = Depends(get_db)) -> APIResponse[AuthResponse]:
    service = AuthService(db)
    existing = await service.get_user_by_phone(payload.phone)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone already registered")
    role = payload.role.lower()
    if role == "officer":
        role = "extension_officer"
    allowed_roles = {"farmer", "extension_officer", "admin"}
    if role not in allowed_roles:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    assigned_regions = payload.assigned_regions if role in {"extension_officer", "admin"} else []

    user = await service.create_user(
        {
            "name": payload.name,
            "phone": payload.phone,
            "email": payload.email,
            "hashed_password": get_password_hash(payload.password),
            "role": role,
            "location": payload.location,
            "farm_size": payload.farm_size,
            "soil_type": payload.soil_type,
            "water_source": payload.water_source,
            "primary_crops": payload.primary_crops,
            "language": payload.language,
            "assigned_regions": assigned_regions,
            "risk_view_consent": payload.risk_view_consent,
        }
    )

    tokens = await service.create_tokens(user)
    token_response = TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        expires_in=settings.access_token_expire_minutes * 60,
    )
    return success_response(AuthResponse(user=_to_public_user(user), token=token_response), message="Registration successful")


@router.post("/login", response_model=APIResponse[TokenResponse])
async def login(payload: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_db)) -> APIResponse[TokenResponse]:
    service = AuthService(db)
    lockout_remaining = await service.lockout_remaining_seconds(payload.phone)
    if lockout_remaining > 0:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account temporarily locked. Try again in {lockout_remaining} seconds.",
        )

    user = await service.authenticate_user(payload.phone, payload.password, mfa_code=payload.mfa_code)
    if not user:
        if settings.feature_mfa_enabled and settings.mfa_enabled:
            existing = await service.get_user_by_phone(payload.phone)
            if existing and verify_password(payload.password, existing.hashed_password) and not payload.mfa_code:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="MFA code required. A one-time code has been sent.",
                )
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials or MFA code")
        lockout_remaining = await service.lockout_remaining_seconds(payload.phone)
        if lockout_remaining > 0:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Account temporarily locked. Try again in {lockout_remaining} seconds.",
            )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    tokens = await service.create_tokens(user)
    token = TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        expires_in=settings.access_token_expire_minutes * 60,
        mfa_required=False,
    )
    return success_response(token, message="Login successful")


@router.post("/request-password-reset", response_model=APIResponse[dict])
async def request_password_reset(
    payload: PasswordResetRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[dict]:
    service = AuthService(db)
    await service.create_password_reset(payload.phone, payload.channel)
    return success_response({"sent": True}, message="If the account exists, a reset code has been sent.")


@router.post("/reset-password", response_model=APIResponse[dict])
async def reset_password(
    payload: PasswordResetConfirm,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[dict]:
    service = AuthService(db)
    ok = await service.reset_password(payload.phone, payload.otp, payload.new_password)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset code")
    return success_response({"reset": True}, message="Password updated")


@router.post("/refresh", response_model=APIResponse[TokenResponse])
async def refresh_token(
    payload: RefreshTokenRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[TokenResponse]:
    service = AuthService(db)
    tokens = await service.rotate_refresh_token(payload.refresh_token)
    if not tokens:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    token = TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        expires_in=settings.access_token_expire_minutes * 60,
    )
    return success_response(token, message="Token refreshed")


@router.post("/logout", response_model=APIResponse[dict])
async def logout_session(
    payload: LogoutRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> APIResponse[dict]:
    service = AuthService(db)
    revoked = await service.revoke_refresh_token(payload.refresh_token)
    return success_response({"revoked": revoked}, message="Logout processed")
