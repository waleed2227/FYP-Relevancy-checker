"""
Remove proposal file attachments and migrate to structured proposal v2 fields.
Run from backend/: python -m scripts.apply_proposal_v2_migration
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

NEW_COLUMNS = (
    "current_challenges",
    "existing_solution_limitations",
    "proposed_solution",
    "unique_features",
    "innovation_aspect",
    "market_gap",
    "target_users",
    "ai_technologies_used",
    "expected_impact",
    "future_scope",
    "risk_assessment",
)

OLD_COLUMNS = (
    "objectives",
    "methodology",
    "expected_outcomes",
    "deliverables",
)


async def main() -> None:
    async with engine.begin() as conn:
        await conn.execute(
            text("ALTER TABLE project_ideas ADD COLUMN IF NOT EXISTS problem_statement TEXT")
        )
        for col in NEW_COLUMNS:
            await conn.execute(
                text(f"ALTER TABLE project_ideas ADD COLUMN IF NOT EXISTS {col} TEXT")
            )
        for col in OLD_COLUMNS:
            await conn.execute(text(f"ALTER TABLE project_ideas DROP COLUMN IF EXISTS {col}"))

        await conn.execute(text("DROP TABLE IF EXISTS project_attachments CASCADE"))

    print("Proposal v2 migration applied: new columns added, legacy columns removed, attachments dropped.")


if __name__ == "__main__":
    asyncio.run(main())
