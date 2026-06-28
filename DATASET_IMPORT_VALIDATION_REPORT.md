# Dataset Import Validation Report

**Project:** AI-Based FYP Relevancy System  
**Document type:** Pre-execution validation (read-only)  
**Date:** June 2026  
**Target file:** `dataset/eval_corpus_v1.sql`  
**Database:** `fyp_relevancy_system` @ `localhost:5432`  
**ORM reference:** `backend/app/models/project.py`

---

## Executive Summary

| Check | Result |
|-------|--------|
| Schema compatibility | **PASS** |
| Required fields present | **PASS** |
| Foreign key validity | **PASS** |
| Professor email validity | **PASS** |
| Duplicate primary keys | **PASS** (none specified; auto-increment) |
| Execution on current DB | **PASS — safe to run** |

**Overall verdict:** The script is **valid and should execute successfully** on the current development database. All 20 rows should insert on first run (project IDs 11–30 expected). No blocking issues found.

**Non-blocking notes:** 27 optional `project_ideas` columns are omitted (allowed). Relevancy analysis is not triggered by SQL import. A second run inserts **0 rows** (idempotent by design).

---

## 1. Schema Compatibility

### 1.1 INSERT columns vs live `project_ideas` table

Validated against PostgreSQL `information_schema` (`public.project_ideas`, **43 columns**).

**Columns used in every INSERT (16):**

| Column | DB type | Nullable | In SQL |
|--------|---------|----------|--------|
| student_id | integer | NO | Subquery |
| professor_id | integer | YES | Subquery |
| title | varchar(500) | NO | Literal |
| technologies | varchar(500) | NO | Literal |
| description | text | NO | Literal |
| category | varchar(255) | YES | Literal |
| target_industry | varchar(255) | YES | Literal |
| problem_statement | text | YES | Literal |
| proposed_solution | text | YES | Literal |
| unique_features | text | YES | Literal |
| innovation_aspect | text | YES | Literal |
| target_users | text | YES | Literal |
| expected_impact | text | YES | Literal |
| professor_email | varchar(255) | NO | Literal |
| status | enum `projectstatus` | NO | `'PENDING'` |
| submitted_date | date | NO | `CURRENT_DATE` |

**Result:** All 16 INSERT column names exist in the live table. **No unknown or misspelled columns.**

### 1.2 Omitted columns (27 — all nullable or auto-default)

These DB columns are **not** in the INSERT list; all are nullable except auto-managed timestamps:

| Omitted | Handling |
|---------|----------|
| `id` | Serial/auto-increment (default) |
| `created_at`, `updated_at` | Server default `now()` |
| `relevancy_score`, `feedback` | Nullable — OK |
| Remaining 23 extended proposal fields | Nullable — OK |

**Result:** Omission is **schema-valid**. Matches ORM model (`ProjectIdea`).

### 1.3 String length limits

| Field | Max in SQL | DB limit | Status |
|-------|----------:|---------:|--------|
| title | 83 chars | 500 | PASS |
| technologies | 71 chars | 500 | PASS |
| category / target_industry | 26 chars | 255 | PASS |
| description & text fields | ≤ ~400 chars each | text | PASS |

### 1.4 SQL escaping

One apostrophe correctly escaped as `''` in EVAL-U05 `expected_impact` (`student''s`). **No unescaped quote risk detected.**

### 1.5 INSERT consistency

- **20** `INSERT INTO project_ideas` statements
- **20** unique `[EVAL-*]` titles parsed from file
- All statements share the **same column list and value order**

---

## 2. Required Fields

### 2.1 Database NOT NULL constraints

Live NOT NULL columns:

```
id, student_id, title, technologies, description,
professor_email, status, submitted_date, created_at, updated_at
```

| Required column | Provided by SQL? | Notes |
|-----------------|------------------|-------|
| student_id | Yes | FK subquery |
| title | Yes | All 20 rows |
| technologies | Yes | All 20 rows |
| description | Yes | All 20 rows |
| professor_email | Yes | All 20 rows |
| status | Yes | `'PENDING'` |
| submitted_date | Yes | `CURRENT_DATE` |
| id | Default | Auto-increment |
| created_at | Default | Server `now()` |
| updated_at | Default | Server `now()` |

### 2.2 Evaluation dataset fields (9 semantic fields)

Required by expansion plan — all populated in every INSERT:

| Field | 20/20 present |
|-------|:-------------:|
| title | Yes |
| description | Yes |
| problem_statement | Yes |
| proposed_solution | Yes |
| unique_features | Yes |
| innovation_aspect | Yes |
| target_users | Yes |
| target_industry | Yes |
| expected_impact | Yes |

**Result:** **PASS** — all evaluation and DB-required fields satisfied.

---

## 3. Foreign Key Validation

### 3.1 `student_id` → `students.id`

SQL pattern (rotating):

```sql
(SELECT id FROM students ORDER BY id LIMIT 1 OFFSET 0|1|2)
```

| Offset | Resolves to | Status |
|--------|------------:|--------|
| 0 | student id **1** | Valid |
| 1 | student id **2** | Valid |
| 2 | student id **3** | Valid |

**Live DB:** 3 students (ids 1, 2, 3). **PASS**

