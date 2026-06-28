# Dataset Expansion Plan

**Project:** AI-Based FYP Relevancy System  
**Document type:** Evaluation dataset design & import guide  
**Date:** June 2026  
**Companion:** `PROJECT_DATASET_AUDIT.md`, `RELEVANCY_ENGINE_V2_GAP_ANALYSIS.md`  
**Deliverables:** `dataset/eval_corpus_v1.json`, `dataset/eval_corpus_v1.sql`

---

## 1. Executive Summary

The current database has **9 sparse projects** with **zero V2-complete proposals** and **one exact duplicate pair** — insufficient for semantic relevancy evaluation. This plan adds **20 curated, realistic UOL-style FYP proposals** with full semantic fields, explicit ground-truth labels, and direct PostgreSQL import files.

| After import | Current (9) | + Eval corpus (20) | Combined |
|--------------|------------:|-------------------:|---------:|
| Total projects | 9 | 20 | **29** |
| V2-complete (9 fields) | 0 | **20** | **20** |
| Labeled paraphrase pairs | 0 | **5** | **5** |
| Near-duplicate cluster | 0 | **5** | **5** |
| Unrelated control set | partial | **5** | **5+** |
| Industries represented | 1 | **8** | **9+** |

**No application code is modified.** Import uses standalone JSON/SQL artifacts only.

---

## 2. Current Corpus Analysis

From `PROJECT_DATASET_AUDIT.md` (June 2026):

| Gap | Impact on V2 testing |
|-----|----------------------|
| 0 / 9 V2-complete projects | Semantic engine cannot be evaluated on production-shaped inputs |
| Avg 3.0 / 8 V2 fields filled | Embeddings dominated by title + description only |
| 1 duplicate pair (100% TF-IDF, identical titles) | Tests copy-paste only, not paraphrase detection |
| 1 industry, 1 category | No cross-domain relevancy/novelty calibration |
| Test/junk rows (E2E, random strings) | Pollutes eval metrics |

**Existing projects worth keeping** (IDs 1, 3, 4, 6, 8, 10) remain in corpus as legacy baseline. The eval corpus uses **`[EVAL-xxx]` title prefixes** so imports are idempotent and easy to filter.

---

## 3. Eval Corpus Design (20 Projects)

### 3.1 Category breakdown

| Category | Count | Eval IDs | Purpose |
|----------|------:|----------|---------|
| **Clearly unrelated** | 5 | `EVAL-U01` – `EVAL-U05` | Negative controls — low cross-similarity |
| **Similar-domain cluster** | 5 | `EVAL-S01` – `EVAL-S05` | Same industry (Healthcare), distinct problems — **near-duplicate testing** |
| **Semantic paraphrase pairs** | 10 (5 pairs) | `EVAL-P1A/B` – `EVAL-P5A/B` | Same idea, different wording — **semantic vs TF-IDF gap** |

> **Note on near-duplicates:** The 5 similar-domain Healthcare projects (`EVAL-S01`–`EVAL-S05`) satisfy the **5 near-duplicate projects** requirement. They share `target_industry`, clinical vocabulary, and stakeholder types but differ in problem/solution — expected **moderate-high semantic similarity** without being paraphrases.

### 3.2 Required fields (all 20 projects)

Every eval project includes all nine evaluation fields plus DB-required columns:

| Field | Populated |
|-------|-----------|
| title | Yes |
| description | Yes |
| problem_statement | Yes |
| proposed_solution | Yes |
| unique_features | Yes |
| innovation_aspect | Yes |
| target_users | Yes |
| target_industry | Yes |
| expected_impact | Yes |
| technologies *(DB required)* | Yes |
| professor_email *(DB required)* | `professor@uol.edu.pk` |

V2 semantic concat length: **~900–1,400 characters** per project (vs 94–264 chars on 6/9 current projects).

---

## 4. Project Catalog

### 4.1 Unrelated controls (5)

