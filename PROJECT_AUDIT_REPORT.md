# PROJECT AUDIT REPORT

**Project:** AI-Based FYP Relevancy System  
**Audit Type:** Analysis Only (no code changes)  
**Date:** June 3, 2026  
**Scope:** Frontend (`Frontend/`), Backend (`backend/`), PostgreSQL database

---

## 1. Executive Summary

This is an existing Final Year Project with a **Figma-export React frontend** and a **FastAPI + PostgreSQL backend**. The **core student/professor workflow** (register, login, submit project, view relevancy, professor approve/reject) is partially integrated. A large portion of the UI — especially the **admin portal**, **notifications**, **profile**, and **list views** — displays **hardcoded mock data** despite matching backend APIs already existing.

The backend is structurally sound with JWT auth, role-based access, and 27 API endpoints. The AI relevancy engine has a **critical embedding bug** that likely breaks similarity analysis when multiple projects exist. Several database tables (`duplicate_reports`, `ai_suggestions`) are defined but never populated.

**Overall readiness for user manual / FYP defense:** ~50% of required screens are fully functional end-to-end.

---

## 2. Existing Functional Pages

Pages that exist in the codebase and are **fully connected** to backend + database:

| Page | Component | Role | Screen ID |
|------|-----------|------|-----------|
| Login | `Login.tsx` | Public | `login` |
| Registration | `Registration.tsx` | Public | `registration` |
| Student Dashboard | `StudentDashboard.tsx` | Student | `dashboard` |
| Submit Project Idea | `IdeaSubmissionForm.tsx` | Student | `submit-idea` |
| Relevancy Analysis Results | `RelevancyResults.tsx` | Student | `relevancy-results` |
| Professor Dashboard | `ProfessorDashboard.tsx` | Professor | `dashboard` |
| Review Queue | `ReviewQueue.tsx` | Professor | `review-queue` |

**Navigation:** State-based via `currentScreen` in `App.tsx` (not URL routing). Persisted in `localStorage`.

---

## 3. Existing Pages (UI Only — Not Backend Connected)

Pages that **exist with complete UI** but use mock/localStorage data:

| Page | Component | Role |
|------|-----------|------|
| My Projects | `MyProjects.tsx` | Student |
| Notifications | `Notifications.tsx` | Student / Professor / Admin |
| AI Suggestions | `AISuggestions.tsx` | Student |
| Profile Edit | `ProfileEdit.tsx` | Student / Professor / Admin |
| All Projects | `AllProjects.tsx` | Professor |
| AI Analytics | `AIAnalytics.tsx` | Professor |
| Admin Dashboard | `AdminDashboard.tsx` | Admin |
| User Management | `AdminUsers.tsx` | Admin |
| Student Management | `AdminStudents.tsx` | Admin |
| Professor Management | `AdminProfessors.tsx` | Admin |
| Department Management | `AdminDepartments.tsx` | Admin |
| Admin Projects | `AdminProjects.tsx` | Admin |
| Admin AI Reports | `AdminAIReports.tsx` | Admin |
| Admin Approvals | `AdminApprovals.tsx` | Admin |
| Admin Analytics | `AdminAnalytics.tsx` | Admin |
| Admin Settings | `AdminSettings.tsx` | Admin |

---

## 4. Existing APIs

**Base path:** `/api/v1`  
**Health check:** `GET /health`

### Authentication (`backend/app/routes/auth.py`)

| Method | Path | Auth | Status |
|--------|------|------|--------|
| POST | `/auth/register` | Public | Working |
| POST | `/auth/login` | Public | Working |
| POST | `/auth/refresh` | Public | Working |
| POST | `/auth/logout` | Bearer | Working (client-side only) |
| GET | `/auth/me` | Bearer | Working |

### Projects (`backend/app/routes/projects.py`)

| Method | Path | Role | Frontend Used? |
|--------|------|------|----------------|
| POST | `/projects` | Student | **Yes** |
| GET | `/projects/my` | Student | **Yes** |
| GET | `/projects/stats` | Any | **Yes** |
| GET | `/projects/assigned` | Professor | **Yes** |
| GET | `/projects/review-queue` | Professor | **Yes** |
| GET | `/projects/all` | Professor / Admin | **No** |
| GET | `/projects/{id}/relevancy` | Bearer | **Yes** |
| POST | `/projects/{id}/review` | Professor | **Yes** |

### Profile (`backend/app/routes/profile.py`)

