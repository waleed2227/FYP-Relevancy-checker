# Project Dataset Audit

**Project:** AI-Based FYP Relevancy System  
**Document type:** Read-only database audit  
**Date:** June 2026  
**Database:** `fyp_relevancy_system` @ `localhost:5432`  
**Method:** Direct SQL queries against `project_ideas` and related tables (no application code modified)

---

## Executive Summary

The current database contains **9 project submissions** from **3 students**. The dataset is adequate for **basic UI and pipeline smoke testing** but **not sufficient for meaningful semantic relevancy or duplicate-detection evaluation**. No project has all V2 semantic fields populated; the average V2 field coverage is **3.0 / 8**. Only **one duplicate pair** exists in the corpus (projects 3 and 6, identical titles, 100% TF-IDF similarity).

| Metric | Value | Assessment |
|--------|------:|------------|
| Total projects | 9 | Too small for robust eval |
| V2-complete projects (8/8 fields) | 0 | Blocker for semantic testing |
| Corpus duplicate pairs (≥50% similarity) | 1 | Insufficient for duplicate tuning |
| Distinct industries | 1 | No domain diversity |
| Relevancy analyses run | 8 / 9 | One seed project lacks analysis row |

---

## 1. Project Counts by Status

| Status | Count | % of Total |
|--------|------:|-----------:|
| **Pending** | 5 | 55.6% |
| **Approved** | 2 | 22.2% |
| **Rejected** | 2 | 22.2% |
| **Revision** | 0 | 0.0% |
| **Total** | **9** | **100%** |

### Project inventory

| ID | Title | Status | Relevancy Score | V2 Fields Filled |
|----|-------|--------|----------------:|-----------------:|
| 1 | Smart Campus Navigation System | Approved | 78.00 | 2 / 8 |
| 3 | AI-Based Final Year Project Relevancy System | Pending | 80.71 | 2 / 8 |
| 4 | Smart Waste Management System Using IoT and AI | Rejected | 68.66 | 2 / 8 |
| 5 | E2E Notify Test 1780489173 | Pending | 76.47 | 2 / 8 |
| 6 | AI-Based Final Year Project Relevancy System | Approved | 44.02 | 2 / 8 |
| 7 | LLM based app | Pending | 67.34 | 2 / 8 |
| 8 | Proposal V2 Test Project | Pending | 64.20 | 4 / 8 |
| 9 | nqwwwwwwwwwwwwwwwqeq | Rejected | 80.01 | 7 / 8 |
| 10 | Smart Campus FYP | Pending | 68.89 | 4 / 8 |

**Note:** Project ID 2 does not exist (deleted or never created). Project 1 was seeded with a `relevancy_score` but has **no** `relevancy_results` row — analysis was never run through the engine.

---

## 2. Proposal Field Completeness

### 2.1 Definitions used in this audit

Three completeness tiers are tracked, aligned with the relevancy engine design:

| Tier | Fields | Purpose |
|------|--------|---------|
| **Required (submission minimum)** | `title`, `description`, `technologies` | Always present on create |
| **V2 semantic (8 fields)** | `title`, `description`, `problem_statement`, `proposed_solution`, `unique_features`, `innovation_aspect`, `target_users`, `target_industry` | Relevancy Engine V2 input |
| **Extended proposal (30 optional attrs)** | All `_PROPOSAL_ATTRS` in `project_service.py` | Full multi-section proposal form |
| **V1 relevancy weighted (17 fields)** | `RELEVANCY_TEXT_FIELDS` in `relevancy_engine.py` | Current TF-IDF corpus text |

A field counts as **filled** when non-null and non-whitespace after `TRIM()`.

---

### 2.2 Summary counts

| Completeness tier | Complete | Missing ≥1 field |
|-------------------|---------:|-----------------:|
| Required (3 fields) | **9** | **0** |
| V2 semantic (8 fields) | **0** | **9** |
| V1 relevancy weighted (17 fields) | **0** | **9** |
| Extended proposal (30 optional + required) | **0** | **9** |

---

### 2.3 V2 semantic field fill rates (9 projects)

