# Admin Dashboard — Duplicate Detection Widget Audit

**Date:** June 3, 2026  
**Component:** Admin Dashboard → “AI Duplicate Detection Alerts” section  
**Goal:** Remove demo/mock duplicate cards; keep only real database-backed UI

---

## Executive summary

| Question | Answer |
|----------|--------|
| Was widget data real? | **No** — 100% hardcoded in the React component |
| Connected to PostgreSQL list API? | **No** — no endpoint returns duplicate pairs for the UI |
| Connected to `matched_projects`? | **No** on this screen |
| Connected to `duplicate_reports`? | **Only indirectly** — stat card count via `GET /admin/dashboard` |
| Action taken | **Removed** entire “AI Duplicate Detection Alerts” widget section |

---

## 1. Where the widget got its data

### Source (fake)

**File:** `Frontend/src/app/components/AdminDashboard.tsx`  
**Variable:** `aiAlerts` (inline constant array, lines 210–238 before removal)

```typescript
const aiAlerts = [
  {
    id: 1,
    project1: 'AI-Based Traffic Prediction',
    student1: 'Emma Wilson',
    project2: 'Real-time Traffic Analysis',
    student2: 'David Brown',
    similarity: 87,
    riskLevel: 'high',
  },
  // ... Lisa Anderson, John Smith, etc.
];
```

### Data type classification

| Source type | Used for widget? |
|-------------|------------------|
| Hardcoded array in component | **Yes** |
| Mock service | No |
| Fake API response | No |
| `fetch()` / `adminService` for list | No |
| Placeholder / Figma demo data | **Yes** |

The widget rendered `{aiAlerts.map(...)}` with no API call, no props, and no context provider.

### “Review Now” buttons

Non-functional UI — no `onClick` handler, no navigation, no backend action.

---

## 2. Backend / database connectivity check

### Tables

| Table | Purpose in system | Used by removed widget? |
|-------|-------------------|-------------------------|
| `duplicate_reports` | Admin duplicate pairs (`project1_id`, `project2_id`, `similarity_score`, …) | **No** (no list API wired to UI) |
| `matched_projects` | Per-project relevancy similarity rows (`relevancy_results` → student relevancy screen) | **No** |
| `project_ideas` | All submitted projects | **No** (widget did not query projects) |

### APIs

| Endpoint | Returns | Used by widget? |
|----------|---------|-----------------|
| `GET /api/v1/admin/dashboard` | `aiDuplicateAlerts` = `COUNT(duplicate_reports WHERE status=pending)` | **No** (count only; not the card list) |
| `GET /api/v1/admin/duplicate-reports` | — | **Does not exist** |
| `GET /api/v1/projects/{id}/relevancy` | `matched_projects[]` | Used on **student** relevancy page only |

**Backend implementation (unchanged):**  
`backend/app/services/admin_service.py` → `get_admin_stats()` counts pending rows in `duplicate_reports`. That count still powers the **“AI Duplicate Alerts” stat card** (real number, often `0` if nothing is inserted into `duplicate_reports`).

**Important:** Relevancy analysis writes to `matched_projects` on submit but **does not** populate `duplicate_reports`. The stat count and the removed widget were therefore unrelated data paths.

---

## 3. What was removed

### UI components removed

| Item | Description |
|------|-------------|
| Section | “AI Duplicate Detection Alerts” panel (full-width block below department chart) |
| `aiAlerts` | Hardcoded demo array |
| `getRiskColor()` | Helper only used by removed cards |
| `Sparkles` icon import | Only used in removed section |
| “Review Now” buttons | Part of removed section |

### What was kept (real data)

| Item | Source |
|------|--------|
| Six stat cards | `GET /api/v1/admin/dashboard` → PostgreSQL aggregates |
| “AI Duplicate Alerts” **stat card** | `duplicate_reports` pending count (live; may show `0`) |

### Separate files not deleted

| File | Reason |
|------|--------|
| `Frontend/src/app/components/AdminAIReports.tsx` | Already `@deprecated`, not in app navigation; not part of Admin Dashboard widget. Contains its own mock `reports` array. Out of scope for this dashboard-only fix. |
| `backend/app/models/duplicate_report.py` | Schema still used for dashboard **count** |
| `backend/app/services/admin_service.py` | Unchanged |

No standalone “duplicate alerts mock JSON” file existed — demo data lived only inside `AdminDashboard.tsx`.

---

## 4. Files modified

| File | Change |
|------|--------|
| `Frontend/src/app/components/AdminDashboard.tsx` | Removed `aiAlerts`, `getRiskColor`, duplicate alerts JSX, `Sparkles` import |

**Files not modified (per requirements):**

- Project submission / relevancy engine  
- Review queue / `submit_review`  
- Notifications (student or professor)  
- Auth, user management, admin list pages  
- Backend routes, models, `admin_service.get_admin_stats()`  

---

## 5. Confirmation — backend functionality unaffected

| Area | Impact |
|------|--------|
| `POST /projects` + relevancy | None |
| `matched_projects` inserts | None |
| `duplicate_reports` table / model | None (table unused for writes today; count query unchanged) |
| Professor notifications | None |
| Student review notifications | None |
| Authentication | None |

---

## 6. Remaining mock content on Admin Dashboard (documented)

These sections were **not** part of this task but still use placeholder data:

| Section | Data source |
|---------|-------------|
| Recent Activities | Hardcoded `recentActivities` array |
| Department Wise | Hardcoded `departmentData` array |

Only the **AI Duplicate Detection Alerts** list widget was removed per audit scope.

---

## 7. Verification steps

1. **Build:** `npm run build` in `Frontend/` — **PASS** after removal.  
2. **UI:** Log in as admin → Dashboard → confirm:
   - Stat cards still load from API.  
   - “AI Duplicate Alerts” stat may show `0` or DB count.  
   - **No** Emma Wilson / Traffic Prediction cards at bottom.  
3. **Regression:** Submit project, professor review, notifications — unchanged code paths.

---

## 8. Future work (not implemented)

To show real duplicate pairs on the dashboard later (without mock data):

1. Populate `duplicate_reports` when relevancy similarity exceeds a threshold, **or**  
2. Add `GET /admin/duplicate-reports` listing `duplicate_reports` with project/student joins, **then**  
3. Re-add a dashboard section wired to that API (or use deprecated `AdminAIReports` page with real data).

---

*End of audit report.*
