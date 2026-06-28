# University Proposals Import Report

**Date:** June 2026  
**Script:** `backend/scripts/import_university_proposals.py`  
**SQL file:** `university_proposals_import.sql`  
**Source:** `dataset/university_proposals/`  
**Reference:** `UNIVERSITY_PROPOSAL_AUDIT.md`

---

## Executive Summary

| Metric | Value |
|--------|------:|
| Files found in source directory | 13 |
| Marked **Ready** (imported) | **10** |
| Skipped (Not Ready) | **3** |
| Successfully imported | **10** |
| Failed imports | **0** |
| Duplicate skips (re-run) | **10** (idempotent) |

**Result:** All 10 audit-ready university proposals are in PostgreSQL as `project_ideas` rows **31–40**. No relevancy analysis was run. No schema or AI code changes were made.

---

## Import Rules Applied

| Rule | Applied |
|------|---------|
| Import Ready proposals only | Yes — 10 files |
| Skip Not Ready | Yes — 3 files |
| `professor_email = professor@uol.edu.pk` | Yes |
| `professor_id` resolved from DB | Yes — ID 1 |
| Student rotation (IDs 1, 2, 3) | Yes |
| Duplicate protection by title | Yes |
| Idempotent re-run | Yes — verified |
| Relevancy / embeddings | **Not run** |

---

## Skipped (Not Ready)

| File | Reason |
|------|--------|
| `FYP Proposal.pdf` | 4/7 fields — UOL template layout |
| `Proposal.pdf` | 4/7 fields — weapon detection template |
| `pixelwave (hrm) project proposal by group 2_260621_125121.pdf` | 4/7 fields — HRM business format |

---

## Successfully Imported (10)

| ID | Source file | Title |
|----|-------------|-------|
| 31 | AI_Classroom_Noise_Notes_Proposal.pdf | AI-Powered Real-Time Classroom Noise Detection and Automatic Lecture Notes Generator |
| 32 | FYP Pre.docx | Smart Relocation Assistance and Property Finder System |
| 33 | FYP Proposal.docx | AI-Based Retinal Disease Detection System Using Deep Learning |
| 34 | FYP_C-PRMS 2.pdf | Integrated Health Information System (IHIS) |
| 35 | FYP_Proposal_1.docx | AI-Based "Can I Resell This?" System for Waste-to-Value Optimization |
| 36 | Filled_FYP_Proposal_AI_Tuition_System.docx | AI Smart Tuition Recommendation System |
| 37 | Final year project.pdf | ScholarIQ — AI Scholarship Recommendation Platform |
| 38 | Proposal CareerCraft V2.pdf | CareerCraft AI — Intelligent Interview and Resume Mastery Platform |
| 39 | ahad CipherPlay_Proposal.pdf | CipherPlay — AI-Powered Children's Indoor Fitness Game |
| 40 | qaiser11 fyp perposol.pdf | AI-Powered Career Coaching and Job Preparation Platform |

---

## Field Mapping (Proposal V3 → `project_ideas`)

| Source / curated field | DB column | Populated |
|------------------------|-----------|:---------:|
| title | `title` | 10/10 |
| description | `description` | 10/10 |
| category | `category` | 10/10 |
| target_industry | `target_industry` | 10/10 |
| problem_statement | `problem_statement` | 10/10 |
| proposed_solution | `proposed_solution` | 10/10 |
| unique_features | `unique_features` | 10/10 |
| innovation_aspect | `innovation_aspect` | 10/10 |
| target_users | `target_users` | 10/10 |
| expected_impact | `expected_impact` | 10/10 |
| technologies | `technologies` | 10/10 |
| — | `professor_email` | 10/10 |
| — | `professor_id` | 10/10 |
| — | `status` | `PENDING` |
| — | `student_id` | Rotated 1→2→3 |

Extraction used PDF/DOCX parsing plus curated enrichments from `UNIVERSITY_PROPOSAL_AUDIT.md` for titles and gap fields.

---

## Duplicate Protection

Before each insert:

```sql
SELECT 1 FROM project_ideas WHERE title = '<canonical title>'
```

**First run:** 10 inserts (count 29 → 39)  
**Second run:** 10 skipped as duplicates (count unchanged at 39)

---

## Usage

### Python import (recommended)

```bash
cd backend
python -m scripts.import_university_proposals          # import only
python -m scripts.import_university_proposals --dry-run
python -m scripts.import_university_proposals --generate-sql
python -m scripts.import_university_proposals --generate-sql --import
```

### SQL import (alternative)

```bash
psql -U postgres -d fyp_relevancy_system -f university_proposals_import.sql
```

Uses `WHERE NOT EXISTS` on title — safe to re-run.

---

## Not Modified

- Relevancy engine / similarity engine  
- Ollama integration  
- Authentication, notifications, review workflow  
- Frontend  
- Database schema  

---

## Notable Corpus Overlap

| Pair | Note |
|------|------|
| CareerCraft (#38) ↔ Career Coaching (#40) | Near-duplicate domain from audit (67% TF-IDF) |
| CareerCraft / Qaiser ↔ `[EVAL-P1A/P1B]` | Real + synthetic career/relevancy topics |

Relevancy analysis was **not** run as part of this import.

---

## Artifacts

| File | Purpose |
|------|---------|
| `backend/scripts/import_university_proposals.py` | Importer |
| `university_proposals_import.sql` | Idempotent SQL |
| `dataset/university_proposals_import_result.json` | Machine-readable run log |
| `POST_IMPORT_VALIDATION.md` | Post-import DB verification |

---

*Import completed without relevancy backfill or AI pipeline changes.*
