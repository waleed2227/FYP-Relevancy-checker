"""Duplicate detection: persist high-similarity project pairs for admin review."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config.settings import get_settings
from app.models.duplicate_report import DuplicateReport, DuplicateReportStatus, RiskLevel
from app.models.project import ProjectIdea
from app.models.relevancy import MatchedProject, RelevancyResult
from app.models.student import Student


def get_similarity_threshold() -> float:
    return get_settings().duplicate_similarity_threshold


def similarity_to_risk(similarity: float) -> RiskLevel:
    if similarity >= 75:
        return RiskLevel.HIGH
    if similarity >= 60:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def _pair_ids(project_a_id: int, project_b_id: int) -> tuple[int, int]:
    return (project_a_id, project_b_id) if project_a_id < project_b_id else (project_b_id, project_a_id)


def _default_ai_analysis(similarity: float) -> str:
    risk = similarity_to_risk(similarity).value
    return (
        f"AI semantic similarity of {similarity:.1f}% detected between two project submissions "
        f"({risk} risk). Review both proposals to confirm differentiation."
    )


async def upsert_duplicate_report(
    db: AsyncSession,
    project_a_id: int,
    project_b_id: int,
    similarity_score: float,
    *,
    ai_analysis: str | None = None,
    recommendation: str | None = None,
) -> DuplicateReport | None:
    """Create or update a duplicate report for an unordered project pair."""
    threshold = get_similarity_threshold()
    if similarity_score < threshold:
        return None

    p1_id, p2_id = _pair_ids(project_a_id, project_b_id)
    if p1_id == p2_id:
        return None

    result = await db.execute(
        select(DuplicateReport).where(
            DuplicateReport.project1_id == p1_id,
            DuplicateReport.project2_id == p2_id,
        )
    )
    report = result.scalar_one_or_none()
    analysis_text = ai_analysis or _default_ai_analysis(similarity_score)
    risk = similarity_to_risk(similarity_score)

    if report:
        report.similarity_score = similarity_score
        report.risk_level = risk
        report.ai_analysis = analysis_text
        if recommendation:
            report.recommendation = recommendation
        return report

    report = DuplicateReport(
        project1_id=p1_id,
        project2_id=p2_id,
        similarity_score=similarity_score,
        risk_level=risk,
        ai_analysis=analysis_text,
        recommendation=recommendation
        or "Review both project descriptions and require differentiation before approval.",
        status=DuplicateReportStatus.PENDING,
    )
    db.add(report)
    await db.flush()
    return report


async def create_reports_from_matches(
    db: AsyncSession,
    source_project_id: int,
    matches: list[dict],
) -> None:
    """Persist duplicate reports from relevancy analysis matched project list."""
    for match in matches:
        matched_id = match.get("matched_project_id")
        similarity = match.get("similarity", 0.0)
        if matched_id:
            await upsert_duplicate_report(db, source_project_id, matched_id, similarity)


async def sync_duplicate_reports_from_matched_projects(db: AsyncSession) -> None:
    """Backfill duplicate_reports from existing matched_projects rows."""
    threshold = get_similarity_threshold()
    rows = await db.execute(
        select(MatchedProject, RelevancyResult.project_id)
        .join(RelevancyResult, MatchedProject.relevancy_result_id == RelevancyResult.id)
        .where(
            MatchedProject.similarity >= threshold,
            MatchedProject.matched_project_id.is_not(None),
        )
    )
    for match, source_project_id in rows.all():
        await upsert_duplicate_report(
            db,
            source_project_id,
            match.matched_project_id,
            match.similarity,
        )


async def _load_project_summary(db: AsyncSession, project_id: int) -> dict | None:
    result = await db.execute(
        select(ProjectIdea)
        .where(ProjectIdea.id == project_id)
        .options(selectinload(ProjectIdea.student).selectinload(Student.user))
    )
    project = result.scalar_one_or_none()
    if not project:
        return None
    student_name = (
        project.student.user.full_name
        if project.student and project.student.user
        else "Unknown"
    )
    return {
        "id": project.id,
        "title": project.title,
        "studentName": student_name,
        "technologies": project.technologies,
        "description": project.description,
        "status": project.status.value,
        "submittedDate": project.submitted_date.isoformat(),
    }


async def list_pending_duplicate_alerts(db: AsyncSession, limit: int = 20) -> list[dict]:
    """Return pending duplicate reports with project pair details for the admin UI."""
    await sync_duplicate_reports_from_matched_projects(db)

    result = await db.execute(
        select(DuplicateReport)
        .where(DuplicateReport.status == DuplicateReportStatus.PENDING)
        .order_by(DuplicateReport.similarity_score.desc())
        .limit(limit)
    )
    alerts: list[dict] = []
    for report in result.scalars().all():
        p1 = await _load_project_summary(db, report.project1_id)
        p2 = await _load_project_summary(db, report.project2_id)
        if not p1 or not p2:
            continue
        alerts.append(
            {
                "id": report.id,
                "project1": p1,
                "project2": p2,
                "similarity": report.similarity_score,
                "riskLevel": report.risk_level.value,
                "status": report.status.value,
                "detectedDate": report.detected_date.isoformat(),
                "aiAnalysis": report.ai_analysis,
                "recommendation": report.recommendation,
            }
        )
    return alerts


async def get_duplicate_alert_detail(db: AsyncSession, report_id: int) -> dict | None:
    """Full duplicate pair detail for Review Now modal."""
    report = await db.get(DuplicateReport, report_id)
    if not report:
        return None
    p1 = await _load_project_summary(db, report.project1_id)
    p2 = await _load_project_summary(db, report.project2_id)
    if not p1 or not p2:
        return None
    return {
        "id": report.id,
        "project1": p1,
        "project2": p2,
        "similarity": report.similarity_score,
        "riskLevel": report.risk_level.value,
        "status": report.status.value,
        "detectedDate": report.detected_date.isoformat(),
        "aiAnalysis": report.ai_analysis,
        "recommendation": report.recommendation,
    }
