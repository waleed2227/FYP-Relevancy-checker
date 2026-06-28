# Master Project Status Report

**Project:** AI-Based FYP Relevancy System  
**Audit date:** 2026-06-07  
**Method:** Read-only static analysis of `backend/app`, `Frontend/src/app`, migration scripts, and existing audit documents. No code was modified. Findings are based on routed/active components and live API wiring only.

---

## Executive Summary

The **core FYP workflow is implemented and database-backed**: register/login → submit structured proposal → TF-IDF relevancy + Ollama explanation → professor review (approve/reject/revision) → notifications. Major gaps are **decorative admin CRUD buttons without APIs**, **mock dashboard insight widgets**, **partial student edit UI**, **unused AI-suggestions pipeline**, and **limited automated test coverage**.

| Area | Completion | Notes |
|------|------------|-------|
| **Overall project** | **~82%** | Core demo-ready; polish and dead UI remain |
| **Frontend (active routes)** | **~78%** | Most pages use real APIs; mock widgets and broken buttons persist |
| **Backend** | **~88%** | PostgreSQL-backed REST API; a few endpoints/tables unused |
| **AI engine** | **~80%** | Weighted TF-IDF + duplicate reports + Ollama explanations done; no sentence-transformers |
| **Documentation** | **~72%** | Many implementation/audit reports; user manual partially stale vs latest AI features |

**FYP readiness:** **Demonstration-ready** for end-to-end workflow. **Viva-ready with caveats** — be prepared to explain mock dashboard widgets, non-functional admin Edit/Delete buttons, and TF-IDF limitations.

---

## 1. Module Audit

### Authentication

| Feature | Status | Evidence |
|---------|--------|----------|
| Login | **Complete** | `POST /api/v1/auth/login` → JWT; `Login.tsx` → `authService.ts` |
| Registration | **Complete** | `POST /api/v1/auth/register` (student/professor); `Registration.tsx` |
| JWT access + refresh | **Complete** | `app/auth/security.py`; tokens in `localStorage` via `api.ts` |
| Role-based access | **Complete** | `StudentUser`, `ProfessorUser`, `AdminUser` in `dependencies.py` |
| Student role | **Complete** | Student profile on register; student-only project routes |
| Professor role | **Complete** | Professor profile; review routes |
| Admin role | **Complete** | Admin via seed or `POST /admin/users`; admin routes guarded |
| Logout | **Complete** | Client-side token discard (`POST /auth/logout` stateless) |
| Password reset / email verify | **Missing** | Not implemented |
| Admin self-registration | **Missing** | By design — admin created by seed/admin API |

---

### Student Module

| Feature | Status | Data source | Notes |
|---------|--------|-------------|-------|
| Dashboard | **Partial** | Real: `GET /projects/my`, `GET /projects/stats` | Mock: `AIInsightsPanel.tsx` hardcoded cards (lines 48–77) |
| Submit Project | **Complete** | `POST /projects` | Full 10-section form + relevancy on submit |
| Edit Project | **Partial** | `PATCH /projects/{id}` | Works for pending/revision; **category/target industry not in edit UI** (`MyProjects.tsx` — no `showSection1`) |
| My Projects | **Complete** | `GET /projects/my` | Detail modal shows full proposal via `ProjectProposalSections` |
| Profile | **Complete** | `GET /auth/me`, `PATCH /profile` | Photo upload with compression (`profilePhoto.ts`) |
| Notifications | **Complete** | `GET/PATCH/DELETE /notifications` | Real DB via `NotificationContext` |
| Relevancy Results | **Complete** | `GET /projects/{id}/relevancy` | Shown after submit; includes Ollama explanation panel |

**Stale UI copy:** `IdeaSubmissionForm.tsx` (lines 231–234) still says analysis uses only “title, technologies, and description” — engine now uses weighted proposal fields.

---

### Professor Module

| Feature | Status | Data source | Notes |
|---------|--------|-------------|-------|
| Dashboard | **Partial** | Real: `GET /projects/assigned` | Mock: `AIInsightsPanel.tsx` (lines 17–46); hardcoded email `sarah.smith@university.edu` (line 157); search not wired |
| Review Queue | **Complete** | `GET /projects/review-queue` | Full proposal + Ollama via `AdvancedReviewModal` |
| Approve | **Complete** | `POST /projects/{id}/review` | Review Queue + Dashboard (`ProjectDetailsModal`) |
| Reject | **Complete** | Same | Review Queue + Dashboard |
| Revision Request | **Partial** | Same API | **Only in Review Queue** (`AdvancedReviewModal`); **not on Dashboard** modal |
| Notifications | **Complete** | Notification APIs | Created on submit/review from backend |
| Profile | **Complete** | Profile APIs | Shared `ProfileEdit.tsx` |

