"""
Regenerate Ollama explanations for university proposals (IDs 31–40).

Does NOT re-run relevancy scoring — only updates explanation fields on existing
relevancy_results rows via _apply_explanation_to_relevancy().

Run from backend/:
  python -m scripts.backfill_university_ollama_explanations
  python -m scripts.backfill_university_ollama_explanations --force
  python -m scripts.backfill_university_ollama_explanations --dry-run
"""

from __future__ import annotations

import argparse
import asyncio
import importlib.util
import time
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
from app.services.project_service import (
    _apply_explanation_to_relevancy,
    _to_relevancy_analysis_dict,
)

UNIVERSITY_PROJECT_IDS = list(range(31, 41))


async def backfill(*, force: bool = False, dry_run: bool = False) -> dict:
    stats = {
        "found": 0,
        "processed": 0,
        "generated": 0,
        "fallback": 0,
        "skipped": 0,
        "failed": 0,
        "errors": [],
        "results": [],
        "response_times_sec": [],
    }

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ProjectIdea)
            .where(ProjectIdea.id.in_(UNIVERSITY_PROJECT_IDS))
            .options(
                selectinload(ProjectIdea.student).selectinload(Student.user),
                selectinload(ProjectIdea.relevancy_result).selectinload(
                    RelevancyResult.matched_projects
                ),
            )
            .order_by(ProjectIdea.id)
        )
        projects = result.scalars().all()
        stats["found"] = len(projects)

        for project in projects:
            rel = project.relevancy_result
            if not rel:
                stats["skipped"] += 1
                print(f"  [SKIP   ] id={project.id}  no relevancy_results row")
                continue

            has_explanation = bool(rel.why_relevant)
            is_generated = rel.explanation_status == "generated"

            if dry_run:
                action = "skip" if is_generated and not force else "regenerate"
                if has_explanation and not force and not is_generated:
                    action = "regenerate" if force else "skip_has_fallback"
                print(
                    f"  [{action.upper():16}] id={project.id}  "
                    f"status={rel.explanation_status}  score={rel.overall_score:.2f}  "
                    f"{project.title[:50]}"
                )
                continue

            if is_generated and not force:
                stats["skipped"] += 1
                print(f"  [SKIP   ] id={project.id}  already generated")
                continue

            if has_explanation and not force:
                stats["skipped"] += 1
                print(f"  [SKIP   ] id={project.id}  has fallback (use --force to regenerate)")
                continue

            stats["processed"] += 1
            original_score = rel.overall_score
            print(f"  [RUN    ] id={project.id}  generating explanation...  {project.title[:50]}")

            matched = [
                {
                    "title": m.title,
                    "similarity": m.similarity,
                    "year": m.year,
                    "author": m.author,
                    "status": m.status,
                    "matched_project_id": m.matched_project_id,
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

            try:
                t0 = time.perf_counter()
                await _apply_explanation_to_relevancy(rel, project_dict, scores, matched)
                elapsed = time.perf_counter() - t0
                stats["response_times_sec"].append(elapsed)
                await db.flush()

                if rel.overall_score != original_score:
                    raise RuntimeError(
                        f"Score changed unexpectedly: {original_score} -> {rel.overall_score}"
                    )

                status = rel.explanation_status or "unknown"
                if status == "generated":
                    stats["generated"] += 1
                else:
                    stats["fallback"] += 1

                stats["results"].append(
                    {
                        "project_id": project.id,
                        "title": project.title,
                        "overall_score": rel.overall_score,
                        "explanation_status": status,
                        "ollama_model": rel.ollama_model,
                        "why_relevant": rel.why_relevant,
                        "why_relevant_len": len(rel.why_relevant or ""),
                        "response_time_sec": round(elapsed, 2),
                    }
                )
                print(
                    f"  [OK     ] id={project.id}  status={status}  "
                    f"model={rel.ollama_model}  time={elapsed:.1f}s  "
                    f"score_unchanged={rel.overall_score:.2f}"
                )
            except Exception as exc:
                stats["failed"] += 1
                stats["errors"].append({"project_id": project.id, "error": str(exc)})
                print(f"  [FAIL   ] id={project.id}  {exc}")

        await db.commit()

    return stats


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Regenerate Ollama explanations for university proposals (31–40)"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate even when fallback explanation exists",
    )
    parser.add_argument("--dry-run", action="store_true", help="List targets only")
    args = parser.parse_args()

    print("=" * 70)
    print("University Ollama explanation backfill (IDs 31–40, scores unchanged)")
    print("=" * 70)

    stats = asyncio.run(backfill(force=args.force, dry_run=args.dry_run))

    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"  Found:     {stats['found']}")
    print(f"  Processed: {stats['processed']}")
    print(f"  Generated: {stats['generated']}")
    print(f"  Fallback:  {stats['fallback']}")
    print(f"  Skipped:   {stats['skipped']}")
    print(f"  Failed:    {stats['failed']}")
    if stats["errors"]:
        for err in stats["errors"]:
            print(f"    - id={err['project_id']}: {err['error']}")
    times = stats.get("response_times_sec") or []
    if times:
        avg = sum(times) / len(times)
        print(f"  Avg Ollama response time: {avg:.2f}s (min={min(times):.2f}s, max={max(times):.2f}s)")
    print("=" * 70)


if __name__ == "__main__":
    main()
