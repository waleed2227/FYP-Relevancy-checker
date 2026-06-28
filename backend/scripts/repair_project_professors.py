"""
Backfill professor_id on project_ideas where professor_email matches a registered professor.

Run from backend folder:
    python -m scripts.repair_project_professors
"""

import asyncio
import importlib.util
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "bootstrap", Path(__file__).resolve().parent / "_bootstrap.py"
)
_bootstrap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bootstrap)

from app.database import AsyncSessionLocal
from app.services import project_service


async def main() -> None:
    async with AsyncSessionLocal() as db:
        fixed = await project_service.repair_orphan_professor_assignments(db)
        await db.commit()
    print(f"Repaired {fixed} project(s) with missing professor_id.")


if __name__ == "__main__":
    asyncio.run(main())
