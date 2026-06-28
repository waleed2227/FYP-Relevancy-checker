# Relevancy Engine V2 — Gap Analysis

**Project:** AI-Based FYP Relevancy System  
**Document type:** Pre-integration audit  
**Date:** June 2026  
**Status:** Analysis only — no implementation in this document  

---

## Executive Summary

The production relevancy path today is **V1: weighted TF-IDF + heuristic sub-scores**. A **semantic prerequisite layer** exists (`semantic_embeddings.py`, settings, download script) but is **not wired** into scoring, duplicate detection, or APIs.

| Area | Current state | V2 readiness |
|------|---------------|--------------|
| TF-IDF engine | Production, tested | Keep as fallback / optional hybrid |
| Semantic module | Skeleton only | **Not production-ready** |
| Model `all-MiniLM-L6-v2` | Package installed; model **not cached** | Blocker for offline viva |
| Database | No V2 score columns | Migration required |
| APIs | V1 fields only | Additive extension needed |

---

## A. Current Scoring Method

### A.1 Pipeline overview

```
POST/PATCH project
       ↓
project_service.run_relevancy_analysis()
       ↓
_to_relevancy_analysis_dict()  ← 17 weighted text fields + metadata
       ↓
RelevancyEngine.analyze(query, corpus)
       ↓
┌──────────────────────────────────────────────────────────────┐
│ 1. build_combined_analysis_text() — weighted field concat    │
│ 2. embeddings.similarity_between() — TF-IDF + cosine (0–100) │
│ 3. Heuristics — tech, scope, market word counts              │
│ 4. Aggregate scores → AnalysisResult                         │
└──────────────────────────────────────────────────────────────┘
       ↓
Persist RelevancyResult + MatchedProject rows
       ↓
duplicate_service.create_reports_from_matches()
       ↓
ollama_service.generate_relevancy_explanation()  ← text only, no scoring
```

**Entry points:**

| Trigger | File | Function |
|---------|------|----------|
| New submission | `routes/projects.py` | `run_relevancy_analysis()` |
| GET relevancy (missing) | `routes/projects.py` | `run_relevancy_analysis()` |
| Proposal field edit | `project_service.py` | `_relevancy_rerun_needed()` → `run_relevancy_analysis()` |

---

### A.2 Inputs used (V1)

**Similarity corpus text** — `build_combined_analysis_text()` in `relevancy_engine.py`:

| Tier | Weight | Fields |
|------|--------|--------|
| Critical | ×3 | `problem_statement`, `proposed_solution`, `unique_features`, `innovation_aspect` |
| High | ×2 | `current_challenges`, `existing_solutions`, `project_scope`, `competitive_advantage`, `market_gap` |
| Standard | ×1 | `title`, `description`, `technologies`, `target_users`, `target_industry`, `expected_impact`, `existing_solution_limitations` |

**Heuristic-only inputs** (not in weighted similarity string):

- `technologies`, `ai_technologies_used` — modern vs legacy tech keyword sets
- `project_scope` or `description` — scope word count
- `target_industry`, `market_gap`, `expected_impact` — market text richness

**Corpus:** all other `project_ideas` (excluding self), ordered by `submitted_date DESC`, optional `relevancy_corpus_limit`.

---

### A.3 Similarity method (V1)

**File:** `app/ai/embeddings.py`

| Step | Method |
|------|--------|
| Tokenization | Regex `[a-z0-9]+` lowercased |
| Vectorization | Bag-of-words counts over shared vocab (TF-style, not IDF-weighted across corpus) |
| Normalization | L2 per document |
| Pairwise score | Cosine similarity × 100, clipped to [0, 100] |

**Function:** `similarity_between(text_a, text_b) -> float`

**Limitation:** Lexical overlap only; paraphrases and semantic equivalence are missed.

---

### A.4 Weight and score calculations (V1)

**Per-corpus-item similarity:**

```text
sim = similarity_between(build_combined_analysis_text(query), build_combined_analysis_text(corpus_item))
```

**Matched projects:** `sim >= duplicate_similarity_threshold` (default **50%**), top **5** by similarity.

**Sub-scores** (`RelevancyEngine.analyze()`):

| Score | Formula (simplified) |
|-------|----------------------|
| `similarity_score` | `max(sim)` over corpus |
| `novelty_score` | `max(30, 100 - max_similarity × 0.8)` |
| `tech_score` | `50 + 10×modern_keywords - 15×legacy_keywords` (cap 100) |
| `scope_score` | `40 + 0.5 × word_count(scope or description)` (cap 100) |
| `market_input` | Word count from industry + market_gap + expected_impact |
| `feasibility_score` | `(tech_score + scope_score) / 2` |
| `market_relevance` | `min(95, market_input × 0.9 + 10)` |
| `innovation_score` | `novelty × 0.6 + market_relevance × 0.4` |
| **`overall_score`** | `innovation×0.35 + feasibility×0.25 + novelty×0.25 + (100-similarity)×0.15` |
| **`ai_confidence`** | `min(95, 70 + len(matched)×5)` |

