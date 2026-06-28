# Pre-Import Validation

**Workflow:** Evaluation Corpus Deployment — Phase 1  
**Date:** June 2026  
**Database:** `fyp_relevancy_system` @ `localhost:5432`

---

## 1. Dataset Files

| File | Status | Path |
|------|--------|------|
| SQL import script | **Present** | `dataset/eval_corpus_v1.sql` (551 lines, 20 INSERTs) |
| JSON source corpus | **Present** | `dataset/eval_corpus_v1.json` (476 lines, 20 projects) |

Both files exist and match the expansion plan (`DATASET_EXPANSION_PLAN.md`).

---

## 2. Current Database Snapshot (Pre-Import)

| Metric | Value |
|--------|------:|
| Total projects | **9** |
| Eval projects (`[EVAL-%`) | **0** |
| Total students | **3** |
| Total professors | **2** |
| Max project ID | **10** |
| Relevancy results | 8 |
| Reviews | **4** |
| Notifications | **10** |
| Duplicate reports | 1 |

---

## 3. Foreign Key Prerequisites

### Professor account

| Check | Result |
|-------|--------|
| `professor@uol.edu.pk` registered | **Yes** |
| Professor ID | **1** |

### Student accounts

| Student ID | Status |
|----------:|--------|
| 1 | **Exists** |
| 2 | **Exists** |
| 3 | **Exists** |

SQL import rotates `student_id` across offsets 0, 1, 2 — all resolve correctly.

---

## 4. Safety Checks

| Check | Result |
|-------|--------|
| Eval corpus already imported | **No** — safe for first import |
| Import script idempotent (`WHERE NOT EXISTS`) | Yes |
| Existing users preserved | Yes — INSERT only adds `project_ideas` rows |
| Existing reviews preserved | Yes — no DELETE on reviews |
| Existing notifications preserved | Yes — no DELETE on notifications |
| Prior validation report | `DATASET_IMPORT_VALIDATION_REPORT.md` — **PASS** |

---

## 5. Expected Post-Import State

| Metric | Expected |
|--------|----------|
| Total projects | **29** (9 + 20) |
| Eval projects | **20** |
| New project IDs | **11–30** |
| Reviews | 4 (unchanged) |
| Notifications | 10 (unchanged) |

---

## 6. Phase 1 Verdict

**GO** — All pre-import checks passed. Proceed to backup (Phase 2) and import (Phase 3).

---

*Read-only validation. No database modifications in this phase.*
