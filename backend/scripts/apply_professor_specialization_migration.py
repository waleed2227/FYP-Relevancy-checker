"""Add professors.specialization column (idempotent). Run: python -m scripts.apply_professor_specialization_migration"""
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


async def main() -> None:
    async with engine.begin() as conn:
        await conn.execute(
            text("ALTER TABLE professors ADD COLUMN IF NOT EXISTS specialization VARCHAR(255)")
        )
    print("professors.specialization column applied (or already present).")


if __name__ == "__main__":
    asyncio.run(main())