| Method | Path | Auth | Frontend Used? |
|--------|------|------|----------------|
| PATCH | `/profile` | Bearer | **No** |

### Notifications (`backend/app/routes/notifications.py`)

| Method | Path | Auth | Frontend Used? |
|--------|------|------|----------------|
| GET | `/notifications` | Bearer | **No** |
| PATCH | `/notifications/{id}/read` | Bearer | **No** |
| DELETE | `/notifications/{id}` | Bearer | **No** |
| PATCH | `/notifications/read-all` | Bearer | **No** |
| GET | `/ai-suggestions` | Bearer | **No** |
| PATCH | `/ai-suggestions/{id}/read` | Bearer | **No** |
| DELETE | `/ai-suggestions/{id}` | Bearer | **No** |

### Admin (`backend/app/routes/admin.py`)

| Method | Path | Role | Frontend Used? |
|--------|------|------|----------------|
| GET | `/admin/dashboard` | Admin | **No** |
| GET | `/admin/users` | Admin | **No** |
| GET | `/admin/students` | Admin | **No** |
| GET | `/admin/professors` | Admin | **No** |
| GET | `/admin/departments` | Admin | **No** |

**Summary:** 27 endpoints total. **12 called from frontend**. **15 unused by frontend**.

---

## 5. Existing Database Tables

| Table | Model | Used By Backend | Used By Frontend |
|-------|-------|-----------------|------------------|
| `users` | `User` | Yes | Indirect (auth) |
| `students` | `Student` | Yes | Indirect |
| `professors` | `Professor` | Yes | Indirect |
| `admins` | `Admin` | Yes (seed) | Indirect |
| `departments` | `Department` | Yes | No |
| `project_ideas` | `ProjectIdea` | Yes | Partial |
| `project_attachments` | `ProjectAttachment` | Write only | No |
| `relevancy_results` | `RelevancyResult` | Yes | Partial |
| `matched_projects` | `MatchedProject` | Yes | Partial |
| `reviews` | `Review` | Write only | No |
| `notifications` | `Notification` | Partial (created on review) | No |
| `ai_suggestions` | `AISuggestion` | **Never written** | No |
| `duplicate_reports` | `DuplicateReport` | **Never written** (count only) | No |

**Schema creation:** `Base.metadata.create_all` via `scripts/init_schema.py` and `scripts/seed.py`.  
**Alembic:** Revision `001_initial_schema.py` has empty `upgrade()` — non-functional.

### Key Relationships

```
User 1──0..1 Student ──N ProjectIdea
User 1──0..1 Professor ──N ProjectIdea (supervisor)
User 1──0..1 Admin
Student N──1 Department
Professor N──1 Department
ProjectIdea 1──0..1 RelevancyResult 1──N MatchedProject
ProjectIdea 1──N Review
ProjectIdea 1──N ProjectAttachment
User 1──N Notification
User 1──N AISuggestion
DuplicateReport ── project1_id, project2_id (no ORM relationships)
```

---

## 6. Missing Screens

Screens **required by typical FYP user manual** but **not present or not functional**:

| Screen | Status |
|--------|--------|
| Forgot Password | **Missing** (link exists as `href="#"` only) |
| Email Verification | **Missing** |
| Review History | **Missing** (reviews stored but no UI) |
| Attachment Download/View | **Missing** |
| Duplicate Report Detail (admin) | UI exists (`AdminAIReports.tsx`) but mock only; no dedicated backend endpoint |

All 14 user-manual screens **exist as UI** (see Section 8). None are missing from the frontend codebase.

---

## 7. Missing APIs

| Missing API | Purpose | Notes |
|-------------|---------|-------|
| `GET /reviews` or `/projects/{id}/reviews` | Review history | `Review` model written, never read |
| `GET /projects/{id}/attachments` | List uploaded files | Attachments saved, no retrieval |
| `GET /attachments/{id}/download` | Download file | Not implemented |
| `POST/PUT/DELETE /admin/users` | User CRUD | Admin read-only |
| `POST/PUT/DELETE /admin/departments` | Department CRUD | Admin read-only |
| `GET /admin/duplicate-reports` | Duplicate detection list | Table exists, no API |
| `POST /admin/duplicate-reports/{id}/action` | Review duplicate | Not implemented |
| `GET /admin/analytics` | Analytics aggregates | Not implemented |
| `GET /admin/approvals` | Pending approvals queue | Not implemented |
| `GET/PATCH /admin/settings` | System settings | Not implemented |
| `POST /auth/forgot-password` | Password reset | Not implemented |
| `POST /auth/reset-password` | Password reset confirm | Not implemented |
| AI suggestion generation trigger | Populate `ai_suggestions` | Not implemented |
| Duplicate detection job | Populate `duplicate_reports` | Not implemented |

