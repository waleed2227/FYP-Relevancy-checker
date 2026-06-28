# User Manual Screen Report

**Project:** AI-Based FYP Relevancy System  
**Chapter:** 8 — User Manual  
**Date:** June 3, 2026  
**Version:** Post-cleanup (FYP core workflow only)

---

## Purpose

This document lists every **active** screen in the application, how to reach it, which backend APIs and database tables it uses, and whether it is ready for inclusion in the thesis user manual. Screens removed from navigation are listed separately as out of scope.

**Prerequisites**

- Backend: `uvicorn app.main:app --reload --port 8000` (from `backend/`)
- Frontend: `npm run dev` (from `Frontend/`)
- `Frontend/.env`: `VITE_API_URL=http://localhost:8000/api/v1`
- PostgreSQL database seeded (see test accounts below)

---

## Test accounts (UOL seed)

| Role | Email | Password |
|------|-------|----------|
| Student | `70140912@student.uol.edu.pk` | `Student123` |
| Professor | `professor@uol.edu.pk` | `Professor123` |
| Admin | `admin@uol.edu.pk` | `Admin123` |

---

## Summary table (active screens only)

| # | Screen name | Screen ID | Ready for user manual? | Status |
|---|-------------|-----------|------------------------|--------|
| 1 | Login | `login` | Yes | Working |
| 2 | Registration | `registration` | Yes | Working |
| 3 | Student Dashboard | `dashboard` | Yes | Working* |
| 4 | Submit Project Idea | `submit-idea` | Yes | Working |
| 5 | Relevancy Results | `relevancy-results` | Yes | Working* |
| 6 | My Projects | `my-projects` | Yes | Working |
| 7 | Notifications (student) | `notifications` | Yes | Working |
| 8 | Profile (student) | `profile` | Yes | Working |
| 9 | Professor Dashboard | `dashboard` | Yes | Working* |
| 10 | Review Queue | `review-queue` | Yes | Working |
| 11 | Notifications (professor) | `notifications` | Yes | Working |
| 12 | Profile (professor) | `profile` | Yes | Working |
| 13 | Admin Dashboard | `admin-dashboard` | Partial | Working* |
| 14 | User Management | `admin-users` | Partial | Working (read-only) |
| 15 | Student Management | `admin-students` | Partial | Working (read-only) |
| 16 | Professor Management | `admin-professors` | Partial | Working (read-only) |
| 17 | Project Ideas (admin) | `admin-projects` | Yes | Working |

\*Includes non-database demo widgets or minor UX gaps — see screen notes.

**Recommended manual count:** 17 active flows (14 fully documentable end-to-end + 3 admin list pages with “view only” caveat).

---

## Out of scope (removed from app menu)

Do **not** document these in Chapter 8 unless noting they were removed:

- AI Suggestions (student)  
- All Projects / AI Analytics (professor)  
- Departments, AI Relevancy Reports, Approvals, Analytics, Settings (admin)

Files remain on disk as `@deprecated` reference only.

---

## Screen-by-screen manual entries

### 1. Login Page

| Item | Detail |
|------|--------|
| **How to open** | Application start URL (default screen when logged out) |
| **API** | `POST /api/v1/auth/login`, then `GET /api/v1/auth/me` |
| **Database** | `users` |
| **Status** | Working |

**Steps**

1. Select role: Student, Professor, or Administrator.  
2. Enter UOL email and password.  
3. Click **Sign In**.  
4. System stores JWT and opens role dashboard.

**Buttons**

| Button | Works? |
|--------|--------|
| Role cards | Yes |
| Sign In | Yes |
| Create account | Yes → Registration |

---

### 2. Registration Page

| Item | Detail |
|------|--------|
| **How to open** | Login → **Create account** |
| **API** | `POST /api/v1/auth/register`, `GET /api/v1/auth/me` |
| **Database** | `users`, `students` or `professors`, `departments` |
| **Status** | Working |

**Steps**

1. Choose Student or Professor.  
2. Complete form (UOL email rules apply).  
3. Submit registration → logged in as new user.

**Buttons:** Register, Back to login — both working.

---

### 3. Student Dashboard

