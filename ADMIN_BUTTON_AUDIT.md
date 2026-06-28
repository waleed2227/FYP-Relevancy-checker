# Admin Button Audit — Add User / Student / Professor

**Date:** June 3, 2026  
**Scope:** Admin management header buttons on Users, Students, and Professors pages

---

## Executive summary

| Button | Location | Before audit | After audit |
|--------|----------|--------------|---------------|
| **Add New User** | `AdminUsers.tsx` | No handler — dead button | Modal + `POST /admin/users` (role selector) |
| **Add Student** | `AdminStudents.tsx` | No handler — dead button | Modal + `POST /admin/users` (student role) |
| **Add Professor** | `AdminProfessors.tsx` | No handler — dead button | Modal + `POST /admin/users` (professor role) |

All three buttons are **implemented** (not removed). Records persist to PostgreSQL (`users`, `students` / `professors` / `admins`, `departments`).

---

## 1. Pre-audit findings

### Add New User (`AdminUsers.tsx` line 86–89)

- **Route:** None
- **Modal:** None
- **onClick:** Missing
- **Verdict:** Non-functional placeholder

### Add Student (`AdminStudents.tsx` line 77–80)

- **Route:** None
- **Modal:** None
- **onClick:** Missing
- **Verdict:** Non-functional placeholder

### Add Professor (`AdminProfessors.tsx` line 77–80)

- **Route:** None
- **Modal:** None
- **onClick:** Missing
- **Verdict:** Non-functional placeholder

### Existing backend (before changes)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/users` | GET | List users |
| `/admin/students` | GET | List students |
| `/admin/professors` | GET | List professors |
| `/auth/register` | POST | Public self-registration (student/professor only) |

No admin-only create endpoint existed.

---

## 2. Implementation

### Backend

**New endpoint**

```
POST /api/v1/admin/users
Authorization: Bearer <admin token>
Content-Type: application/json
```

**Request body** (`AdminCreateUserRequest`):

| Field | Student | Professor | Admin |
|-------|---------|-----------|-------|
| `full_name` | required | required | required |
| `email` | `{id}@student.uol.edu.pk` | `name@uol.edu.pk` | `name@uol.edu.pk` |
| `password` | min 8 chars | min 8 chars | min 8 chars |
| `role` | `"student"` | `"professor"` | `"admin"` |
| `student_id` | required | — | — |
| `department` | optional | required | optional |
| `phone_number` | optional PK format | optional | optional |

**PostgreSQL writes**

| Role | Tables |
|------|--------|
| Student | `users` → `students` (+ optional `departments`) |
| Professor | `users` → `professors` (+ `departments`) |
| Admin | `users` → `admins` |

Validation reuses UOL rules from public registration (`validators.py`).

**Response:** `UserListItem` (201 Created)

### Frontend

**Shared component:** `AdminCreateUserModal.tsx`

| Page | Modal config |
|------|----------------|
| User Management | `showRoleSelect` — student / professor / admin |
| Student Management | `fixedRole="student"` |
| Professor Management | `fixedRole="professor"` |

**Behavior after submit**

1. Calls `createAdminUser()` → `POST /admin/users`
2. On success: green banner, closes modal, **reloads list** from GET endpoint
3. On error: red message inside modal (validation / duplicate email / duplicate student ID)

**Department dropdown:** Loaded from `GET /admin/departments`.

---

## 3. Files modified

| File | Change |
|------|--------|
| `backend/app/schemas/admin.py` | `AdminCreateUserRequest` schema |
| `backend/app/services/admin_service.py` | `create_user`, `_resolve_department`, `_user_to_list_item` |
| `backend/app/routes/admin.py` | `POST /admin/users` |
| `Frontend/src/app/services/adminService.ts` | `createAdminUser`, `fetchAdminDepartments`, types |
| `Frontend/src/app/components/AdminCreateUserModal.tsx` | **New** shared form modal |
| `Frontend/src/app/components/AdminUsers.tsx` | Wire Add New User button |
| `Frontend/src/app/components/AdminStudents.tsx` | Wire Add Student button |
| `Frontend/src/app/components/AdminProfessors.tsx` | Wire Add Professor button |

**Not modified:** Public `/auth/register`, login, project flows, review queue, notifications.

---

## 4. Other admin buttons (documented, out of scope)

These remain **non-functional** (not part of this audit’s three buttons):

| Page | Buttons | Status |
|------|---------|--------|
| All admin list pages | Edit, Trash | No handlers (future CRUD) |
| AdminUsers | Pagination Previous/Next | Decorative |
| AdminDashboard | Stat card clicks | No navigation |

---

## 5. Test results

### Build

| Check | Result |
|-------|--------|
| `npm run build` | **PASS** |

### API (admin token, 2026-06-03)

| Test | Result |
|------|--------|
| `POST /admin/users` role=student | **201** — `99988877@student.uol.edu.pk`, department Computer Science |
| `POST /admin/users` role=professor | **201** — `audit.prof@uol.edu.pk`, department Data Science |
| Duplicate email | **409** — "Email already registered" (via existing user) |
| Duplicate student_id | **409** — "Student ID already exists" |
| Non-admin caller | **403** — admin dependency |

### UI verification checklist

- [x] Add New User opens modal with role selector
- [x] Add Student opens student-only form (auto email from ID)
- [x] Add Professor opens professor form (department required)
- [x] Success message + list refresh after create
- [x] Validation errors shown in modal

---

## 6. Usage notes

- Student email is auto-filled from ID (same as public registration).
- Admin accounts use `@uol.edu.pk` email format (e.g. `newadmin@uol.edu.pk`).
- Created users can log in immediately with the password set in the form.
- Admin-created accounts do **not** auto-login the admin session (unlike public register).

---

*End of audit report.*