| Field | Filled | Missing | Fill rate |
|-------|-------:|--------:|----------:|
| title | 9 | 0 | 100% |
| description | 9 | 0 | 100% |
| problem_statement | 3 | 6 | 33% |
| proposed_solution | 2 | 7 | 22% |
| unique_features | 1 | 8 | 11% |
| innovation_aspect | 1 | 8 | 11% |
| target_users | 1 | 8 | 11% |
| target_industry | 1 | 8 | 11% |

**V2 field count distribution:**

| V2 fields filled | Projects |
|-----------------:|---------:|
| 2 / 8 | 6 |
| 4 / 8 | 2 |
| 7 / 8 | 1 |
| 8 / 8 | 0 |

**Average V2 fields filled:** 3.0 / 8 (37.5%)

**Best candidate:** Project 9 (7/8 fields) — still missing one V2 field (likely `proposed_solution` or `problem_statement` based on aggregate counts).

---

### 2.4 Extended proposal field fill rates (lowest coverage)

These optional proposal sections are **empty on all 9 projects**:

- `existing_solutions`, `project_scope`, `competitive_advantage`, `secondary_target_users`
- `technical_feasibility`, `financial_feasibility`, `operational_feasibility`
- `academic_impact`, `business_impact`, `social_impact`
- `future_enhancements`, `scalability_opportunities`, `commercialization_potential`
- `privacy_concerns`, `security_concerns`, `ethical_considerations`

**Highest-filled extended fields:**

| Field | Filled |
|-------|-------:|
| problem_statement | 3 |
| current_challenges | 2 |
| proposed_solution | 2 |
| ai_technologies_used | 2 |
| category, target_industry, unique_features, innovation_aspect, target_users, market_gap, expected_impact, future_scope, risk_assessment, existing_solution_limitations | 1 each |

---

## 3. Relevancy & Duplicate Analysis Data

| Table | Row count |
|-------|----------:|
| `relevancy_results` | 8 |
| `matched_projects` | 1 |
| `duplicate_reports` | 1 |

### Known duplicate pair (V1 TF-IDF)

| Query project | Matched project | Similarity | Notes |
|---------------|-----------------|-----------:|-------|
| 6 — AI-Based Final Year Project Relevancy System | 3 — AI-Based Final Year Project Relevancy System | **100%** | Identical titles; likely near-identical descriptions |

No other pairs exceeded the 50% duplicate threshold in the current corpus.

---

## 4. Corpus Diversity

| Dimension | Distinct values | Notes |
|-----------|----------------:|-------|
| Students | 3 | Limited author diversity |
| Technologies strings | 8 | Good string variety, but short metadata |
| Categories | 1 | No category diversity |
| Target industries | 1 | No industry diversity |
| Semantic text length (V2 concat) | 94 – 1,190 chars | 6 projects under 210 chars — too thin for reliable embeddings |

**Semantic text length ranking:**

| ID | Title | Approx. V2 text length |
|----|-------|----------------------:|
| 3, 6 | AI-Based Final Year Project Relevancy System | 1,190 |
| 4 | Smart Waste Management System Using IoT and AI | 894 |
| 9 | nqwwwwwwwwwwwwwwwqeq | 264 |
| 8 | Proposal V2 Test Project | 207 |
| 10 | Smart Campus FYP | 205 |
| 5, 7, 1 | Various | 94 – 105 |

Six of nine projects have **under 210 characters** of V2 semantic text — embeddings will be dominated by title + description only.

---

## 5. Is the Dataset Sufficient for Semantic Relevancy Testing?

### Verdict: **No — not sufficient for meaningful evaluation**

| Test type | Minimum viable | Current state | Gap |
|-----------|----------------|---------------|-----|
| Engine smoke test (runs without crash) | 3–5 projects | 9 projects | **Met** |
| V2 field coverage test | ≥5 projects with 8/8 fields | 0 | **Critical gap** |
| Duplicate detection (true positives) | ≥5 labeled duplicate/near-duplicate pairs | 1 pair (exact duplicate) | **Critical gap** |
| Duplicate detection (true negatives) | ≥20 unrelated pairs across domains | ~28 possible pairs, low diversity | **Weak** |
| Paraphrase sensitivity test | ≥3 paraphrase pairs (same idea, different wording) | 0 constructed | **Missing** |
| Domain diversity | ≥5 industries / problem domains | 1 industry | **Critical gap** |
| Confidence score calibration | ≥30 complete proposals | 0 complete | **Critical gap** |
| Viva live demo | 15–20 realistic proposals + 1 paraphrase demo | 9 sparse proposals | **Partial** |