---

### Admin Module

| Feature | Status | Real DB | Mock / broken |
|---------|--------|---------|---------------|
| Dashboard | **Complete** | `GET /admin/dashboard` | Stats + duplicate alerts from `duplicate_reports` |
| Users (list) | **Complete** | `GET /admin/users` | — |
| Students (list) | **Complete** | `GET /admin/students` | — |
| Professors (list) | **Complete** | `GET /admin/professors` | — |
| Project Ideas | **Complete** | `GET /projects/all` + relevancy detail | Ollama panel on detail modal |
| Add User | **Complete** | `POST /admin/users` | `AdminCreateUserModal.tsx` |
| Add Student | **Complete** | Same (fixed role student) | — |
| Add Professor | **Complete** | Same (fixed role professor) | — |
| View Profile | **Complete** | `AdminRecordDetailModal` | Read-only |
| Edit User | **Missing** | No `PATCH /admin/users/{id}` | Edit button **no handler** — `AdminUsers.tsx` lines 234–236 |
| Delete User | **Missing** | No delete endpoint | Trash button **no handler** — lines 237–239 |
| Edit Student | **Missing** | No student update API | Edit button **no handler** — `AdminStudents.tsx` lines 265–267 |
| Delete Student | **Missing** | No delete endpoint | Trash button **no handler** — lines 268–270 |
| Edit Professor | **Complete** | `PATCH /admin/professors/{id}` | `AdminEditProfessorModal.tsx` |
| Delete Professor | **Complete** | `DELETE /admin/professors/{id}` | `AdminProfessors.tsx` |

**Admin gaps:** No admin profile page, no admin notifications page (`AdminSidebar.tsx` — dashboard, users, students, professors, projects only).

---

### Proposal System

| Area | Status | Evidence |
|------|--------|----------|
| 10 proposal sections (submit) | **Complete** | `IdeaSubmissionForm.tsx` + `ProjectProposalSections.tsx` |
| 10 sections (display) | **Complete** | Shared `ProjectProposalSections` on student/professor/admin detail views |
| 10 sections (edit) | **Partial** | Sections 2–10 editable; **Section 1 category/industry not in edit form** |
| Database schema | **Complete** | 29+ nullable columns on `project_ideas` (`models/project.py`); v3 migration scripts |
| APIs (create/update/read) | **Complete** | `ProjectCreate`, `ProjectUpdate`, `ProjectResponse`, `ReviewQueueItem` |
| Student view | **Complete** | Submit, My Projects detail, Relevancy Results |
| Professor view | **Complete** | Review Queue + Advanced Review modal |
| Admin view | **Complete** | Admin Projects detail modal |
| Legacy `riskAssessment` | **Partial** | DB column retained; not in v3 form or display component |
| Legacy `futureScope` | **Partial** | Read-only fallback in `_proposal_fields()` only |

---

### AI Relevancy Engine

| Component | Status | Details |
|-----------|--------|---------|
| Similarity engine | **Complete** | `RelevancyEngine.analyze()` in `relevancy_engine.py` |
| TF-IDF | **Complete** | `embeddings.py` — bag-of-words + cosine (unchanged algorithm) |
| Cosine similarity | **Complete** | `similarity_between()` pairwise |
| Weighted fields | **Complete** | Critical×3, High×2, Standard×1 (`CRITICAL_FIELDS`, `HIGH_FIELDS`, `STANDARD_FIELDS`) |
| Proposal integration | **Complete** | 16 fields in combined text via `_to_relevancy_analysis_dict()` |
| Duplicate detection | **Complete** | `duplicate_service.py` from matched projects; admin dashboard alerts |
| Re-analysis on edit | **Complete** | `_relevancy_rerun_needed()` → `run_relevancy_analysis()` on `PATCH /projects/{id}` |
| Heuristic scores | **Partial** | Improved inputs (scope, tech, market); still keyword/heuristic-based |
| Sentence Transformers | **Missing** | Commented future path only |
| OpenAI embeddings | **Missing** | `openai_api_key` in settings unused |
| Unit tests | **Partial** | `tests/test_relevancy_engine.py` — 10 tests, engine only |

**Current algorithm:** Weighted text concatenation → TF-IDF cosine vs all other projects (configurable `RELEVANCY_CORPUS_LIMIT`, default unlimited) → threshold matches → heuristic sub-scores → overall formula unchanged.

