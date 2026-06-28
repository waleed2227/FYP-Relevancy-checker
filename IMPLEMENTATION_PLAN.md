# IMPLEMENTATION PLAN

**Project:** AI-Based FYP Relevancy System  
**Type:** Planning document only — **no implementation until approved**  
**Date:** June 3, 2026  
**Based on:** `PROJECT_AUDIT_REPORT.md`

---

## How to Read This Document

Each item lists what would need to change to make a missing or partial feature fully functional. **No work should begin until you approve this plan.**

Risk levels:
- **LOW** — Isolated change, existing patterns, minimal regression risk
- **MEDIUM** — Cross-layer change (frontend + backend), moderate testing needed
- **HIGH** — Core logic, security, or schema change; requires careful testing

---

## Phase 1: Critical Fixes (User Manual Blockers)

### 1.1 Fix AI Embedding Similarity Bug

| Field | Detail |
|-------|--------|
| **Feature Name** | AI Relevancy — Shared Vocabulary Similarity |
| **Files To Modify** | `backend/app/ai/relevancy_engine.py`, `backend/app/ai/embeddings.py` |
| **New Files Needed** | None |
| **APIs Needed** | None (fix existing `POST /projects` and `GET /projects/{id}/relevancy` behavior) |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **HIGH** |

**Approach:** Build vocabulary once from `[query_text] + all corpus texts`, or use existing `similarity_between(text_a, text_b)` which embeds both texts together. Verify with 2+ projects in DB.

---

### 1.2 Wire My Projects Page to Backend

| Field | Detail |
|-------|--------|
| **Feature Name** | My Projects (Student) |
| **Files To Modify** | `Frontend/src/app/components/MyProjects.tsx` |
| **New Files Needed** | Optional: `Frontend/src/app/services/projectService.ts` (extract API calls) |
| **APIs Needed** | Existing: `GET /projects/my` |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **LOW** |

**Approach:** Replace hardcoded `projects` array with `useEffect` + `api.get('/projects/my')`. Add loading and error states. Map `ProjectResponse` fields to table columns.

---

### 1.3 Wire Profile Edit to Backend

| Field | Detail |
|-------|--------|
| **Feature Name** | Profile Management |
| **Files To Modify** | `Frontend/src/app/components/ProfileEdit.tsx`, optionally `Frontend/src/app/services/authService.ts` |
| **New Files Needed** | Optional: `Frontend/src/app/services/profileService.ts` |
| **APIs Needed** | Existing: `GET /auth/me`, `PATCH /profile` |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **MEDIUM** |

**Approach:** Load user on mount via `fetchMe()` or `AuthContext.user`. Replace fake initial state. On save, call `PATCH /profile` with `{ full_name, phone, photo_url, major, year, department }`. Extend `ProfileEdit` role type to include `'admin'`.

---

### 1.4 Wire Notifications to Backend

| Field | Detail |
|-------|--------|
| **Feature Name** | Notification Management |
| **Files To Modify** | `Frontend/src/app/context/NotificationContext.tsx`, `Frontend/src/app/components/Notifications.tsx` |
| **New Files Needed** | `Frontend/src/app/services/notificationService.ts` |
| **APIs Needed** | Existing: `GET /notifications`, `PATCH /notifications/{id}/read`, `DELETE /notifications/{id}`, `PATCH /notifications/read-all` |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **MEDIUM** |

**Approach:** Remove localStorage default mock seeding. Fetch notifications on auth. Map backend `NotificationResponse` to UI shape. Wire mark-read, delete, read-all actions.

---

### 1.5 Fix Revision Flow in Review Modal

| Field | Detail |
|-------|--------|
| **Feature Name** | Request Revision (Professor Review) |
| **Files To Modify** | `Frontend/src/app/components/AdvancedReviewModal.tsx` |
| **New Files Needed** | None |
| **APIs Needed** | Existing: `POST /projects/{id}/review` with `action: 'revision'` |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **LOW** |

**Approach:** Add `onRequestRevision: (id: number, feedback: string) => void` to modal props. In `handleSubmit`, call it for revision action instead of `alert()`. Add try/catch with user feedback.

---

### 1.6 Wire Admin Dashboard to Backend

| Field | Detail |
|-------|--------|
| **Feature Name** | Admin Dashboard |
| **Files To Modify** | `Frontend/src/app/components/AdminDashboard.tsx` |
| **New Files Needed** | `Frontend/src/app/services/adminService.ts` |
| **APIs Needed** | Existing: `GET /admin/dashboard` |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **LOW** |

