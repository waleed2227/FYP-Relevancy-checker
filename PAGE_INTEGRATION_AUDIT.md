# Page Integration Audit — AI-Based FYP Relevancy System

**Audit date:** 2026-06-03  
**Scope:** Frontend pages vs FastAPI backend (`/api/v1`) and PostgreSQL  
**Method:** Static code review of `Frontend/src/app/components`, services, and `backend/app/routes`  
**Code changes:** None (report only)

---

## Executive Summary

| Status | Count | Pages |
|--------|------:|-------|
| **Fully Connected** | 8 | Login, Registration, Submit Project, Relevancy Results, My Projects, Professor Dashboard, Review Queue, Admin Users/Students/Professors (read-only lists) |
| **Partially Connected** | 7 | Student Dashboard, Notifications, Admin Dashboard, Admin Notifications, Idea flow attachments |
| **Mock Data** | 11 | Profile (all roles), AI Suggestions, AI Analytics, All Projects (professor), Admin Departments/Projects/AI Reports/Approvals/Analytics/Settings, AI Insights panels |
| **Broken / Disconnected** | 4 | AI Suggestions (API exists, UI never calls it), Admin Departments (API exists, UI mock), Admin Project Ideas (API exists, UI mock), Sidebar user labels (hardcoded names) |

**Backend API base:** `VITE_API_URL` → `http://localhost:8000/api/v1` (see `Frontend/.env`)

**Routing model:** No React Router URLs. Navigation uses `App.tsx` screen state (`localStorage` key `currentScreen`). “Route” below = **screen ID**.

---

## Backend API Inventory (Implemented)

| Prefix | Endpoints | Primary tables |
|--------|-----------|----------------|
| `/auth` | `POST /register`, `/login`, `/refresh`, `/logout`, `GET /me` | `users`, `students`, `professors`, `admins`, `departments` |
| `/projects` | `POST /`, `GET /my`, `/stats`, `/assigned`, `/review-queue`, `/all`, `GET /{id}/relevancy`, `POST /{id}/review` | `project_ideas`, `project_attachments`, `relevancy_results`, `matched_projects`, `reviews` |
| `/notifications` | `GET /`, `PATCH /{id}/read`, `PATCH /read-all`, `DELETE /{id}` | `notifications` |
| `/ai-suggestions` | `GET /`, `PATCH /{id}/read`, `DELETE /{id}` | `ai_suggestions` |
| `/profile` | `PATCH /` | `users`, `students`, `professors`, `departments` |
| `/admin` | `GET /dashboard`, `/users`, `/students`, `/professors`, `/departments` | `users`, `students`, `professors`, `project_ideas`, `departments`, `duplicate_reports` (stats only) |

**Not implemented in backend (no routes):** admin analytics, admin settings persistence, admin approvals workflow, admin AI duplicate report listing, user/student/professor CRUD (create/update/delete via admin), department CRUD, server-side pagination/search.

---

## Global UI Issues (All Roles)

| Issue | Location | Impact |
|-------|----------|--------|
| Sidebar display name | `Sidebar.tsx` | Shows **Alex Johnson** / **Dr. Sarah Smith** instead of `AuthContext.user` from `GET /auth/me` |
| Profile screen | `ProfileEdit.tsx` | Hardcoded demo identity; does not load or save via `GET /auth/me` or `PATCH /profile` |
| AI Suggestions source | `NotificationContext.tsx` | Loads **`localStorage` only**; never calls `GET /api/v1/ai-suggestions` |
| Pagination | Admin Users (and similar) | Decorative Previous/Next buttons; **no page logic** |
| Admin sidebar badges | `AdminSidebar.tsx` | Hardcoded `12` and `8` on AI Reports / Approvals |

---

# Student Portal

## 1. Dashboard

| Field | Value |
|-------|-------|
| **Page name** | Student Dashboard |
| **Route (screen)** | `dashboard` |
| **Component** | `StudentDashboard.tsx` |
| **API endpoints** | `GET /projects/my`, `GET /projects/stats` |
| **Database tables** | `project_ideas`, `relevancy_results` (via project), `students`, `users` |
| **Status** | **Partially Connected** |

**Data sources**

- **Live (PostgreSQL):** Project list, stat cards (total / approved / pending / rejected).
- **Mock:** `AIInsightsPanel` (static insight strings; no API).

**Interactions**

