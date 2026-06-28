# Post-Import Validation — University Proposals

**Date:** June 2026  
**Validation type:** Read-only database verification  
**Import script:** `backend/scripts/import_university_proposals.py`

---

## 1. Project Count

```sql
SELECT COUNT(*) FROM project_ideas;
```

| Metric | Before import | After import | Delta |
|--------|--------------:|-------------:|------:|
| **Total projects** | **29** | **39** | **+10** |

Breakdown after import:

| Segment | Count |
|---------|------:|
| Legacy projects | 9 |
| Eval corpus (`[EVAL-%`) | 20 |
| **University proposals (real)** | **10** |
| **Total** | **39** |

---

## 2. Import Results Summary

| Category | Count |
|----------|------:|
| Proposals found in source folder | 13 |
| Ready candidates | 10 |
| Skipped (Not Ready) | 3 |
| **Successfully imported** | **10** |
| Skipped duplicates (re-run) | 10 |
| Failed imports | **0** |

---

## 3. Project IDs Created

| ID | Title | Source file |
|----|-------|-------------|
| 31 | AI-Powered Real-Time Classroom Noise Detection and Automatic Lecture Notes Generator | AI_Classroom_Noise_Notes_Proposal.pdf |
| 32 | Smart Relocation Assistance and Property Finder System | FYP Pre.docx |
| 33 | AI-Based Retinal Disease Detection System Using Deep Learning | FYP Proposal.docx |
| 34 | Integrated Health Information System (IHIS) | FYP_C-PRMS 2.pdf |
| 35 | AI-Based "Can I Resell This?" System for Waste-to-Value Optimization | FYP_Proposal_1.docx |
| 36 | AI Smart Tuition Recommendation System | Filled_FYP_Proposal_AI_Tuition_System.docx |
| 37 | ScholarIQ — AI Scholarship Recommendation Platform | Final year project.pdf |
| 38 | CareerCraft AI — Intelligent Interview and Resume Mastery Platform | Proposal CareerCraft V2.pdf |
| 39 | CipherPlay — AI-Powered Children's Indoor Fitness Game | ahad CipherPlay_Proposal.pdf |
| 40 | AI-Powered Career Coaching and Job Preparation Platform | qaiser11 fyp perposol.pdf |

**ID range:** 31 – 40

---

## 4. Assignment Validation

| Check | Result |
|-------|--------|
| `professor_email` | `professor@uol.edu.pk` on all 10 rows |
| `professor_id` | **1** on all 10 rows |
| `status` | `PENDING` on all 10 rows |
| `student_id` rotation | IDs 1, 2, 3 (round-robin) |
| `relevancy_score` | NULL (analysis not run) |
| `relevancy_results` rows for IDs 31–40 | **0** (expected) |

---

## 5. Proposal V3 Field Completeness (Imported Rows)

Verified on IDs 31–40:

| Field | Non-empty |
|-------|:---------:|
| title | 10/10 |
| description | 10/10 |
| category | 10/10 |
| target_industry | 10/10 |
| problem_statement | 10/10 |
| proposed_solution | 10/10 |
| unique_features | 10/10 |
| innovation_aspect | 10/10 |
| target_users | 10/10 |
| expected_impact | 10/10 |
| technologies | 10/10 |

---

## 6. Preserved Existing Data

| Table / segment | Unchanged |
|-----------------|-----------|
| Legacy projects (IDs 1–10) | Yes |
| Eval corpus (IDs 11–30) | Yes |
| Reviews | Yes |
| Notifications | Yes |
| Existing relevancy_results | Yes (28 rows — eval + legacy only) |

---

## 7. Idempotency Check

Second execution of `python -m scripts.import_university_proposals`:

| Metric | Value |
|--------|------:|
| Imported | 0 |
| Skipped (duplicate title) | 10 |
| Final count | 39 (unchanged) |

**Pass** — importer is safe to run multiple times.

---

## 8. Skipped Files (Not Imported)

| File | Status |
|------|--------|
| FYP Proposal.pdf | Not Ready — not in DB |
| Proposal.pdf | Not Ready — not in DB |
| pixelwave (hrm) project proposal...pdf | Not Ready — not in DB |

---

## 9. Verification Queries

```sql
-- Total count
SELECT COUNT(*) FROM project_ideas;
-- Expected: 39

-- University imports (by title patterns)
SELECT id, title FROM project_ideas
WHERE id BETWEEN 31 AND 40
ORDER BY id;

-- No relevancy yet
SELECT COUNT(*) FROM relevancy_results
WHERE project_id BETWEEN 31 AND 40;
-- Expected: 0
```

---

## 10. Phase Verdict

**PASS** — All 10 ready university proposals imported into `project_ideas` with full Proposal V3 fields, correct professor assignment, and duplicate-safe idempotency. Final project count **39**. Relevancy analysis intentionally not executed.

---

*See `UNIVERSITY_PROPOSALS_IMPORT_REPORT.md` for import details and `UNIVERSITY_PROPOSAL_AUDIT.md` for source audit.*