**Current limitations (factual):**

- Bag-of-words misses paraphrase semantics  
- No embedding cache / vector store  
- Heuristic tech lists (`MODERN_TECH` / `LEGACY_TECH`) are static  
- `category`, impact sub-fields, feasibility text not in similarity weights  
- Scores stored at analysis time — pre-weighted projects differ until re-analyzed  

---

### Ollama Integration

| Feature | Status | Evidence |
|---------|--------|----------|
| Explanation generation | **Complete** | `ollama_service.py` → `POST {OLLAMA_BASE_URL}/api/generate`; fallback if unavailable |
| Stored in DB | **Complete** | Columns on `relevancy_results` (no schema change in this audit) |
| Student explanation page | **Complete** | `RelevancyResults.tsx` → `RelevancyExplanationPanel` |
| Professor explanation page | **Partial** | **Review Queue only** (`AdvancedReviewModal`); not on professor dashboard modal |
| Admin explanation page | **Complete** | `AdminProjects.tsx` detail modal |
| Ollama affects similarity | **Not implemented** | By design — separate from TF-IDF |

---

### Database

| Table | Used by active app? | Relationships |
|-------|---------------------|---------------|
| `users` | **Yes** | 1:1 student/professor/admin; 1:N notifications |
| `students` | **Yes** | → projects, department |
| `professors` | **Yes** | → supervised projects, reviews |
| `admins` | **Yes** | Admin auth only |
| `departments` | **Yes** | Registration, profiles, admin lists |
| `project_ideas` | **Yes** | Core entity; 29+ proposal columns |
| `relevancy_results` | **Yes** | 1:1 project; scores + Ollama explanation |
| `matched_projects` | **Yes** | Linked to relevancy results |
| `reviews` | **Yes** | Written on professor review action |
| `notifications` | **Yes** | Submit + review events |
| `duplicate_reports` | **Partial** | Created from relevancy; **read-only** admin API (no status update endpoint) |
| `ai_suggestions` | **Unused in practice** | Table + GET/PATCH/DELETE API exist; **no code creates rows** |

**Missing relationships / gaps:** No FK from notifications to projects (message text only). Duplicate report review workflow not exposed in API.

---

## 2. API Audit

