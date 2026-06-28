"""FastAPI auth dependencies for protected routes."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import verify_token
from app.database import get_db
from app.models.user import User, UserRole
from app.services.auth_service import user_response_load_options

security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = verify_token(credentials.credentials, "access")
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = int(payload["sub"])
    result = await db.execute(
        select(User)
        .where(User.id == user_id, User.is_active.is_(True))
        .options(*user_response_load_options())
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_roles(*roles: UserRole):
    async def role_checker(user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return role_checker


CurrentUser = Annotated[User, Depends(get_current_user)]
StudentUser = Annotated[User, Depends(require_roles(UserRole.STUDENT))]
ProfessorUser = Annotated[User, Depends(require_roles(UserRole.PROFESSOR))]
AdminUser = Annotated[User, Depends(require_roles(UserRole.ADMIN))]