**Risk if student count < 3:** OFFSET 2 returns NULL → `NOT NULL` violation on `student_id`. Not applicable today; document for other environments.

### 3.2 `professor_id` → `professors.id`

SQL pattern:

```sql
(SELECT p.id FROM professors p
 JOIN users u ON u.id = p.user_id
 WHERE u.email = 'professor@uol.edu.pk' LIMIT 1)
```

| Check | Result |
|-------|--------|
| Professor account exists | Yes |
| Resolved `professor_id` | **1** |
| Matches registered seed user | Yes |

**Result:** **PASS** — valid FK; column is nullable but value resolves.

---

## 4. Professor Email Validation

### 4.1 Values in SQL

All 20 INSERTs use: **`professor@uol.edu.pk`**

### 4.2 Application validator (`validate_professor_email`)

Pattern: `^[a-zA-Z0-9._-]+@uol.edu.pk$` (case-insensitive)

| Check | Result |
|-------|--------|
| Format valid | Yes |
| Not a `@student.` email | Yes |
| Registered professor in DB | Yes (`professor@uol.edu.pk`) |
| API would accept on submit | Yes |

**Note:** Application normalizes email to lowercase on create; SQL value already lowercase. **PASS**

---

## 5. Primary Key / Uniqueness

### 5.1 Explicit primary keys in SQL

**None.** No `id` column in any INSERT statement. IDs assigned by sequence.

### 5.2 Duplicate IDs

Not applicable — auto-increment only. Current `MAX(id) = 10`; next IDs **11–30** on first import.

### 5.3 Duplicate titles

| Scope | Count | Result |
|-------|------:|--------|
| Within SQL file | 20 unique | PASS |
| Collisions with existing DB | 0 | PASS |
| Existing `[EVAL-%` rows in DB | 0 | PASS (first import) |

Idempotency guard:

```sql
WHERE NOT EXISTS (SELECT 1 FROM project_ideas WHERE title = '...')
```

**Second run:** 0 new rows, no PK conflict, transaction commits cleanly.

---

## 6. Status Enum Compatibility

Live PostgreSQL enum `projectstatus`:

```
PENDING | APPROVED | REJECTED | REVISION
```

SQL uses **`'PENDING'`** (uppercase enum label).

| Check | Result |
|-------|--------|
| Value in enum | Yes |
| Matches existing row pattern | Yes (audit showed `APPROVED`, `PENDING`) |

**Result:** **PASS** — no enum cast required.

---

## 7. Execution Readiness (Current Database)

### 7.1 Pre-flight snapshot

| Item | Current value |
|------|---------------|
| Total projects | 9 |
| Max project id | 10 |
| Students | 3 |
| Professor seed account | Present |
| Eval corpus already imported | No |

### 7.2 Expected outcome on first run

```
BEGIN;
  → 20 INSERTs execute
  → 20 new rows (ids 11–30)
COMMIT;
```

| Post-import metric | Expected |
|--------------------|----------|
| `SELECT COUNT(*) FROM project_ideas WHERE title LIKE '[EVAL-%'` | **20** |
| Total projects | **29** |
| Relevancy results | **0** (until API/backfill) |

### 7.3 Transaction safety

Script wrapped in `BEGIN` / `COMMIT`. Any single failure rolls back all 20 inserts. **PASS**

### 7.4 Known non-blocking gaps after import

| Gap | Impact | Mitigation |
|-----|--------|------------|
| No `relevancy_results` rows | Scores empty until analysis run | POST/GET relevancy API or backfill |
| No `professor_id` repair needed | FK already set in SQL | — |
| Junk legacy rows (IDs 5, 9) remain | Eval metrics noise | Filter in eval queries |

---

## 8. Checklist Summary

| # | Question | Answer |
|---|----------|--------|
| 1 | Does every INSERT match `project_ideas` schema? | **Yes** |
| 2 | Are all required fields present? | **Yes** |
| 3 | Invalid foreign keys? | **None** |
| 4 | Valid `professor_email` values? | **Yes** — all `professor@uol.edu.pk` |
| 5 | Duplicate primary keys used? | **No** — auto-increment only |
| 6 | Will script run on current DB? | **Yes** |

---

## 9. Recommended Import Command

```bash
psql -U postgres -d fyp_relevancy_system -f dataset/eval_corpus_v1.sql
```

**Verify after import:**

```sql
SELECT COUNT(*) FROM project_ideas WHERE title LIKE '[EVAL-%';
-- Expected: 20

SELECT id, title FROM project_ideas WHERE title LIKE '[EVAL-%' ORDER BY id;
-- Expected: ids 11–30
```

---

## 10. Validation Method

- Parsed `dataset/eval_corpus_v1.sql` structure (20 INSERTs, titles, emails, lengths)
- Queried live PostgreSQL schema via `information_schema`
- Resolved FK subqueries against `students` and `professors`
- Verified enum labels for `projectstatus`
- Checked title collisions with existing rows
- Validated professor email against `backend/app/utils/validators.py`

**No data was modified during this validation.**

---

*Generated as a pre-execution gate for eval corpus import. See `DATASET_EXPANSION_PLAN.md` for corpus design and post-import steps.*