### Working APIs (used by active UI)

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /auth/register`, `/login`, `/refresh`, `/logout`, `GET /auth/me` |
| Projects | `POST /projects`, `PATCH /projects/{id}`, `GET /my`, `/stats`, `/assigned`, `/review-queue`, `/all`, `/{id}/relevancy`, `POST /{id}/review` |
| Profile | `PATCH /profile` |
| Notifications | `GET/PATCH/DELETE /notifications`, `PATCH /read-all` |
| Admin | `GET /admin/dashboard`, `POST/GET /admin/users`, `GET /admin/students`, `GET/PATCH/DELETE /admin/professors/*`, `GET /admin/professors/stats`, `GET /admin/duplicate-reports` |

### Unused APIs (no active frontend consumer)

| Endpoint | Reason |
|----------|--------|
| `GET /admin/departments` | Admin Departments page deprecated (`navigation.ts`) |
| `GET/PATCH/DELETE /ai-suggestions` | AI Suggestions page deprecated; no backend writer |
| `GET /health` | Not used by frontend |

### Missing APIs (UI implies feature)

| Expected capability | Gap |
|---------------------|-----|
| Admin edit/delete user | No `PATCH/DELETE /admin/users/{id}` |
| Admin edit/delete student | No student-specific update/delete |
| Duplicate report dismiss/review | No `PATCH /admin/duplicate-reports/{id}` |
| File upload on submit | Removed; legacy `uploads/` folder only |

---

## 3. Mock Data Audit

### Active routes (still rendered)

| File | Lines (approx.) | Type |
|------|-----------------|------|
| `Frontend/src/app/components/AIInsightsPanel.tsx` | 17–77 | Hardcoded professor/student insight cards |
| `Frontend/src/app/components/AdvancedReviewModal.tsx` | 39–43, 294–297 | Hardcoded AI feedback suggestions; non-functional Regenerate |
| `Frontend/src/app/components/ProfessorDashboard.tsx` | 157 | Hardcoded example supervisor email |
| `Frontend/src/app/context/NotificationContext.tsx` | 77–86 | `localStorage` key `aiSuggestions` — never seeded from API |
| `Frontend/src/app/components/IdeaSubmissionForm.tsx` | 231–234 | Outdated relevancy description text |
| `Frontend/src/app/components/AdminUsers.tsx` | 234–239, 255–257 | Edit/Delete/Previous/Next buttons without handlers |
| `Frontend/src/app/components/AdminStudents.tsx` | 265–270 | Edit/Delete buttons without handlers |

### Deprecated (on disk, not routed in `App.tsx`)

Listed in `Frontend/src/app/navigation.ts` `DEPRECATED_SCREENS`:

| File | Mock content |
|------|--------------|
| `AllProjects.tsx` | Hardcoded fake projects |
| `AdminApprovals.tsx` | Hardcoded pending approvals |
| `AdminAIReports.tsx` | Hardcoded AI reports |
| `AdminDepartments.tsx` | Hardcoded departments |
| `AdminAnalytics.tsx` | Hardcoded analytics |
| `AdminSettings.tsx` | Static settings UI |
| `AIAnalytics.tsx` | Hardcoded analytics totals |
| `AISuggestions.tsx` | localStorage-only suggestions |

### Backend non-DB / synthetic data

| Location | Purpose |
|----------|---------|
| `backend/scripts/seed.py` | Test accounts + optional sample project |
| `backend/app/ai/relevancy_engine.py` | Template summaries; tech keyword lists |
| `backend/app/ai/ollama_service.py` | Rule-based fallback explanations |
| `backend/app/services/duplicate_service.py` | Templated duplicate analysis strings |
| `backend/app/services/admin_service.py` | Synthetic `PROF{id}` IDs; `averageRating` derived from relevancy avg |

---

## 4. Documentation Audit

| Document type | Status | Notes |
|---------------|--------|-------|
| User manual readiness | **Partial** | `USER_MANUAL_SCREEN_REPORT.md` covers 17 active screens; predates weighted relevancy + Ollama UI updates |
| Chapter 8 readiness | **Partial** | No file named “Chapter 8”; screen report serves as draft; needs refresh for AI explanation + weighted engine |
| Implementation reports | **Complete** | Multiple reports: proposal form, Ollama, weighted relevancy, integration audits |
| Testing readiness | **Partial** | 10 unit tests for relevancy engine only; `scripts/verify_e2e_flows.py` exists but not CI-integrated |
| Viva readiness | **Partial** | Strong architecture docs (`PROJECT_BACKEND_GUIDE.md`, audits); must explain mock widgets and TF-IDF limits |

---

## 5. Completed Features

- JWT authentication with student/professor/admin roles  
- Student registration and login (UOL email validation)  
- Structured 10-section proposal submit with PostgreSQL persistence  
- Weighted TF-IDF relevancy analysis on submit and on proposal edit  
- Matched projects + duplicate report generation  
- Ollama explanation layer with DB persistence and fallback  
- Student relevancy results page with explanation  
- Professor review queue with approve/reject/revision + Ollama explanation  
- Professor review notifications  
- Student my projects, edit (sections 2–10), profile with photo  
- Admin dashboard with real stats and duplicate alerts  
- Admin professor CRUD (list, add, view, edit, delete)  
- Admin user/student list + create user  
- Admin project list with full proposal + AI analysis detail  
- Real-time notifications (DB-backed) for students and professors  

---

## 6. Partially Completed Features

- Student dashboard (real project stats + mock AI insights panel)  
- Professor dashboard (real assigned projects; mock insights; no revision from dashboard modal)  
- Student edit proposal (missing category/target industry in edit UI)  
- Admin user/student management (view + create only; decorative edit/delete)  
- Proposal legacy fields (`riskAssessment`, `futureScope` display gaps)  
- AI relevancy heuristics (improved inputs; still non-ML)  
- Ollama on professor dashboard review path  
- Automated testing (engine unit tests only)  
- User manual / Chapter 8 (exists but not fully current)  
- Duplicate report workflow (detection yes; admin review/dismiss no)  

---

## 7. Missing Features

- Password reset / email verification  
- Admin edit/delete user and edit/delete student (API + UI)  
- Duplicate report status update API  
- AI suggestions creation pipeline (table unused)  
- Sentence-transformer / OpenAI embedding upgrade  
- File upload on project submit (removed from product)  
- Admin profile and notifications pages  
- Professor dashboard revision action and Ollama explanation  
- Comprehensive integration/E2E test suite in CI  
- Health check with DB/Ollama connectivity  

---

## 8. Top 10 Remaining Tasks (Priority Order)

1. **Remove or implement admin User/Student Edit/Delete** — buttons currently non-functional (`AdminUsers.tsx`, `AdminStudents.tsx`)  
2. **Replace `AIInsightsPanel` mock data** with API-driven stats or remove widget  
3. **Add category/target industry to student edit form** (`MyProjects.tsx`)  
4. **Align UI copy** with weighted relevancy (`IdeaSubmissionForm.tsx`)  
5. **Professor dashboard parity** — revision + Ollama explanation in review modal  
6. **Duplicate report review/dismiss API + admin UI action**  
7. **AI suggestions pipeline** — create rows from relevancy or remove dead API/localStorage  
8. **Expand automated tests** — auth, project submit/review, PATCH re-analysis integration  
9. **Update user manual / Chapter 8** for weighted engine, Ollama, edit re-analysis  
10. **Sentence-transformer embedding upgrade** (post-FYP enhancement per `AI_RELEVANCY_IMPROVEMENT_GUIDE.md`)  

---

## 9. Recommended Development Roadmap

| Phase | Focus | Effort |
|-------|-------|--------|
| **Phase A — Demo polish (1 week)** | Fix admin dead buttons (implement or hide), remove/replace mock dashboards, update stale copy | Low |
| **Phase B — Proposal UX (3–5 days)** | Edit form Section 1; relevancy link from My Projects | Low |
| **Phase C — Professor parity (3–5 days)** | Dashboard modal → revision + explanation panel | Low |
| **Phase D — Admin duplicates (1 week)** | PATCH duplicate status; dismiss/review UI | Medium |
| **Phase E — Quality (1–2 weeks)** | Integration tests, manual test script in README, refresh user manual | Medium |
| **Phase F — AI v2 (post-viva)** | Sentence-transformers, embedding cache, AISuggestion writer | High |

---

## 10. Estimated Effort Remaining

| Scope | Estimate |
|-------|----------|
| Viva/demo polish (Phases A–C) | **5–10 developer days** |
| Admin duplicate workflow + tests (Phases D–E) | **10–15 developer days** |
| Full AI embedding upgrade (Phase F) | **15–25 developer days** (optional post-FYP) |

---

## 11. FYP Readiness Assessment

| Criterion | Rating | Comment |
|-----------|--------|---------|
| **Live demo (core workflow)** | ✅ Ready | Submit → relevancy → professor review → notification works with PostgreSQL |
| **Thesis technical depth** | ✅ Ready | Weighted TF-IDF, duplicate detection, Ollama separation documented in repo reports |
| **UI completeness** | ⚠️ Partial | Mock insight panels and dead admin buttons should be disclosed or fixed before examination |
| **Testing evidence** | ⚠️ Partial | Unit tests for engine; no full pytest suite for API/workflows |
| **User manual accuracy** | ⚠️ Partial | Update required for latest AI features |
| **Production readiness** | ❌ Not target | Default secrets, no token revocation, no file hardening |

**Overall FYP verdict:** The project meets **minimum viable FYP demonstration standards** with a **real, integrated backend**. Remaining work is primarily **UI honesty**, **admin CRUD completion**, and **documentation/test evidence** — not core workflow implementation.

---

## 12. Explicit Confirmations (Unchanged Systems)

| System | Status in this codebase |
|--------|-------------------------|
| Authentication | Implemented; not modified in this audit |
| Notifications | DB-backed; create on submit/review only |
| Review workflow | `POST /projects/{id}/review` → `reviews` + status + notification |
| Approval workflow | Approve/reject/revision via same review endpoint |
| Dashboards | Active dashboards use real APIs; mock widgets noted above |
| Professor Management | Full CRUD for professors (admin) |
| Ollama Explanation Layer | Implemented separately from similarity; unchanged by weighted engine work |

---

## 13. Reference Documents in Repository

| Report | Topic |
|--------|-------|
| `USER_MANUAL_SCREEN_REPORT.md` | Active screens for Chapter 8 |
| `PROPOSAL_INTEGRATION_AUDIT.md` | Proposal form integration gaps |
| `RELEVANCY_ENGINE_READINESS_AUDIT.md` | Engine readiness analysis |
| `WEIGHTED_RELEVANCY_IMPLEMENTATION_REPORT.md` | Weighted similarity + corpus + edit re-run |
| `OLLAMA_EXPLANATION_IMPLEMENTATION_REPORT.md` | Ollama explanation layer |
| `FINAL_PROJECT_AUDIT.md` | Prior full-stack audit (June 3 baseline) |
| `PROJECT_BACKEND_GUIDE.md` | Backend architecture guide |

---

*This audit did not execute live API calls or database queries. Status reflects code structure and wiring as of 2026-06-07.*
