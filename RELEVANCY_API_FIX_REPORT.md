# Relevancy API Fix Report

**Date:** 23 June 2026  
**Endpoint:** `GET /api/v1/projects/{project_id}/relevancy`  
**Issue:** HTTP 500 Internal Server Error  
**Scoring modified:** No  
**Schema modified:** No

---

## Executive Summary

| Item | Detail |
|------|--------|
| **Root cause** | SQLAlchemy async lazy-load (`MissingGreenlet`) on `project.professor.user` |
| **Fix** | Eager-load `professor.user` and `student.user` in `get_relevancy` query |
| **File changed** | `backend/app/routes/projects.py` (1 route, 2 `selectinload` lines) |
| **Verification** | IDs 31, 32, 38, 39, 40 → **HTTP 200** (admin) |

---

## 1. Reproduce the Error

### Before fix

```http
GET /api/v1/projects/31/relevancy
Authorization: Bearer <student-or-admin-token>
```

**Response:** `HTTP 500 Internal Server Error`

Same failure observed for university proposal IDs when relevancy data existed and `build_relevancy_result_response()` was invoked.

### Reproduction command

```powershell
cd backend
.\venv\Scripts\activate
python -c "
import asyncio, httpx
async def main():
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post('http://127.0.0.1:8000/api/v1/auth/login',
            json={'email':'70140912@student.uol.edu.pk','password':'Student123','role':'student'})
        h={'Authorization':'Bearer '+r.json()['access_token']}
        rel = await c.get('http://127.0.0.1:8000/api/v1/projects/31/relevancy', headers=h)
        print(rel.status_code)
asyncio.run(main())
"
```

**Before fix:** `500`  
**After fix:** `200`

---

## 2. Stack Trace (Captured)

From uvicorn server logs:

```
File "backend/app/routes/projects.py", line 150, in get_relevancy
    return project_service.build_relevancy_result_response(project, rel)

File "backend/app/services/project_service.py", line 428, in build_relevancy_result_response
    prof_name = project.professor.user.full_name if project.professor and project.professor.user else None
                                                                          ^^^^^^^^^^^^^^^^^^^^^^

sqlalchemy.exc.MissingGreenlet: greenlet_spawn has not been called; can't call await_only() here.
Was IO attempted in an unexpected place?
```

Secondary risk (same class of bug) when `ensure_relevancy_explanation()` or `run_relevancy_analysis()` calls `_to_relevancy_analysis_dict(project)` which accesses `project.student.user` without eager load.

---

## 3. Root Cause

FastAPI uses **async SQLAlchemy sessions**. The `get_relevancy` route loaded:

```python
selectinload(ProjectIdea.relevancy_result).selectinload(RelevancyResult.matched_projects)
selectinload(ProjectIdea.professor)  # professor row only — NOT professor.user
```

But `build_relevancy_result_response()` accesses:

```python
project.professor.user.full_name  # triggers lazy IO → MissingGreenlet in async context
```

Similarly, `_to_relevancy_analysis_dict()` reads `project.student.user.full_name` when explanations are generated on-the-fly.

**This is not a scoring bug** — it is an **ORM eager-loading gap** in the route query.

---

## 4. Fix Applied (Smallest Safe Change)

**File:** `backend/app/routes/projects.py`

**Change:** Add nested `selectinload` for relationships accessed downstream:

```python
.options(
    selectinload(ProjectIdea.relevancy_result).selectinload(RelevancyResult.matched_projects),
    selectinload(ProjectIdea.student).selectinload(Student.user),
    selectinload(ProjectIdea.professor).selectinload(Professor.user),
)
```

No changes to:
- `RelevancyEngine` / scoring logic
- Database schema
- Authentication rules
- `build_relevancy_result_response()` logic

---

## 5. Verification Results

### Target IDs (admin token)

| ID | Title (short) | HTTP | `explanation.status` |
|----|---------------|:----:|:--------------------:|
| **31** | Classroom noise + lecture notes | **200** | generated |
| **32** | Smart relocation | **200** | generated |
| **38** | CareerCraft AI | **200** | generated |
| **39** | CipherPlay | **200** | generated |
| **40** | Career coaching (Qaiser) | **200** | generated |

**All 5 required IDs: HTTP 200 ✅**

### Additional checks

| Caller | ID | HTTP | Notes |
|--------|---:|:----:|-------|
| Student `70140912` | 31 | 200 | Owner |
| Student `70140912` | 40 | 200 | Owner |
| Student `70140912` | 32 | 400 | Access denied — not owner (expected) |
| Admin | 31–40 | 200 | Full access |

HTTP **400 Access denied** for non-owners is correct authorization behavior, not a regression.

### Response payload sample (ID 38)

- `overall_score`: 63.63 (unchanged)
- `explanation.status`: `generated`
- `explanation.ollama_model`: `llama3.2`
- `explanation.why_relevant`: non-empty Ollama text

---

## 6. Files Changed

| File | Change |
|------|--------|
| `backend/app/routes/projects.py` | Added `selectinload(Student.user)` and `selectinload(Professor.user)` on `get_relevancy` query |

**Lines touched:** imports already present; `.options(...)` block expanded (2 lines).

---

## 7. UI Impact

`RelevancyResults.tsx` → `GET /projects/{id}/relevancy` now receives JSON successfully.  
`RelevancyExplanationPanel` displays generated Ollama explanations when `explanation.why_relevant` is present.

---

## 8. Prevention

Any async route that passes `ProjectIdea` to service functions accessing nested relationships must eager-load:

- `student.user`
- `professor.user`

Pattern already used correctly in `run_relevancy_analysis()` corpus query; now mirrored in `get_relevancy`.

---

*Fix verified 23 June 2026. No scoring or schema changes.*