| ID | Title | Industry |
|----|-------|----------|
| EVAL-U01 | Drone-Based Crop Disease Detection for Smallholder Farms | Agriculture |
| EVAL-U02 | Blockchain Peer-to-Peer Renewable Energy Trading Platform | Energy & Utilities |
| EVAL-U03 | Real-Time Sign Language Interpreter for Video Conferencing | Accessibility & EdTech |
| EVAL-U04 | Phishing Email Detection System for Small Business Networks | Cybersecurity |
| EVAL-U05 | Adaptive O-Level Mathematics Practice Platform | Education |

**Expected behavior:** Low similarity to all other eval projects; high novelty scores when compared to Healthcare or Higher-Ed clusters.

---

### 4.2 Similar-domain / near-duplicate cluster (5)

| ID | Title | Sub-domain |
|----|-------|------------|
| EVAL-S01 | Hospital Outpatient Queue and Appointment Management System | Operations |
| EVAL-S02 | AI Symptom Triage Chatbot for Rural Telehealth Centers | Triage |
| EVAL-S03 | AI-Assisted Radiology Report Summarization for Junior Doctors | Diagnostics |
| EVAL-S04 | Medication Adherence Reminder and Tracking App for Chronic Patients | Patient engagement |
| EVAL-S05 | Emergency Blood Donor Matching and Hospital Alert System | Emergency logistics |

**Expected behavior:** Pairwise semantic similarity **elevated within cluster** (same industry vocabulary) but below paraphrase-pair thresholds unless threshold tuned aggressively. Useful for calibrating **near-duplicate** vs **true duplicate** boundaries.

---

### 4.3 Semantic paraphrase pairs (5 pairs = 10 projects)

| Pair | Original (A) | Paraphrase (B) | Domain |
|------|--------------|----------------|--------|
| **P1** | EVAL-P1A — AI-Based Final Year Project Relevancy and Originality Checker | EVAL-P1B — Intelligent Academic Capstone Proposal Assessment Platform | Higher Education |
| **P2** | EVAL-P2A — Smart Waste Management System Using IoT Sensors and AI Routing | EVAL-P2B — IoT-Enabled Intelligent Municipal Garbage Collection Optimizer | Smart Cities |
| **P3** | EVAL-P3A — Smart Campus Navigation System with Indoor and Outdoor Routing | EVAL-P3B — University Wayfinding Mobile App for Indoor and Outdoor Campus Travel | Higher Education |
| **P4** | EVAL-P4A — Automated Classroom Attendance System Using Facial Recognition | EVAL-P4B — Contactless Student Presence Verification for Lecture Halls | Higher Education |
| **P5** | EVAL-P5A — AI Mental Health Chatbot for University Students | EVAL-P5B — Conversational Wellbeing Support Assistant for Higher Education Students | Higher Education |

**Expected behavior:**

| Engine | P1A ↔ P1B similarity | Notes |
|--------|---------------------:|-------|
| TF-IDF (V1) | 40–70% (variable) | Different vocabulary; may **miss** duplicate |
| Sentence Transformer (V2) | **75–95%** | Should **flag duplicate risk** |
| Relevancy (paraphrase B) | Lower novelty | Should score lower distinctiveness |

Pairs P1, P2, P3 align with **existing legacy projects** (IDs 3/6, 4, 1/10) for before/after V2 comparison.

---

## 5. Test Group Organization

Projects are tagged in JSON with `test_groups` and `ground_truth` for automated eval scripts.

### 5.1 Duplicate detection testing

| Test case | Projects | Expected result |
|-----------|----------|-----------------|
| True paraphrase duplicates | P1A↔P1B, P2A↔P2B, P3A↔P3B, P4A↔P4B, P5A↔P5B | **Flag** at ≥50% semantic similarity |
| Near-duplicate cluster | S01–S05 cross pairs | **Maybe flag** — tune threshold; not all should alert |
| Unrelated negatives | U01 vs U02, U03, U04, U05 | **Do not flag** |
| Legacy exact duplicate | Existing IDs 3 & 6 | **Flag** (TF-IDF already 100%) |

### 5.2 Semantic similarity testing

