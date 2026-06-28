"""Create all database tables. Run: python scripts/init_schema.py"""

import importlib.util
import asyncio
import sys
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "bootstrap", Path(__file__).resolve().parent / "_bootstrap.py"
)
_bootstrap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bootstrap)

from app.database import Base, engine
from app.database.connection import get_database_url
import app.models  # noqa: F401


async def main() -> None:
    print(f"Target DB: {get_database_url().split('@')[-1]}")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("All tables created successfully.")
    except Exception as e:
        print(f"Failed: {e}\nRun: python scripts/check_connection.py")
        sys.exit(1)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