---

## 8. Missing Database Tables

No major tables are missing for the advertised feature set. Existing gaps:

| Gap | Detail |
|-----|--------|
| `ai_suggestions` unused | Table exists; no writer |
| `duplicate_reports` unused | Table exists; no writer |
| `reviews` read path missing | Table populated; no query API |
| `project_attachments` incomplete | No list/download lifecycle |
| System settings table | Not defined (Admin Settings UI has no backing store) |
| Password reset tokens | Not defined |
| Refresh token blacklist | Not defined |

---

## 9. User Manual Screen Verification

Required screens from project specification:

| # | Screen | Exists? | UI Complete? | Backend Connected? | Database Connected? | Ready for User Manual? |
|---|--------|---------|--------------|--------------------|--------------------|------------------------|
| 1 | Login Page | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| 2 | Registration Page | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| 3 | Student Dashboard | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| 4 | Submit Project Idea | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** (if relevancy engine does not crash) |
| 5 | My Projects | **Yes** | **Yes** | **No** | **No** | **No** |
| 6 | Relevancy Analysis Result Page | **Yes** | **Yes** | **Yes** | **Yes** | **Partial** (fallback score 87 on API failure) |
| 7 | Notifications Page | **Yes** | **Yes** | **No** | **No** | **No** |
| 8 | Professor Dashboard | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |
| 9 | Review Queue | **Yes** | **Yes** | **Yes** | **Yes** | **Partial** (revision broken in modal) |
| 10 | Approve / Reject Project | **Yes** | **Yes** | **Partial** | **Partial** | **Partial** (approve/reject work; revision via modal does not) |
| 11 | User Management Page | **Yes** | **Yes** | **No** | **No** | **No** |
| 12 | Student Management Page | **Yes** | **Yes** | **No** | **No** | **No** |
| 13 | Professor Management Page | **Yes** | **Yes** | **No** | **No** | **No** |
| 14 | Admin Dashboard | **Yes** | **Yes** | **No** | **No** | **No** |

**User Manual Ready Count:** 4 fully ready, 3 partial, 7 not ready.

---

## 10. Authentication Status

### Implemented

| Feature | Status | Location |
|---------|--------|----------|
| JWT access token (30 min) | Working | `auth/security.py` |
| JWT refresh token (7 days) | Working | `auth/security.py` |
| bcrypt password hashing | Working | `auth/security.py` |
| Bearer token auth dependency | Working | `auth/dependencies.py` |
| Role-based route guards | Working | `StudentUser`, `ProfessorUser`, `AdminUser` |
| UOL email validation (student/professor) | Working | `utils/validators.py`, frontend `validation.ts` |
| Student ID validation | Working | Backend + frontend |
| Pakistani phone validation | Working | Backend + frontend |
| Token refresh on 401 | Working | `Frontend/services/api.ts` |
| `/auth/me` profile load | Working | `auth_service.py` |
| Admin via seed only | By design | `scripts/seed.py` |

### Not Implemented

| Feature | Status |
|---------|--------|
| Token revocation / blacklist | Not implemented |
| Server-side logout | Cosmetic only |
| Password reset / forgot password | Not implemented |
| Email verification | Not implemented |
| User deactivate API | `is_active` checked but no toggle endpoint |
| Rate limiting on auth | Not implemented |
| Admin self-registration | Not implemented |

### Role-Based Access Control

| Role | Registration | Protected Routes | Frontend Screens |
|------|-------------|------------------|------------------|
| **Student** | `POST /auth/register` | `StudentUser` on project submit/list | Dashboard, submit, relevancy, my projects |
| **Professor** | `POST /auth/register` | `ProfessorUser` on review routes | Dashboard, review queue, all projects |
| **Admin** | Seed script only | `AdminUser` on `/admin/*` | Full admin portal (mock data) |

**Frontend RBAC:** Soft guard via `userRole` + `isAuthenticated` in `App.tsx`. No per-screen URL guards. Wrong-role access falls through to login/default.

---

## 11. Integration Status

### Fully Integrated (Frontend ↔ Backend ↔ Database)

