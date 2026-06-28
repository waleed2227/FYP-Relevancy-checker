"""Project submission, relevancy, and review business logic."""

import json
from datetime import date

from sqlalchemy import and_, func, not_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.ollama_service import generate_relevancy_explanation
from app.ai.relevancy_engine import RELEVANCY_TEXT_FIELDS, RelevancyEngine
from app.config.settings import get_settings
from app.models.notification import Notification, NotificationType
from app.models.professor import Professor
from app.models.project import ProjectIdea, ProjectStatus
from app.models.relevancy import MatchedProject, RelevancyResult
from app.models.review import Review, ReviewAction
from app.models.student import Student
from app.models.user import User, UserRole
from app.schemas.project import (
    DashboardStats,
    MatchedProjectResponse,
    ProjectResponse,
    RelevancyExplanation,
    RelevancyInsight,
    RelevancyResultResponse,
    ReviewQueueItem,
)
from app.services import duplicate_service
from app.utils.exceptions import bad_request, not_found

engine = RelevancyEngine()

# Legacy UI placeholder emails → correct before professor lookup
_LEGACY_PROFESSOR_EMAIL_FIXES: dict[str, str] = {
    "professor@university.edu": "professor@uol.edu.pk",
    "professor.name@university.edu": "professor@uol.edu.pk",
}


def _proposal_fields(project: ProjectIdea) -> dict:
    future_enhancements = project.future_enhancements or project.future_scope
    return {
        "category": project.category,
        "targetIndustry": project.target_industry,
        "problemStatement": project.problem_statement,
        "currentChallenges": project.current_challenges,
        "existingSolutions": project.existing_solutions,
        "existingSolutionLimitations": project.existing_solution_limitations,
        "proposedSolution": project.proposed_solution,
        "projectScope": project.project_scope,
        "uniqueFeatures": project.unique_features,
        "innovationAspect": project.innovation_aspect,
        "competitiveAdvantage": project.competitive_advantage,
        "marketGap": project.market_gap,
        "primaryTargetUsers": project.target_users,
        "secondaryTargetUsers": project.secondary_target_users,
        "aiTechnologiesUsed": project.ai_technologies_used,
        "technicalFeasibility": project.technical_feasibility,
        "financialFeasibility": project.financial_feasibility,
        "operationalFeasibility": project.operational_feasibility,
        "expectedImpact": project.expected_impact,
        "academicImpact": project.academic_impact,
        "businessImpact": project.business_impact,
        "socialImpact": project.social_impact,
        "futureEnhancements": future_enhancements,
        "scalabilityOpportunities": project.scalability_opportunities,
        "commercializationPotential": project.commercialization_potential,
        "privacyConcerns": project.privacy_concerns,
        "securityConcerns": project.security_concerns,
        "ethicalConsiderations": project.ethical_considerations,
        "futureScope": project.future_scope,
        "riskAssessment": project.risk_assessment,
    }


_PROPOSAL_ATTRS = (
    "category",
    "target_industry",
    "problem_statement",
    "current_challenges",
    "existing_solutions",
    "existing_solution_limitations",
    "proposed_solution",
    "project_scope",
    "unique_features",
    "innovation_aspect",
    "competitive_advantage",
    "market_gap",
    "target_users",
    "secondary_target_users",
    "ai_technologies_used",
    "technical_feasibility",
    "financial_feasibility",
    "operational_feasibility",
    "expected_impact",
    "academic_impact",
    "business_impact",
    "social_impact",
    "future_enhancements",
    "scalability_opportunities",
    "commercialization_potential",
    "privacy_concerns",
    "security_concerns",
    "ethical_considerations",
    "future_scope",
    "risk_assessment",
)


def _relevancy_rerun_needed(project: ProjectIdea, data) -> bool:
    """True when PATCH payload changes any field that affects relevancy analysis."""
    if getattr(data, "title", None) is not None and data.title != project.title:
        return True
    if getattr(data, "technologies", None) is not None and data.technologies != project.technologies:
        return True
    if getattr(data, "description", None) is not None and data.description != project.description:
        return True
    for attr in _PROPOSAL_ATTRS:
        if getattr(data, attr, None) is None:
            continue
        new_val = _empty_to_none(getattr(data, attr))
        if new_val != getattr(project, attr):
            return True
    return False


def _to_relevancy_analysis_dict(project: ProjectIdea) -> dict:
    """Map a project row to the dict shape expected by RelevancyEngine.analyze."""
    data = {field: getattr(project, field, None) for field in RELEVANCY_TEXT_FIELDS}
    data["ai_technologies_used"] = project.ai_technologies_used
    data["id"] = project.id
    data["year"] = str(project.submitted_date.year)
    data["author"] = (
        project.student.user.full_name
        if project.student and project.student.user
        else "Unknown"
    )
    data["status"] = project.status.value
    return data