**Summary text:** threshold templates at overall 80 / 60.

---

### A.5 Duplicate detection logic (V1)

| Layer | Behavior |
|-------|----------|
| **Gate** | TF-IDF `similarity >= duplicate_similarity_threshold` (50%) |
| **Matched list** | Same threshold; stored in `matched_projects.similarity` |
| **Duplicate reports** | `duplicate_service.create_reports_from_matches()` writes `duplicate_reports` |
| **Risk level** | `similarity_to_risk()`: ≥75 HIGH, ≥60 MEDIUM, else LOW |
| **Sync backfill** | `sync_duplicate_reports_from_matched_projects()` reads `matched_projects.similarity` (TF-IDF) |

**Note:** `_default_ai_analysis()` text says “semantic similarity” but the numeric score is **TF-IDF**.

---

### A.6 Persistence and API mapping (V1)

| DB column | Source |
|-----------|--------|
| `project_ideas.relevancy_score` | `analysis.overall_score` |
| `relevancy_results.overall_score` | same |
| `relevancy_results.similarity_score` | max TF-IDF similarity |
| `relevancy_results.ai_confidence` | heuristic confidence |
| `matched_projects.similarity` | per-pair TF-IDF |
| `duplicate_reports.similarity_score` | TF-IDF from match |

**API exposure:** `GET /projects/{id}/relevancy`, review queue `similarityScore`, admin `duplicateAlerts[].similarity`.

---

## B. Semantic Layer Readiness

### B.1 Is `sentence-transformers` installed?

| Check | Result |
|-------|--------|
| `requirements.txt` | `sentence-transformers>=3.3.0,<6`, `torch>=2.2.0,<3` |
| Active Python 3.12 | **Installed** — sentence-transformers **5.5.1**, torch **2.12.0** |
| Runtime import | `from sentence_transformers import SentenceTransformer` — **OK** |

---

### B.2 Is `all-MiniLM-L6-v2` available?

| Check | Result |
|-------|--------|
| Settings default | `sentence-transformers/all-MiniLM-L6-v2` |
| Local project copy | `backend/models/all-MiniLM-L6-v2/config.json` — **Missing** |
| HF hub cache | Download blocked by **HTTP 429** in recent runs |
| Offline viva readiness | **Not ready** until `python -m scripts.download_sentence_transformer` succeeds |

---

### B.3 Is `semantic_embeddings.py` production ready?

| Capability | Status |
|------------|--------|
| Lazy singleton load | Implemented |
| Feature flag gate | `RELEVANCY_ENGINE_V2_ENABLED=false` (default) |
| `encode_texts()` | Implemented |
| `build_semantic_analysis_text()` | **Missing** — not in module |
| `semantic_similarity_between()` | **Missing** |
| Batch corpus encoding | **Missing** |
| `asyncio.to_thread()` wrapper | **Missing** — would block FastAPI if called in async route |
| Integration with `RelevancyEngine` | **None** |
| Unit tests with mocked model | **Missing** (only flag-off prereq tests) |
| Local model path support | **Partial** — settings use HF id only |

**Verdict:** **Prerequisite skeleton only — not production-ready for scoring.**

---

### B.4 Code paths that already exist

| Component | Path | Role |
|-----------|------|------|
| V1 engine | `app/ai/relevancy_engine.py` | Production scoring |
| TF-IDF | `app/ai/embeddings.py` | Production similarity |
| Semantic skeleton | `app/ai/semantic_embeddings.py` | Not called by engine |
| Orchestration | `project_service.run_relevancy_analysis()` | Calls `engine.analyze()` only |
| Duplicates | `duplicate_service.py` | TF-IDF match dict |
| Explanations | `ollama_service.py` | Post-score narrative |
| Settings | `config/settings.py` | V2 flag + model name (disabled) |
| Model download | `scripts/download_sentence_transformer.py` | Manual/cache setup |
| Prereq tests | `tests/test_semantic_embeddings_prereq.py` | Flag-off behavior |
| V1 tests | `tests/test_relevancy_engine.py` | 10 regression tests |

**Nothing in the hot path imports `semantic_embeddings` today.**

---

### B.5 Gap summary: V1 vs requested V2

| Requirement (V2) | V1 | Gap |
|------------------|----|----|
| Semantic inputs (8 fields) | 17-field weighted TF-IDF | Need `build_semantic_text()` with 8 fields |
| Sentence Transformer embeddings | Not used | Wire `encode_texts()` + cosine |
| **Relevancy score** (semantic) | Heuristic `overall_score` | New formula from semantic distinctiveness |
| **Duplicate risk score** | TF-IDF `similarity_score` | Must use semantic max similarity |
| **Confidence score** | `ai_confidence` (match count) | Redefine using semantic + field coverage |
| Keep TF-IDF fallback | N/A | Feature flag + V1 path |
| Store semantic scores | No columns | DB migration |
| Ollama for scoring | Already explanation-only | No change |

