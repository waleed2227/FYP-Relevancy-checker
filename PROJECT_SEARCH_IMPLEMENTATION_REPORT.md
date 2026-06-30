# Project Search — Implementation Report

## Summary

A **Project Search** panel was added to the existing **Professor Dashboard** and **Admin Dashboard** (no new routes or pages). Professors and admins can search PostgreSQL projects by **ID** or **title** (partial match), view results in-place, and open full project details in a modal—including matched projects with drill-down.

---

## Files modified

| File | Change |
|------|--------|
| `backend/app/routes/projects.py` | Added `GET /projects/search`, `GET /projects/{id}`; professor/admin access guards |
| `backend/app/services/project_service.py` | `search_projects()`, `get_project_detail()`; `professorName` on queue items |
| `backend/app/schemas/project.py` | `professorName`, `professorEmail` on `ReviewQueueItem` |
| `Frontend/src/app/components/ProjectSearchPanel.tsx` | **New** — search UI + results table |
| `Frontend/src/app/components/ProjectSearchDetailModal.tsx` | **New** — full read-only detail modal (reuses proposal + relevancy sections) |
| `Frontend/src/app/utils/duplicateRisk.ts` | **New** — duplicate risk labels from stored similarity |
| `Frontend/src/app/components/ProfessorDashboard.tsx` | Embedded `ProjectSearchPanel` |
| `Frontend/src/app/components/AdminDashboard.tsx` | Embedded `ProjectSearchPanel` |

---

## APIs reused

| Endpoint | Use |
|----------|-----|
| `GET /api/v1/projects/search?q=` | Search by id substring or title (`ILIKE`) |
| `GET /api/v1/projects/{id}` | Load single project for detail / matched-project drill-down |
| `GET /api/v1/projects/{id}/relevancy` | AI scores, Ollama explanation, `matched_projects` |

Existing list endpoints (`/assigned`, `/all`) unchanged.

---

## New APIs

### `GET /projects/search?q={term}`

- **Auth:** Professor or Admin only
- **Query:** Partial match on `project_ideas.id` (cast to text) or `title`
- **Returns:** `ReviewQueueItem[]` (max 50), ordered by submission date desc
- **SQL:** `WHERE cast(id AS text) ILIKE '%term%' OR title ILIKE '%term%'`

### `GET /projects/{project_id}`

- **Auth:** Professor or Admin only
- **Returns:** Full `ReviewQueueItem` with all proposal fields and relevancy summary fields

---

## Search implementation

- **Backend:** Indexed-friendly `ILIKE` on title; id matched via `cast(id, String).ilike(pattern)`
- **Frontend:** Debounced live search (350ms) + explicit **Search** button
- **No duplicate data store** — reads directly from `project_ideas` + `relevancy_results`

---

## UI changes

### Professor Dashboard & Admin Dashboard

New **Project Search** section with:

- Search input (ID or title) — loads **all stored projects** on open, filters as you type
- Results table: **ID, Title, Student, Professor, Status, Category, Technologies, Submitted** — **no AI scores**
- **View Details** opens a read-only modal with **database proposal fields only** (description, problem statement, scope, technologies, student/professor info, etc.)

AI relevancy, similarity, Ollama explanations, and matched-project scores are **not shown** in this search flow — use Review Queue for AI-assisted review.

---

## Performance considerations

- Search limited to **50 results** per query
- Eager-loads `student.user`, `professor.user`, `relevancy_result` in one query (no N+1)
- Debounced frontend requests reduce API churn while typing
- No full-table fetch on dashboard load — search runs only when user types or clicks Search
- Relevancy/matched data loaded on demand when opening **View Details**

---

## Security

| Role | Project Search | View Details | Relevancy API |
|------|----------------|--------------|---------------|
| Admin | ✓ | ✓ | ✓ |
| Professor | ✓ | ✓ | ✓ (incl. matched-project drill-down) |
| Student | ✗ | ✗ | Own projects only (unchanged) |

---

## Confirmations

| Requirement | Status |
|-------------|--------|
| No AI engine changes | ✓ |
| No scoring changes | ✓ |
| No embedding changes | ✓ |
| No database schema changes | ✓ |
| Existing PostgreSQL reused | ✓ |
| No new page/route in frontend | ✓ |
| Detail modal pattern reused | ✓ (`ProjectProposalSections`, `RelevancyExplanationPanel`) |
| Matched projects reused (no recalculation) | ✓ |

---

*Generated for the dashboard project search feature.*
