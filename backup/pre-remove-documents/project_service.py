"""Project submission, relevancy, and review business logic."""

from datetime import date

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.relevancy_engine import RelevancyEngine
from app.models.notification import Notification, NotificationType
from app.models.professor import Professor
from app.models.project import ProjectIdea, ProjectStatus
from app.models.relevancy import MatchedProject, RelevancyResult
from app.models.review import Review, ReviewAction
from app.models.student import Student
from app.models.user import User, UserRole
from app.schemas.project import DashboardStats, ProjectResponse, ReviewQueueItem
from app.services import duplicate_service
from app.utils.exceptions import bad_request, not_found

engine = RelevancyEngine()

# Legacy UI placeholder emails → correct before professor lookup
_LEGACY_PROFESSOR_EMAIL_FIXES: dict[str, str] = {
    "professor@university.edu": "professor@uol.edu.pk",
    "professor.name@university.edu": "professor@uol.edu.pk",
}


def _proposal_fields(project: ProjectIdea) -> dict:
    return {
        "problemStatement": project.problem_statement,
        "objectives": project.objectives,
        "methodology": project.methodology,
        "expectedOutcomes": project.expected_outcomes,
        "deliverables": project.deliverables,
    }


def _empty_to_none(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped if stripped else None


def _to_review_queue_item(project: ProjectIdea) -> ReviewQueueItem:
    """Build ReviewQueueItem from a project with eager-loaded student.user and relevancy_result."""
    student_user = project.student.user if project.student else None
    rel = project.relevancy_result
    return ReviewQueueItem(
        id=project.id,
        studentName=student_user.full_name if student_user else "Unknown",
        studentId=project.student.student_id if project.student else "",
        studentEmail=student_user.email if student_user else "",
        studentPhone=student_user.phone if student_user else None,
        studentPhoto=student_user.photo_url if student_user else None,
        title=project.title,
        projectTitle=project.title,
        technologies=project.technologies,
        description=project.description,
        **_proposal_fields(project),
        submittedDate=project.submitted_date.isoformat(),
        relevancyScore=project.relevancy_score,
        status=project.status.value,
        feedback=project.feedback,
        innovationScore=rel.innovation_score if rel else project.relevancy_score,
        similarityScore=rel.similarity_score if rel else None,
        feasibilityScore=rel.feasibility_score if rel else None,
        aiConfidence=rel.ai_confidence if rel else None,
    )


def _project_to_response(project: ProjectIdea, professor_name: str | None = None) -> ProjectResponse:
    return ProjectResponse(
        id=project.id,
        title=project.title,
        technologies=project.technologies,
        description=project.description,
        **_proposal_fields(project),
        submittedDate=project.submitted_date.isoformat(),
        status=project.status.value,
        relevancyScore=project.relevancy_score,
        professor=professor_name,
        professorEmail=project.professor_email,
        feedback=project.feedback,
    )


def normalize_professor_email(email: str) -> str:
    """Normalize and validate UOL professor email format."""
    from app.utils.validators import validate_professor_email

    return validate_professor_email(email.strip())


async def get_professor_by_email(db: AsyncSession, email: str) -> Professor | None:
    """Find active professor profile by registered UOL email."""
    normalized = normalize_professor_email(email)
    result = await db.execute(
        select(Professor)
        .join(Professor.user)
        .where(
            func.lower(User.email) == normalized,
            User.role == UserRole.PROFESSOR,
            User.is_active.is_(True),
        )
        .options(selectinload(Professor.user))
    )
    return result.scalar_one_or_none()


async def resolve_professor_for_submission(db: AsyncSession, professor_email: str) -> Professor:
    """
    Resolve professor for a new submission.
    Raises bad_request if email is invalid or no matching professor account exists.
    """
    try:
        normalized = normalize_professor_email(professor_email)
    except ValueError as exc:
        raise bad_request(str(exc)) from exc
    professor = await get_professor_by_email(db, normalized)
    if not professor:
        raise bad_request(
            f"No registered professor found for '{normalized}'. "
            "Ask your supervisor to register with a UOL professor email (e.g. professor@uol.edu.pk), "
            "then use that exact email here."
        )
    return professor


async def repair_orphan_professor_assignments(db: AsyncSession) -> int:
    """
    Set professor_id on existing rows where professor_email matches a registered professor.
    Returns number of projects fixed.
    """
    result = await db.execute(select(ProjectIdea).where(ProjectIdea.professor_id.is_(None)))
    fixed = 0
    for project in result.scalars().all():
        if not project.professor_email:
            continue
        email = project.professor_email.strip().lower()
        corrected = _LEGACY_PROFESSOR_EMAIL_FIXES.get(email)
        if corrected:
            project.professor_email = corrected
            email = corrected
        try:
            professor = await get_professor_by_email(db, email)
        except Exception:
            continue
        if professor:
            project.professor_id = professor.id
            fixed += 1
    return fixed


async def _notify_professor_new_submission(
    db: AsyncSession,
    professor: Professor,
    student: Student,
    project_title: str,
) -> None:
    """Notify assigned professor when a student submits a new project."""
    if not professor.user_id:
        return

    student_name = "Unknown"
    if student.user:
        student_name = student.user.full_name
    else:
        st_row = await db.execute(
            select(Student)
            .where(Student.id == student.id)
            .options(selectinload(Student.user))
        )
        loaded = st_row.scalar_one_or_none()
        if loaded and loaded.user:
            student_name = loaded.user.full_name

    db.add(
        Notification(
            user_id=professor.user_id,
            type=NotificationType.SUBMISSION,
            title="New Project Submission",
            message=f'Student {student_name} submitted "{project_title}" for review.',
            priority="high",
            color="blue",
        )
    )


async def create_project(
    db: AsyncSession,
    student: Student,
    title: str,
    technologies: str,
    description: str,
    professor_email: str,
    *,
    problem_statement: str | None = None,
    objectives: str | None = None,
    methodology: str | None = None,
    expected_outcomes: str | None = None,
    deliverables: str | None = None,
) -> ProjectIdea:
    professor = await resolve_professor_for_submission(db, professor_email)
    normalized_email = professor.user.email.lower() if professor.user else normalize_professor_email(professor_email)

    project = ProjectIdea(
        student_id=student.id,
        professor_id=professor.id,
        title=title,
        technologies=technologies,
        description=description,
        problem_statement=_empty_to_none(problem_statement),
        objectives=_empty_to_none(objectives),
        methodology=_empty_to_none(methodology),
        expected_outcomes=_empty_to_none(expected_outcomes),
        deliverables=_empty_to_none(deliverables),
        professor_email=normalized_email,
        status=ProjectStatus.PENDING,
        submitted_date=date.today(),
    )
    db.add(project)
    await db.flush()
    await _notify_professor_new_submission(db, professor, student, title)
    return project


async def update_project(
    db: AsyncSession,
    student: Student,
    project_id: int,
    data,
) -> ProjectIdea:
    """Update a student's project (pending or revision only). Does not re-run relevancy."""
    result = await db.execute(
        select(ProjectIdea)
        .where(ProjectIdea.id == project_id, ProjectIdea.student_id == student.id)
        .options(selectinload(ProjectIdea.professor).selectinload(Professor.user))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise not_found("Project")
    if project.status not in (ProjectStatus.PENDING, ProjectStatus.REVISION):
        raise bad_request("Only pending or revision projects can be edited")

    if data.title is not None:
        project.title = data.title
    if data.technologies is not None:
        project.technologies = data.technologies
    if data.description is not None:
        project.description = data.description
    if data.problem_statement is not None:
        project.problem_statement = _empty_to_none(data.problem_statement)
    if data.objectives is not None:
        project.objectives = _empty_to_none(data.objectives)
    if data.methodology is not None:
        project.methodology = _empty_to_none(data.methodology)
    if data.expected_outcomes is not None:
        project.expected_outcomes = _empty_to_none(data.expected_outcomes)
    if data.deliverables is not None:
        project.deliverables = _empty_to_none(data.deliverables)
    if data.professor_email is not None:
        professor = await resolve_professor_for_submission(db, data.professor_email)
        project.professor_id = professor.id
        project.professor_email = professor.user.email.lower() if professor.user else normalize_professor_email(
            data.professor_email
        )

    await db.flush()
    return project


async def run_relevancy_analysis(db: AsyncSession, project: ProjectIdea) -> RelevancyResult:
    result = await db.execute(
        select(ProjectIdea)
        .where(ProjectIdea.id != project.id)
        .options(selectinload(ProjectIdea.student).selectinload(Student.user))
        .limit(100)
    )
    existing = result.scalars().all()
    corpus = [
        {
            "id": p.id,
            "title": p.title,
            "technologies": p.technologies,
            "description": p.description,
            "year": str(p.submitted_date.year),
            "author": p.student.user.full_name if p.student and p.student.user else "Unknown",
            "status": p.status.value,
        }
        for p in existing
    ]

    analysis = engine.analyze(project.title, project.technologies, project.description, corpus)
    project.relevancy_score = analysis.overall_score

    existing_rel_result = await db.execute(
        select(RelevancyResult).where(RelevancyResult.project_id == project.id)
    )
    existing_rel = existing_rel_result.scalar_one_or_none()
    if existing_rel:
        await db.delete(existing_rel)
        await db.flush()

    relevancy = RelevancyResult(
        project_id=project.id,
        overall_score=analysis.overall_score,
        novelty_score=analysis.novelty_score,
        feasibility_score=analysis.feasibility_score,
        market_relevance=analysis.market_relevance,
        innovation_score=analysis.innovation_score,
        similarity_score=analysis.similarity_score,
        ai_confidence=analysis.ai_confidence,
        summary=analysis.summary,
    )
    db.add(relevancy)
    await db.flush()

    for m in analysis.matched:
        db.add(
            MatchedProject(
                relevancy_result_id=relevancy.id,
                matched_project_id=m.get("matched_project_id"),
                title=m["title"],
                similarity=m["similarity"],
                year=m.get("year"),
                author=m.get("author"),
                status=m.get("status"),
            )
        )

    await duplicate_service.create_reports_from_matches(db, project.id, analysis.matched)

    return relevancy


async def get_student_projects(db: AsyncSession, student_id: int) -> list[ProjectResponse]:
    result = await db.execute(
        select(ProjectIdea)
        .where(ProjectIdea.student_id == student_id)
        .options(selectinload(ProjectIdea.professor).selectinload(Professor.user))
        .order_by(ProjectIdea.submitted_date.desc())
    )
    projects = result.scalars().all()
    out = []
    for p in projects:
        prof_name = p.professor.user.full_name if p.professor and p.professor.user else None
        out.append(_project_to_response(p, prof_name))
    return out


async def get_dashboard_stats(db: AsyncSession, student_id: int | None, professor_id: int | None) -> DashboardStats:
    q = select(ProjectIdea.status, func.count(ProjectIdea.id)).group_by(ProjectIdea.status)
    if student_id:
        q = q.where(ProjectIdea.student_id == student_id)
    if professor_id:
        q = q.where(ProjectIdea.professor_id == professor_id)

    result = await db.execute(q)
    counts = {row[0]: row[1] for row in result.all()}
    approved = counts.get(ProjectStatus.APPROVED, 0)
    pending = counts.get(ProjectStatus.PENDING, 0)
    rejected = counts.get(ProjectStatus.REJECTED, 0)
    revision = counts.get(ProjectStatus.REVISION, 0)
    total = approved + pending + rejected + revision
    return DashboardStats(total=total, approved=approved, pending=pending + revision, rejected=rejected)


async def get_professor_submissions(db: AsyncSession, professor: Professor) -> list[ReviewQueueItem]:
    result = await db.execute(
        select(ProjectIdea)
        .where(ProjectIdea.professor_id == professor.id)
        .options(
            selectinload(ProjectIdea.student).selectinload(Student.user),
            selectinload(ProjectIdea.relevancy_result),
        )
        .order_by(ProjectIdea.submitted_date.desc())
    )
    return [_to_review_queue_item(p) for p in result.scalars().all()]


async def get_review_queue(db: AsyncSession, professor: Professor) -> list[ReviewQueueItem]:
    await repair_orphan_professor_assignments(db)

    prof_row = await db.execute(
        select(Professor)
        .where(Professor.id == professor.id)
        .options(selectinload(Professor.user))
    )
    prof = prof_row.scalar_one()
    prof_email = prof.user.email.lower() if prof.user else None

    filters = [
        ProjectIdea.professor_id == professor.id,
    ]
    if prof_email:
        filters.append(
            and_(
                ProjectIdea.professor_id.is_(None),
                func.lower(ProjectIdea.professor_email) == prof_email,
            )
        )

    result = await db.execute(
        select(ProjectIdea)
        .where(ProjectIdea.status == ProjectStatus.PENDING, or_(*filters))
        .options(
            selectinload(ProjectIdea.student).selectinload(Student.user),
            selectinload(ProjectIdea.relevancy_result),
        )
        .order_by(ProjectIdea.submitted_date.desc())
    )
    projects = result.scalars().all()
    for p in projects:
        if p.professor_id is None:
            p.professor_id = professor.id
    return [_to_review_queue_item(p) for p in projects]


async def submit_review(
    db: AsyncSession,
    professor: Professor,
    project_id: int,
    action: str,
    feedback: str,
) -> ProjectIdea:
    prof_row = await db.execute(
        select(Professor)
        .where(Professor.id == professor.id)
        .options(selectinload(Professor.user))
    )
    prof = prof_row.scalar_one()
    prof_email = prof.user.email.lower() if prof.user else None

    ownership = [ProjectIdea.professor_id == professor.id]
    if prof_email:
        ownership.append(
            and_(
                ProjectIdea.professor_id.is_(None),
                func.lower(ProjectIdea.professor_email) == prof_email,
            )
        )

    result = await db.execute(
        select(ProjectIdea)
        .where(ProjectIdea.id == project_id, or_(*ownership))
        .options(selectinload(ProjectIdea.student).selectinload(Student.user))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise not_found("Project")
    if project.professor_id is None:
        project.professor_id = professor.id

    status_map = {
        "approve": ProjectStatus.APPROVED,
        "reject": ProjectStatus.REJECTED,
        "revision": ProjectStatus.REVISION,
    }
    action_enum = ReviewAction(action)
    project.status = status_map[action]
    project.feedback = feedback

    db.add(Review(project_id=project.id, professor_id=professor.id, action=action_enum, feedback=feedback))

    if project.student and project.student.user:
        notif_type = NotificationType.APPROVAL
        if action == "reject":
            notif_type = NotificationType.FEEDBACK
        elif action == "revision":
            notif_type = NotificationType.REVISION
        action_labels = {
            "approve": "approved",
            "reject": "rejected",
            "revision": "sent back for revision",
        }
        db.add(
            Notification(
                user_id=project.student.user_id,
                type=notif_type,
                title=f"Project {action.title()}",
                message=(
                    f'Your project "{project.title}" has been '
                    f'{action_labels.get(action, action)} by your professor.'
                ),
                priority="high",
                color="green" if action == "approve" else "orange",
            )
        )

    return project
