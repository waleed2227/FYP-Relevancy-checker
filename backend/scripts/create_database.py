"""Create PostgreSQL database if it does not exist."""

import importlib.util
import sys
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "bootstrap", Path(__file__).resolve().parent / "_bootstrap.py"
)
_bootstrap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bootstrap)

try:
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
except ImportError:
    print("Install: pip install psycopg2-binary")
    sys.exit(1)

from app.config.settings import get_settings


def main() -> None:
    s = get_settings()
    print(f"Connecting as {s.db_user}@{s.db_host}:{s.db_port} ...")
    try:
        conn = psycopg2.connect(
            host=s.db_host,
            port=s.db_port,
            user=s.db_user,
            password=s.db_password,
            dbname="postgres",
            connect_timeout=10,
        )
    except psycopg2.OperationalError as e:
        print(f"Failed: {e}\nRun: python scripts/check_connection.py")
        sys.exit(1)

    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (s.db_name,))
    if cur.fetchone():
        print(f"Database '{s.db_name}' already exists.")
    else:
        cur.execute(f'CREATE DATABASE "{s.db_name}"')
        print(f"Database '{s.db_name}' created.")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