### Why the current dataset falls short

1. **Zero V2-complete projects** — semantic engine cannot be fairly evaluated on real production-shaped inputs.
2. **Sparse text** — 67% of projects fill only 2 V2 fields (title + description); sentence transformers need richer problem/solution context.
3. **Single duplicate pair** — both projects share the same title; this tests exact-match only, not semantic near-duplicate detection (the main V2 value proposition).
4. **No paraphrase pairs** — cannot demonstrate V2 outperforming TF-IDF on reworded duplicates (key viva talking point).
5. **No domain spread** — one category, one industry; relevancy and market scores cannot be meaningfully compared across domains.
6. **Test/junk data** — entries like `E2E Notify Test`, `nqwwwwwwwwwwwwwwwqeq`, and duplicate self-project titles reduce eval quality.

---

## 6. Recommended Dataset Size

### For different goals

| Goal | Recommended project count | Additional requirements |
|------|--------------------------:|-------------------------|
| **V2 integration smoke test** | 10–15 | 5+ with all 8 V2 fields filled |
| **Viva demonstration** | 15–20 | 3 paraphrase duplicate pairs + 5 unrelated controls |
| **Meaningful offline evaluation** | **40–60** | 10+ duplicate clusters, 5+ industries, labeled ground truth |
| **Production confidence / tuning** | **80–100+** | Real student submissions, professor-reviewed labels |

### Recommended additions before V2 go-live

| # | Action | Count |
|---|--------|------:|
| 1 | Fill all 8 V2 fields on existing real projects (IDs 3, 4, 8, 10) | 4 |
| 2 | Add **paraphrase pairs** (same FYP idea, different wording) | 3 pairs (6 projects) |
| 3 | Add **clearly unrelated** projects (different domain/tech) | 10 |
| 4 | Add **near-duplicate** pairs (partial overlap, not copy-paste) | 3 pairs |
| 5 | Remove or archive E2E/junk test rows before viva | 2–3 |

**Minimum target for meaningful semantic evaluation:** **40 projects** with at least **20 fully populated (8/8 V2 fields)** and **10 labeled duplicate/near-duplicate relationships**.

**Minimum target for viva demo only:** **15 projects** with **8 fully populated** and **1 live paraphrase duplicate demo**.

---

## 7. Data Quality Observations

1. **Seed project gap:** ID 1 has `relevancy_score=78` but no `relevancy_results` record — dashboard score and analysis panel may disagree.
2. **Duplicate self-submissions:** Projects 3 and 6 share identical titles and max TF-IDF similarity; useful for TF-IDF testing, not for semantic nuance testing.
3. **Proposal form adoption:** Extended proposal fields (feasibility, impact, ethics) are largely unused — students submit minimal proposals today.
4. **ID gap:** Missing project ID 2 suggests a deleted record; no impact on counts but indicates manual/test churn.

---

## 8. Suggested Next Steps (Data Only — No Code)

1. **Backfill V2 fields** on the 4 most realistic projects (3, 4, 8, 10) using complete proposal content.
2. **Create a viva demo corpus** of 15 curated projects with intentional duplicate/paraphrase/unrelated labels stored in a spreadsheet for eval.
3. **Run relevancy analysis** on project 1 to align score with `relevancy_results`.
4. **Archive test projects** (5, 9 partial junk) or mark them excluded from corpus via admin tooling (future).
5. **Re-run this audit** after dataset expansion; target ≥40 projects and ≥20 V2-complete before enabling `RELEVANCY_ENGINE_V2_ENABLED`.

---

## 9. Audit Query Reference

Counts were produced with read-only SQL against:

- `project_ideas` — status, field null/empty checks
- `relevancy_results`, `matched_projects`, `duplicate_reports` — analysis coverage
- V2 completeness: all 8 semantic fields `IS NOT NULL AND TRIM(field) <> ''`
- Extended completeness: all 30 `_PROPOSAL_ATTRS` + required fields

**Audit timestamp:** June 2026 (live query against development database).

---

*This document is analysis-only. No application code or database records were modified during this audit.*
