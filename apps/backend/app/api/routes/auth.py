from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import settings
from app.core.database import Database
from app.core.dependencies import get_current_user, get_db
from app.core.security import get_password_hash, verify_password
from app.models.user import UserInDB
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    LogoutRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserProfileUpdate,
    UserPublic,
)
from app.schemas.response import APIResponse
from app.services.auth_service import AuthService
from app.utils.responses import success_response
from app.utils.user import to_public_user

router = APIRouter()
PUBLIC_SELF_REGISTER_ROLES = {"farmer", "fpo", "agri_business"}
PRIVILEGED_ASSIGNABLE_ROLES = {"extension_officer", "government_agency", "admin"}
SUPPORTED_REGISTRATION_ROLES = PUBLIC_SELF_REGISTER_ROLES | PRIVILEGED_ASSIGNABLE_ROLES


async def _rotate_refresh_token(payload: RefreshTokenRequest, db: Database) -> TokenResponse:
    service = AuthService(db)
    tokens = await service.rotate_refresh_token(payload.refresh_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.post("/register", response_model=APIResponse[AuthResponse])
async def register(
    payload: RegisterRequest, db: Database = Depends(get_db)
) -> APIResponse[AuthResponse]:
    service = AuthService(db)
    existing = await service.get_user_by_phone(payload.phone)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Phone already registered"
        )
    role = payload.role.lower()
    if role == "officer":
        role = "extension_officer"
    if role not in SUPPORTED_REGISTRATION_ROLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    if role in PRIVILEGED_ASSIGNABLE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Privileged roles cannot be self-registered",
        )
    assigned_regions = []

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
    return success_response(
        AuthResponse(user=to_public_user(user), token=token_response),
        message="Registration successful",
    )


@router.post("/login", response_model=APIResponse[TokenResponse])
async def login(
    payload: LoginRequest, db: Database = Depends(get_db)
) -> APIResponse[TokenResponse]:
    service = AuthService(db)
    lockout_remaining = await service.lockout_remaining_seconds(payload.phone)
    if lockout_remaining > 0:
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account temporarily locked. Try again in {lockout_remaining} seconds.",
        )

    user = await service.authenticate_user(
        payload.phone, payload.password, mfa_code=payload.mfa_code
    )
    if not user:
        if settings.feature_mfa_enabled and settings.mfa_enabled:
            existing = await service.get_user_by_phone(payload.phone)
            if (
                existing
                and verify_password(payload.password, existing.hashed_password)
                and not payload.mfa_code
            ):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="MFA code required. A one-time code has been sent.",
                )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials or MFA code"
            )
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
    db: Database = Depends(get_db),
) -> APIResponse[dict]:
    service = AuthService(db)
    await service.create_password_reset(payload.phone, payload.channel)
    return success_response(
        {"sent": True}, message="If the account exists, a reset code has been sent."
    )


@router.post("/reset-password", response_model=APIResponse[dict])
async def reset_password(
    payload: PasswordResetConfirm,
    db: Database = Depends(get_db),
) -> APIResponse[dict]:
    service = AuthService(db)
    ok = await service.reset_password(payload.phone, payload.otp, payload.new_password)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset code"
        )
    return success_response({"reset": True}, message="Password updated")


@router.post("/refresh", response_model=APIResponse[TokenResponse])
async def refresh_token(
    payload: RefreshTokenRequest,
    db: Database = Depends(get_db),
) -> APIResponse[TokenResponse]:
    token = await _rotate_refresh_token(payload, db)
    return success_response(token, message="Token refreshed")


@router.post("/refresh-token", response_model=APIResponse[TokenResponse])
async def refresh_token_alias(
    payload: RefreshTokenRequest,
    db: Database = Depends(get_db),
) -> APIResponse[TokenResponse]:
    token = await _rotate_refresh_token(payload, db)
    return success_response(token, message="Token refreshed")


@router.post("/logout", response_model=APIResponse[dict])
async def logout_session(
    payload: LogoutRequest,
    db: Database = Depends(get_db),
) -> APIResponse[dict]:
    service = AuthService(db)
    revoked = await service.revoke_refresh_token(payload.refresh_token)
    return success_response({"revoked": revoked}, message="Logout processed")


@router.get("/me", response_model=APIResponse[UserPublic])
async def get_me(user: UserInDB = Depends(get_current_user)) -> APIResponse[UserPublic]:
    return success_response(to_public_user(user), message="Current user")


@router.patch("/me", response_model=APIResponse[UserPublic])
async def update_me(
    payload: UserProfileUpdate,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(get_current_user),
) -> APIResponse[UserPublic]:
    service = AuthService(db)
    updated = await service.update_profile(user, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return success_response(to_public_user(updated), message="Profile updated")


@router.get("/roles", response_model=APIResponse[dict])
async def list_roles() -> APIResponse[dict]:
    return success_response(
        {
            "roles": sorted(PUBLIC_SELF_REGISTER_ROLES),
            "privileged_roles": sorted(PRIVILEGED_ASSIGNABLE_ROLES),
        },
        message="Allowed roles",
    )
