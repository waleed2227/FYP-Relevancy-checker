"""Add FYP proposal form v3 columns (idempotent). Run: python -m scripts.apply_proposal_form_v3_migration"""
import asyncio
import importlib.util
from pathlib import Path

_bootstrap_path = Path(__file__).resolve().parent / "_bootstrap.py"
_spec = importlib.util.spec_from_file_location("bootstrap", _bootstrap_path)
if _spec is None or _spec.loader is None:
    raise RuntimeError(f"Failed to load bootstrap module from {_bootstrap_path}")
_bootstrap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bootstrap)

from sqlalchemy import text

from app.database import engine

NEW_COLUMNS = (
    "category",
    "target_industry",
    "existing_solutions",
    "project_scope",
    "competitive_advantage",
    "secondary_target_users",
    "technical_feasibility",
    "financial_feasibility",
    "operational_feasibility",
    "academic_impact",
    "business_impact",
    "social_impact",
    "future_enhancements",
    "scalability_opportunities",
    "commercialization_potential",
    "privacy_concerns",
    "security_concerns",
    "ethical_considerations",
)


async def main() -> None:
    async with engine.begin() as conn:
        for col in NEW_COLUMNS:
            await conn.execute(
                text(f"ALTER TABLE project_ideas ADD COLUMN IF NOT EXISTS {col} TEXT")
            )
    print("Proposal form v3 columns applied (or already present).")


if __name__ == "__main__":
    asyncio.run(main())
