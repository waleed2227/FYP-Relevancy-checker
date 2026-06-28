"""
Backfill relevancy analysis for imported university proposals (IDs 31–40).

Uses the same pipeline as API submission: project_service.run_relevancy_analysis().

Run from backend/:
  python -m scripts.backfill_university_proposals
  python -m scripts.backfill_university_proposals --force   # re-analyze even if result exists
  python -m scripts.backfill_university_proposals --dry-run # list targets only
"""

from __future__ import annotations

import argparse
import asyncio
import importlib.util
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "bootstrap", Path(__file__).resolve().parent / "_bootstrap.py"
)
_bootstrap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bootstrap)

from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal
from app.models.duplicate_report import DuplicateReport
from app.models.project import ProjectIdea
from app.models.relevancy import RelevancyResult
from app.models.student import Student
from app.services.project_service import run_relevancy_analysis

UNIVERSITY_PROJECT_IDS = list(range(31, 41))


async def _count_duplicate_reports_for_university(db) -> int:
    """Duplicate reports where at least one side is a university proposal ID."""
    result = await db.execute(
        select(func.count())
        .select_from(DuplicateReport)
        .where(
            or_(
                DuplicateReport.project1_id.in_(UNIVERSITY_PROJECT_IDS),
                DuplicateReport.project2_id.in_(UNIVERSITY_PROJECT_IDS),
            )
        )
    )
    return result.scalar_one()


async def backfill(*, force: bool = False, dry_run: bool = False) -> dict:
    stats = {
        "found": 0,
        "processed": 0,
        "success": 0,
        "skipped": 0,
        "failed": 0,
        "duplicate_reports_before": 0,
        "duplicate_reports_after": 0,
        "duplicate_reports_created": 0,
        "errors": [],
        "results": [],
    }

    async with AsyncSessionLocal() as db:
        stats["duplicate_reports_before"] = await _count_duplicate_reports_for_university(db)

        result = await db.execute(
            select(ProjectIdea)
            .where(ProjectIdea.id.in_(UNIVERSITY_PROJECT_IDS))
            .options(selectinload(ProjectIdea.student).selectinload(Student.user))
            .order_by(ProjectIdea.id)
        )
        projects = result.scalars().all()
        stats["found"] = len(projects)

        if dry_run:
            for project in projects:
                rel = await db.execute(
                    select(RelevancyResult.id).where(RelevancyResult.project_id == project.id)
                )
                has_result = rel.scalar_one_or_none() is not None
                action = "skip" if has_result and not force else "analyze"
                print(f"  [{action.upper():7}] id={project.id}  has_result={has_result}  {project.title[:65]}")
            return stats

        for project in projects:
            existing = await db.execute(
                select(RelevancyResult.id).where(RelevancyResult.project_id == project.id)
            )
            if existing.scalar_one_or_none() and not force:
                stats["skipped"] += 1
                print(f"  [SKIP   ] id={project.id}  already analyzed  {project.title[:60]}")
                continue

            stats["processed"] += 1
            print(f"  [RUN    ] id={project.id}  analyzing...  {project.title[:55]}")

            try:
                relevancy = await run_relevancy_analysis(db, project)
                stats["success"] += 1
                matched_count = len(relevancy.matched_projects or [])
                stats["results"].append(
                    {
                        "project_id": project.id,
                        "title": project.title,
                        "overall_score": relevancy.overall_score,
                        "similarity_score": relevancy.similarity_score,
                        "matched_count": matched_count,
                        "explanation_status": relevancy.explanation_status,
                    }
                )
                print(
                    f"  [OK     ] id={project.id}  score={relevancy.overall_score:.2f}  "
                    f"similarity={relevancy.similarity_score:.2f}  matches={matched_count}  "
                    f"explanation={relevancy.explanation_status or 'none'}"
                )
            except Exception as exc:
                stats["failed"] += 1
                stats["errors"].append(
                    {"project_id": project.id, "title": project.title, "error": str(exc)}
                )
                print(f"  [FAIL   ] id={project.id}  {exc}")

        await db.commit()
        stats["duplicate_reports_after"] = await _count_duplicate_reports_for_university(db)
        stats["duplicate_reports_created"] = (
            stats["duplicate_reports_after"] - stats["duplicate_reports_before"]
        )

    return stats


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Backfill relevancy for university proposals (IDs 31–40)"
    )
    parser.add_argument(
        "--force", action="store_true", help="Re-run even if relevancy_results exist"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="List targets without analyzing"
    )
    args = parser.parse_args()

    print("=" * 70)
    print("University proposals relevancy backfill (IDs 31–40)")
    print("=" * 70)

    stats = asyncio.run(backfill(force=args.force, dry_run=args.dry_run))

    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"  Found:                    {stats['found']}")
    print(f"  Processed:                {stats['processed']}")
    print(f"  Success:                  {stats['success']}")
    print(f"  Skipped (already analyzed): {stats['skipped']}")
    print(f"  Failed:                   {stats['failed']}")
    if not args.dry_run:
        print(f"  Duplicate reports (before): {stats['duplicate_reports_before']}")
        print(f"  Duplicate reports (after):  {stats['duplicate_reports_after']}")
        print(f"  Duplicate reports created:  {stats['duplicate_reports_created']}")
    if stats["errors"]:
        print("  Errors:")
        for err in stats["errors"]:
            print(f"    - id={err['project_id']}: {err['error']}")
    print("=" * 70)


if __name__ == "__main__":
    main()
