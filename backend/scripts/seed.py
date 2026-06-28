"""
Seed database with UOL demo accounts and sample data.
Run from backend folder: python -m scripts.seed
(Requires DATABASE_URL pointing to fyp_relevancy_system – see .env)
Use --force to recreate UOL test users (keeps other data).
"""

import argparse
import asyncio
from datetime import date

import importlib.util
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "bootstrap", Path(__file__).resolve().parent / "_bootstrap.py"
)
_bootstrap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bootstrap)

from sqlalchemy import delete, func, select

from app.auth.security import hash_password
from app.database import AsyncSessionLocal, Base, engine
from app.models.admin import Admin
from app.models.department import Department
from app.models.professor import Professor
from app.models.project import ProjectIdea, ProjectStatus
from app.models.student import Student
from app.models.user import User, UserRole

DEPARTMENTS = [
    "Computer Science",
    "Data Science",
    "Software Engineering",
    "Cybersecurity",
]

# Official UOL test accounts (requirement)
UOL_ACCOUNTS = [
    {
        "email": "70140912@student.uol.edu.pk",
        "password": "Student123",
        "full_name": "UOL Test Student",
        "role": UserRole.STUDENT,
        "student_id": "70140912",
        "phone": "+923001234567",
        "department": "Computer Science",
    },
    {
        "email": "professor@uol.edu.pk",
        "password": "Professor123",
        "full_name": "UOL Test Professor",
        "role": UserRole.PROFESSOR,
        "phone": "+923009876543",
        "department": "Computer Science",
    },
    {
        "email": "admin@uol.edu.pk",
        "password": "Admin123",
        "full_name": "UOL System Admin",
        "role": UserRole.ADMIN,
        "phone": "+923001112233",
        "department": None,
    },
]


async def ensure_departments(db) -> dict[str, Department]:
    depts: dict[str, Department] = {}
    for name in DEPARTMENTS:
        result = await db.execute(select(Department).where(Department.name == name))
        d = result.scalar_one_or_none()
        if not d:
            d = Department(name=name, code=name[:3].upper())
            db.add(d)
            await db.flush()
        depts[name] = d
    return depts


async def upsert_uol_user(db, account: dict, depts: dict[str, Department]) -> None:
    result = await db.execute(select(User).where(User.email == account["email"]))
    user = result.scalar_one_or_none()

    if user:
        user.hashed_password = hash_password(account["password"])
        user.full_name = account["full_name"]
        user.phone = account.get("phone")
        user.is_active = True
    else:
        user = User(
            email=account["email"],
            hashed_password=hash_password(account["password"]),
            full_name=account["full_name"],
            role=account["role"],
            phone=account.get("phone"),
        )
        db.add(user)
        await db.flush()

    if account["role"] == UserRole.STUDENT:
        result = await db.execute(select(Student).where(Student.user_id == user.id))
        student = result.scalar_one_or_none()
        dept = depts.get(account["department"])
        if not student:
            db.add(
                Student(
                    user_id=user.id,
                    student_id=account["student_id"],
                    department_id=dept.id if dept else None,
                    major=account["department"],
                    year="4th Year",
                )
            )
        else:
            student.student_id = account["student_id"]
            student.department_id = dept.id if dept else None

    elif account["role"] == UserRole.PROFESSOR:
        result = await db.execute(select(Professor).where(Professor.user_id == user.id))
        prof = result.scalar_one_or_none()
        dept = depts.get(account["department"])
        if not prof:
            db.add(Professor(user_id=user.id, department_id=dept.id if dept else None))
        elif dept:
            prof.department_id = dept.id

    elif account["role"] == UserRole.ADMIN:
        result = await db.execute(select(Admin).where(Admin.user_id == user.id))
        if not result.scalar_one_or_none():
            db.add(Admin(user_id=user.id))


async def seed_sample_projects(db, depts: dict[str, Department]) -> None:
    """Add sample projects if student has none."""
    result = await db.execute(
        select(User).where(User.email == "70140912@student.uol.edu.pk")
    )
    user = result.scalar_one_or_none()
    if not user:
        return
    result = await db.execute(select(Student).where(Student.user_id == user.id))
    student = result.scalar_one_or_none()
    if not student:
        return

    count = await db.scalar(
        select(func.count()).select_from(ProjectIdea).where(ProjectIdea.student_id == student.id)
    )
    if count and count > 0:
        return

    result = await db.execute(
        select(Professor)
        .join(Professor.user)
        .where(User.email == "professor@uol.edu.pk")
    )
    professor = result.scalar_one_or_none()

    db.add(
        ProjectIdea(
            student_id=student.id,
            professor_id=professor.id if professor else None,
            title="Smart Campus Navigation System",
            technologies="React Native, Firebase, Google Maps API",
            description="Campus navigation app with GPS and AR markers for UOL students.",
            professor_email="professor@uol.edu.pk",
            status=ProjectStatus.PENDING,
            relevancy_score=78.0,
            submitted_date=date.today(),
        )
    )


async def seed(force: bool = False) -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        depts = await ensure_departments(db)

        if force:
            emails = [a["email"] for a in UOL_ACCOUNTS]
            for email in emails:
                result = await db.execute(select(User).where(User.email == email))
                u = result.scalar_one_or_none()
                if u:
                    await db.execute(delete(User).where(User.id == u.id))

        for account in UOL_ACCOUNTS:
            await upsert_uol_user(db, account, depts)

        await seed_sample_projects(db, depts)
        await db.commit()

    print("=" * 50)
    print("UOL test accounts ready:")
    print("  Student:   70140912@student.uol.edu.pk  /  Student123")
    print("  Professor: professor@uol.edu.pk         /  Professor123")
    print("  Admin:     admin@uol.edu.pk             /  Admin123")
    print("=" * 50)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Recreate UOL test users")
    args = parser.parse_args()
    asyncio.run(seed(force=args.force))
