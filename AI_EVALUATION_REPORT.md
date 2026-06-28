# AI Evaluation Report

**Project:** AI-Based FYP Relevancy System  
**Document type:** Read-only database + AI engine evaluation  
**Date:** 23 June 2026  
**Data source:** Live PostgreSQL query (`fyp_relevancy_system`)  
**Code modified:** None

---

## Executive Summary

| Metric | Value |
|--------|------:|
| Total projects in database | **40** |
| Projects with relevancy analysis | **29** (72.5%) |
| Projects missing relevancy analysis | **11** (27.5%) |
| University proposals analyzed (IDs 31–40) | **0 / 10** |
| Duplicate reports in system | **5** |
| Ollama `generated` explanations | **0** |
| Ollama `fallback` explanations | **21** |
| Active AI engine | **V1 BOW cosine + heuristics** (see `AI_ENGINE_AUDIT.md`) |

**Key finding:** All 10 imported university proposals (IDs 31–40) were imported **without relevancy backfill**. They cannot be demonstrated on the relevancy page until analysis is run. The system is **partially ready** for viva (eval corpus + legacy projects work), but **not ready** to demo real university proposals without a backfill step.

---

## AI Engine Context (Current Production)

| Component | Status |
|-----------|--------|
| Scoring | `RelevancyEngine` — weighted BOW cosine similarity + heuristic sub-scores |
| TF-IDF label | Misleading — implementation is bag-of-words cosine (no IDF) |
| Sentence Transformers | **Dormant** (`RELEVANCY_ENGINE_V2_ENABLED=false`) |
| Duplicate detection | V1 similarity % from matched projects (threshold 50%) |
| Ollama | Explanations only; **0 live-generated** explanations in DB |

---

## 1. Current Project Count

| Segment | Count | ID range / marker |
|---------|------:|-------------------|
| **Total** | **40** | IDs 1–41 (gap at ID 2) |
| Legacy seed projects | 9 | 1, 3–10 |
| Eval corpus | 20 | 11–30 (`[EVAL-*]` titles) |
| University proposals (imported) | 10 | **31–40** |
| Other | 1 | 41 — *AI-Powered Privacy-First Scavenger Hunt for Children* (post-import submission) |

### Database inventory by status

| Status | Count |
|--------|------:|
| With `relevancy_results` row | 29 |
| Without `relevancy_results` row | 11 |
| With duplicate report involvement | 6 |
| Without duplicate report involvement | 34 |

---

## 2. Projects Missing Relevancy Results

**Total missing: 11 projects (27.5% of corpus)**

| ID | Title | Segment |
|----|-------|---------|
| 1 | Smart Campus Navigation System | Legacy |
| 31 | AI-Powered Real-Time Classroom Noise Detection and Automatic Lecture Notes Generator | **University** |
| 32 | Smart Relocation Assistance and Property Finder System | **University** |
| 33 | AI-Based Retinal Disease Detection System Using Deep Learning | **University** |
| 34 | Integrated Health Information System (IHIS) | **University** |
| 35 | AI-Based "Can I Resell This?" System for Waste-to-Value Optimization | **University** |
| 36 | AI Smart Tuition Recommendation System | **University** |
| 37 | ScholarIQ — AI Scholarship Recommendation Platform | **University** |
| 38 | CareerCraft AI — Intelligent Interview and Resume Mastery Platform | **University** |
| 39 | CipherPlay — AI-Powered Children's Indoor Fitness Game | **University** |
| 40 | AI-Powered Career Coaching and Job Preparation Platform | **University** |

### University proposals (31–40) — relevancy status

| Result | Count |
|--------|------:|
| Missing relevancy | **10 / 10** |
| Have relevancy | **0 / 10** |

**Cause:** Import script intentionally skipped relevancy analysis per `UNIVERSITY_PROPOSALS_IMPORT_REPORT.md`. No backfill has been run since import.

### Analyzed corpus statistics (29 projects)

| Metric | Value |
|--------|------:|
| Average `overall_score` | **67.59** |
| Legacy average (IDs 3–10) | 68.79 |
| Eval corpus average (IDs 11–30) | 67.44 |
| Other (ID 41 only) | 61.12 |

---

## 3. Projects Missing Duplicate Analysis

