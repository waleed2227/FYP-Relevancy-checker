"""Export local PostgreSQL data to JSON. Run: python scripts/export_local_db.py"""

import importlib.util
import json
import sys
from datetime import date, datetime, time
from decimal import Decimal
from pathlib import Path
from uuid import UUID

_bootstrap_path = Path(__file__).resolve().parent / "_bootstrap.py"
_spec = importlib.util.spec_from_file_location("bootstrap", _bootstrap_path)
if _spec is None or _spec.loader is None:
    raise RuntimeError(f"Failed to load bootstrap module from {_bootstrap_path}")
_bootstrap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bootstrap)
BACKEND_ROOT = _bootstrap.BACKEND_ROOT

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("Install: pip install psycopg2-binary")
    sys.exit(1)

from app.config.settings import get_settings

OUTPUT_PATH = BACKEND_ROOT / "local_database_dump.json"

TABLES = [
    "departments", "users", "students", "professors", "admins",
    "project_ideas", "relevancy_results", "matched_projects",
    "reviews", "notifications", "ai_suggestions", "duplicate_reports",
]


class CustomEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, (datetime, date, time)):
            return o.isoformat()
        if isinstance(o, Decimal):
            return float(o)
        if isinstance(o, UUID):
            return str(o)
        return super().default(o)


def export_db() -> None:
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

    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    data = {}
    for table in TABLES:
        cur.execute(f"SELECT * FROM {table}")
        data[table] = [dict(row) for row in cur.fetchall()]

    cur.close()
    conn.close()

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, cls=CustomEncoder, indent=2)

    project_count = len(data["project_ideas"])
    print(f"Successfully exported local database ({project_count} project ideas) to {OUTPUT_PATH}!")


if __name__ == "__main__":
    export_db()
