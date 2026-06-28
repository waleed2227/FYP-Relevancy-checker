# Admin Dashboard — Real Data Audit

**Date:** June 3, 2026  
**Scope:** Remove hardcoded demo data from Recent Activities and Department Wise; wire to PostgreSQL via existing admin API.

---

## Executive summary

| Section | Before | After |
|---------|--------|-------|
| Stat cards (6) | Real (`GET /admin/dashboard`) | **Unchanged — real** |
| AI Duplicate Alerts widget | Removed (prior audit) | Still removed |
| Recent Activities | Hardcoded `recentActivities` array | **Real** — merged from DB tables |
| Department Wise | Hardcoded `departmentData` (145, 98, …) | **Real** — per-department counts from DB |
| View All button | Non-functional | **Removed** |

All visible Admin Dashboard widgets now load from **`GET /api/v1/admin/dashboard`** only.

---

## 1. Fake components found (removed)

### Recent Activities (`AdminDashboard.tsx`)

| Field | Demo value (not in DB) |
|-------|------------------------|
| Sarah Johnson | `"AI-Powered Code Review System"` submission |
| Dr. Smith | Approved `"Smart Campus Navigation"` |
| Dr. Lee | Revision on `"Blockchain Healthcare"` |
| Michael Chen | `"IoT Smart Home System"` submission |
| AI duplicate alert | Static 78% similarity text |

**Source:** Inline `recentActivities` constant (lines 161–207 before fix).

**View All:** Button had no `onClick` / route — removed.

### Department Wise (`AdminDashboard.tsx`)

| Department | Fake project count |
|------------|-------------------|
| Computer Science | 145 (42%) |
| Software Engineering | 98 (29%) |
| Data Science | 67 (20%) |
| Cybersecurity | 32 (9%) |

**Source:** Inline `departmentData` constant (lines 209–214 before fix).

### Previously removed (prior audit)

- **AI Duplicate Detection Alerts** panel — `aiAlerts` hardcoded array (Emma Wilson, David Brown, etc.)

---

## 2. Real components preserved

| Widget | Endpoint | DB tables / logic |
|--------|----------|-------------------|
| Total Students | `GET /admin/dashboard` | `COUNT(students)` |
| Total Professors | same | `COUNT(professors)` |
| Submitted Projects | same | `COUNT(project_ideas)` |
| Approved Projects | same | `project_ideas` where `status = approved` |
| Rejected Projects | same | `project_ideas` where `status = rejected` |
| AI Duplicate Alerts (stat only) | same | `COUNT(duplicate_reports)` pending |

---

## 3. Implementation — queries and endpoints

### Endpoint (extended, not new route)

```
GET /api/v1/admin/dashboard
Authorization: Bearer <admin token>
```

**Handler:** `backend/app/routes/admin.py` → `admin_service.get_admin_stats()`

### Response shape (added fields)

```json
{
  "totalStudents": 2,
  "totalProfessors": 1,
  "submittedProjects": 5,
  "approvedProjects": 1,
  "rejectedProjects": 1,
  "aiDuplicateAlerts": 0,
  "recentActivities": [ ... ],
  "departmentBreakdown": [ ... ]
}
```

### Recent activities — `_fetch_recent_activities()`

Merges up to 8 rows from each source, sorts by `occurredAt` descending, returns top **10** unique events.

| Source table | Query | Activity types |
|--------------|-------|----------------|
| `project_ideas` | Latest by `created_at`, join `students` → `users` | `submission` |
| `reviews` | Latest by `created_at`, join `project_ideas`, `professors` → `users` | `approval`, `rejection`, `revision` |
| `notifications` | Latest by `created_at` | Uses stored `type`, `title`, `message`, `color` |
| `users` | Latest non-admin by `created_at` | `registration` |

**Note:** Notifications and reviews for the same event may both appear (both are real DB rows). No synthetic merge/dedup beyond unique `id`.

### Department breakdown — `_fetch_department_breakdown()`

Reuses `list_departments()` aggregation:

| Metric | SQL pattern |
|--------|-------------|
| `students` | `COUNT(students)` where `department_id = d.id` |
| `professors` | `COUNT(professors)` where `department_id = d.id` |
| `projects` | `COUNT(project_ideas)` joined via `students.department_id` |
| `percentage` | `projectCount / sum(all projectCount) * 100`, rounded 1 decimal |

Sorted by project count descending.

### Verified live sample (2026-06-03)

API returned real names (Faish Mlahi, Waleed Awan, UOL Test Professor) and CS project count **3**, not demo 145.

---

## 4. Files modified

| File | Change |
|------|--------|
| `backend/app/schemas/admin.py` | Added `DashboardActivityItem`, `DashboardDepartmentItem`; extended `AdminDashboardStats` |
| `backend/app/services/admin_service.py` | Added `_fetch_recent_activities`, `_fetch_department_breakdown`; extended `get_admin_stats` |
| `Frontend/src/app/services/adminService.ts` | TypeScript interfaces for new dashboard fields |
| `Frontend/src/app/components/AdminDashboard.tsx` | Removed hardcoded arrays; load activities/departments from API; removed View All; empty states; relative time formatter |

**Not modified:** Auth, project submission, relevancy engine, review queue writes, notification creation, user CRUD routes (only **read** aggregation on dashboard).

---

## 5. Frontend behavior changes

- **Loading:** Activities and departments populate with stat cards in one request.
- **Empty state:** Copy when no activities or no departments/projects.
- **Timestamps:** `formatRelativeTime(occurredAt)` from ISO datetime (no fake “5 minutes ago” strings).
- **Icons/colors:** Mapped from API `type` / `color` with static Tailwind class map (fixes broken dynamic `bg-${color}-100` classes).
- **Department row:** Shows project count + student/professor subcounts from API.

---

## 6. Mock data files

No separate JSON/mock service files existed for these sections. Demo data was **only** inline in `AdminDashboard.tsx`.

Deprecated pages (`AdminAIReports.tsx`, `AllProjects.tsx`) still contain unrelated demo names but are **not** on the Admin Dashboard route.

---

## 7. Backend functionality impact

| Area | Impact |
|------|--------|
| `POST /projects`, relevancy | None |
| `reviews` insert on professor action | None |
| `notifications` insert | None |
| Auth / user management | None |
| `GET /admin/departments` | Unchanged (standalone list still available) |

Only **read** path extended on `GET /admin/dashboard`.

---

## 8. Verification checklist

- [x] `npm run build` (Frontend) — pass
- [x] `GET /api/v1/admin/dashboard` as admin — returns `recentActivities` and `departmentBreakdown`
- [x] No Sarah Johnson / Michael Chen / 145-project counts in API response
- [x] View All button removed from Recent Activities header

---

## 9. Optional follow-ups (not implemented)

- Deduplicate notification + review rows that share the same timestamp/event
- Dedicated activity log table for cleaner admin feed
- Link activity rows to admin project detail screens

---

*End of audit report.*
