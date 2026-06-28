"""Admin management API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import AdminUser
from app.database import get_db
from app.schemas.admin import (
    AdminCreateUserRequest,
    AdminDashboardStats,
    AdminUpdateProfessorRequest,
    DepartmentResponse,
    DuplicateAlertItem,
    ProfessorDetailResponse,
    ProfessorListItem,
    ProfessorStatsResponse,
    StudentListItem,
    UserListItem,
)
from app.utils.exceptions import not_found
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard", response_model=AdminDashboardStats)
async def admin_dashboard(_: AdminUser, db: AsyncSession = Depends(get_db)):
    return await admin_service.get_admin_stats(db)


@router.post("/users", response_model=UserListItem, status_code=201)
async def admin_create_user(
    data: AdminCreateUserRequest, _: AdminUser, db: AsyncSession = Depends(get_db)
):
    return await admin_service.create_user(db, data)


@router.get("/users", response_model=list[UserListItem])
async def admin_users(_: AdminUser, db: AsyncSession = Depends(get_db)):
    return await admin_service.list_all_users(db)


@router.get("/students", response_model=list[StudentListItem])
async def admin_students(_: AdminUser, db: AsyncSession = Depends(get_db)):
    return await admin_service.list_students(db)


@router.get("/professors", response_model=list[ProfessorListItem])
async def admin_professors(_: AdminUser, db: AsyncSession = Depends(get_db)):
    return await admin_service.list_professors(db)


@router.get("/professors/stats", response_model=ProfessorStatsResponse)
async def admin_professor_stats(_: AdminUser, db: AsyncSession = Depends(get_db)):
    return await admin_service.get_professor_stats(db)


@router.get("/professors/{professor_id}", response_model=ProfessorDetailResponse)
async def admin_professor_detail(
    professor_id: int, _: AdminUser, db: AsyncSession = Depends(get_db)
):
    return await admin_service.get_professor_detail(db, professor_id)


@router.patch("/professors/{professor_id}", response_model=ProfessorListItem)
async def admin_update_professor(
    professor_id: int,
    data: AdminUpdateProfessorRequest,
    _: AdminUser,
    db: AsyncSession = Depends(get_db),
):
    return await admin_service.update_professor(db, professor_id, data)


@router.delete("/professors/{professor_id}", status_code=204)
async def admin_delete_professor(
    professor_id: int, _: AdminUser, db: AsyncSession = Depends(get_db)
):
    await admin_service.delete_professor(db, professor_id)


@router.get("/departments", response_model=list[DepartmentResponse])
async def admin_departments(_: AdminUser, db: AsyncSession = Depends(get_db)):
    return await admin_service.list_departments(db)


@router.get("/duplicate-reports", response_model=list[DuplicateAlertItem])
async def admin_duplicate_reports(_: AdminUser, db: AsyncSession = Depends(get_db)):
    from app.services import duplicate_service

    raw = await duplicate_service.list_pending_duplicate_alerts(db)
    return [DuplicateAlertItem(**item) for item in raw]


@router.get("/duplicate-reports/{report_id}", response_model=DuplicateAlertItem)
async def admin_duplicate_report_detail(
    report_id: int, _: AdminUser, db: AsyncSession = Depends(get_db)
):
    from app.services import duplicate_service

    detail = await duplicate_service.get_duplicate_alert_detail(db, report_id)
    if not detail:
        raise not_found("Duplicate report not found")
    return DuplicateAlertItem(**detail)
