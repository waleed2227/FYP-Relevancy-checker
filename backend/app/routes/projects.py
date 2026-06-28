"""Project submission and relevancy API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import CurrentUser, ProfessorUser, StudentUser
from app.database import get_db
from app.models.professor import Professor
from app.models.project import ProjectIdea
from app.models.relevancy import RelevancyResult
from app.models.student import Student
from app.models.user import UserRole
from app.schemas.project import (
    DashboardStats,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    RelevancyResultResponse,
    ReviewCreate,
    ReviewQueueItem,
)
from app.services import project_service
from app.utils.exceptions import bad_request, not_found

router = APIRouter(prefix="/projects", tags=["Projects"])


def _can_view_project_relevancy(user: CurrentUser, project: ProjectIdea) -> bool:
    if user.role == UserRole.ADMIN:
        return True
    if user.student and project.student_id == user.student.id:
        return True
    if user.professor:
        if project.professor_id == user.professor.id:
            return True
        if user.professor.user and project.professor_email:
            if project.professor_email.lower() == user.professor.user.email.lower():
                return True
    return False


@router.post("", response_model=ProjectResponse, summary="Submit new project idea")
async def submit_project(
    data: ProjectCreate,
    user: StudentUser,
    db: AsyncSession = Depends(get_db),
):
    if not user.student:
        raise bad_request("Student profile not found")

    project = await project_service.create_project(
        db,
        user.student,
        data.title,
        data.technologies,
        data.description,
        data.professor_email,
        **data.model_dump(
            exclude={"title", "technologies", "description", "professor_email"},
            exclude_none=True,
        ),
    )
    await project_service.run_relevancy_analysis(db, project)
    return project_service._project_to_response(project)


@router.patch("/{project_id}", response_model=ProjectResponse, summary="Update own project")
async def update_project(
    project_id: int,
    data: ProjectUpdate,
    user: StudentUser,
    db: AsyncSession = Depends(get_db),
):
    if not user.student:
        raise bad_request("Student profile not found")
    project = await project_service.update_project(db, user.student, project_id, data)
    prof_name = project.professor.user.full_name if project.professor and project.professor.user else None
    return project_service._project_to_response(project, prof_name)


@router.get("/my", response_model=list[ProjectResponse], summary="Student's own projects")
async def my_projects(user: StudentUser, db: AsyncSession = Depends(get_db)):
    if not user.student:
        raise bad_request("Student profile not found")
    return await project_service.get_student_projects(db, user.student.id)


@router.get("/stats", response_model=DashboardStats, summary="Dashboard statistics")
async def project_stats(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    student_id = user.student.id if user.student else None
    professor_id = user.professor.id if user.professor else None
    return await project_service.get_dashboard_stats(db, student_id, professor_id)


@router.get("/assigned", response_model=list[ReviewQueueItem], summary="Professor assigned projects")
async def assigned_projects(user: ProfessorUser, db: AsyncSession = Depends(get_db)):
    if not user.professor:
        raise bad_request("Professor profile not found")
    return await project_service.get_professor_submissions(db, user.professor)


@router.get("/review-queue", response_model=list[ReviewQueueItem], summary="Pending review queue")
async def review_queue(user: ProfessorUser, db: AsyncSession = Depends(get_db)):
    if not user.professor:
        raise bad_request("Professor profile not found")
    return await project_service.get_review_queue(db, user.professor)


@router.get("/all", response_model=list[ReviewQueueItem], summary="All projects (professor/admin)")
async def all_projects(user: CurrentUser, db: AsyncSession = Depends(get_db)):
    if user.role == UserRole.PROFESSOR and user.professor:
        return await project_service.get_professor_submissions(db, user.professor)
    if user.role == UserRole.ADMIN:
        result = await db.execute(
            select(ProjectIdea)
            .options(
                selectinload(ProjectIdea.student).selectinload(Student.user),
                selectinload(ProjectIdea.relevancy_result),
            )
            .order_by(ProjectIdea.submitted_date.desc())
        )
        items = [project_service._to_review_queue_item(p) for p in result.scalars().all()]
        return items
    raise bad_request("Not authorized")


@router.get("/{project_id}/relevancy", response_model=RelevancyResultResponse, summary="Get relevancy results")
async def get_relevancy(project_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProjectIdea)
        .where(ProjectIdea.id == project_id)
        .options(
            selectinload(ProjectIdea.relevancy_result).selectinload(RelevancyResult.matched_projects),
            selectinload(ProjectIdea.student).selectinload(Student.user),
            selectinload(ProjectIdea.professor).selectinload(Professor.user),
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise not_found("Project")
    if not _can_view_project_relevancy(user, project):
        raise bad_request("Access denied")

    rel = project.relevancy_result
    if not rel:
        rel = await project_service.run_relevancy_analysis(db, project)
    else:
        rel = await project_service.ensure_relevancy_explanation(db, project, rel)

    return project_service.build_relevancy_result_response(project, rel)


@router.post("/{project_id}/review", response_model=ProjectResponse, summary="Professor review action")
async def review_project(
    project_id: int,
    data: ReviewCreate,
    user: ProfessorUser,
    db: AsyncSession = Depends(get_db),
):
    if not user.professor:
        raise bad_request("Professor profile not found")
    project = await project_service.submit_review(
        db, user.professor, project_id, data.action, data.feedback
    )
    prof_name = user.full_name
    return project_service._project_to_response(project, prof_name)
