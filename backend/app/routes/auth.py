"""Authentication API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import CurrentUser
from app.auth.security import create_access_token, create_refresh_token, verify_token
from app.database import get_db
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from app.services import auth_service
from app.utils.exceptions import bad_request

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    summary="Register student or professor",
    description=(
        "Student: numeric ID + email `{id}@student.uol.edu.pk`. "
        "Professor: `{name}@uol.edu.pk` + department. "
        "Phone: Pakistani format (+923001234567 or 03001234567)."
    ),
)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Create account, hash password, return JWT tokens."""
    user = await auth_service.register_user(db, data)
    access = create_access_token(user.id, {"role": user.role.value})
    refresh = create_refresh_token(user.id)
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/login", response_model=TokenResponse, summary="Login with email and password")
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user, access, refresh = await auth_service.authenticate_user(
        db, data.email, data.password, data.role
    )
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request a password-reset email",
)
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Always returns the same message regardless of whether the email exists."""
    await auth_service.request_password_reset(db, data.email)
    return MessageResponse(
        message="If an account exists for that email, a password reset link has been sent."
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Set a new password using an emailed reset token",
)
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    await auth_service.reset_password(db, data.token, data.new_password)
    return MessageResponse(
        message="Your password has been updated. You can now sign in with your new password."
    )


@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token")
async def refresh_token(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = verify_token(data.refresh_token, "refresh")
    if not payload:
        raise bad_request("Invalid refresh token")
    user_id = int(payload["sub"])
    from sqlalchemy import select
    from app.models.user import User

    result = await db.execute(select(User).where(User.id == user_id, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if not user:
        raise bad_request("User not found")
    access = create_access_token(user.id, {"role": user.role.value})
    new_refresh = create_refresh_token(user.id)
    return TokenResponse(access_token=access, refresh_token=new_refresh)


@router.post("/logout", summary="Logout (client should discard tokens)")
async def logout(_: CurrentUser):
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse, summary="Get current user profile")
async def me(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from app.models.user import User

    result = await db.execute(
        select(User)
        .where(User.id == user.id)
        .options(*auth_service.user_response_load_options())
    )
    full_user = result.scalar_one()
    return auth_service.user_to_response(full_user)
