# Final Project Audit

**Project:** AI-Based FYP Relevancy System  
**Audit date:** June 3, 2026  
**Scope:** All active routes/screens, buttons, API endpoints, PostgreSQL integration  
**Method:** Static analysis of `Frontend/src/app` and `backend/app` (post-cleanup baseline)  
**Code changes during audit:** None (report only)

---

## Executive summary

| Category | Finding |
|----------|---------|
| **Active screens** | 18 (2 auth + 6 student + 4 professor + 5 admin + 1 post-submit) |
| **Deprecated screens (on disk, not routed)** | 8 |
| **Backend API routes** | 22 under `/api/v1` (+ `/health`) |
| **Core FYP workflow** | **Working** — login, submit, AI relevancy, professor review, notifications |
| **Critical bugs** | None identified that block core workflow |
| **Main gaps** | Decorative admin CRUD buttons, partial mock widgets on dashboards, unused backend endpoints |

**API base:** `http://localhost:8000/api/v1` (`Frontend/.env` → `VITE_API_URL`)  
**Routing:** SPA screen IDs in `App.tsx` (not React Router URLs). Stale screens redirected via `navigation.ts`.

---

## Backend API catalog

| Method | Endpoint | Auth | DB tables (primary) | Used by active UI |
|--------|----------|------|---------------------|-------------------|
| GET | `/health` | No | — | No |
| POST | `/auth/register` | No | `users`, `students` or `professors`, `departments` | Yes |
| POST | `/auth/login` | No | `users` | Yes |
| POST | `/auth/refresh` | No | `users` | Yes (api client) |
| POST | `/auth/logout` | Yes | — | Yes |
| GET | `/auth/me` | Yes | `users`, `students`, `professors`, `departments` | Yes |
| POST | `/projects` | Student | `project_ideas`, `project_attachments`, `relevancy_results`, `matched_projects` | Yes |
| GET | `/projects/my` | Student | `project_ideas`, `professors`, `users` | Yes |
| GET | `/projects/stats` | Yes | `project_ideas` | Yes |
| GET | `/projects/assigned` | Professor | `project_ideas`, `students`, `users`, `relevancy_results` | Yes |
| GET | `/projects/review-queue` | Professor | `project_ideas`, `students`, `users`, `relevancy_results` | Yes |
| GET | `/projects/all` | Admin (professor gets assigned only) | `project_ideas`, `students`, `users`, `relevancy_results` | Yes (admin) |
| GET | `/projects/{id}/relevancy` | Yes | `relevancy_results`, `matched_projects`, `project_ideas` | Yes |
| POST | `/projects/{id}/review` | Professor | `project_ideas`, `reviews`, `notifications` | Yes |
| GET | `/notifications` | Yes | `notifications` | Yes |
| PATCH | `/notifications/{id}/read` | Yes | `notifications` | Yes |
| PATCH | `/notifications/read-all` | Yes | `notifications` | Yes |
| DELETE | `/notifications/{id}` | Yes | `notifications` | Yes |
| GET | `/ai-suggestions` | Yes | `ai_suggestions` | **No** (page removed) |
| PATCH | `/ai-suggestions/{id}/read` | Yes | `ai_suggestions` | **No** |
| DELETE | `/ai-suggestions/{id}` | Yes | `ai_suggestions` | **No** |
| PATCH | `/profile` | Yes | `users`, `students`, `professors`, `departments` | Yes |
| GET | `/admin/dashboard` | Admin | `students`, `professors`, `project_ideas`, `duplicate_reports` | Yes (stats only) |
| GET | `/admin/users` | Admin | `users`, `students`, `professors`, `project_ideas` | Yes |
| GET | `/admin/students` | Admin | `students`, `users`, `departments`, `project_ideas` | Yes |
| GET | `/admin/professors` | Admin | `professors`, `users`, `departments`, `project_ideas` | Yes |
| GET | `/admin/departments` | Admin | `departments`, `students`, `professors`, `project_ideas` | **No** (page removed) |

**Tables with no active UI surface:** `duplicate_reports` (count only on admin dashboard), `ai_suggestions` (API exists, UI removed).

---

## Page-by-page audit (active screens)

### Auth

#### 1. Login

| Field | Value |
|-------|-------|
| **Screen** | `login` |
| **Component** | `Login.tsx` |
| **API** | `POST /auth/login` → `GET /auth/me` |
| **Tables** | `users`, role profile tables |
| **Status** | **Working** |