Duplicate reports are created when `run_relevancy_analysis()` finds corpus matches ≥ 50% similarity. A project is counted as **missing duplicate analysis** if it has **no involvement** in any `duplicate_reports` row (neither as `project1_id` nor `project2_id`).

### System-wide

| Category | Count | Notes |
|----------|------:|-------|
| Never analyzed (no relevancy run possible) | **11** | IDs 1, 31–40 |
| Analyzed but no duplicate report | **23** | No cross-match ≥ 50% |
| Involved in ≥ 1 duplicate report | **6** | IDs 3, 6, 21, 25, 26, 39, 41 |

### University proposals (31–40)

| ID | Own analysis run | In duplicate report | Notes |
|----|:----------------:|:-------------------:|-------|
| 31 | No | No | Fully unprocessed |
| 32 | No | No | Fully unprocessed |
| 33 | No | No | Fully unprocessed |
| 34 | No | No | Fully unprocessed |
| 35 | No | No | Fully unprocessed |
| 36 | No | No | Fully unprocessed |
| 37 | No | No | Fully unprocessed |
| 38 | No | No | Fully unprocessed |
| 39 | No | **Yes** (passive) | Appears as `project1_id` in report vs ID 41 (64.05%) — triggered when ID 41 was analyzed, not when 39 was |
| 40 | No | No | Fully unprocessed |

**University summary:** **10 / 10** missing their own duplicate analysis. Only ID 39 appears passively in one report because a later project (ID 41) matched it during corpus comparison.

