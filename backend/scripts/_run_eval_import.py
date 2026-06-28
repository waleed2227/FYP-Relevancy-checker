"""
Import evaluation corpus from dataset/eval_corpus_v1.json.

Equivalent to dataset/eval_corpus_v1.sql but safe for Python execution
(string fields may contain semicolons).

Run from backend/:
  python -m scripts._run_eval_import
"""

from __future__ import annotations

import asyncio
import importlib.util
import json
from pathlib import Path

from sqlalchemy import select

_spec = importlib.util.spec_from_file_location(
    "bootstrap", Path(__file__).resolve().parent / "_bootstrap.py"
)
_bootstrap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bootstrap)

from app.database import AsyncSessionLocal
from app.models.professor import Professor
from app.models.project import ProjectIdea, ProjectStatus
from app.models.user import User

ROOT = Path(__file__).resolve().parents[2]
JSON_PATH = ROOT / "dataset" / "eval_corpus_v1.json"


async def main() -> None:
    data = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    projects = data["projects"]
    inserted = 0
    skipped = 0

    async with AsyncSessionLocal() as db:
        prof_result = await db.execute(
            select(Professor)
            .join(Professor.user)
            .where(User.email == "professor@uol.edu.pk")
        )
        professor = prof_result.scalar_one_or_none()
        if not professor:
            raise RuntimeError("professor@uol.edu.pk not found — run scripts.seed first")

        from sqlalchemy import text

        student_ids = [r[0] for r in (await db.execute(text("SELECT id FROM students ORDER BY id"))).all()]
        if len(student_ids) < 1:
            raise RuntimeError("No students found — run scripts.seed first")

        for i, item in enumerate(projects):
            eval_id = item["eval_id"]
            title = f"[{eval_id}] {item['title']}"
            exists = await db.execute(select(ProjectIdea.id).where(ProjectIdea.title == title))
            if exists.scalar_one_or_none():
                skipped += 1
                continue

            student_id = student_ids[i % len(student_ids)]
            db.add(
                ProjectIdea(
                    student_id=student_id,
                    professor_id=professor.id,
                    title=title,
                    technologies=item["technologies"],
                    description=item["description"],
                    category=item.get("target_industry"),
                    target_industry=item["target_industry"],
                    problem_statement=item["problem_statement"],
                    proposed_solution=item["proposed_solution"],
                    unique_features=item["unique_features"],
                    innovation_aspect=item["innovation_aspect"],
                    target_users=item["target_users"],
                    expected_impact=item["expected_impact"],
                    professor_email="professor@uol.edu.pk",
                    status=ProjectStatus.PENDING,
                )
            )
            inserted += 1

        await db.commit()

    print(f"Source: {JSON_PATH}")
    print(f"Inserted: {inserted}")
    print(f"Skipped (already exist): {skipped}")


if __name__ == "__main__":
    asyncio.run(main())
