# Database Backup Guide

**Workflow:** Evaluation Corpus Deployment — Phase 2  
**Date:** June 2026  
**Database:** `fyp_relevancy_system`  
**Purpose:** Backup before importing `dataset/eval_corpus_v1.sql`

---

## Important

**Do not skip backup on production or shared environments.**  
This guide provides the exact command for the current development setup. **The backup is not executed automatically** as part of the deployment workflow.

---

## Current Environment

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `fyp_relevancy_system` |
| User | `postgres` |
| Password | Set in `backend/.env` (`DB_PASSWORD`) |

Pre-import row counts: **9 projects**, **3 students**, **4 reviews**, **10 notifications**.

---

## Recommended Backup Command

Run from any directory where `pg_dump` is on your PATH:

```bash
pg_dump -U postgres -h localhost -p 5432 -d fyp_relevancy_system -F p -f backup_before_eval.sql
```

When prompted, enter the PostgreSQL password (`postgre123` in local `.env`).

### Windows PowerShell (same command)

```powershell
pg_dump -U postgres -h localhost -p 5432 -d fyp_relevancy_system -F p -f backup_before_eval.sql
```

### With password inline (avoid in shared shells)

```bash
set PGPASSWORD=postgre123
pg_dump -U postgres -h localhost -p 5432 -d fyp_relevancy_system -F p -f backup_before_eval.sql
```

PowerShell:

```powershell
$env:PGPASSWORD = "postgre123"
pg_dump -U postgres -h localhost -p 5432 -d fyp_relevancy_system -F p -f backup_before_eval.sql
```

---

## Suggested Backup Location

Save next to the repo root for easy rollback:

```
d:\FYP UNI\FYP-Relevancy-checker\backup_before_eval.sql
```

Or timestamped:

```bash
pg_dump -U postgres -h localhost -p 5432 -d fyp_relevancy_system -F p -f "backup_before_eval_2026-06-03.sql"
```

---

## Verify Backup

```bash
# File should be non-empty
ls -la backup_before_eval.sql

# Optional: list tables included
pg_restore -l backup_before_eval.sql
```

Plain SQL format (`-F p`) can also be inspected with any text editor; it should contain `CREATE TABLE` and `COPY` / `INSERT` statements.

---

## Restore (If Rollback Needed)

**Warning:** Restore overwrites current database contents.

```bash
# Drop and recreate (destructive)
psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS fyp_relevancy_system;"
psql -U postgres -h localhost -c "CREATE DATABASE fyp_relevancy_system;"
psql -U postgres -h localhost -d fyp_relevancy_system -f backup_before_eval.sql
```

### Remove only eval corpus (lighter rollback)

If import succeeded but you only want to remove eval rows:

```sql
DELETE FROM project_ideas WHERE title LIKE '[EVAL-%';
-- Cascades relevancy_results, matched_projects, duplicate_reports for those projects
```

---

## What Is Preserved in Backup

- All `users`, `students`, `professors`, `admins`
- All `project_ideas` (9 pre-import rows)
- All `reviews`, `notifications`
- All `relevancy_results`, `duplicate_reports`
- Schema and enum types

---

## Phase 2 Checklist

- [ ] `pg_dump` installed (`pg_dump --version`)
- [ ] Backup file created and non-zero size
- [ ] Backup path recorded
- [ ] Proceed to Phase 3 import

---

*Backup command documented only — not executed by the deployment workflow.*
