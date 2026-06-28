"""
Test PostgreSQL connection using credentials from backend/.env

Run from backend folder:
    python scripts/check_connection.py
"""

import importlib.util
import sys
from pathlib import Path

# Load bootstrap without requiring 'scripts' package on PYTHONPATH
_bootstrap_path = Path(__file__).resolve().parent / "_bootstrap.py"
_spec = importlib.util.spec_from_file_location("bootstrap", _bootstrap_path)
_bootstrap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bootstrap)
BACKEND_ROOT = _bootstrap.BACKEND_ROOT

import asyncio


def check_sync() -> bool:
    try:
        import psycopg2
    except ImportError:
        print("Missing package: pip install psycopg2-binary")
        return False

    from app.config.settings import get_settings

    s = get_settings()
    print(f"Host: {s.db_host}:{s.db_port}")
    print(f"User: {s.db_user}")
    print(f"Database (target): {s.db_name}")
    print(f"Password: {'*' * len(s.db_password)} ({len(s.db_password)} chars)")
    print()

    try:
        conn = psycopg2.connect(
            host=s.db_host,
            port=s.db_port,
            user=s.db_user,
            password=s.db_password,
            dbname="postgres",
            connect_timeout=5,
        )
        conn.close()
        print("SUCCESS: PostgreSQL accepted your password.")
        return True
    except psycopg2.OperationalError as e:
        err = str(e)
        print("FAILED: Could not connect to PostgreSQL.")
        print(f"  {err}")
        print()
        if "password authentication failed" in err:
            print("FIX: Edit backend/.env and set DB_PASSWORD to your real PostgreSQL password.")
            print("  (The password you set when installing PostgreSQL / pgAdmin)")
            print("  Your .env had a typo: postgre123 vs postgres123 – they must match exactly.")
        elif "Connection refused" in err:
            print("FIX: Start PostgreSQL service in Windows Services.")
        return False


async def check_async() -> bool:
    try:
        import asyncpg
    except ImportError:
        print("Missing: pip install asyncpg")
        return False

    from app.database.connection import get_database_url

    dsn = get_database_url().replace("postgresql+asyncpg://", "postgresql://")
    try:
        conn = await asyncpg.connect(dsn, timeout=5)
        await conn.close()
        print("SUCCESS: asyncpg OK (same driver as FastAPI).")
        return True
    except Exception as e:
        print(f"FAILED asyncpg: {e}")
        return False


async def main() -> None:
    print("=" * 55)
    print("PostgreSQL connection check")
    print(f".env: {BACKEND_ROOT / '.env'}")
    print("=" * 55)
    print()

    if not check_sync():
        sys.exit(1)
    print()
    if await check_async():
        print("\nNext: python scripts/setup_db.py")
        sys.exit(0)
    sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
