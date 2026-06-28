"""Authentication and user registration business logic."""

from sqlalchemy import inspect, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.base import NO_VALUE

from app.auth.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.models.department import Department
from app.models.professor import Professor
from app.models.student import Student
from app.models.user import User, UserRole
from app.schemas.auth import RegisterRequest, UserResponse
from app.utils.exceptions import bad_request, conflict, unauthorized


def user_response_load_options():
    """Eager-load relationships required by user_to_response() in async sessions."""
    return (
        selectinload(User.student).selectinload(Student.department),
        selectinload(User.professor).selectinload(Professor.department),
        selectinload(User.admin),
    )


def _loaded_relationship(parent: User | Student | Professor, attr: str):
    """Return a relationship value only if already loaded (never triggers lazy IO)."""
    value = inspect(parent).attrs[attr].loaded_value
    if value is NO_VALUE:
        return None
    return value


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(
        select(User)
        .where(User.email == email.lower().strip())
        .options(*user_response_load_options())
    )
    return result.scalar_one_or_none()


async def register_user(db: AsyncSession, data: RegisterRequest) -> User:
    if await get_user_by_email(db, data.email):
        raise conflict("Email already registered")

    role = UserRole.STUDENT if data.role == "student" else UserRole.PROFESSOR

    if role == UserRole.STUDENT and not data.student_id:
        raise bad_request("Student ID is required")
    if role == UserRole.PROFESSOR and not data.department:
        raise bad_request("Department is required for professors")

    user = User(
        email=data.email.lower().strip(),
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=role,
        phone=data.phone_number,
    )
    db.add(user)
    await db.flush()

    dept = None
    if data.department:
        dept_result = await db.execute(
            select(Department).where(Department.name.ilike(data.department.strip()))
        )
        dept = dept_result.scalar_one_or_none()
        if not dept:
            dept = Department(name=data.department.strip())
            db.add(dept)
            await db.flush()

    if role == UserRole.STUDENT:
        existing_sid = await db.execute(
            select(Student).where(Student.student_id == data.student_id)
        )
        if existing_sid.scalar_one_or_none():
            raise conflict("Student ID already exists")
        db.add(
            Student(
                user_id=user.id,
                student_id=data.student_id,
                department_id=dept.id if dept else None,
                major=dept.name if dept else None,
                year="4th Year",
            )
        )
    else:
        db.add(
            Professor(
                user_id=user.id,
                department_id=dept.id if dept else None,
            )
        )

    result = await db.execute(
        select(User)
        .where(User.id == user.id)
        .options(*user_response_load_options())
    )
    return result.scalar_one()


async def authenticate_user(
    db: AsyncSession, email: str, password: str, expected_role: str | None = None
) -> tuple[User, str, str]:
    result = await db.execute(
        select(User)
        .where(User.email == email.lower().strip(), User.is_active.is_(True))
        .options(*user_response_load_options())
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.hashed_password):
        raise unauthorized("Invalid email or password")

    if expected_role and user.role.value != expected_role:
        raise unauthorized(f"Account is not registered as {expected_role}")

    access = create_access_token(user.id, {"role": user.role.value})
    refresh = create_refresh_token(user.id)
    return user, access, refresh


def user_to_response(user: User) -> UserResponse:
    def _department_name_if_loaded(profile: Student | Professor | None) -> str | None:
        if not profile or not profile.department_id:
            return None
        department = _loaded_relationship(profile, "department")
        return department.name if department else None

    student = _loaded_relationship(user, "student")
    professor = _loaded_relationship(user, "professor")

    dept_name = None
    student_id = None
    major = None
    year = None
    employee_id = None

    if student:
        student_id = student.student_id
        major = student.major
        year = student.year
        dept_name = _department_name_if_loaded(student) or major
    if professor:
        dept_name = _department_name_if_loaded(professor) or dept_name
        employee_id = professor.employee_id

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.value,
        phone=user.phone,
        photo_url=user.photo_url,
        student_id=student_id,
        department=dept_name,
        major=major,
        year=year,
        employee_id=employee_id,
    )