| Item | Detail |
|------|--------|
| **How to open** | After student login; sidebar **Dashboard** |
| **API** | `GET /api/v1/projects/my`, `GET /api/v1/projects/stats` |
| **Database** | `project_ideas`, relevancy fields |
| **Status** | Working (AI insight banner is illustrative only) |

**Steps**

1. Review stat cards (totals from database).  
2. Click stat card to filter project list.  
3. Click **Submit New Idea** to start submission.  
4. Click a project row to view details modal.

**Buttons**

| Button | Works? |
|--------|--------|
| Submit New Idea | Yes |
| Stat filters | Yes |
| Project row | Yes (modal) |
| Sidebar: My Projects, Notifications, Profile | Yes |

**Note for manual:** Top “AI Insights” panel is not loaded from API.

---

### 4. Submit Project Idea

| Item | Detail |
|------|--------|
| **How to open** | Dashboard → **Submit New Idea** |
| **API** | `POST /api/v1/projects` (multipart form) |
| **Database** | `project_ideas`, `project_attachments`, `relevancy_results`, `matched_projects` |
| **Status** | Working |

**Steps**

1. Enter title, technologies, description.  
2. Enter supervisor email (must be registered professor, e.g. `professor@uol.edu.pk`).  
3. Optionally attach files.  
4. Submit → AI relevancy runs on server → **Relevancy Results** screen.

**Buttons**

| Button | Works? |
|--------|--------|
| Submit | Yes |
| Cancel / back | Yes |
| Attach files | Yes |
| Sidebar logout | No — use Cancel first |

---

### 5. Relevancy Analysis Results

| Item | Detail |
|------|--------|
| **How to open** | Automatically after successful submit |
| **API** | `GET /api/v1/projects/{id}/relevancy` |
| **Database** | `relevancy_results`, `matched_projects` |
| **Status** | Working |

**Steps**

1. View overall relevancy score and insight cards.  
2. Review similar past projects list.  
3. Click **Back to Dashboard**.

**Buttons:** Back to dashboard — Yes.

**Note:** If API fails, page may show placeholder score until refresh; document happy path after successful submit.

---

### 6. My Projects

| Item | Detail |
|------|--------|
| **How to open** | Sidebar → **My Projects** |
| **API** | `GET /api/v1/projects/my` |
| **Database** | `project_ideas` |
| **Status** | Working |

**Steps**

1. Wait for list to load.  
2. Use search box to filter by title/technologies.  
3. Read status, date, relevancy %, supervisor name.

**Buttons:** Search — Yes. Cards are view-only.

---

### 7. Notifications (Student)

| Item | Detail |
|------|--------|
| **How to open** | Sidebar → **Notifications** |
| **API** | `GET`, `PATCH`, `DELETE` on `/api/v1/notifications` |
| **Database** | `notifications` |
| **Status** | Working |

**Steps**

1. Filter: All / Unread / AI alerts / Approvals.  
2. Click unread item to mark read.  
3. **Mark All as Read** or delete individual items.

**Buttons:** All notification actions — Yes.

---

### 8. Profile (Student)

| Item | Detail |
|------|--------|
| **How to open** | Sidebar → **My Profile** |
| **API** | `GET /api/v1/auth/me`, `PATCH /api/v1/profile` |
| **Database** | `users`, `students` |
| **Status** | Working |

**Steps**

1. Profile loads from logged-in user (name, email, student ID, phone, major, year).  
2. Edit allowed fields.  
3. **Save Changes** → data stored in PostgreSQL.

**Buttons:** Save, Cancel — Yes. Email and student ID are read-only.

---

### 9. Professor Dashboard

| Item | Detail |
|------|--------|
| **How to open** | After professor login |
| **API** | `GET /api/v1/projects/assigned`, `POST /api/v1/projects/{id}/review` |
| **Database** | `project_ideas`, `reviews`, `notifications` |
| **Status** | Working |

**Steps**

1. View assigned submissions and stat counts.  
2. Filter by status.  
3. Open project → approve or reject with feedback (revision available on Review Queue only).

**Buttons**

| Button | Works? |
|--------|--------|
| Filters | Yes |
| Review / Approve / Reject | Yes |
| Request revision | Use Review Queue screen |

---

### 10. Review Queue

| Item | Detail |
|------|--------|
| **How to open** | Sidebar → **Review Queue** |
| **API** | `GET /api/v1/projects/review-queue`, `POST /api/v1/projects/{id}/review` |
| **Database** | `project_ideas`, `reviews`, `notifications` |
| **Status** | Working |