| Feature | Works? | Notes |
|---------|--------|-------|
| Status filters (stat cards) | Yes | Client-side filter on API `status` values (`pending`, `approved`, `rejected`) |
| Search | No | Not on this page |
| View project (modal) | Partial | `ProjectDetailsModal` shows data passed from list; no extra fetch |
| Edit / Delete | No | Not offered |
| Pagination | No | Full list rendered |
| Submit New Idea | Yes | Navigates to `submit-idea` |

**Errors:** Failed API calls are swallowed (`catch` with empty handler); UI may show zeros with no error banner.

---

## 2. My Projects

| Field | Value |
|-------|-------|
| **Route** | `my-projects` |
| **Component** | `MyProjects.tsx` |
| **API endpoints** | `GET /projects/my` |
| **Database tables** | `project_ideas`, `professors`, `users`, `students` |
| **Status** | **Fully Connected** (read-only) |

**Interactions**

| Feature | Works? | Notes |
|---------|--------|-------|
| Search | Yes | Client-side title/technologies |
| Filters | No | Status filter not present |
| View Profile | N/A | |
| Edit / Delete | No | Cards are display-only |
| Pagination | No | |

---

## 3. Submit Project

| Field | Value |
|-------|-------|
| **Route** | `submit-idea` |
| **Component** | `IdeaSubmissionForm.tsx` |
| **API endpoints** | `POST /projects` (multipart: title, technologies, description, professor_email, files) |
| **Database tables** | `project_ideas`, `project_attachments`, `professors`, `users`; triggers `relevancy_results`, `matched_projects` on server |
| **Status** | **Fully Connected** |

**Interactions**

| Feature | Works? | Notes |
|---------|--------|-------|
| Submit | Yes | Validates professor email server-side; sets `professor_id` |
| File upload | Yes | Saved under backend `upload_dir` → `project_attachments` |
| Search / Filter / Pagination | N/A | |

On success navigates to `relevancy-results` with returned `id` and `relevancyScore`.

---

## 4. Relevancy Results (post-submit)

| Field | Value |
|-------|-------|
| **Route** | `relevancy-results` |
| **Component** | `RelevancyResults.tsx` |
| **API endpoints** | `GET /projects/{id}/relevancy` |
| **Database tables** | `relevancy_results`, `matched_projects`, `project_ideas` |
| **Status** | **Fully Connected** (with minor fallback) |

**Notes:** Initial score defaults to `87` until API returns; insights/matched projects load from DB. Failed fetch fails silently.

---

## 5. Notifications

