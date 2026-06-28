"""
Add Ollama explanation columns to relevancy_results (idempotent).
Run from backend/: python -m scripts.apply_ollama_explanation_migration
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
    ("ollama_model", "VARCHAR(100)"),
    ("why_relevant", "TEXT"),
    ("similar_projects_summary", "TEXT"),
    ("objectives_overlap", "TEXT"),
    ("problem_domains_overlap", "TEXT"),
    ("unique_aspects", "TEXT"),
    ("novelty_suggestions", "TEXT"),
    ("explanation_status", "VARCHAR(20)"),
)


async def main() -> None:
    async with engine.begin() as conn:
        for col, col_type in COLUMNS:
            await conn.execute(
                text(f"ALTER TABLE relevancy_results ADD COLUMN IF NOT EXISTS {col} {col_type}")
            )
    print("Ollama explanation columns applied (or already present).")


if __name__ == "__main__":
    asyncio.run(main())
