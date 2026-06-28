"""One-off viva verification runner. Usage: python scripts/_viva_verify.py"""
import asyncio
import httpx

BASE = "http://127.0.0.1:8000"
API = BASE + "/api/v1"
RESULTS: list[tuple[str, str, str, str]] = []


def record(area: str, test: str, status: str, detail: str = "") -> None:
    RESULTS.append((area, test, status, detail))
    print(f"{status:7} | {area:12} | {test} | {detail}")


async def login(c: httpx.AsyncClient, email: str, pwd: str, role: str):
    r = await c.post(
        API + "/auth/login", json={"email": email, "password": pwd, "role": role}
    )
    if r.status_code != 200:
        return None, r.status_code, r.text[:120]
    return r.json()["access_token"], 200, ""


async def main() -> None:
    try:
        async with httpx.AsyncClient(timeout=90) as c:
            h = await c.get(BASE + "/health")
            record(
                "Infra",
                "Backend health",
                "PASS" if h.status_code == 200 else "FAIL",
                str(h.status_code),
            )
            d = await c.get(BASE + "/docs")
            record(
                "Infra",
                "Swagger /docs",
                "PASS" if d.status_code == 200 else "FAIL",
                str(d.status_code),
            )
            try:
                fe = await c.get("http://127.0.0.1:5173")
                record(
                    "Infra",
                    "Frontend :5173",
                    "PASS" if fe.status_code == 200 else "WARNING",
                    str(fe.status_code),
                )
            except Exception as ex:
                record("Infra", "Frontend :5173", "WARNING", str(ex)[:80])
            try:
                oll = await c.get("http://127.0.0.1:11434/api/tags")
                record(
                    "Infra",
                    "Ollama API",
                    "PASS" if oll.status_code == 200 else "WARNING",
                    str(oll.status_code),
                )
            except Exception as ex:
                record("Infra", "Ollama API", "WARNING", str(ex)[:80])

            st, _, err = await login(
                c, "70140912@student.uol.edu.pk", "Student123", "student"
            )
            record("Student", "Login", "PASS" if st else "FAIL", err or "OK")
            if st:
                hdr = {"Authorization": "Bearer " + st}
                me = await c.get(API + "/auth/me", headers=hdr)
                record(
                    "Student",
                    "GET /auth/me",
                    "PASS" if me.status_code == 200 else "FAIL",
                    str(me.status_code),
                )
                my = await c.get(API + "/projects/my", headers=hdr)
                cnt = len(my.json()) if my.status_code == 200 else 0
                record(
                    "Student",
                    "GET /projects/my",
                    "PASS" if my.status_code == 200 else "FAIL",
                    f"count={cnt}",
                )
                for pid in [31, 40]:
                    rel = await c.get(f"{API}/projects/{pid}/relevancy", headers=hdr)
                    if rel.status_code == 200:
                        body = rel.json()
                        exp = body.get("explanation") or {}
                        record(
                            "Student",
                            f"View relevancy #{pid}",
                            "PASS",
                            f"score={body.get('overall_score')} exp={exp.get('status')}",
                        )
                        ok_exp = bool(exp.get("why_relevant")) and exp.get("status") == "generated"
                        record(
                            "Student",
                            f"View explanation #{pid}",
                            "PASS" if ok_exp else "WARNING",
                            exp.get("status") or "missing",
                        )
                    else:
                        record(
                            "Student",
                            f"View relevancy #{pid}",
                            "FAIL",
                            str(rel.status_code),
                        )
                record(
                    "Student",
                    "Submit proposal",
                    "WARNING",
                    "POST /projects not run (avoids test DB mutation); route registered",
                )

            pr, _, err = await login(c, "professor@uol.edu.pk", "Professor123", "professor")
            record("Professor", "Login", "PASS" if pr else "FAIL", err or "OK")
            if pr:
                hdr = {"Authorization": "Bearer " + pr}
                rq = await c.get(API + "/projects/review-queue", headers=hdr)
                n = len(rq.json()) if rq.status_code == 200 else 0
                record(
                    "Professor",
                    "Review queue",
                    "PASS" if rq.status_code == 200 else "FAIL",
                    f"items={n}",
                )
                if rq.status_code == 200 and rq.json():
                    item = rq.json()[0]
                    has_rel = item.get("relevancyScore") is not None
                    has_exp = bool(item.get("aiExplanation"))
                    record(
                        "Professor",
                        "Project details in queue",
                        "PASS" if has_rel else "WARNING",
                        f"score={item.get('relevancyScore')} explanation={has_exp}",
                    )
                dup = await c.get(API + "/admin/duplicate-reports", headers=hdr)
                record(
                    "Professor",
                    "Duplicate alerts via admin API",
                    "WARNING" if dup.status_code in (403, 401) else "PASS",
                    f"HTTP {dup.status_code} (UI uses admin dashboard embed)",
                )

            ad, _, err = await login(c, "admin@uol.edu.pk", "Admin123", "admin")
            record("Admin", "Login", "PASS" if ad else "FAIL", err or "OK")
            dups = None
            if ad:
                hdr = {"Authorization": "Bearer " + ad}
                users = await c.get(API + "/admin/users", headers=hdr)
                record(
                    "Admin",
                    "Users list",
                    "PASS" if users.status_code == 200 else "FAIL",
                    f"count={len(users.json()) if users.status_code == 200 else 0}",
                )
                allp = await c.get(API + "/projects/all", headers=hdr)
                record(
                    "Admin",
                    "Projects list",
                    "PASS" if allp.status_code == 200 else "FAIL",
                    f"count={len(allp.json()) if allp.status_code == 200 else 0}",
                )
                dups = await c.get(API + "/admin/duplicate-reports", headers=hdr)
                nd = len(dups.json()) if dups.status_code == 200 else 0
                record(
                    "Admin",
                    "Duplicate reports",
                    "PASS" if dups.status_code == 200 else "FAIL",
                    f"count={nd}",
                )
                dash = await c.get(API + "/admin/dashboard", headers=hdr)
                record(
                    "Admin",
                    "Dashboard + duplicate alerts embed",
                    "PASS" if dash.status_code == 200 else "FAIL",
                    str(dash.status_code),
                )

            if ad:
                hdr = {"Authorization": "Bearer " + ad}
                all_ok = True
                for pid in [31, 32, 38, 39, 40]:
                    rel = await c.get(f"{API}/projects/{pid}/relevancy", headers=hdr)
                    ok = rel.status_code == 200
                    all_ok = all_ok and ok
                    if ok:
                        record(
                            "AI",
                            f"Relevancy scoring #{pid}",
                            "PASS",
                            f"overall={rel.json().get('overall_score')}",
                        )
                    else:
                        record("AI", f"Relevancy scoring #{pid}", "FAIL", str(rel.status_code))
                if dups and dups.status_code == 200 and dups.json():
                    top = max(dups.json(), key=lambda x: x.get("similarityScore", 0))
                    record(
                        "AI",
                        "Duplicate detection",
                        "PASS",
                        f"max={top.get('similarityScore')}% risk={top.get('riskLevel')}",
                    )
                elif dups and dups.status_code == 200:
                    record("AI", "Duplicate detection", "WARNING", "no reports")
                rel38 = await c.get(f"{API}/projects/38/relevancy", headers=hdr)
                if rel38.status_code == 200:
                    e = rel38.json().get("explanation") or {}
                    record(
                        "AI",
                        "Ollama explanations (university)",
                        "PASS" if e.get("status") == "generated" else "WARNING",
                        e.get("status") or "none",
                    )

    except httpx.ConnectError as ex:
        record("Infra", "Backend reachable", "FAIL", str(ex))


if __name__ == "__main__":
    asyncio.run(main())
