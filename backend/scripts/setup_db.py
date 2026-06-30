"""Full setup: check -> create DB -> tables -> seed. Run: python scripts/setup_db.py"""

import importlib.util
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_scripts = Path(__file__).resolve().parent


def run(script_name: str) -> None:
    path = _scripts / script_name
    print(f"\n>>> python {path.name}\n")
    import os
    env = os.environ.copy()
    env["PYTHONPATH"] = str(ROOT)
    r = subprocess.run([sys.executable, str(path)], cwd=ROOT, env=env)
    if r.returncode != 0:
        sys.exit(r.returncode)


def main() -> None:
    run("check_connection.py")
    run("create_database.py")
    run("init_schema.py")
    print("\n>>> python -m scripts.seed\n")
    import os
    env = os.environ.copy()
    env["PYTHONPATH"] = str(ROOT)
    subprocess.run([sys.executable, "-m", "scripts.seed"], cwd=ROOT, env=env, check=True)
    print("\nSetup complete.")


if __name__ == "__main__":
    main()