**Approach:** Replace hardcoded stats with API response (`totalStudents`, `totalProfessors`, `submittedProjects`, `approvedProjects`, `rejectedProjects`, `aiDuplicateAlerts`).

---

### 1.7 Wire Admin User/Student/Professor Management Pages

| Field | Detail |
|-------|--------|
| **Feature Name** | User Management, Student Management, Professor Management |
| **Files To Modify** | `Frontend/src/app/components/AdminUsers.tsx`, `AdminStudents.tsx`, `AdminProfessors.tsx`, `Frontend/src/app/services/adminService.ts` |
| **New Files Needed** | `Frontend/src/app/services/adminService.ts` (if not created in 1.6) |
| **APIs Needed** | Existing: `GET /admin/users`, `GET /admin/students`, `GET /admin/professors` |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **LOW** |

**Approach:** Replace hardcoded arrays with API fetch. Add loading/error states. Map response fields to table columns.

---

### 1.8 Wire Admin Departments and Projects Pages

| Field | Detail |
|-------|--------|
| **Feature Name** | Department Management (read), Admin Projects List |
| **Files To Modify** | `Frontend/src/app/components/AdminDepartments.tsx`, `AdminProjects.tsx`, `adminService.ts` |
| **New Files Needed** | None (extend `adminService.ts`) |
| **APIs Needed** | Existing: `GET /admin/departments`, `GET /projects/all` |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **LOW** |

---

## Phase 2: High-Priority Feature Completion

### 2.1 Wire AI Suggestions to Backend

| Field | Detail |
|-------|--------|
| **Feature Name** | AI Suggestions (Student) |
| **Files To Modify** | `Frontend/src/app/context/NotificationContext.tsx`, `Frontend/src/app/components/AISuggestions.tsx` |
| **New Files Needed** | Extend `notificationService.ts` |
| **APIs Needed** | Existing: `GET /ai-suggestions`, `PATCH /ai-suggestions/{id}/read`, `DELETE /ai-suggestions/{id}` |
| **Database Changes Needed** | **Backend writer needed** — populate `ai_suggestions` table (see 2.2) |
| **Estimated Risk Level** | **MEDIUM** |

---

### 2.2 Implement AI Suggestion Generation

| Field | Detail |
|-------|--------|
| **Feature Name** | AI Suggestion Generation (Backend) |
| **Files To Modify** | `backend/app/services/project_service.py` (after relevancy), optionally `backend/app/ai/relevancy_engine.py` |
| **New Files Needed** | Optional: `backend/app/services/ai_suggestion_service.py` |
| **APIs Needed** | None new (uses existing list endpoints) |
| **Database Changes Needed** | None (table exists) |
| **Estimated Risk Level** | **MEDIUM** |

**Approach:** After `run_relevancy_analysis`, insert `AISuggestion` rows for the student based on scores (e.g. low novelty → suggest differentiation tips).

---

### 2.3 Implement Duplicate Detection

| Field | Detail |
|-------|--------|
| **Feature Name** | Duplicate Detection & Admin AI Reports |
| **Files To Modify** | `backend/app/services/project_service.py`, `backend/app/routes/admin.py`, `backend/app/services/admin_service.py`, `Frontend/src/app/components/AdminAIReports.tsx`, `adminService.ts` |
| **New Files Needed** | Optional: `backend/app/services/duplicate_service.py` |
| **APIs Needed** | **New:** `GET /admin/duplicate-reports`, `PATCH /admin/duplicate-reports/{id}` (review/dismiss) |
| **Database Changes Needed** | None (table exists); may add index on `similarity_score` |
| **Estimated Risk Level** | **HIGH** |

**Approach:** When relevancy finds similarity ≥ threshold (e.g. 80%), insert `DuplicateReport`. Expose list to admin. Wire `AdminAIReports.tsx`.

---

### 2.4 Wire All Projects (Professor) to Backend

| Field | Detail |
|-------|--------|
| **Feature Name** | All Projects (Professor) |
| **Files To Modify** | `Frontend/src/app/components/AllProjects.tsx` |
| **New Files Needed** | Extend `projectService.ts` |
| **APIs Needed** | Existing: `GET /projects/assigned` or `GET /projects/all` |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **LOW** |

---

### 2.5 Wire Admin Approvals Page