| Button / action | Status | Notes |
|-----------------|--------|-------|
| Role selector (student/professor/admin) | Working | Sent as `role` on login |
| Sign in | Working | JWT stored in `localStorage` |
| Register link | Working | Navigates to `registration` |

**Missing:** None critical.

---

#### 2. Registration

| Field | Value |
|-------|-------|
| **Screen** | `registration` |
| **Component** | `Registration.tsx` |
| **API** | `POST /auth/register` → `GET /auth/me` |
| **Tables** | `users`, `students` or `professors`, `departments` |
| **Status** | **Working** |

| Button / action | Status |
|-----------------|--------|
| Register | Working |
| Back to login | Working |

**Missing:** Admin self-registration not offered (by design).

---

### Student

#### 3. Dashboard

| Field | Value |
|-------|-------|
| **Screen** | `dashboard` |
| **Component** | `StudentDashboard.tsx` |
| **API** | `GET /projects/my`, `GET /projects/stats` |
| **Tables** | `project_ideas`, `relevancy_results` (via projects) |
| **Status** | **Working** (partial UI) |

| Button / action | Status | Notes |
|-----------------|--------|-------|
| Submit New Idea | Working | → `submit-idea` |
| Stat card filters | Working | Client-side on API data |
| Project row click | Working | Opens `ProjectDetailsModal` (passed data) |
| Sidebar nav / logout | Working | Live user in sidebar |

**Mock / hardcoded:** `AIInsightsPanel` — static insight strings (no API).

**Missing:** No error banner if dashboard APIs fail (empty `catch`). No `revision` filter label (API may return `revision` status).

---

#### 4. Submit Project Idea

| Field | Value |
|-------|-------|
| **Screen** | `submit-idea` |
| **Component** | `IdeaSubmissionForm.tsx` |
| **API** | `POST /projects` (multipart) |
| **Tables** | `project_ideas`, `project_attachments`, `relevancy_results`, `matched_projects`, `professors` |
| **Status** | **Working** |

| Button / action | Status | Notes |
|-----------------|--------|-------|
| Submit | Working | Professor email validated server-side |
| Cancel / back | Working | |
| File attach/remove | Working | |
| Sidebar logout | **Broken** | `onLogout={() => {}}` — logout does nothing on this screen |

**Missing:** Logout from sidebar on submit screen (use Cancel first).

---

#### 5. Relevancy Results

| Field | Value |
|-------|-------|
| **Screen** | `relevancy-results` |
| **Component** | `RelevancyResults.tsx` |
| **API** | `GET /projects/{id}/relevancy` |
| **Tables** | `relevancy_results`, `matched_projects`, `project_ideas` |
| **Status** | **Working** (partial UX) |

| Button / action | Status |
|-----------------|--------|
| Back to dashboard | Working |
| Sidebar logout | **Broken** | No-op `onLogout` |

**Mock / hardcoded:** Default score `87` until API returns; failed API load is silent.

**Missing:** Loading/error states for relevancy fetch.

---

#### 6. My Projects

| Field | Value |
|-------|-------|
| **Screen** | `my-projects` |
| **Component** | `MyProjects.tsx` |
| **API** | `GET /projects/my` |
| **Tables** | `project_ideas`, `professors`, `users` |
| **Status** | **Working** |

| Button / action | Status |
|-----------------|--------|
| Search | Working (client-side) |
| Project cards | Display only (no drill-down API) |

**Missing:** Open project detail / re-run relevancy from this page.

---

#### 7. Notifications

| Field | Value |
|-------|-------|
| **Screen** | `notifications` |
| **Component** | `Notifications.tsx` + `NotificationContext` |
| **API** | `GET /notifications`, `PATCH` read, `PATCH` read-all, `DELETE` |
| **Tables** | `notifications` |
| **Status** | **Working** |

| Button / action | Status |
|-----------------|--------|
| Filter tabs | Working (client-side) |
| Mark all read | Working |
| Click unread → read | Working |
| Delete | Working |

**Dead code in context:** `aiSuggestions` + `localStorage` (page removed; no menu item).

**Missing:** None for notifications workflow.

---

#### 8. Profile

| Field | Value |
|-------|-------|
| **Screen** | `profile` |
| **Component** | `ProfileEdit.tsx` |
| **API** | `GET /auth/me` (via `refreshUser`), `PATCH /profile` |
| **Tables** | `users`, `students` or `professors`, `departments` |
| **Status** | **Working** |