```
Login/Register ──► /auth/* ──► users, students, professors
StudentDashboard ──► /projects/my, /projects/stats ──► project_ideas
IdeaSubmissionForm ──► POST /projects ──► project_ideas, relevancy_results, attachments
RelevancyResults ──► GET /projects/{id}/relevancy ──► relevancy_results, matched_projects
ProfessorDashboard ──► /projects/assigned, POST review ──► project_ideas, reviews, notifications
ReviewQueue ──► /projects/review-queue, POST review ──► project_ideas, reviews
AuthContext ──► /auth/me ──► users (+ role profiles)
```

### Backend Exists — Frontend Not Connected

```
PATCH /profile                          ──X── ProfileEdit.tsx (mock)
GET /projects/my                        ──X── MyProjects.tsx (mock)
GET /projects/all                       ──X── AllProjects.tsx, AdminProjects.tsx (mock)
GET /notifications/*                    ──X── Notifications.tsx (localStorage)
GET /ai-suggestions/*                   ──X── AISuggestions.tsx (localStorage)
GET /admin/dashboard                    ──X── AdminDashboard.tsx (mock)
GET /admin/users                        ──X── AdminUsers.tsx (mock)
GET /admin/students                     ──X── AdminStudents.tsx (mock)
GET /admin/professors                   ──X── AdminProfessors.tsx (mock)
GET /admin/departments                  ──X── AdminDepartments.tsx (mock)
```

### UI Exists — Backend Missing

```
AdminAIReports.tsx      ──X── (no /admin/duplicate-reports API)
AdminApprovals.tsx      ──X── (no /admin/approvals API)
AdminAnalytics.tsx      ──X── (no /admin/analytics API)
AdminSettings.tsx       ──X── (no settings API or table)
AIAnalytics.tsx         ──X── (no professor analytics API)
Forgot Password link    ──X── (no auth reset API)
```

### Database Exists — Not Used

```
ai_suggestions          ── never populated
duplicate_reports       ── never populated (admin stat count only)
reviews                 ── written, never read via API
project_attachments     ── written, never listed/downloaded
```

---

## 12. Bugs Found

### Critical

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| B1 | AI embedding vectors built with **separate vocabularies** per document | `ai/relevancy_engine.py` lines 47–55 | `ValueError` when comparing projects; relevancy crashes on 2nd+ submission |
| B2 | Admin portal shows **fabricated statistics** unrelated to database | All `Admin*.tsx` components | Misleading for examiners and user manual |
| B3 | Notifications UI shows **localStorage mock data** | `NotificationContext.tsx` | Real notifications from professor review never visible |

### High

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| B4 | Revision request in modal calls `alert()` instead of API | `AdvancedReviewModal.tsx` lines 64–66 | Revision action non-functional from review queue modal |
| B5 | `ReviewQueue` passes `onRequestRevision` prop modal does not accept | `ReviewQueue.tsx` vs `AdvancedReviewModal.tsx` | TypeScript prop mismatch; revision never fires |
| B6 | Profile save uses `alert()` with fake initial data | `ProfileEdit.tsx` | Profile management non-functional |
| B7 | RelevancyResults defaults to score **87** on API failure | `RelevancyResults.tsx` line 12 | Masks backend errors |
| B8 | Upload filenames not sanitized | `routes/projects.py` line 62 | Path traversal / overwrite risk |
| B9 | Orphan projects when professor email not found | `project_service.create_project` | Project stuck with no reviewer |

### Medium

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| B10 | Silent `.catch(() => {})` on API calls | Multiple frontend components | Errors invisible to user |
| B11 | Admin notifications uses professor sidebar | `App.tsx` line 246 | Wrong navigation for admin |
| B12 | ProfileEdit type excludes admin role | `ProfileEdit.tsx` vs `App.tsx` | Admin profile screen type error |
| B13 | Sidebar shows hardcoded user names | `Sidebar.tsx` | Wrong identity display |
| B14 | IdeaSubmissionForm/RelevancyResults Sidebar logout is no-op | `onLogout={() => {}}` | Logout broken on those screens |
| B15 | Alembic migration is empty | `alembic/versions/001_initial_schema.py` | No version-controlled schema management |
| B16 | Default JWT secret in settings | `config/settings.py` | Security risk if deployed as-is |

### Low

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| B17 | "Remember me" checkbox non-functional | `Login.tsx` | UX gap |
| B18 | `react-router` installed but unused | `package.json` | Dead dependency |
| B19 | ~40 shadcn UI components never imported | `components/ui/` | Dead code |
| B20 | `OPENAI_API_KEY` configured but unused | `settings.py` | Misleading configuration |