| Field | Detail |
|-------|--------|
| **Feature Name** | Admin Approvals Queue |
| **Files To Modify** | `Frontend/src/app/components/AdminApprovals.tsx`, `backend/app/routes/admin.py`, `backend/app/services/admin_service.py` |
| **New Files Needed** | None |
| **APIs Needed** | **New:** `GET /admin/approvals` — pending projects across all professors |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **MEDIUM** |

**Approach:** Return projects with `status = pending` for admin view. Optionally allow admin override approve/reject (would need new POST endpoint).

---

### 2.6 Secure File Uploads

| Field | Detail |
|-------|--------|
| **Feature Name** | File Upload Security |
| **Files To Modify** | `backend/app/routes/projects.py` |
| **New Files Needed** | Optional: `backend/app/utils/file_utils.py` |
| **APIs Needed** | None |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **MEDIUM** |

**Approach:** Sanitize filenames (UUID prefix), allowlist extensions (pdf, docx, png, jpg), validate MIME type.

---

### 2.7 Validate Professor Email on Submission

| Field | Detail |
|-------|--------|
| **Feature Name** | Professor Assignment Validation |
| **Files To Modify** | `backend/app/services/project_service.py`, optionally `Frontend/src/app/components/IdeaSubmissionForm.tsx` |
| **New Files Needed** | None |
| **APIs Needed** | Optional: `GET /professors/by-email?email=` for frontend autocomplete |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **MEDIUM** |

**Approach:** Reject submission if professor email not found in DB, or return warning. Prevents orphan projects.

---

### 2.8 Add Review History API

| Field | Detail |
|-------|--------|
| **Feature Name** | Review History |
| **Files To Modify** | `backend/app/routes/projects.py`, `backend/app/services/project_service.py` |
| **New Files Needed** | Optional: review history component on frontend |
| **APIs Needed** | **New:** `GET /projects/{id}/reviews` |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **LOW** |

---

### 2.9 Add Automated Tests

| Field | Detail |
|-------|--------|
| **Feature Name** | Test Suite |
| **Files To Modify** | None initially |
| **New Files Needed** | `backend/tests/test_auth.py`, `test_projects.py`, `test_relevancy.py`, `test_review.py`, `backend/pytest.ini` |
| **APIs Needed** | N/A |
| **Database Changes Needed** | Test database config |
| **Estimated Risk Level** | **MEDIUM** |

---

## Phase 3: Medium-Priority Enhancements

### 3.1 Wire Admin Analytics Page

| Field | Detail |
|-------|--------|
| **Feature Name** | Admin Analytics & Reporting |
| **Files To Modify** | `Frontend/src/app/components/AdminAnalytics.tsx`, `backend/app/routes/admin.py`, `backend/app/services/admin_service.py` |
| **New Files Needed** | None |
| **APIs Needed** | **New:** `GET /admin/analytics` (aggregates: projects by status, department breakdown, monthly submissions) |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **MEDIUM** |

---

### 3.2 Wire Professor AI Analytics Page

| Field | Detail |
|-------|--------|
| **Feature Name** | Professor AI Analytics |
| **Files To Modify** | `Frontend/src/app/components/AIAnalytics.tsx`, `backend/app/routes/projects.py` |
| **New Files Needed** | None |
| **APIs Needed** | **New:** `GET /projects/analytics` (professor-scoped relevancy aggregates) |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **MEDIUM** |

---

### 3.3 Attachment List and Download

| Field | Detail |
|-------|--------|
| **Feature Name** | Project Attachment Management |
| **Files To Modify** | `backend/app/routes/projects.py`, `backend/app/services/project_service.py` |
| **New Files Needed** | Optional frontend attachment list component |
| **APIs Needed** | **New:** `GET /projects/{id}/attachments`, `GET /attachments/{id}/download` |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **MEDIUM** |

---

### 3.4 Admin Department CRUD

| Field | Detail |
|-------|--------|
| **Feature Name** | Department Create/Update/Delete |
| **Files To Modify** | `backend/app/routes/admin.py`, `backend/app/services/admin_service.py`, `Frontend/src/app/components/AdminDepartments.tsx` |
| **New Files Needed** | None |
| **APIs Needed** | **New:** `POST /admin/departments`, `PATCH /admin/departments/{id}`, `DELETE /admin/departments/{id}` |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **MEDIUM** |

---

### 3.5 Admin User Activate/Deactivate