**Notable unverified pair:** CareerCraft (#38) vs Qaiser career coaching (#40) was flagged at ~67% similarity in the file audit — **not yet in `duplicate_reports`** because neither project has been analyzed.

---

## 4. Projects Missing Ollama Explanations

Ollama explanation is considered **present** when `relevancy_results.why_relevant` is non-empty.

| Status | Count | Project IDs |
|--------|------:|-------------|
| **No explanation** (`why_relevant` empty) | **8** | 3, 4, 5, 6, 7, 8, 9, 10 |
| **Fallback** (`explanation_status = fallback`) | **21** | 11–30, 41 |
| **Generated** (`explanation_status = generated`) | **0** | — |
| **Not applicable** (no relevancy row) | **11** | 1, 31–40 |

### University proposals (31–40)

| Status | Count |
|--------|------:|
| Missing explanation | **10 / 10** |
| Fallback explanation | 0 |
| Generated explanation | 0 |

All university proposals lack explanations because relevancy analysis has never been run on them.

**Interpretation:** Ollama has **never successfully generated** a live explanation in this database. All existing explanations are rule-based fallbacks (Ollama not running or unreachable during backfill).

---

## 5. Highest Relevancy Score

| Field | Value |
|-------|-------|
| **Score** | **80.71** |
| Project ID | 3 |
| Title | AI-Based Final Year Project Relevancy System |
| Segment | Legacy |
| `similarity_score` | 100.0 (exact duplicate of ID 6) |
| `novelty_score` | 30.0 (floor — high similarity penalizes novelty) |

### Top 5 overall scores (all analyzed projects)

| Rank | ID | Score | Title |
|------|----|------:|-------|
| 1 | 3 | 80.71 | AI-Based Final Year Project Relevancy System |
| 2 | 29 | 76.37 | [EVAL-U05] AI-Based Final Year Project Relevancy and Originality Checker |
| 3 | 5 | 75.82 | AI-Based Final Year Project Relevancy System |
| 4 | 4 | 74.91 | AI-Based Final Year Project Relevancy System |
| 5 | 28 | 74.21 | [EVAL-U04] AI-Based Final Year Project Relevancy and Originality Checker |

**University proposals:** No scores — all unanalyzed.

---

## 6. Lowest Relevancy Score

| Field | Value |
|-------|-------|
| **Score** | **44.02** |
| Project ID | 6 |
| Title | AI-Based Final Year Project Relevancy System |
| Segment | Legacy |
| `similarity_score` | 100.0 (exact duplicate of ID 3 — low overall due to novelty penalty) |

### Bottom 5 overall scores (all analyzed projects)

| Rank | ID | Score | Title |
|------|----|------:|-------|
| 1 | 6 | 44.02 | AI-Based Final Year Project Relevancy System |
| 2 | 25 | 56.67 | [EVAL-P3A] Smart Campus Navigation System with Indoor and Outdoor Routing |
| 3 | 41 | 61.12 | AI-Powered Privacy-First Scavenger Hunt for Children |
| 4 | 26 | 61.45 | [EVAL-P3B] University Wayfinding Mobile App for Indoor and Outdoor Campus Travel |
| 5 | 22 | 62.88 | [EVAL-P2A] AI-Powered Resume Screening and Candidate Ranking System |

---

## 7. Top Duplicate-Risk Pairs

All **5** duplicate reports currently in the database (sorted by similarity):

| Rank | Project 1 | Project 2 | Similarity | Risk | Segment |
|------|-----------|-----------|----------:|:----:|---------|
| 1 | **#3** — AI-Based Final Year Project Relevancy System | **#6** — AI-Based Final Year Project Relevancy System | **100.00%** | **HIGH** | Legacy ↔ Legacy (exact duplicate) |
| 2 | **#39** — CipherPlay — AI-Powered Children's Indoor Fitness Game | **#41** — AI-Powered Privacy-First Scavenger Hunt for Children | **64.05%** | **MEDIUM** | **University #39** ↔ Other |
| 3 | **#3** — AI-Based Final Year Project Relevancy System | **#21** — [EVAL-P1A] AI-Based FYP Relevancy and Originality Checker | **58.16%** | LOW | Legacy ↔ Eval |
| 4 | **#6** — AI-Based Final Year Project Relevancy System | **#21** — [EVAL-P1A] AI-Based FYP Relevancy and Originality Checker | **58.16%** | LOW | Legacy ↔ Eval |
| 5 | **#25** — [EVAL-P3A] Smart Campus Navigation System | **#26** — [EVAL-P3B] University Wayfinding Mobile App | **53.27%** | LOW | Eval paraphrase pair |

### University-relevant pairs (expected after backfill)

Based on prior file audit (`UNIVERSITY_PROPOSAL_AUDIT.md`), these pairs should be watched once IDs 31–40 are analyzed:

| Expected pair | Prior audit similarity | Currently in DB |
|---------------|----------------------:|:---------------:|
| CareerCraft (#38) ↔ Qaiser career coaching (#40) | ~67% | **No** |
| CipherPlay (#39) ↔ Scavenger hunt (#41) | ~64% | **Yes** (64.05%) |
| ScholarIQ (#37) ↔ AI Tuition (#36) | Moderate (same domain) | **No** — pending analysis |

### Eval corpus duplicate detection gap (V1 engine)

From `EVAL_CORPUS_ANALYSIS_REPORT.md`: only **1 of 5** designed paraphrase pairs was flagged under V1 BOW scoring. This limitation applies to university proposals as well.

---

## 8. University Proposals Evaluation (IDs 31–40)

| ID | Title | Relevancy | Duplicate | Ollama | Ready for demo |
|----|-------|:---------:|:---------:|:------:|:--------------:|
| 31 | AI-Powered Real-Time Classroom Noise Detection… | ❌ | ❌ | ❌ | **No** |
| 32 | Smart Relocation Assistance and Property Finder System | ❌ | ❌ | ❌ | **No** |
| 33 | AI-Based Retinal Disease Detection System | ❌ | ❌ | ❌ | **No** |
| 34 | Integrated Health Information System (IHIS) | ❌ | ❌ | ❌ | **No** |
| 35 | AI-Based "Can I Resell This?" System | ❌ | ❌ | ❌ | **No** |
| 36 | AI Smart Tuition Recommendation System | ❌ | ❌ | ❌ | **No** |
| 37 | ScholarIQ — AI Scholarship Recommendation Platform | ❌ | ❌ | ❌ | **No** |
| 38 | CareerCraft AI — Interview and Resume Mastery | ❌ | ❌ | ❌ | **No** |
| 39 | CipherPlay — Children's Indoor Fitness Game | ❌ | ⚠️ passive | ❌ | **No** |
| 40 | AI-Powered Career Coaching and Job Preparation | ❌ | ❌ | ❌ | **No** |

**Overall university readiness: 0 / 10 demo-ready.**

---

## 9. Viva Demonstration Readiness

### Verdict: **PARTIALLY READY** ⚠️

| Area | Status | Detail |
|------|:------:|--------|
| Backend API running | ✅ | FastAPI + PostgreSQL connected |
| V1 relevancy engine | ✅ | Functional on analyzed projects |
| Eval corpus (20 projects) | ✅ | Fully backfilled with scores |
| Legacy projects | ⚠️ | 8/9 analyzed; ID 1 missing |
| **University proposals (31–40)** | ❌ | **0/10 analyzed — critical gap** |
| Duplicate detection | ⚠️ | Works but only 5 reports; misses paraphrases |
| Ollama live explanations | ❌ | 0 generated; all fallback or empty |
| V2 semantic engine | ❌ | Not integrated |
| Frontend relevancy page | ⚠️ | Works for analyzed projects only |

### What works today (demo-safe)

1. Log in as student/professor/admin.
2. View relevancy results for **eval corpus** projects (IDs 11–30) or legacy IDs 3–10.
3. Show duplicate alerts for the 5 existing pairs (especially 100% legacy duplicate #3 ↔ #6).
4. Explain V1 scoring pipeline (`AI_ENGINE_AUDIT.md`).
5. Show fallback explanation text on analyzed projects.

### What will fail or look empty in viva

1. Opening relevancy for **any university proposal (31–40)** — triggers analysis on first GET, or shows nothing if not opened.
2. Claiming **CareerCraft vs Qaiser** duplicate detection without running backfill first.
3. Demonstrating **live Ollama** explanations — none exist in DB; Ollama likely not running.
4. Claiming **semantic / SentenceTransformer** scoring — V2 is dormant.
5. Showing **TF-IDF** as true IDF-weighted — implementation is BOW cosine.

### Recommended pre-viva actions (no code changes required)

| Priority | Action | Command / method |
|----------|--------|------------------|
| **P0** | Backfill relevancy for university proposals 31–40 | Run `run_relevancy_analysis()` per project or extend `backfill_eval_relevancy.py` filter |
| **P0** | Backfill ID 1 (legacy gap) | Same |
| **P1** | Start Ollama locally for live explanation demo | `ollama serve` + `ollama pull llama3.2`; re-open relevancy GET |
| **P1** | Pre-open relevancy pages for demo projects | Avoid live scoring delay during presentation |
| **P2** | Document V1 paraphrase limitation | Use eval P3A/P3B pair (53.27%) as honest example |
| **P3** | V2 integration | Deferred — not required for V1 viva |

### Minimum viable viva path (without backfill)

Demo using **eval corpus only**:
- Submit or open `[EVAL-P3A]` vs `[EVAL-P3B]` for duplicate detection (53.27%).
- Open `[EVAL-P1A]` vs legacy #3 for cross-corpus match (58.16%).
- Show exact duplicate #3 ↔ #6 at 100%.
- Acknowledge university proposals are imported but analysis is a planned next step.

### Minimum viable viva path (with backfill — recommended)

1. Run relevancy backfill on IDs 31–40 (~2–5 min depending on Ollama timeout).
2. Demo CareerCraft (#38) vs Qaiser (#40) duplicate risk.
3. Demo CipherPlay (#39) vs scavenger hunt (#41) at 64%.
4. Show varied scores across real proposal domains (health, career, education, etc.).

---

## Appendix: Query Methodology

Read-only SQLAlchemy queries executed against live database on 23 June 2026:

- `SELECT COUNT(*) FROM project_ideas` → 40
- `SELECT COUNT(*) FROM relevancy_results` → 29
- `SELECT COUNT(*) FROM duplicate_reports` → 5
- University filter: `WHERE id BETWEEN 31 AND 40`

No application code, schema, or data was modified.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `AI_ENGINE_AUDIT.md` | Full AI engine code audit |
| `UNIVERSITY_PROPOSALS_IMPORT_REPORT.md` | Import of IDs 31–40 |
| `EVAL_CORPUS_ANALYSIS_REPORT.md` | Eval backfill results |
| `RELEVANCY_ENGINE_V2_GAP_ANALYSIS.md` | V2 gaps |

---

*Read-only evaluation. No application code was modified.*
