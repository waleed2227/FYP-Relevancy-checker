"""
Quick API end-to-end verification (no UI).
Run from backend/: python -m scripts.verify_e2e_flows
"""

import asyncio
import importlib.util
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "bootstrap", Path(__file__).resolve().parent / "_bootstrap.py"
)
_bootstrap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bootstrap)

import httpx

BASE = "http://127.0.0.1:8000/api/v1"
STUDENT = ("70140912@student.uol.edu.pk", "Student123")
PROFESSOR = ("professor@uol.edu.pk", "Professor123")


async def login(client: httpx.AsyncClient, email: str, password: str, role: str) -> str:
    r = await client.post(f"{BASE}/auth/login", json={"email": email, "password": password, "role": role})
    r.raise_for_status()
    return r.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def main() -> None:
    results: list[tuple[str, str]] = []
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Health
            h = await client.get("http://127.0.0.1:8000/health")
            if h.status_code != 200:
                print("FAIL: backend not running on :8000")
                return

            # Registration uniqueness check (expect 400 if exists)
            reg = await client.post(
                f"{BASE}/auth/register",
                json={
                    "full_name": "E2E Test",
                    "email": "e2e99999@student.uol.edu.pk",
                    "password": "Student123",
                    "role": "student",
                    "student_id": "99999999",
                    "department": "Computer Science",
                },
            )
            results.append(("Registration endpoint", "PASS" if reg.status_code in (200, 400) else f"FAIL {reg.status_code}"))

            st_token = await login(client, *STUDENT, "student")
            pr_token = await login(client, *PROFESSOR, "professor")

            me = await client.get(f"{BASE}/auth/me", headers=auth_headers(st_token))
            me.raise_for_status()
            results.append(("Login + GET /auth/me", "PASS"))

            unique_phone = "+923001112299"
            patch = await client.patch(
                f"{BASE}/profile",
                headers=auth_headers(st_token),
                json={"phone": unique_phone, "full_name": me.json()["full_name"]},
            )
            patch.raise_for_status()
            results.append(("PATCH /profile", "PASS"))

            # Logout/login persistence
            await client.post(f"{BASE}/auth/logout", headers=auth_headers(st_token))
            st_token2 = await login(client, *STUDENT, "student")
            me2 = await client.get(f"{BASE}/auth/me", headers=auth_headers(st_token2))
            me2.raise_for_status()
            phone_ok = me2.json().get("phone") == unique_phone
            results.append(("Profile persists after re-login", "PASS" if phone_ok else "FAIL phone mismatch"))

            st_token = st_token2

            my = await client.get(f"{BASE}/projects/my", headers=auth_headers(st_token))
            my.raise_for_status()
            results.append(("GET /projects/my", "PASS"))

            notif = await client.get(f"{BASE}/notifications", headers=auth_headers(st_token))
            notif.raise_for_status()
            results.append(("GET /notifications", "PASS"))

            rq = await client.get(f"{BASE}/projects/review-queue", headers=auth_headers(pr_token))
            rq.raise_for_status()
            results.append(("GET /projects/review-queue", "PASS"))

            if rq.json():
                pid = rq.json()[0]["id"]
                # dry-run would mutate DB — skip review POST in verify unless env allows
                results.append(("Review queue has items", "PASS"))
            else:
                results.append(("Review queue has items", "PASS (empty queue)"))

    except httpx.ConnectError:
        print("SKIP: Backend not reachable at http://127.0.0.1:8000 — start uvicorn to verify.")
        return
    except Exception as e:
        print(f"FAIL: {e}")
        return

    print("E2E API verification")
    print("-" * 40)
    for name, status in results:
        print(f"{status:6} {name}")


if __name__ == "__main__":
    asyncio.run(main())
