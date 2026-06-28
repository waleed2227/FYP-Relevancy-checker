"""Project submission and relevancy API routes."""

import os
from pathlib import Path

import aiofiles
from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import CurrentUser, ProfessorUser, StudentUser
from app.config.settings import get_settings
from app.database import get_db
from app.models.project import ProjectAttachment, ProjectIdea
from app.models.relevancy import RelevancyResult
from app.models.user import UserRole
from app.schemas.project import (
    DashboardStats,
    MatchedProjectResponse,
    ProjectResponse,
    RelevancyInsight,
    RelevancyResultResponse,
    ReviewCreate,
    ReviewQueueItem,
)
from app.services import project_service
from app.utils.exceptions import bad_request, not_found

router = APIRouter(prefix="/projects", tags=["Projects"])
settings = get_settings()


@router.post("", response_model=ProjectResponse, summary="Submit new project idea")
async def submit_project(
    user: StudentUser,
    db: AsyncSession = Depends(get_db),
    title: str = Form(...),
    technologies: str = Form(...),
    description: str = Form(...),
    professor_email: str = Form(...),
    files: list[UploadFile] = File(default=[]),
):
    if not user.student:
        raise bad_request("Student profile not found")

    project = await project_service.create_project(
        db, user.student, title, technologies, description, professor_email
    )
    await project_service.run_relevancy_analysis(db, project)

    upload_dir = Path(settings.upload_dir) / str(project.id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    max_bytes = settings.max_upload_size_mb * 1024 * 1024

    for f in files:
        if not f.filename:
            continue
        content = await f.read()
        if len(content) > max_bytes:
            raise bad_request(f"File {f.filename} exceeds size limit")
        path = upload_dir / f.filename
        async with aiofiles.open(path, "wb") as out:
            await out.write(content)
        db.add(
            ProjectAttachment(
                project_id=project.id,
                filename=f.filename,
                file_path=str(path),
                file_size=len(content),
                mime_type=f.content_type,
            )
        )

    return project_service._project_to_response(project)


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
        from app.models.student import Student

        result = await db.execute(
            select(ProjectIdea)
            .options(
                selectinload(ProjectIdea.student).selectinload(Student.user),
                selectinload(ProjectIdea.relevancy_result),
            )
            .order_by(ProjectIdea.submitted_date.desc())
        )
        items = []
        for p in result.scalars().all():
            su = p.student.user if p.student else None
            rel = p.relevancy_result
            items.append(
                ReviewQueueItem(
                    id=p.id,
                    studentName=su.full_name if su else "Unknown",
                    studentId=p.student.student_id if p.student else "",
                    studentEmail=su.email if su else "",
                    title=p.title,
                    projectTitle=p.title,
                    technologies=p.technologies,
                    description=p.description,
                    submittedDate=p.submitted_date.isoformat(),
                    relevancyScore=p.relevancy_score,
                    status=p.status.value,
                    feedback=p.feedback,
                    innovationScore=rel.innovation_score if rel else None,
                    similarityScore=rel.similarity_score if rel else None,
                    feasibilityScore=rel.feasibility_score if rel else None,
                    aiConfidence=rel.ai_confidence if rel else None,
                )
            )
        return items
    raise bad_request("Not authorized")


@router.get("/{project_id}/relevancy", response_model=RelevancyResultResponse, summary="Get relevancy results")
async def get_relevancy(project_id: int, user: CurrentUser, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProjectIdea)
        .where(ProjectIdea.id == project_id)
        .options(
            selectinload(ProjectIdea.relevancy_result).selectinload(RelevancyResult.matched_projects),
            selectinload(ProjectIdea.professor),
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise not_found("Project")
    if user.student and project.student_id != user.student.id:
        raise bad_request("Access denied")

    rel = project.relevancy_result
    if not rel:
        rel = await project_service.run_relevancy_analysis(db, project)
        await db.refresh(project)

    insights = [
        RelevancyInsight(
            label="Novelty Score",
            value=f"{rel.novelty_score or 0}%",
            description="Innovative potential relative to existing projects",
        ),
        RelevancyInsight(
            label="Feasibility",
            value="High" if (rel.feasibility_score or 0) >= 70 else "Moderate",
            description="Technical feasibility based on chosen technologies",
        ),
        RelevancyInsight(
            label="Market Relevance",
            value=f"{rel.market_relevance or 0}%",
            description="Alignment with current industry and research trends",
        ),
    ]
    matched = [
        MatchedProjectResponse(
            id=m.id,
            title=m.title,
            similarity=m.similarity,
            year=m.year,
            author=m.author,
            status=m.status,
        )
        for m in (rel.matched_projects or [])
    ]
    return RelevancyResultResponse(
        overall_score=rel.overall_score,
        is_high_relevancy=rel.overall_score >= 70,
        insights=insights,
        matched_projects=matched,
        project=project_service._project_to_response(project),
    )


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