def _parse_novelty_suggestions(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [str(s).strip() for s in parsed if str(s).strip()]
    except json.JSONDecodeError:
        pass
    return [line.strip() for line in raw.splitlines() if line.strip()]


def _serialize_novelty_suggestions(suggestions: list[str]) -> str | None:
    cleaned = [s.strip() for s in suggestions if s.strip()]
    return json.dumps(cleaned) if cleaned else None


def _relevancy_explanation_from_result(rel: RelevancyResult | None) -> RelevancyExplanation | None:
    if not rel or not rel.why_relevant:
        return None
    return RelevancyExplanation(
        similarity_score=rel.similarity_score,
        why_relevant=rel.why_relevant,
        similar_projects_summary=rel.similar_projects_summary,
        objectives_overlap=rel.objectives_overlap,
        problem_domains_overlap=rel.problem_domains_overlap,
        unique_aspects=rel.unique_aspects,
        novelty_suggestions=_parse_novelty_suggestions(rel.novelty_suggestions),
        ollama_model=rel.ollama_model,
        status=rel.explanation_status,
    )


async def _apply_explanation_to_relevancy(
    relevancy: RelevancyResult,
    project_dict: dict,
    scores: dict[str, float],
    matched: list[dict],
) -> None:
    explanation = await generate_relevancy_explanation(project_dict, scores, matched)
    relevancy.ollama_model = explanation.get("ollama_model")
    relevancy.why_relevant = explanation.get("why_relevant") or None
    relevancy.similar_projects_summary = explanation.get("similar_projects_summary") or None
    relevancy.objectives_overlap = explanation.get("objectives_overlap") or None
    relevancy.problem_domains_overlap = explanation.get("problem_domains_overlap") or None
    relevancy.unique_aspects = explanation.get("unique_aspects") or None
    relevancy.novelty_suggestions = _serialize_novelty_suggestions(
        explanation.get("novelty_suggestions") or []
    )
    relevancy.explanation_status = explanation.get("status")


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
        aiExplanation=_relevancy_explanation_from_result(rel),
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
    **proposal_fields: str | None,
) -> ProjectIdea:
    professor = await resolve_professor_for_submission(db, professor_email)
    normalized_email = professor.user.email.lower() if professor.user else normalize_professor_email(professor_email)

    proposal_kwargs = {
        attr: _empty_to_none(proposal_fields.get(attr))
        for attr in _PROPOSAL_ATTRS
    }

    project = ProjectIdea(
        student_id=student.id,
        professor_id=professor.id,
        title=title,
        technologies=technologies,
        description=description,
        professor_email=normalized_email,
        status=ProjectStatus.PENDING,
        submitted_date=date.today(),
        **proposal_kwargs,
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
    """Update a student's project (pending or revision only). Re-runs relevancy when proposal fields change."""
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

    rerun_relevancy = _relevancy_rerun_needed(project, data)

    if data.title is not None:
        project.title = data.title
    if data.technologies is not None:
        project.technologies = data.technologies
    if data.description is not None:
        project.description = data.description
    for attr in _PROPOSAL_ATTRS:
        value = getattr(data, attr, None)
        if value is not None:
            setattr(project, attr, _empty_to_none(value))
    if data.professor_email is not None:
        professor = await resolve_professor_for_submission(db, data.professor_email)
        project.professor_id = professor.id
        project.professor_email = professor.user.email.lower() if professor.user else normalize_professor_email(
            data.professor_email
        )

    await db.flush()

    if rerun_relevancy:
        await run_relevancy_analysis(db, project)

    return project


def build_relevancy_result_response(project: ProjectIdea, rel: RelevancyResult) -> RelevancyResultResponse:
    prof_name = project.professor.user.full_name if project.professor and project.professor.user else None
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
        explanation=_relevancy_explanation_from_result(rel),
        project=_project_to_response(project, prof_name),
    )


async def ensure_relevancy_explanation(
    db: AsyncSession, project: ProjectIdea, rel: RelevancyResult
) -> RelevancyResult:
    """Generate and persist Ollama explanation if missing (does not recalculate similarity)."""
    if rel.why_relevant:
        return rel

    matched = [
        {
            "title": m.title,
            "similarity": m.similarity,
            "year": m.year,
            "author": m.author,
            "status": m.status,
        }
        for m in (rel.matched_projects or [])
    ]
    project_dict = _to_relevancy_analysis_dict(project)
    scores = {
        "overall_score": rel.overall_score,
        "similarity_score": rel.similarity_score or 0,
        "novelty_score": rel.novelty_score or 0,
        "innovation_score": rel.innovation_score or 0,
    }
    await _apply_explanation_to_relevancy(rel, project_dict, scores, matched)
    await db.flush()
    return rel


async def run_relevancy_analysis(db: AsyncSession, project: ProjectIdea) -> RelevancyResult:
    corpus_query = (
        select(ProjectIdea)
        .where(ProjectIdea.id != project.id)
        .where(
            not_(
                and_(ProjectIdea.student_id == project.student_id, ProjectIdea.title == project.title)
            )
        )
        .options(selectinload(ProjectIdea.student).selectinload(Student.user))
        .order_by(ProjectIdea.submitted_date.desc())
    )
    corpus_limit = get_settings().relevancy_corpus_limitm
    if corpus_limit > 0:
        corpus_query = corpus_query.limit(corpus_limit)
    result = await db.execute(corpus_query)
    existing = result.scalars().all()
    corpus = [_to_relevancy_analysis_dict(p) for p in existing]

    analysis = engine.analyze(_to_relevancy_analysis_dict(project), corpus)
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

    project_dict = _to_relevancy_analysis_dict(project)
    scores = {
        "overall_score": analysis.overall_score,
        "similarity_score": analysis.similarity_score,
        "novelty_score": analysis.novelty_score,
        "innovation_score": analysis.innovation_score,
    }
    await _apply_explanation_to_relevancy(relevancy, project_dict, scores, analysis.matched)
    await db.flush()
    await db.refresh(relevancy, attribute_names=["matched_projects"])

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