---

## C. Integration Plan (Summary)

Detailed steps are in `RELEVANCY_ENGINE_V2_IMPLEMENTATION_PLAN.md`.

### C.1 Files that must change

| Priority | File |
|----------|------|
| P0 | `app/ai/semantic_embeddings.py` — semantic text builder, similarity helpers, thread-safe encode |
| P0 | `app/ai/relevancy_engine.py` — dual-path analyze, extended `AnalysisResult` |
| P0 | `app/services/project_service.py` — persist new scores, async thread offload |
| P0 | `app/services/duplicate_service.py` — semantic gate + score fields |
| P1 | `app/models/relevancy.py`, `duplicate_report.py` |
| P1 | `scripts/apply_relevancy_v2_migration.py` |
| P1 | `app/schemas/project.py`, `schemas/admin.py` |
| P2 | `app/ai/ollama_service.py` — prompt labels only |
| P2 | `app/config/settings.py` — semantic threshold |
| P2 | Tests: `test_relevancy_engine_v2.py`, `test_semantic_embeddings.py` |

### C.2 Functions that must change

| File | Function | Change |
|------|----------|--------|
| `semantic_embeddings.py` | **New** `build_semantic_analysis_text()` | 8-field concat |
| `semantic_embeddings.py` | **New** `semantic_similarity_percent()` | ST encode + cosine × 100 |
| `semantic_embeddings.py` | **New** `encode_corpus_batch()` | Batch encode for N projects |
| `relevancy_engine.py` | `analyze()` | Branch V1/V2; compute 3 V2 outputs |
| `relevancy_engine.py` | **New** `_compute_v2_scores()` | relevancy, duplicate risk, confidence |
| `project_service.py` | `run_relevancy_analysis()` | Map new fields; `asyncio.to_thread(engine.analyze, ...)` |
| `project_service.py` | `build_relevancy_result_response()` | Expose new scores (optional fields) |
| `duplicate_service.py` | `create_reports_from_matches()` | Pass semantic duplicate risk |
| `duplicate_service.py` | `upsert_duplicate_report()` | Store semantic + legacy TF-IDF |
| `duplicate_service.py` | `sync_duplicate_reports_from_matched_projects()` | Read semantic columns |

### C.3 Database changes required

**Scoped AI tables only** (additive nullable columns):

| Table | New columns |
|-------|-------------|
| `relevancy_results` | `semantic_score`, `duplicate_risk_score`, `engine_version` (optional) |
| `matched_projects` | `semantic_score`, `duplicate_risk_score` |
| `duplicate_reports` | `semantic_score`, `duplicate_risk_score` |

**Backward compatibility:**

- Keep `similarity_score` = TF-IDF max (V1) when hybrid enabled, or alias to semantic when V2-only mode
- Keep `overall_score` = **relevancy score** for existing UI
- Map `ai_confidence` = **confidence score**

### C.4 API changes required

**Additive only** (no breaking renames):

| Response | New optional fields |
|----------|---------------------|
| `RelevancyResultResponse` | `duplicate_risk_score`, `semantic_score`, `confidence_score`, `engine_version` |
| `MatchedProjectResponse` | `semantic_score`, `duplicate_risk_score` |
| `DuplicateAlertItem` | `semanticScore`, `duplicateRiskScore` |
| `ReviewQueueItem` | `duplicateRiskScore` (optional) |

Existing `relevancyScore`, `similarityScore`, `overall_score` remain populated for frontend compatibility.

---

## D. Risks and Blockers

| Risk | Severity | Mitigation |
|------|----------|------------|
| Model not cached | **High** | HF token + `download_sentence_transformer` before integration |
| Analysis latency | **Medium** | Batch encode; thread pool; corpus limit |
| Score semantics change | **Medium** | Feature flag; document mapping for viva |
| DB migration approval | **Medium** | Scoped AI-table-only migration |
| Empty semantic text (legacy projects) | **Low** | Fallback to title+description; penalize confidence |

---

## E. Readiness Checklist Before Implementation

- [ ] `python -m scripts.download_sentence_transformer` exits 0 (offline OK)
- [ ] Stakeholder approves scoped DB migration
- [ ] V2 field list confirmed (8 fields per this audit)
- [ ] Viva demo script: paraphrase pair ranks higher semantically than TF-IDF
- [ ] `RELEVANCY_ENGINE_V2_ENABLED=false` regression tests green

---

*Gap analysis complete. Proceed to `RELEVANCY_ENGINE_V2_IMPLEMENTATION_PLAN.md` for phased delivery.*
