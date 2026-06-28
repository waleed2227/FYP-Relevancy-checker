"""User profile update routes."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import CurrentUser
from app.database import get_db
from app.models.department import Department
from app.models.user import User
from app.schemas.admin import ProfileUpdate
from app.schemas.auth import UserResponse
from app.services import auth_service
from app.utils.exceptions import bad_request

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.patch("", response_model=UserResponse)
async def update_profile(
    data: ProfileUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User)
        .where(User.id == user.id)
        .options(*auth_service.user_response_load_options())
    )
    u = result.scalar_one()

    if data.full_name:
        u.full_name = data.full_name
    if data.phone is not None:
        u.phone = data.phone
    if "photo_url" in data.model_fields_set:
        u.photo_url = data.photo_url

    if u.student:
        if data.major:
            u.student.major = data.major
        if data.year:
            u.student.year = data.year
        if data.department:
            dept_result = await db.execute(
                select(Department).where(Department.name.ilike(data.department))
            )
            dept = dept_result.scalar_one_or_none()
            if not dept:
                dept = Department(name=data.department)
                db.add(dept)
                await db.flush()
            u.student.department_id = dept.id
            u.student.major = data.department

    if u.professor and data.department:
        dept_result = await db.execute(
            select(Department).where(Department.name.ilike(data.department))
        )
        dept = dept_result.scalar_one_or_none()
        if not dept:
            dept = Department(name=data.department)
            db.add(dept)
            await db.flush()
        u.professor.department_id = dept.id

    refreshed = await db.execute(
        select(User)
        .where(User.id == u.id)
        .options(*auth_service.user_response_load_options())
    )
    return auth_service.user_to_response(refreshed.scalar_one())