| Field | Detail |
|-------|--------|
| **Feature Name** | User Status Management |
| **Files To Modify** | `backend/app/routes/admin.py`, `backend/app/services/admin_service.py`, `AdminUsers.tsx` |
| **New Files Needed** | None |
| **APIs Needed** | **New:** `PATCH /admin/users/{id}/status` |
| **Database Changes Needed** | None (`is_active` column exists) |
| **Estimated Risk Level** | **MEDIUM** |

---

### 3.6 Fix Frontend Error Handling

| Field | Detail |
|-------|--------|
| **Feature Name** | User-Visible API Error Messages |
| **Files To Modify** | `ReviewQueue.tsx`, `ProfessorDashboard.tsx`, `RelevancyResults.tsx`, `StudentDashboard.tsx`, `IdeaSubmissionForm.tsx` |
| **New Files Needed** | Optional: shared `useApiError` hook or toast component |
| **APIs Needed** | None |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **LOW** |

---

### 3.7 Fix Navigation and Sidebar Issues

| Field | Detail |
|-------|--------|
| **Feature Name** | Sidebar Identity & Admin Notifications Nav |
| **Files To Modify** | `Sidebar.tsx`, `App.tsx`, `IdeaSubmissionForm.tsx`, `RelevancyResults.tsx` |
| **New Files Needed** | None |
| **APIs Needed** | None |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **LOW** |

---

### 3.8 Functional Alembic Migrations

| Field | Detail |
|-------|--------|
| **Feature Name** | Database Migration Management |
| **Files To Modify** | `backend/alembic/versions/001_initial_schema.py`, `backend/alembic/env.py` |
| **New Files Needed** | Generated migration revisions as models change |
| **APIs Needed** | None |
| **Database Changes Needed** | Migration scripts (not schema change) |
| **Estimated Risk Level** | **HIGH** |

---

## Phase 4: Low-Priority / Future Enhancements

### 4.1 React Router Integration

| Field | Detail |
|-------|--------|
| **Feature Name** | URL-Based Navigation |
| **Files To Modify** | `Frontend/src/app/App.tsx`, all screen components, `main.tsx` |
| **New Files Needed** | `Frontend/src/app/router.tsx` |
| **APIs Needed** | None |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **HIGH** |

---

### 4.2 Forgot Password Flow

| Field | Detail |
|-------|--------|
| **Feature Name** | Password Reset |
| **Files To Modify** | `Login.tsx`, `backend/app/routes/auth.py`, `backend/app/services/auth_service.py` |
| **New Files Needed** | `backend/app/models/password_reset.py` or token table |
| **APIs Needed** | **New:** `POST /auth/forgot-password`, `POST /auth/reset-password` |
| **Database Changes Needed** | **New table:** `password_reset_tokens` |
| **Estimated Risk Level** | **HIGH** |

---

### 4.3 Admin Settings Persistence

| Field | Detail |
|-------|--------|
| **Feature Name** | System Settings |
| **Files To Modify** | `AdminSettings.tsx`, `backend/app/routes/admin.py` |
| **New Files Needed** | `backend/app/models/system_settings.py`, `admin_service.py` extension |
| **APIs Needed** | **New:** `GET /admin/settings`, `PATCH /admin/settings` |
| **Database Changes Needed** | **New table:** `system_settings` (key-value or JSON) |
| **Estimated Risk Level** | **MEDIUM** |

---

### 4.4 OpenAI / Sentence-Transformers Integration

| Field | Detail |
|-------|--------|
| **Feature Name** | Semantic Similarity Upgrade |
| **Files To Modify** | `backend/app/ai/embeddings.py`, `backend/app/ai/relevancy_engine.py`, `backend/requirements.txt` |
| **New Files Needed** | Optional: `backend/app/ai/openai_client.py` |
| **APIs Needed** | None |
| **Database Changes Needed** | Optional: store embedding vectors |
| **Estimated Risk Level** | **HIGH** |

---

### 4.5 Similarity Report PDF Export

| Field | Detail |
|-------|--------|
| **Feature Name** | Relevancy Report Export |
| **Files To Modify** | `RelevancyResults.tsx`, `backend/app/routes/projects.py` |
| **New Files Needed** | `backend/app/services/report_service.py` |
| **APIs Needed** | **New:** `GET /projects/{id}/relevancy/report.pdf` |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **MEDIUM** |

---

### 4.6 Token Revocation / Secure Logout

| Field | Detail |
|-------|--------|
| **Feature Name** | Server-Side Logout |
| **Files To Modify** | `backend/app/auth/security.py`, `backend/app/routes/auth.py` |
| **New Files Needed** | Optional: `backend/app/models/revoked_token.py` |
| **APIs Needed** | Enhance existing `POST /auth/logout` |
| **Database Changes Needed** | **New table:** `revoked_tokens` or Redis cache |
| **Estimated Risk Level** | **HIGH** |

