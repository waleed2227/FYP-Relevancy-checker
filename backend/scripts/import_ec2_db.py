"""Import local_database_dump.json into PostgreSQL. Run: python scripts/import_ec2_db.py"""

import importlib.util
import json
import sys
from pathlib import Path

_bootstrap_path = Path(__file__).resolve().parent / "_bootstrap.py"
_spec = importlib.util.spec_from_file_location("bootstrap", _bootstrap_path)
if _spec is None or _spec.loader is None:
    raise RuntimeError(f"Failed to load bootstrap module from {_bootstrap_path}")
_bootstrap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bootstrap)
BACKEND_ROOT = _bootstrap.BACKEND_ROOT

try:
    import psycopg2
except ImportError:
    print("Install: pip install psycopg2-binary")
    sys.exit(1)

from app.config.settings import get_settings

DUMP_PATH = BACKEND_ROOT / "local_database_dump.json"

TABLES = [
    "departments", "users", "students", "professors", "admins",
    "project_ideas", "relevancy_results", "matched_projects",
    "reviews", "notifications", "ai_suggestions", "duplicate_reports",
]


def import_db() -> None:
    if not DUMP_PATH.is_file():
        print(f"Dump not found: {DUMP_PATH}\nRun: python scripts/export_local_db.py")
        sys.exit(1)

    s = get_settings()
    print(f"Connecting to {s.db_user}@{s.db_host}:{s.db_port}/{s.db_name} ...")
    try:
        conn = psycopg2.connect(
            dbname=s.db_name,
            user=s.db_user,
            password=s.db_password,
            host=s.db_host,
            port=s.db_port,
            connect_timeout=10,
        )
    except psycopg2.OperationalError as e:
        print(f"Failed: {e}\nRun: python scripts/check_connection.py")
        sys.exit(1)

    cur = conn.cursor()

    with open(DUMP_PATH, encoding="utf-8") as f:
        data = json.load(f)

    for table in reversed(TABLES):
        cur.execute(f"TRUNCATE TABLE {table} CASCADE")

    for table in TABLES:
        rows = data.get(table, [])
        if not rows:
            continue
        cols = list(rows[0].keys())
        col_str = ", ".join(cols)
        val_str = ", ".join([f"%({col})s" for col in cols])
        query = f"INSERT INTO {table} ({col_str}) VALUES ({val_str})"
        for row in rows:
            cur.execute(query, row)

        if "id" in cols:
            cur.execute(
                f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
                f"COALESCE((SELECT MAX(id) FROM {table}), 1), true)"
            )

    conn.commit()
    cur.close()
    conn.close()

    project_count = len(data.get("project_ideas", []))
    print(f"Successfully imported local database dump ({project_count} project ideas) into {s.db_name}!")


if __name__ == "__main__":
    import_db()
