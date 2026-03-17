from __future__ import annotations

from typing import List

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from app.core.database import Database

from app.core.security import decode_token
from app.core.config import settings
from app.models.user import UserInDB
from app.services.auth_service import AuthService


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_db(request: Request) -> Database:
    db = request.app.state.db
    if db is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Database unavailable")
    return db


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Database = Depends(get_db),
) -> UserInDB:
    auth_service = AuthService(db)
    try:
        payload = decode_token(token, token_type="access")
        if payload.get("type") != "access":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    user = await auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_roles(allowed_roles: List[str]):
    async def checker(user: UserInDB = Depends(get_current_user)) -> UserInDB:
        if user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return checker


async def require_public_api_key(request: Request) -> str:
    api_key = request.headers.get("x-api-key") or request.query_params.get("api_key")
    allowed = settings.public_api_key_list
    if not allowed:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Public API keys not configured")
    if not api_key or api_key not in allowed:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
    return api_key
