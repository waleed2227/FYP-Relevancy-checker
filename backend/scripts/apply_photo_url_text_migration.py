"""Widen users.photo_url to TEXT for profile image data URLs. Run: python -m scripts.apply_photo_url_text_migration"""
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
        await conn.execute(text("ALTER TABLE users ALTER COLUMN photo_url TYPE TEXT"))
    print("users.photo_url widened to TEXT.")


if __name__ == "__main__":
    asyncio.run(main())