**Steps**

1. View pending projects assigned to logged-in professor.  
2. Click **Review** → advanced modal.  
3. Approve, reject, or request revision with feedback.

**Buttons:** Review, Approve, Reject, Request revision — Yes.

**Manual tip:** This is the primary professor workflow screen for thesis documentation.

---

### 11. Notifications (Professor)

Same as student notifications — **Working**.

---

### 12. Profile (Professor)

Same as student profile — uses `PATCH /profile` for professor department — **Working**.

---

### 13. Admin Dashboard

| Item | Detail |
|------|--------|
| **How to open** | After admin login |
| **API** | `GET /api/v1/admin/dashboard` |
| **Database** | `students`, `professors`, `project_ideas`, `duplicate_reports` (count) |
| **Status** | Partial |

**Steps**

1. Verify six stat cards (live counts).  
2. **Do not document** activity feed or duplicate cards as live data — they are UI placeholders.

**Ready for manual:** Stat cards only.

---

### 14. User Management

| Item | Detail |
|------|--------|
| **How to open** | Sidebar → **Users** |
| **API** | `GET /api/v1/admin/users` |
| **Database** | `users`, related counts |
| **Status** | Working (read-only) |

**Steps**

1. Search by name/email.  
2. Filter by role.  
3. Click **View** (eye) for user detail modal.

**Do not document:** Add User, Edit, Delete, pagination — not implemented.

---

### 15. Student Management

| Item | Detail |
|------|--------|
| **How to open** | Sidebar → **Students** |
| **API** | `GET /api/v1/admin/students` |
| **Database** | `students`, `users`, `project_ideas` |
| **Status** | Working (read-only) |

**Steps:** Search, department filter, **View Profile** modal.

**Do not document:** Add/Edit/Delete, GPA column.

---

### 16. Professor Management

| Item | Detail |
|------|--------|
| **How to open** | Sidebar → **Professors** |
| **API** | `GET /api/v1/admin/professors` |
| **Database** | `professors`, `users`, `project_ideas` |
| **Status** | Working (read-only) |

**Steps:** Search, department filter, **View Profile** modal.

---

### 17. Project Ideas (Admin)

| Item | Detail |
|------|--------|
| **How to open** | Sidebar → **Project Ideas** |
| **API** | `GET /api/v1/projects/all` |
| **Database** | `project_ideas`, `students`, `users`, `relevancy_results` |
| **Status** | Working |

**Steps**

1. View all submissions with live counts.  
2. Search and filter by status.  
3. Click eye icon for project detail modal.

**Buttons:** Search, status filter, view detail — Yes.

---

## End-to-end workflows for Chapter 8

Document these three flows with screenshots:

### Flow A — Student submits project

Login (student) → Dashboard → Submit New Idea → fill form + `professor@uol.edu.pk` → Submit → Relevancy Results → My Projects confirms entry.

### Flow B — Professor reviews project

Login (professor) → Review Queue → Review → Approve or Reject or Revision → student sees Notifications.

### Flow C — Admin oversees system

Login (admin) → Dashboard (stats) → Project Ideas (full list) → Users / Students / Professors (view modals).

---

## Sidebar user information (all roles)

After cleanup, the sidebar shows **live** data from `GET /auth/me`:

- Full name  
- Role  
- Email  
- Student ID or professor ID / department  

No fictional names (Alex Johnson / Dr. Sarah Smith).

---

## Known limitations (honest manual footnotes)

1. AI insight panels on dashboards are not database-driven.  
2. Admin cannot create/edit/delete users via UI.  
3. Admin dashboard activity/duplicate sections are placeholders.  
4. Logout from sidebar on Submit/Relevancy screens requires navigating back first.  
5. No browser URL per screen (single-page app with screen state).  

---

## Related documents

| Document | Content |
|----------|---------|
| `FINAL_PROJECT_AUDIT.md` | Full technical audit, dead code, API catalog |
| `SYSTEM_CLEANUP_REPORT.md` | Pages removed vs kept (June 2026 cleanup) |
| `PAGE_INTEGRATION_AUDIT.md` | Pre-cleanup integration snapshot |

---

*End of user manual screen report.*
