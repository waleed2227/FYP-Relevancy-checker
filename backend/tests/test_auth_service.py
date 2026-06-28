"""Auth service tests — async-safe user_to_response serialization."""

from __future__ import annotations

import asyncio

import pytest
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.user import User
from app.services.auth_service import user_response_load_options, user_to_response


async def _run_user_to_response_checks() -> None:
    async with AsyncSessionLocal() as db:
        bare = await db.execute(select(User).limit(1))
        user = bare.scalar_one_or_none()
        if not user:
            return

        response = user_to_response(user)
        assert response.id == user.id
        assert response.email == user.email

        loaded = await db.execute(
            select(User)
            .where(User.role == "student")
            .options(*user_response_load_options())
            .limit(1)
        )
        student_user = loaded.scalar_one_or_none()
        if student_user:
            student_response = user_to_response(student_user)
            assert student_response.student_id is not None


def test_user_to_response_is_async_safe() -> None:
    asyncio.run(_run_user_to_response_checks())