| Button / action | Status | Notes |
|-----------------|--------|-------|
| Save | Working | Persists to PostgreSQL |
| Cancel | Working | |
| Photo upload | Working | Stores `photo_url` (may be data URL) |
| Email field | Read-only | Correct (no email change API) |
| Student/Professor ID | Read-only | Correct |

**Missing:** Admin profile screen (not in scope).

---

### Professor

#### 9. Dashboard

| Field | Value |
|-------|-------|
| **Screen** | `dashboard` |
| **Component** | `ProfessorDashboard.tsx` |
| **API** | `GET /projects/assigned`, `POST /projects/{id}/review` |
| **Tables** | `project_ideas`, `reviews`, `notifications` |
| **Status** | **Working** (partial UI) |

| Button / action | Status | Notes |
|-----------------|--------|-------|
| Stat filters | Working | |
| Review / row click | Working | Modal |
| Approve / Reject (modal) | Working | API |
| Request revision | **Missing** | Only on Review Queue, not dashboard modal |

**Mock:** `AIInsightsPanel` static.

---

#### 10. Review Queue

| Field | Value |
|-------|-------|
| **Screen** | `review-queue` |
| **Component** | `ReviewQueue.tsx`, `AdvancedReviewModal.tsx` |
| **API** | `GET /projects/review-queue`, `POST /projects/{id}/review` |
| **Tables** | `project_ideas`, `reviews`, `notifications`, `relevancy_results` |
| **Status** | **Working** |

| Button / action | Status |
|-----------------|--------|
| Review | Working |
| Approve / Reject / Revision | Working |

**Mock:** Static AI feedback suggestion chips in modal (optional text only).

---

#### 11. Notifications (professor)

Same as student notifications — **Working**.

---

#### 12. Profile (professor)

Same as student profile — **Working**.

---

### Admin

#### 13. Dashboard

| Field | Value |
|-------|-------|
| **Screen** | `admin-dashboard` |
| **Component** | `AdminDashboard.tsx` |
| **API** | `GET /admin/dashboard` |
| **Tables** | `students`, `professors`, `project_ideas`, `duplicate_reports` |
| **Status** | **Working** (partial UI) |

| Button / action | Status |
|-----------------|--------|
| Stat cards | Working (live counts) |

**Mock / hardcoded:** `recentActivities`, `aiAlerts`, `departmentData` arrays.

**Missing:** Live activity feed API; duplicate report listing UI (page removed).

---

#### 14. Users

| Field | Value |
|-------|-------|
| **Screen** | `admin-users` |
| **Component** | `AdminUsers.tsx` |
| **API** | `GET /admin/users` |
| **Tables** | `users`, `students`, `professors`, `project_ideas` |
| **Status** | **Working** (read-only) |

| Button / action | Status |
|-----------------|--------|
| Search / role filter | Working |
| View (Eye) | Working | Modal from list row (DB-backed list) |
| Add New User | **Broken** | No handler / no API |
| Edit | **Broken** | No handler |
| Delete | **Broken** | No handler |
| Pagination | **Broken** | Decorative only |

---

#### 15. Students

| Field | Value |
|-------|-------|
| **Screen** | `admin-students` |
| **Component** | `AdminStudents.tsx` |
| **API** | `GET /admin/students` |
| **Tables** | `students`, `users`, `departments`, `project_ideas` |
| **Status** | **Working** (read-only) |

| Button / action | Status |
|-----------------|--------|
| View Profile | Working | Modal |
| Add / Edit / Delete | **Broken** | No API |
| GPA column | **Mock** | Always "—" |
| Phone | **Mock** | Always "N/A" |

---

#### 16. Professors

| Field | Value |
|-------|-------|
| **Screen** | `admin-professors` |
| **Component** | `AdminProfessors.tsx` |
| **API** | `GET /admin/professors` |
| **Tables** | `professors`, `users`, `departments`, `project_ideas` |
| **Status** | **Working** (read-only) |

| Button / action | Status |
|-----------------|--------|
| View Profile | Working | Modal |
| Rating column | **Mock** | "—" |
| Add / Edit / Delete | **Broken** | No API |

---

#### 17. Project Ideas

| Field | Value |
|-------|-------|
| **Screen** | `admin-projects` |
| **Component** | `AdminProjects.tsx` |
| **API** | `GET /projects/all` |
| **Tables** | `project_ideas`, `students`, `users`, `relevancy_results` |
| **Status** | **Working** |

