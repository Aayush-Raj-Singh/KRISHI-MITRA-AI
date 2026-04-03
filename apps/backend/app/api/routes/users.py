from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import Database
from app.core.dependencies import get_current_user, get_db
from app.models.user import UserInDB
from app.schemas.auth import FarmProfile, UserProfileUpdate, UserPublic
from app.schemas.response import APIResponse
from app.services.auth_service import AuthService
from app.utils.responses import success_response
from app.utils.user import to_farm_profile, to_public_user

router = APIRouter()


@router.get("/profile", response_model=APIResponse[UserPublic])
async def get_profile(user: UserInDB = Depends(get_current_user)) -> APIResponse[UserPublic]:
    return success_response(to_public_user(user), message="User profile")


@router.put("/profile", response_model=APIResponse[UserPublic])
async def update_profile(
    payload: UserProfileUpdate,
    db: Database = Depends(get_db),
    user: UserInDB = Depends(get_current_user),
) -> APIResponse[UserPublic]:
    service = AuthService(db)
    updated = await service.update_profile(user, payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return success_response(to_public_user(updated), message="User profile updated")


@router.get("/farm-profile", response_model=APIResponse[FarmProfile])
async def get_farm_profile(user: UserInDB = Depends(get_current_user)) -> APIResponse[FarmProfile]:
    return success_response(to_farm_profile(user), message="Farm profile")