---

### 4.7 Remove Dead Code

| Field | Detail |
|-------|--------|
| **Feature Name** | Codebase Cleanup |
| **Files To Modify** | `package.json`, unused imports |
| **New Files Needed** | None |
| **APIs Needed** | None |
| **Database Changes Needed** | None |
| **Estimated Risk Level** | **LOW** |

**Targets:** Unused `components/ui/*`, `react-router` if not adopted, `middleware/cors.py` stub, unused `similarity_between` or wire it.

---

## Implementation Order (Recommended)

| Order | Feature | Phase | Risk | User Manual Impact |
|-------|---------|-------|------|-------------------|
| 1 | Fix AI embedding bug | 1.1 | HIGH | Unblocks submit + relevancy |
| 2 | Wire My Projects | 1.2 | LOW | Screen #5 |
| 3 | Wire Profile Edit | 1.3 | MEDIUM | Profile in manual |
| 4 | Wire Notifications | 1.4 | MEDIUM | Screen #7 |
| 5 | Fix revision modal | 1.5 | LOW | Screen #10 |
| 6 | Wire Admin Dashboard | 1.6 | LOW | Screen #14 |
| 7 | Wire Admin Users/Students/Professors | 1.7 | LOW | Screens #11–13 |
| 8 | Wire Admin Departments/Projects | 1.8 | LOW | Admin completeness |
| 9 | AI suggestion generation + wire UI | 2.1–2.2 | MEDIUM | AI features |
| 10 | Duplicate detection + Admin AI Reports | 2.3 | HIGH | Duplicate feature |
| 11 | Secure uploads + professor validation | 2.6–2.7 | MEDIUM | Data integrity |
| 12 | Error handling + sidebar fixes | 3.6–3.7 | LOW | UX polish |
| 13 | Tests | 2.9 | MEDIUM | Defense confidence |
| 14 | Analytics, attachments, CRUD | Phase 3 | MEDIUM | Extended features |
| 15 | Router, password reset, ML upgrade | Phase 4 | HIGH | Future scope |

---

## Summary: New APIs Required (Not Yet Built)

| API | Feature | Priority |
|-----|---------|----------|
| `GET /admin/duplicate-reports` | Duplicate reports list | High |
| `PATCH /admin/duplicate-reports/{id}` | Review/dismiss duplicate | High |
| `GET /admin/approvals` | Admin pending approvals | Medium |
| `GET /admin/analytics` | Admin analytics charts | Medium |
| `GET /projects/analytics` | Professor AI analytics | Medium |
| `GET /projects/{id}/attachments` | Attachment list | Medium |
| `GET /attachments/{id}/download` | File download | Medium |
| `GET /projects/{id}/reviews` | Review history | Medium |
| `POST/PATCH/DELETE /admin/departments` | Department CRUD | Medium |
| `PATCH /admin/users/{id}/status` | User activate/deactivate | Medium |
| `GET/PATCH /admin/settings` | System settings | Low |
| `POST /auth/forgot-password` | Password reset request | Low |
| `POST /auth/reset-password` | Password reset confirm | Low |
| `GET /projects/{id}/relevancy/report.pdf` | PDF export | Low |

---

## Summary: Database Changes Required

| Change | Feature | Priority |
|--------|---------|----------|
| None (use existing tables) | Most Phase 1–2 items | — |
| Populate `ai_suggestions` via backend logic | AI suggestions | High |
| Populate `duplicate_reports` via backend logic | Duplicate detection | High |
| **New:** `password_reset_tokens` | Forgot password | Low |
| **New:** `system_settings` | Admin settings | Low |
| **New:** `revoked_tokens` or Redis | Token revocation | Low |
| Functional Alembic migrations | Schema management | Medium |

---

## Approval Checklist

Before implementation begins, confirm:

- [ ] Phase 1 scope approved (critical user manual blockers)
- [ ] Phase 2 scope approved (duplicate detection, AI suggestions, security)
- [ ] Phase 3 scope approved (analytics, CRUD, attachments)
- [ ] Phase 4 deferred or included (router, ML, password reset)
- [ ] No frontend design changes required (wire existing UI only)
- [ ] No authentication architecture changes required

---

*Planning document only. No application code was modified. Awaiting your approval before any implementation.*