| Test case | Projects | Pass criteria |
|-----------|----------|---------------|
| Paraphrase > unrelated | sim(P1A,P1B) > sim(P1A,U01) | V2 semantic layer |
| Paraphrase > TF-IDF gap | semantic(P1A,P1B) − tfidf(P1A,P1B) > 15 pts | V2 advantage demo |
| Intra-cluster moderate | sim(S01,S02) < sim(P1A,P1B) | Cluster calibration |

### 5.3 Relevancy testing

| Test case | Projects | Pass criteria |
|-----------|----------|---------------|
| Complete proposal quality | All EVAL-* | Relevancy score ≥ 60 with full fields |
| Sparse legacy baseline | Existing IDs 1, 5, 7 | Lower confidence / score vs EVAL-* |
| Cross-domain fit | U01 in Education corpus context | Moderate relevancy, not rejected purely on similarity |

### 5.4 Novelty testing

| Test case | Projects | Pass criteria |
|-----------|----------|---------------|
| High novelty unrelated | U01–U05 vs full corpus | Novelty ≥ 70 |
| Low novelty paraphrase | P1B vs corpus containing P1A | Novelty ≤ 45 |
| Moderate cluster | S01–S05 vs unrelated set | Novelty 50–70 |

### 5.5 Master matrix

| Eval ID | Duplicate | Semantic | Relevancy | Novelty |
|---------|:---------:|:--------:|:---------:|:-------:|
| U01–U05 | — | ✓ | ✓ | ✓ high |
| S01–S05 | ✓ near | ✓ | ✓ | ✓ moderate |
| P1A–P5B | ✓ paraphrase | ✓ | ✓ | ✓ A high / B low |

---

## 6. Import Instructions

### 6.1 Prerequisites

- PostgreSQL database `fyp_relevancy_system` running
- Seed accounts present (`python -m scripts.seed` from `backend/`)
- At least **1 student** and **professor@uol.edu.pk** in database

### 6.2 Option A — SQL import (recommended)

```bash
# From repo root (adjust credentials as needed)
psql -U postgres -d fyp_relevancy_system -f dataset/eval_corpus_v1.sql
```

Features:
- Wrapped in `BEGIN` / `COMMIT`
- Idempotent: `WHERE NOT EXISTS` on prefixed title
- Rotates `student_id` across first 3 students (OFFSET 0–2)
- Sets `status = 'PENDING'`

**Re-import cleanup:**

```sql
DELETE FROM project_ideas WHERE title LIKE '[EVAL-%';
```

### 6.3 Option B — JSON import

File: `dataset/eval_corpus_v1.json`

Structure:

```json
{
  "version": "1.0",
  "projects": [
    {
      "eval_id": "EVAL-U01",
      "category_group": "unrelated",
      "test_groups": ["relevancy", "novelty", "semantic_similarity"],
      "ground_truth": { "expected_duplicate_of": null, ... },
      "title": "...",
      "technologies": "...",
      ...
    }
  ]
}
```

**Manual JSON → DB mapping:**

| JSON field | DB column |
|------------|-----------|
| title | `title` (prefix with `[EVAL-U01]` recommended) |
| technologies | `technologies` |
| description | `description` |
| target_industry | `target_industry`, `category` |
| problem_statement | `problem_statement` |
| proposed_solution | `proposed_solution` |
| unique_features | `unique_features` |
| innovation_aspect | `innovation_aspect` |
| target_users | `target_users` |
| expected_impact | `expected_impact` |
| — | `professor_email = 'professor@uol.edu.pk'` |
| — | `status = 'PENDING'` |

Regenerate SQL from JSON after edits:

```bash
python dataset/_gen_sql.py
```

### 6.4 Post-import steps

1. Verify count: `SELECT COUNT(*) FROM project_ideas WHERE title LIKE '[EVAL-%';` → **20**
2. Run relevancy analysis on each new project (API `GET /projects/{id}/relevancy` or future backfill script)
3. Confirm paraphrase pairs appear in `matched_projects` / `duplicate_reports` when V2 enabled
4. Archive or exclude legacy junk rows (IDs 5, 9) from eval runs if desired

