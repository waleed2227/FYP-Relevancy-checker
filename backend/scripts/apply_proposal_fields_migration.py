"""
Apply proposal field columns to project_ideas (idempotent).
Run from backend/: python -m scripts.apply_proposal_fields_migration
"""
import asyncio
import importlib.util
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "bootstrap", Path(__file__).resolve().parent / "_bootstrap.py"
)
_bootstrap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bootstrap)

from sqlalchemy import text

from app.database import engine


COLUMNS = (
    "problem_statement",
    "objectives",
    "methodology",
    "expected_outcomes",
    "deliverables",
)


async def main() -> None:
    async with engine.begin() as conn:
        for col in COLUMNS:
            await conn.execute(
                text(f"ALTER TABLE project_ideas ADD COLUMN IF NOT EXISTS {col} TEXT")
            )
    print("Proposal field columns applied (or already present).")


if __name__ == "__main__":
    asyncio.run(main())
