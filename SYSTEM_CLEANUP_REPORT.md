# System Cleanup Report

**Date:** 2026-06-03  
**Goal:** Simplify the FYP UI to core workflow pages, wire profile/admin projects, and avoid breaking auth, submission, AI analysis, review, or notifications.

**Backup:** `backup/pre-cleanup/` (file copies; no git repo in project root).

**Build check:** `npm run build` in `Frontend/` — success.

---

## 1. Pages kept (in navigation)

### Auth
| Screen | Component |
|--------|-----------|
| `login` | `Login.tsx` |
| `registration` | `Registration.tsx` |

### Student
| Screen | Component |
|--------|-----------|
| `dashboard` | `StudentDashboard.tsx` |
| `submit-idea` | `IdeaSubmissionForm.tsx` |
| `relevancy-results` | `RelevancyResults.tsx` |
| `my-projects` | `MyProjects.tsx` |
| `notifications` | `Notifications.tsx` |
| `profile` | `ProfileEdit.tsx` |

### Professor
| Screen | Component |
|--------|-----------|
| `dashboard` | `ProfessorDashboard.tsx` |
| `review-queue` | `ReviewQueue.tsx` |
| `notifications` | `Notifications.tsx` |
| `profile` | `ProfileEdit.tsx` |

### Admin
| Screen | Component |
|--------|-----------|
| `admin-dashboard` | `AdminDashboard.tsx` |
| `admin-users` | `AdminUsers.tsx` |
| `admin-students` | `AdminStudents.tsx` |
| `admin-professors` | `AdminProfessors.tsx` |
| `admin-projects` | `AdminProjects.tsx` |

---

## 2. Pages removed from navigation (deprecated on disk)

| Screen | Component | Action |
|--------|-----------|--------|
| `ai-suggestions` | `AISuggestions.tsx` | `@deprecated`; not imported |
| `all-projects` | `AllProjects.tsx` | `@deprecated`; mock data |
| `ai-analytics` | `AIAnalytics.tsx` | `@deprecated`; mock data |
| `admin-departments` | `AdminDepartments.tsx` | `@deprecated`; mock data |
| `admin-ai-reports` | `AdminAIReports.tsx` | `@deprecated`; mock data |
| `admin-approvals` | `AdminApprovals.tsx` | `@deprecated`; mock data |
| `admin-analytics` | `AdminAnalytics.tsx` | `@deprecated`; mock data |
| `admin-settings` | `AdminSettings.tsx` | `@deprecated`; mock data |

**Routing safety:** `Frontend/src/app/navigation.ts` maps deprecated `localStorage` screens back to each role’s dashboard.

**Admin notifications** removed from admin sidebar (not in FYP keep list).

---

## 3. Files modified

| File | Change |
|------|--------|
| `Frontend/src/app/App.tsx` | Removed deprecated imports/routes; profile limited to student/professor |
| `Frontend/src/app/navigation.ts` | **New** — deprecated screen resolver |
| `Frontend/src/app/components/Sidebar.tsx` | Trimmed menu; live user from `useAuth` |
| `Frontend/src/app/components/AdminSidebar.tsx` | Trimmed menu; live admin user |
| `Frontend/src/app/components/ProfileEdit.tsx` | `GET /auth/me` + `PATCH /profile` |
| `Frontend/src/app/services/authService.ts` | Extended `AuthUser` fields |
| `Frontend/src/app/services/profileService.ts` | **New** — profile PATCH helper |
| `Frontend/src/app/components/AdminProjects.tsx` | `GET /projects/all` |
| `Frontend/src/app/components/AdminUsers.tsx` | View Profile modal |
| `Frontend/src/app/components/AdminStudents.tsx` | View Profile modal |
| `Frontend/src/app/components/AdminProfessors.tsx` | View Profile modal |
| `Frontend/src/app/components/AdminRecordDetailModal.tsx` | **New** — admin detail modal |
| 8 deprecated components | `@deprecated` header comment only |

**Not modified:** Backend routes, models, auth service, project submission, relevancy engine, review workflow, notification APIs.

---

## 4. APIs used (after cleanup)

| Feature | Method | Endpoint |
|---------|--------|----------|
| Login / Register | POST | `/auth/login`, `/auth/register` |
| Session user | GET | `/auth/me` |
| Profile save | PATCH | `/profile` |
| Student projects | GET | `/projects/my`, `/projects/stats` |
| Submit idea | POST | `/projects` |
| Relevancy | GET | `/projects/{id}/relevancy` |
| Professor queue | GET | `/projects/review-queue`, `/projects/assigned` |
| Professor review | POST | `/projects/{id}/review` |
| Notifications | GET/PATCH/DELETE | `/notifications`, `/notifications/{id}/read`, etc. |
| Admin stats | GET | `/admin/dashboard` |
| Admin lists | GET | `/admin/users`, `/admin/students`, `/admin/professors` |
| Admin all projects | GET | `/projects/all` |

---

## 5. Features fixed

| Issue | Fix |
|-------|-----|
| Profile mock names | Loads/saves via `fetchMe` + `updateProfile` (`PATCH /profile`) |
| Sidebar Alex Johnson / Dr. Sarah Smith | Shows `full_name`, `role`, `email`, student/professor ID from auth |
| Admin View Profile | Modal with row data from list APIs (PostgreSQL-backed lists) |
| Admin Project Ideas mock | Live list from `GET /projects/all` with search, status filter, loading/error |
| Stale navigation to removed pages | `resolveScreenForRole()` redirects to dashboard |

---

## 6. Remaining mock / partial data

| Location | What is still static |
|----------|----------------------|
| `StudentDashboard.tsx` | `AIInsightsPanel` — hardcoded insight cards |
| `ProfessorDashboard.tsx` | `AIInsightsPanel` — hardcoded insight cards |
| `AdminDashboard.tsx` | Recent activity feed, AI duplicate cards, department chart (stat cards are live) |
| `AdvancedReviewModal.tsx` | AI feedback suggestion snippets (review actions still use API) |
| Admin Users/Students/Professors | Add / Edit / Delete buttons — no backend CRUD (intentionally not added) |
| Admin Users pagination UI | Decorative only (full list shown) |
| `NotificationContext` | `aiSuggestions` still in localStorage (page removed; harmless) |

No database schema changes were made.

---

## 7. Screens ready for Chapter 8 User Manual

Recommended documentation order aligned with working flows:

1. **Login / Registration** — UOL test accounts  
2. **Student:** Dashboard → Submit Project → Relevancy Results → My Projects → Notifications → Profile  
3. **Professor:** Dashboard → Review Queue (approve/reject/revision) → Notifications → Profile  
4. **Admin:** Dashboard (stats) → Users → Students → Professors → Project Ideas (all submissions)

Deprecated screens should **not** appear in the manual unless listed as “out of scope / removed for FYP scope.”

---

## 8. Unchanged core flows (verified by scope)

- JWT authentication and registration validators  
- Project submission with professor assignment and file upload  
- AI relevancy analysis on submit (`run_relevancy_analysis`)  
- Professor review queue and `POST /projects/{id}/review`  
- Notifications CRUD for authenticated users  

---

*End of cleanup report.*