---

## 7. Expected Outcomes After Import

### 7.1 Corpus size

| Metric | Value |
|--------|------:|
| Eval projects | 20 |
| Combined with legacy | 29 |
| V2-complete | 20 (eval only) |
| Ground-truth paraphrase pairs | 5 |
| Near-duplicate cluster members | 5 |
| Unrelated controls | 5 |

### 7.2 Viva demo script

1. Submit or select **EVAL-P1B** (paraphrase) with corpus containing **EVAL-P1A**
2. Show V2 **duplicate risk score** > 70 while TF-IDF may score lower
3. Compare **EVAL-U01** (agriculture) against Healthcare cluster — show low duplicate risk
4. Show **EVAL-S01** vs **EVAL-S02** — elevated but sub-duplicate similarity

### 7.3 Evaluation metrics to track

| Metric | Formula / target |
|--------|------------------|
| Paraphrase recall@threshold | ≥ 4/5 pairs flagged at 50% semantic threshold |
| Unrelated false positive rate | ≤ 1/10 unrelated pairs flagged |
| Near-dup precision | S-cluster alerts ≤ 40% of all S-pairs (threshold-dependent) |
| Field coverage | 100% eval projects have 9/9 fields |

---

## 8. Ground Truth Reference

### 8.1 Paraphrase pairs (must flag)

```
EVAL-P1A ↔ EVAL-P1B
EVAL-P2A ↔ EVAL-P2B
EVAL-P3A ↔ EVAL-P3B
EVAL-P4A ↔ EVAL-P4B
EVAL-P5A ↔ EVAL-P5B
```

### 8.2 Near-duplicate cluster (calibration set)

```
EVAL-S01, EVAL-S02, EVAL-S03, EVAL-S04, EVAL-S05
```

### 8.3 Unrelated controls (must not cross-match)

```
EVAL-U01, EVAL-U02, EVAL-U03, EVAL-U04, EVAL-U05
```

### 8.4 Legacy overlap references

| Eval project | Related legacy ID | Relationship |
|--------------|-------------------|--------------|
| EVAL-P1A | 3, 6 | Same system topic (existing exact dup) |
| EVAL-P2A | 4 | Waste management variant |
| EVAL-P3A | 1, 10 | Campus navigation variant |

---

## 9. File Inventory

| File | Description |
|------|-------------|
| `DATASET_EXPANSION_PLAN.md` | This document |
| `dataset/eval_corpus_v1.json` | 20 projects with labels and ground truth |
| `dataset/eval_corpus_v1.sql` | Idempotent PostgreSQL INSERT script |
| `dataset/_gen_sql.py` | Regenerates SQL from JSON (optional utility) |
| `PROJECT_DATASET_AUDIT.md` | Pre-expansion corpus audit |

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Enum status mismatch (`PENDING` vs `pending`) | SQL uses `PENDING` matching existing DB; adjust if import fails |
| Fewer than 3 students | SQL OFFSET fails silently to NULL — ensure seed run first |
| Eval titles pollute production UI | Filter `[EVAL-%` in reports; delete after viva if needed |
| Relevancy not auto-run on SQL insert | Post-import API backfill or manual GET relevancy |
| Legacy junk rows skew metrics | Exclude IDs 5, 9 from eval queries |

---

## 11. Sufficiency Assessment

| Goal | Before (9 projects) | After (+20 eval) |
|------|--------------------:|-----------------:|
| V2 smoke test | Fail | **Pass** |
| Paraphrase eval | Fail | **Pass** (5 pairs) |
| Near-dup calibration | Fail | **Pass** (5 cluster) |
| Viva demo | Partial | **Pass** |
| Production-grade tuning | Fail | Partial — recommend 40+ total for production |

**Conclusion:** Importing this corpus brings the system to **viva-ready evaluation quality**. For production threshold tuning, expand to **40–60 labeled projects** using the same JSON schema and ground-truth format.

---

*Generated as part of Relevancy Engine V2 preparation. No application source code was modified.*