| Button / action | Status |
|-----------------|--------|
| Search | Working |
| Status filter | Working (includes `revision`) |
| View (Eye) | Working | Detail modal |
| Professor column | **Missing** | Not in API payload; not shown |

---

## Deprecated / unused pages (dead navigation)

| Screen | Component | In `App.tsx`? | Data source |
|--------|-----------|---------------|-------------|
| `ai-suggestions` | `AISuggestions.tsx` | No | `localStorage` / empty |
| `all-projects` | `AllProjects.tsx` | No | Hardcoded array |
| `ai-analytics` | `AIAnalytics.tsx` | No | Hardcoded analytics |
| `admin-departments` | `AdminDepartments.tsx` | No | Hardcoded departments |
| `admin-ai-reports` | `AdminAIReports.tsx` | No | Hardcoded reports |
| `admin-approvals` | `AdminApprovals.tsx` | No | Hardcoded approvals |
| `admin-analytics` | `AdminAnalytics.tsx` | No | Hardcoded charts |
| `admin-settings` | `AdminSettings.tsx` | No | Local form defaults |

**Navigation safety:** `navigation.ts` redirects these screen IDs to role dashboard if found in `localStorage`.

---

## Dead code and unused assets

| Item | Location | Notes |
|------|----------|-------|
| 8 deprecated page components | `Frontend/src/app/components/` | `@deprecated`, not imported |
| `aiSuggestions` state | `NotificationContext.tsx` | No menu entry; localStorage only |
| `unreadAISuggestionCount` | `NotificationContext.tsx` | Unused after sidebar cleanup |
| `handleProfileClick` | Was in `App.tsx` | Removed; profile via sidebar only |
| `GET /admin/departments` | Backend | No active consumer |
| AI suggestion routes | `notifications.py` | Backend ready, UI removed |
| `ui/*` shadcn kit | Many files | Design system; not all used |
| `figma/ImageWithFallback.tsx` | Components | May be unused |
| Admin sidebar badges (12, 8) | Removed in cleanup | — |

---

## Broken navigation

| Issue | Severity | Details |
|-------|----------|---------|
| Deprecated `localStorage` screens | Low | Auto-redirect via `resolveScreenForRole` |
| Submit / Relevancy sidebar logout | Low | No-op handler; use back/cancel or navigate away |
| No URL routing | Info | Bookmarking by screen ID only |
| `relevancy-results` without `selectedIdea` | Low | Falls through to student default dashboard |

No broken links in **active** sidebars.

---

## Mock data and hardcoded values (active UI)

| Location | What |
|----------|------|
| `AIInsightsPanel.tsx` | All insight cards on student/professor dashboards |
| `AdminDashboard.tsx` | Activity feed, duplicate alert cards, department chart |
| `AdvancedReviewModal.tsx` | Three static AI feedback templates |
| `RelevancyResults.tsx` | Default score 87; fallback matched project metadata |
| `AdminStudents.tsx` | GPA, phone placeholders |
| `AdminProfessors.tsx` | Rating placeholder |
| `AdminUsers.tsx` | Pagination buttons |

---

## Critical bugs

**None** requiring immediate code change for core FYP flows:

- Authentication, submission, relevancy analysis, review actions, and notifications are wired to PostgreSQL-backed APIs.
- Professor assignment on submit is enforced server-side.

**Non-critical issues** (document only):

1. Sidebar logout no-op on Submit Idea and Relevancy Results screens.  
2. Silent API failures on Student Dashboard and Relevancy Results.  
3. Decorative admin CRUD and pagination.  
4. Misleading default relevancy score before load.

---

## PostgreSQL integration summary

| Workflow step | Persisted? |
|---------------|------------|
| Register / login | Yes — `users` + role tables |
| Submit project | Yes — `project_ideas`, attachments, relevancy |
| Professor review | Yes — `project_ideas.status`, `reviews`, `notifications` |
| Profile update | Yes — `users` + student/professor fields |
| Notifications | Yes — `notifications` |
| Admin lists / stats | Yes — aggregated queries |

---

## Recommendations (documentation / future work — not implemented)

1. Document only **active** screens in Chapter 8 (see `USER_MANUAL_SCREEN_REPORT.md`).  
2. Remove or wire decorative admin buttons to avoid user confusion.  
3. Optionally delete deprecated component files after thesis submission.  
4. Wire `AIInsightsPanel` to real stats or remove widget.  
5. Pass real `onLogout` to Submit/Relevancy sidebars (minor UX).

---

*End of final audit — no application code modified.*
