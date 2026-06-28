# Viva Readiness Fix Report (Phase A)

**Date:** 2026-06-07  
**Scope:** Frontend-only Phase A polish from `MASTER_PROJECT_STATUS_REPORT.md`

---

## Summary

Phase A viva readiness fixes remove mock dashboard widgets, eliminate dead admin buttons, complete student proposal edit fields, align professor dashboard review with Review Queue, and update stale relevancy copy. **No backend, auth, relevancy engine, Ollama service, notification, review workflow, or database schema changes were made.**

---

## Files Modified

| File | Change |
|------|--------|
| `Frontend/src/app/components/AIInsightsPanel.tsx` | Replaced hardcoded insights with API-driven builders |
| `Frontend/src/app/components/StudentDashboard.tsx` | Passes real project/stats data to insights panel |
| `Frontend/src/app/components/ProfessorDashboard.tsx` | Real insights; `AdvancedReviewModal`; revision; search; logged-in email |
| `Frontend/src/app/components/AdminUsers.tsx` | Removed dead Edit/Delete and fake pagination buttons |
| `Frontend/src/app/components/AdminStudents.tsx` | Removed dead Edit/Delete buttons |
| `Frontend/src/app/components/MyProjects.tsx` | Added Category + Target Industry to edit form |
| `Frontend/src/app/components/IdeaSubmissionForm.tsx` | Updated relevancy description copy |
| `Frontend/src/app/components/AdvancedReviewModal.tsx` | Feedback suggestions from stored explanation (not hardcoded) |

---

## Task 1 — Mock AI Insight Widgets

### Before
`AIInsightsPanel.tsx` used hardcoded arrays (e.g. “Average: 82%”, “3 proposals need attention”, “AI/ML +45%”).

### After
- **`buildStudentDashboardInsights()`** — derives from `GET /projects/my` + `GET /projects/stats`:
  - Total submissions, pending review, approved projects, average relevancy (computed from real scores)
- **`buildProfessorDashboardInsights()`** — derives from `GET /projects/assigned`:
  - Pending review count, high-similarity pending count (`similarityScore >= 40`), average relevancy, most-used technology (parsed from submission technologies)

### Mock data removed
All hardcoded insight strings in `AIInsightsPanel.tsx` (professor and student arrays).

---

## Task 2 — Admin Users Page

### Issue
Edit and Delete buttons had no `onClick` handlers; pagination Previous/Next/2 were non-functional.

### Fix (Option B)
- Removed **Edit** and **Delete** buttons (no backend APIs exist; avoids dead UI)
- Removed fake pagination controls; kept accurate “Showing X of Y users” count
- **View** and **Add New User** remain functional

---

## Task 3 — Admin Students Page

### Issue
Edit and Delete buttons had no handlers.

### Fix (Option B)
- Removed **Edit** and **Delete** buttons
- **View Profile** and **Add Student** (via create modal) remain functional

---

## Task 4 — Student Edit Project Form

### Added fields
In `MyProjects.tsx` edit modal:
- **Category** — `<select>` using `PROJECT_CATEGORIES`
- **Target Industry** — text input

### Persistence
Edit save already calls `PATCH /projects/{id}` with `proposalFieldsToApiPayload()`, which maps:
- `category` → `category`
- `targetIndustry` → `target_industry`

Backend `_PROPOSAL_ATTRS` and `_relevancy_rerun_needed()` handle these fields; relevancy re-analysis triggers on change (existing backend behavior, unchanged in this task).

### Verification
- Form loads values via `proposalFieldsFromProject()` (includes category/targetIndustry)
- Payload includes both fields on save

---

## Task 5 — Professor Dashboard Parity

### Before
- `ProjectDetailsModal` — approve/reject only; no revision; no Ollama explanation; no full proposal sections

### After
- Replaced with **`AdvancedReviewModal`** (same component as Review Queue)
- **Approve** — `POST /projects/{id}/review` with `action: approve`
- **Reject** — `action: reject`
- **Revision Request** — `action: revision` (new on dashboard)
- **Ollama Explanation** — `RelevancyExplanationPanel` loads via `GET /projects/{id}/relevancy` when not preloaded
- Full **`ProjectProposalSections`** in modal
- Search filter wired to student name, title, technologies
- Email banner uses **logged-in professor email** from `useAuth()` (removed hardcoded `sarah.smith@university.edu`)

### Professor dashboard parity verification

| Capability | Review Queue | Professor Dashboard |
|------------|--------------|---------------------|
| Approve | ✅ | ✅ |
| Reject | ✅ | ✅ |
| Revision | ✅ | ✅ |
| Ollama explanation | ✅ | ✅ |
| Full proposal view | ✅ | ✅ |
| AI feedback suggestions | From explanation | From explanation |

---

## Task 6 — Stale UI Copy

### Updated
`IdeaSubmissionForm.tsx` — relevancy info box now describes:
- Weighted proposal-based analysis (problem statement, proposed solution, innovation, scope, market context, core fields)
- Ollama explanation after scoring

### Removed wording
References implying analysis uses **only** title, technologies, and description.

---

## Additional Fix (Related Mock Data)

`AdvancedReviewModal.tsx`:
- Removed hardcoded AI feedback suggestion strings
- Suggestions now come from **`explanation.novelty_suggestions`** (stored relevancy explanation API)
- Removed non-functional **Regenerate** button
- Section hidden when no suggestions exist

---

## Unchanged (Per Requirements)

| System | Status |
|--------|--------|
| Authentication | ✅ Not modified |
| Relevancy Engine | ✅ Not modified |
| Ollama Integration (backend) | ✅ Not modified |
| Notifications | ✅ Not modified |
| Review Workflow (backend) | ✅ Not modified |
| Database Schema | ✅ Not modified |

---

## Manual Test Checklist

1. **Student dashboard** — insights show counts/averages matching project list (not fake percentages)
2. **Professor dashboard** — insights reflect assigned submissions; open Review → full modal with explanation
3. **Professor dashboard** — submit revision request on pending project
4. **Admin Users/Students** — no Edit/Delete buttons visible
5. **My Projects → Edit** — change category/industry → save → reload → values persist
6. **Submit form** — relevancy copy mentions weighted proposal analysis

---

## Remaining Phase B+ Items (Out of Scope)

- Admin user/student edit/delete APIs (if full CRUD desired later)
- Link relevancy results from My Projects list
- Update `USER_MANUAL_SCREEN_REPORT.md` for these UI changes
- Broader automated frontend tests
