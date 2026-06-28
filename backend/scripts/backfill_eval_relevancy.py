"""
Backfill relevancy analysis for evaluation corpus projects.

Finds all project_ideas with title LIKE '[EVAL-%' and runs the existing
relevancy pipeline (same as API submission path).

Run from backend/:
  python -m scripts.backfill_eval_relevancy
  python -m scripts.backfill_eval_relevancy --force   # re-analyze even if result exists
  python -m scripts.backfill_eval_relevancy --dry-run # list targets only
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

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal
from app.models.project import ProjectIdea
from app.models.relevancy import RelevancyResult
from app.models.student import Student
from app.services.project_service import run_relevancy_analysis


async def backfill(*, force: bool = False, dry_run: bool = False) -> dict:
    stats = {
        "found": 0,
        "skipped": 0,
        "analyzed": 0,
        "failed": 0,
        "errors": [],
    }

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ProjectIdea)
            .where(ProjectIdea.title.like("[EVAL-%"))
            .options(selectinload(ProjectIdea.student).selectinload(Student.user))
            .order_by(ProjectIdea.id)
        )
        projects = result.scalars().all()
        stats["found"] = len(projects)

        if dry_run:
            for p in projects:
                rel = await db.execute(
                    select(RelevancyResult.id).where(RelevancyResult.project_id == p.id)
                )
                has_result = rel.scalar_one_or_none() is not None
                print(f"  id={p.id}  has_result={has_result}  {p.title[:70]}")
            return stats

        for project in projects:
            existing = await db.execute(
                select(RelevancyResult.id).where(RelevancyResult.project_id == project.id)
            )
            if existing.scalar_one_or_none() and not force:
                stats["skipped"] += 1
                continue

            try:
                await run_relevancy_analysis(db, project)
                stats["analyzed"] += 1
                print(f"  OK  id={project.id}  score={project.relevancy_score:.2f}  {project.title[:60]}")
            except Exception as exc:
                stats["failed"] += 1
                stats["errors"].append({"project_id": project.id, "title": project.title, "error": str(exc)})
                print(f"  FAIL id={project.id}  {exc}")

        await db.commit()

    return stats


def main() -> None:
    parser = argparse.ArgumentParser(description="Backfill relevancy for [EVAL-% projects")
    parser.add_argument("--force", action="store_true", help="Re-run even if relevancy_results exist")
    parser.add_argument("--dry-run", action="store_true", help="List targets without analyzing")
    args = parser.parse_args()

    print("=" * 60)
    print("Eval corpus relevancy backfill")
    print("=" * 60)

    stats = asyncio.run(backfill(force=args.force, dry_run=args.dry_run))

    print("=" * 60)
    print(f"Found:    {stats['found']}")
    print(f"Analyzed: {stats['analyzed']}")
    print(f"Skipped:  {stats['skipped']}")
    print(f"Failed:   {stats['failed']}")
    if stats["errors"]:
        for err in stats["errors"]:
            print(f"  - id={err['project_id']}: {err['error']}")
    print("=" * 60)


if __name__ == "__main__":
    main()