| Field | Value |
|-------|-------|
| **Route** | `notifications` |
| **Component** | `Notifications.tsx` + `NotificationContext` |
| **API endpoints** | `GET /notifications`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all`, `DELETE /notifications/{id}` |
| **Database tables** | `notifications` |
| **Status** | **Partially Connected** |

**Interactions**

| Feature | Works? | Notes |
|---------|--------|-------|
| Load list | Yes | When authenticated |
| Mark read / Mark all read | Yes | Persists to DB |
| Delete | Yes | Persists to DB |
| Filters (all / unread / ai-alerts / approval) | Yes | Client-side on `type` |
| Search | No | |
| Pagination | No | |

Empty state if no rows seeded for user.

---

## 6. Profile

| Field | Value |
|-------|-------|
| **Route** | `profile` |
| **Component** | `ProfileEdit.tsx` |
| **API endpoints** | **None used** (backend: `GET /auth/me`, `PATCH /profile` exist) |
| **Database tables** | N/A in UI |
| **Status** | **Mock Data** |

**Hardcoded:** Alex Johnson / Dr. Sarah Smith, fake emails, Unsplash photos, `alert()` on save.

| Feature | Works? |
|---------|--------|
| View Profile (sidebar → screen) | Navigates only; data not from DB |
| Edit / Save | **Broken** — UI only, no API |
| Delete | No |

---

## 7. AI Suggestions

| Field | Value |
|-------|-------|
| **Route** | `ai-suggestions` |
| **Component** | `AISuggestions.tsx` + `NotificationContext` |
| **API endpoints** | Backend: `GET /ai-suggestions`, `PATCH /{id}/read`, `DELETE /{id}` — **not called by frontend** |
| **Database tables** | `ai_suggestions` (unused by UI) |
| **Status** | **Broken** (shows `localStorage` or empty; not PostgreSQL) |

**Interactions**

| Feature | Works? | Notes |
|---------|--------|-------|
| Dismiss | Local only | Removes from `localStorage` |
| Apply | `alert()` + local remove | No backend |
| Mark read | Local only | Should use `PATCH /ai-suggestions/{id}/read` |

---

# Professor Portal

## 8. Dashboard

| Field | Value |
|-------|-------|
| **Route** | `dashboard` |
| **Component** | `ProfessorDashboard.tsx` |
| **API endpoints** | `GET /projects/assigned`, `POST /projects/{id}/review` |
| **Database tables** | `project_ideas`, `students`, `users`, `relevancy_results`, `reviews`, `notifications` (on review) |
| **Status** | **Fully Connected** (core table + review actions) |

**Mock:** `AIInsightsPanel` static content.

**Interactions**

| Feature | Works? | Notes |
|---------|--------|-------|
| Load submissions | Yes | All projects where `professor_id` matches |
| Status filters | Yes | Client-side |
| Approve / Reject (modal) | Yes | `POST /projects/{id}/review` |
| Request revision | No | Not on dashboard modal (only approve/reject) |
| Search | No | |
| Pagination | No | |

---

## 9. Review Queue

| Field | Value |
|-------|-------|
| **Route** | `review-queue` |
| **Component** | `ReviewQueue.tsx`, `AdvancedReviewModal.tsx` |
| **API endpoints** | `GET /projects/review-queue`, `POST /projects/{id}/review` |
| **Database tables** | `project_ideas`, `students`, `users`, `relevancy_results`, `reviews`, `notifications` |
| **Status** | **Fully Connected** |

**Mock in modal:** `aiFeedbackSuggestions` array (static feedback templates).

**Interactions**

| Feature | Works? | Notes |
|---------|--------|-------|
| Review → Approve / Reject / Revision | Yes | API + list refresh |
| View (Review button) | Yes | Modal with API row data |
| Search / Filter / Pagination | No | |

---

## 10. All Projects

| Field | Value |
|-------|-------|
| **Route** | `all-projects` |
| **Component** | `AllProjects.tsx` |
| **API endpoints** | **None** (backend: `GET /projects/assigned` or professor `GET /projects/all` via shared route) |
| **Database tables** | N/A in UI |
| **Status** | **Mock Data** |

**Hardcoded:** 5 fictional projects (John Doe, Emma Wilson, etc.).

| Feature | Works? | Notes |
|---------|--------|-------|
| Search | Yes | On mock array only |
| Status filter | Yes | On mock array only |
| View / Edit / Delete | No | Display only |

---

## 11. Notifications

Same as **Student Notifications** (`role="professor"`). **Partially Connected** to `notifications` table.

---

## 12. Profile

Same as **Student Profile**. **Mock Data**; `PATCH /profile` unused.

---

## 13. AI Analytics

| Field | Value |
|-------|-------|
| **Route** | `ai-analytics` |
| **Component** | `AIAnalytics.tsx` |
| **API endpoints** | **None** |
| **Database tables** | N/A in UI |
| **Status** | **Mock Data** |

**Hardcoded:** `analyticsData` (127 projects, category breakdown, risk assessment, trending topics, insights). Time range buttons change UI state only.

| Feature | Works? |
|---------|--------|
| Filters (week/month/semester) | UI only |
| Search / Pagination | No |
| View / Edit / Delete | No |

---

# Admin Portal

## 14. Dashboard

| Field | Value |
|-------|-------|
| **Route** | `admin-dashboard` |
| **Component** | `AdminDashboard.tsx` |
| **API endpoints** | `GET /admin/dashboard` |
| **Database tables** | `students`, `professors`, `project_ideas`, `duplicate_reports` |
| **Status** | **Partially Connected** |

**Live:** Top 6 stat cards from PostgreSQL counts.

**Mock:** `recentActivities`, `aiAlerts`, `departmentData` arrays (fictional names, scores, timelines).

| Feature | Works? |
|---------|--------|
| Stat cards | Yes (API) |
| Activity feed / duplicate cards / dept chart | No (static) |
| Search / Filter / Pagination | No |

---

## 15. Users

| Field | Value |
|-------|-------|
| **Route** | `admin-users` |
| **Component** | `AdminUsers.tsx` |
| **API endpoints** | `GET /admin/users` |
| **Database tables** | `users`, `students`, `professors`, `project_ideas`, `departments` |
| **Status** | **Fully Connected** (read-only list) |

| Feature | Works? | Notes |
|---------|--------|-------|
| Search | Yes | Client-side name/email |
| Role filter | Yes | Client-side |
| View (Eye) | **No** | Button has no `onClick` / no route |
| Edit | **No** | No API |
| Delete | **No** | No API |
| Add New User | **No** | No API (registration is public `/auth/register` only) |
| Pagination | **No** | Decorative controls; shows “Showing X of Y” only |

---

## 16. Students

| Field | Value |
|-------|-------|
| **Route** | `admin-students` |
| **Component** | `AdminStudents.tsx` |
| **API endpoints** | `GET /admin/students` |
| **Database tables** | `students`, `users`, `departments`, `project_ideas` |
| **Status** | **Fully Connected** (read-only) |

| Feature | Works? | Notes |
|---------|--------|-------|
| Search | Yes | Name, email, student ID |
| Department filter | Yes | Built from loaded data |
| View Profile | **No** | Button inert |
| Edit / Delete / Add Student | **No** | |
| Pagination | No | |
| GPA column | Mock | Always "—" |

---

## 17. Professors

| Field | Value |
|-------|-------|
| **Route** | `admin-professors` |
| **Component** | `AdminProfessors.tsx` |
| **API endpoints** | `GET /admin/professors` |
| **Database tables** | `professors`, `users`, `departments`, `project_ideas` |
| **Status** | **Fully Connected** (read-only) |

Same interaction gaps as **Students** (View Profile / Edit / Delete / Add non-functional).

---

## 18. Departments

| Field | Value |
|-------|-------|
| **Route** | `admin-departments` |
| **Component** | `AdminDepartments.tsx` |
| **API endpoints** | **None used** (backend: `GET /admin/departments`) |
| **Database tables** | `departments` (API ready; UI uses fiction) |
| **Status** | **Mock Data** (backend exists → integration **Broken**) |

**Hardcoded:** 5 departments with invented heads, counts, buildings.

| Feature | Works? | Notes |
|---------|--------|-------|
| Search | Yes | On mock data |
| Add / Edit / Delete | **No** | Buttons present, no handlers/API |

---

## 19. Project Ideas

| Field | Value |
|-------|-------|
| **Route** | `admin-projects` |
| **Component** | `AdminProjects.tsx` |
| **API endpoints** | **None used** (backend: `GET /projects/all` for admin role) |
| **Database tables** | `project_ideas`, `students`, `users`, `professors`, `relevancy_results` |
| **Status** | **Mock Data** (API exists → **Broken**) |

**Hardcoded:** 5 sample projects.

| Feature | Works? | Notes |
|---------|--------|-------|
| Search / status filter | Yes | Mock only |
| View (Eye) | **No** | |

---

## 20. AI Relevancy Reports

| Field | Value |
|-------|-------|
| **Route** | `admin-ai-reports` |
| **Component** | `AdminAIReports.tsx` |
| **API endpoints** | **None** (`duplicate_reports` counted in dashboard only) |
| **Database tables** | `duplicate_reports` (not exposed via list endpoint) |
| **Status** | **Mock Data** |

**Hardcoded:** Duplicate/similarity report cards. Sidebar badge `12` is static.

| Feature | Works? |
|---------|--------|
| Risk filter (all/high/medium/low) | Client-side on mock |
| Compare / View actions | No API |

---

## 21. Approvals

| Field | Value |
|-------|-------|
| **Route** | `admin-approvals` |
| **Component** | `AdminApprovals.tsx` |
| **API endpoints** | **None** |
| **Database tables** | N/A in UI (professor reviews live in `project_ideas.status`, `reviews`) |
| **Status** | **Mock Data** |

**Hardcoded:** `pendingApprovals` (3 items). Approve/Reject buttons have no backend wiring. Sidebar badge `8` is static.

---

## 22. Notifications

| Field | Value |
|-------|-------|
| **Route** | `notifications` (admin sidebar) |
| **Component** | `Notifications.tsx` (`role="professor"` in `App.tsx`) |
| **API endpoints** | Same as student notifications |
| **Database tables** | `notifications` |
| **Status** | **Partially Connected** |

Loads notifications for **logged-in admin user ID**. Layout says professor styling; functionally same API as other roles.

---

## 23. Analytics

| Field | Value |
|-------|-------|
| **Route** | `admin-analytics` |
| **Component** | `AdminAnalytics.tsx` |
| **API endpoints** | **None** |
| **Database tables** | N/A in UI |
| **Status** | **Mock Data** |

**Hardcoded:** `analytics` object (user growth, submission trends, approval rates). Time range toggles are UI-only.

---

## 24. Settings

| Field | Value |
|-------|-------|
| **Route** | `admin-settings` |
| **Component** | `AdminSettings.tsx` |
| **API endpoints** | **None** |
| **Database tables** | N/A |
| **Status** | **Mock Data** |

**Hardcoded:** Form `defaultValue`s (system name, institution, SMTP placeholders). Save buttons do not call API. Theme is handled globally via `ThemeContext` (local, not server settings).

---

# Auth Screens (Supporting)

| Page | Screen | API | DB | Status |
|------|--------|-----|-----|--------|
| Login | `login` | `POST /auth/login`, `GET /auth/me` | `users` | **Fully Connected** |
| Registration | `registration` | `POST /auth/register`, `GET /auth/me` | `users`, role tables | **Fully Connected** |

---

# Pages Using Static / Fake Data (Checklist)

| # | Page | Screen | Primary issue |
|---|------|--------|----------------|
| 1 | Student/Professor Profile | `profile` | Entire form hardcoded; no `auth/me` or `PATCH /profile` |
| 2 | AI Suggestions | `ai-suggestions` | `localStorage` instead of `GET /ai-suggestions` |
| 3 | Student Dashboard insights | `dashboard` | `AIInsightsPanel` mock |
| 4 | Professor Dashboard insights | `dashboard` | `AIInsightsPanel` mock |
| 5 | Professor All Projects | `all-projects` | Inline array of 5 projects |
| 6 | Professor AI Analytics | `ai-analytics` | Full page mock analytics |
| 7 | Admin Dashboard (feeds) | `admin-dashboard` | Activities, alerts, dept chart mock |
| 8 | Admin Departments | `admin-departments` | Ignores `GET /admin/departments` |
| 9 | Admin Project Ideas | `admin-projects` | Ignores `GET /projects/all` |
| 10 | Admin AI Relevancy Reports | `admin-ai-reports` | No list API wired |
| 11 | Admin Approvals | `admin-approvals` | No API |
| 12 | Admin Analytics | `admin-analytics` | No API |
| 13 | Admin Settings | `admin-settings` | No API |
| 14 | Sidebar footer names | all | Alex Johnson / Dr. Sarah Smith |
| 15 | Advanced Review Modal | `review-queue` | Static AI feedback suggestion strings |
| 16 | Admin sidebar badges | admin nav | Hardcoded 12 / 8 |

---

# Interaction Matrix (Summary)

| Page | View Profile | Edit | Delete | Search | Filters | Pagination |
|------|:------------:|:----:|:------:|:------:|:-------:|:----------:|
| Student Dashboard | — | — | — | — | Yes | — |
| My Projects | — | — | — | Yes | — | — |
| Submit Project | — | — | — | — | — | — |
| Notifications | — | — | Yes* | — | Yes | — |
| Profile | Broken | Broken | — | — | — | — |
| AI Suggestions | — | — | Local† | — | — | — |
| Prof. Dashboard | Modal‡ | — | — | — | Yes | — |
| Review Queue | Modal‡ | — | — | — | — | — |
| All Projects | — | — | — | Yes§ | Yes§ | — |
| AI Analytics | — | — | — | — | UI§ | — |
| Admin Users | Broken | Broken | Broken | Yes | Yes | Decorative |
| Admin Students | Broken | Broken | Broken | Yes | Yes | — |
| Admin Professors | Broken | Broken | Broken | Yes | Yes | — |
| Admin Departments | — | Broken | Broken | Yes§ | — | — |
| Admin Projects | Broken | — | — | Yes§ | Yes§ | — |
| Admin AI Reports | Broken | — | — | — | Yes§ | — |
| Admin Approvals | Broken | Broken | — | — | — | — |

\* Notifications: delete via API.  
† AI Suggestions: dismiss local only.  
‡ View = in-page modal with list row data, not user profile.  
§ Operates on mock data where page is mock.

---

# Recommended Integration Priority (Informational — Not Implemented)

1. Wire **Profile** to `GET /auth/me` + `PATCH /profile`; fix **Sidebar** to use `AuthContext.user`.
2. Wire **AI Suggestions** context to `GET /ai-suggestions` (+ patch/delete endpoints).
3. Wire **All Projects** (professor) and **Admin Project Ideas** to `GET /projects/assigned` / `GET /projects/all`.
4. Wire **Admin Departments** to `GET /admin/departments`.
5. Replace mock admin/professor analytics with aggregated endpoints or reuse existing stats.
6. Add admin list endpoint for `duplicate_reports` or remove mock AI Reports page until backend exists.
7. Implement or remove non-functional **View / Edit / Delete / Add** buttons to avoid false affordances.

---

# Document Control

| Item | Value |
|------|-------|
| Frontend path | `Frontend/src/app/` |
| Backend path | `backend/app/routes/` |
| API prefix | `/api/v1` (see `backend/app/main.py`) |

*End of audit — no application code was modified.*