---

## 13. Partially Implemented Features

| Feature | What Exists | What Is Missing |
|---------|-------------|-----------------|
| AI Relevancy Analysis | Engine, DB storage, results page | Working similarity math; OpenAI/ML integration |
| Similarity Reports | `MatchedProject` in relevancy response | PDF export; admin duplicate report UI/API |
| Duplicate Detection | DB table, admin stat counter | Detection logic, API, frontend wiring |
| Notifications | DB table, CRUD API, created on review | Frontend API integration |
| AI Suggestions | DB table, list/dismiss API | Generation logic, frontend integration |
| Profile Management | PATCH API | Frontend GET/PATCH wiring |
| Project Management | List APIs for student/prof/admin | MyProjects, AllProjects, AdminProjects wiring |
| Admin Management | Read-only GET APIs | Frontend wiring; create/update/delete |
| Department Management | DB table, read API | CRUD API; frontend wiring |
| Analytics | Basic `/projects/stats` | Admin/professor analytics APIs and real charts |
| File Attachments | Upload on submit | List, download, delete |
| Review History | Written to `reviews` table | Read API and UI |
| Dashboard Management | Role-scoped stats endpoint | Admin dashboard real data |

---

## 14. Recommended Changes

### Critical (before user manual / defense)

1. Fix AI embedding comparison to use shared vocabulary across query and corpus.
2. Wire all admin screens to existing `/admin/*` and `/projects/all` endpoints.
3. Replace `NotificationContext` mocks with `/notifications` and `/ai-suggestions` API calls.
4. Wire `MyProjects.tsx` to `GET /projects/my`.
5. Wire `ProfileEdit.tsx` to `GET /auth/me` and `PATCH /profile`.
6. Fix `AdvancedReviewModal` to call revision API via `onRequestRevision`.
7. Remove silent error swallowing; show user-visible error messages.

### High

8. Implement duplicate detection pipeline and admin API.
9. Implement AI suggestion generation after relevancy analysis.
10. Sanitize upload filenames; validate file types.
11. Add automated tests for auth, submit, relevancy, and review flows.
12. Validate professor email exists on project submission.
13. Add review history GET endpoint.

### Medium

14. Wire `AllProjects.tsx` to `GET /projects/all` or `/assigned`.
15. Display real user data in Sidebar from `AuthContext`.
16. Implement real Alembic migrations.
17. Add attachment list/download endpoints.
18. Add admin user activate/deactivate.

### Low

19. Add React Router for proper URLs.
20. Remove unused dependencies and dead UI components.
21. Implement or remove forgot-password link.
22. Integrate sentence-transformers or OpenAI for semantic similarity.

---

## 15. Completion Percentages

| Area | % | Notes |
|------|---|-------|
| Frontend UI/UX | 88% | All screens designed; polished Tailwind UI |
| Frontend API Integration | 38% | 12 of 27 endpoints used |
| Backend API | 72% | Core flows complete; admin read-only; no tests |
| Database | 78% | Schema complete; 3 tables unused; Alembic empty |
| AI Module | 40% | Structure exists; critical bug; no ML |
| Authentication | 75% | JWT + RBAC work; no reset/revocation |
| User Manual Readiness | 36% | 5 of 14 screens fully/partially ready |
| **Overall Project** | **62%** | Strong prototype; incomplete integration |

---

## 16. Appendix: Frontend API Call Inventory

| Endpoint | Called From |
|----------|-------------|
| `POST /auth/login` | `authService.ts` ← `Login.tsx` |
| `POST /auth/register` | `authService.ts` ← `Registration.tsx` |
| `GET /auth/me` | `authService.ts` ← `AuthContext.tsx` |
| `POST /auth/logout` | `authService.ts` ← `AuthContext.tsx` |
| `POST /auth/refresh` | `api.ts` (automatic on 401) |
| `POST /projects` | `IdeaSubmissionForm.tsx` |
| `GET /projects/my` | `StudentDashboard.tsx` |
| `GET /projects/stats` | `StudentDashboard.tsx` |
| `GET /projects/assigned` | `ProfessorDashboard.tsx` |
| `GET /projects/review-queue` | `ReviewQueue.tsx` |
| `GET /projects/{id}/relevancy` | `RelevancyResults.tsx` |
| `POST /projects/{id}/review` | `ProfessorDashboard.tsx`, `ReviewQueue.tsx` |

---

*Analysis-only report. No application code was modified.*
