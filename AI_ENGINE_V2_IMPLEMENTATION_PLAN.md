# AI Relevancy Engine V2 — Implementation Plan

**Project:** AI-Based FYP Relevancy System  
**Document type:** Technical implementation plan (no code changes in this phase)  
**Version:** 1.0  
**Date:** June 2026  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)  
2. [Scope & Constraints](#2-scope--constraints)  
3. [Current Architecture (V1 — Keep)](#3-current-architecture-v1--keep)  
4. [Target Architecture (V2)](#4-target-architecture-v2)  
5. [Scoring Formulas](#5-scoring-formulas)  
6. [Files Affected](#6-files-affected)  
7. [Required Packages](#7-required-packages)  
8. [Database Changes Needed](#8-database-changes-needed)  
9. [Migration Strategy](#9-migration-strategy)  
10. [Performance Impact](#10-performance-impact)  
11. [Backward Compatibility](#11-backward-compatibility)  
12. [Testing Plan](#12-testing-plan)  
13. [Rollout Phases](#13-rollout-phases)  
14. [Risks & Mitigations](#14-risks--mitigations)  
15. [Out of Scope (Explicit)](#15-out-of-scope-explicit)  

---

## 1. Executive Summary

V2 adds a **Sentence Transformer** semantic layer (`all-MiniLM-L6-v2`) alongside the existing **weighted TF-IDF + cosine** engine. Similarity becomes a **hybrid score**:

| Component | Weight | Source |
|-----------|--------|--------|
| Semantic similarity | **70%** | SentenceTransformer embeddings + cosine |
| Weighted TF-IDF similarity | **20%** | Existing `build_combined_analysis_text()` + `similarity_between()` |
| Heuristic similarity | **10%** | Existing rule-based overlap signals (tech tokens, industry match, scope token overlap) |

**Duplicate detection** will gate on **semantic similarity** (not TF-IDF alone), while persisting both `semantic_score` and `hybrid_score`.

**Ollama** remains **explanation-only** — no scoring changes.

This document is a plan only. Implementation should begin only after review and explicit approval.

---

## 2. Scope & Constraints

### In scope

- AI relevancy pipeline only (`backend/app/ai/*`, relevancy persistence, duplicate detection driven by relevancy matches, relevancy tests).
- Additive API fields for new scores (optional in responses).
- Idempotent SQL migration script for new relevancy/duplicate score columns (same pattern as Ollama migration).

### Out of scope (do not modify)

| Area | Reason |
|------|--------|
| Authentication | User constraint |
| Notifications | User constraint |
| Review / approval workflow | User constraint |
| Dashboards | User constraint |
| Proposal forms (frontend submission UI) | User constraint |
| Ollama scoring logic | Ollama is explanations only by design |

### Schema constraint — important clarification

The brief lists **“Do not modify Database Schema”** and also requires **storing `semantic_score` and `hybrid_score`**. These conflict.

**Recommended resolution:** treat “no schema changes” as **no changes to core domain tables** (`users`, `students`, `professors`, `project_ideas` proposal columns, notifications, review tables). V2 needs **additive, nullable columns** on AI result tables only:

- `relevancy_results`
- `matched_projects`
- `duplicate_reports`

If schema changes are absolutely forbidden, the only fallback is to **not persist** semantic/hybrid scores (compute on read) or overload existing columns — both are inferior and not recommended for duplicate audit trails.

**Decision required before implementation:** approve scoped AI-table migration vs. compute-only mode.

---

## 3. Current Architecture (V1 — Keep)

```
Proposal fields (weighted tiers)
        ↓
build_combined_analysis_text()   ← critical×3, high×2, standard×1
        ↓
TF-IDF bag-of-words (embeddings.py)
        ↓
Cosine similarity → similarity_score, matched_projects
        ↓
Heuristic sub-scores (tech, scope, market) → novelty, feasibility, overall
        ↓
Ollama (ollama_service.py) → why_relevant, objectives_overlap, etc.
```

### Key files today

| File | Role |
|------|------|
| `backend/app/ai/embeddings.py` | TF-IDF token vectors + `similarity_between()` |
| `backend/app/ai/relevancy_engine.py` | Weighted corpus compare, heuristics, `AnalysisResult` |
| `backend/app/services/project_service.py` | `run_relevancy_analysis()`, persistence, Ollama hook |
| `backend/app/services/duplicate_service.py` | Threshold check on `match["similarity"]` (currently TF-IDF) |
| `backend/app/ai/ollama_service.py` | JSON explanation generation (unchanged for V2 scoring) |

V1 must remain callable when V2 is disabled or when the transformer model fails to load.

---

## 4. Target Architecture (V2)

```
                    ┌──────────────────────────────────────┐
                    │         RelevancyEngine.analyze       │
                    └──────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
   Semantic branch              TF-IDF branch              Heuristic branch
   (NEW)                        (KEEP)                     (KEEP + normalize)
          │                           │                           │
   9 fields → concat           weighted fields →           tech Jaccard +
   ST encode → cosine          similarity_between()        industry match +
          │                           │                     scope token overlap
          ▼                           ▼                           ▼
   semantic_similarity         weighted_similarity         heuristic_similarity
   (0–100)                      (0–100)                     (0–100)
          │                           │                           │
          └───────────────────────────┴───────────────────────────┘
                                      │
                         hybrid_score = 0.7·S + 0.2·W + 0.1·H
                                      │
                    Duplicate gate: semantic_similarity ≥ threshold
                    Match ranking: semantic_similarity (desc)
                    Persist: semantic_score, hybrid_score, weighted_similarity
                                      │
                                      ▼
                         Ollama explanations (unchanged inputs)
```

### Semantic embedding input fields

Concatenate (with field labels or separators) these nine proposal fields only:

1. `title`  
2. `description`  
3. `problem_statement`  
4. `proposed_solution`  
5. `unique_features`  
6. `innovation_aspect`  
7. `market_gap`  
8. `target_users`  
9. `expected_impact`  

**New helper:** `build_semantic_analysis_text(project: dict) -> str` in `relevancy_engine.py` (or `semantic_embeddings.py`).

Empty fields are skipped; if all empty, semantic similarity = `0.0` and log a warning.

**Note:** TF-IDF continues to use the full weighted field set (`CRITICAL_FIELDS`, `HIGH_FIELDS`, `STANDARD_FIELDS`) — unchanged.

---

## 5. Scoring Formulas

### 5.1 Semantic similarity

```text
query_vec  = SentenceTransformer.encode(build_semantic_analysis_text(query))
corpus_vec = SentenceTransformer.encode(build_semantic_analysis_text(corpus_item))
semantic_similarity = cosine(query_vec, corpus_vec) × 100   # clip to [0, 100]
```

Use the existing `cosine_similarity()` from `embeddings.py` on L2-normalized vectors (SentenceTransformer returns normalized embeddings by default with `normalize_embeddings=True`).

### 5.2 Weighted TF-IDF similarity (unchanged)

```text
weighted_similarity = similarity_between(
    build_combined_analysis_text(query),
    build_combined_analysis_text(corpus_item),
)
```

Stored separately; today this value is written to `similarity_score` / `matched_projects.similarity`.

### 5.3 Heuristic similarity (10% component)

Normalize existing rule-based **overlap** signals to 0–100 (not feasibility/novelty scores):

| Signal | Weight within heuristic | Logic |
|--------|-------------------------|-------|
| Technology token Jaccard | 50% | `_tech_tokens()` intersection / union × 100 |
| Target industry exact match | 25% | 100 if same non-empty string (case-insensitive), else 0 |
| Scope/description token overlap | 25% | Jaccard on tokens from `project_scope` + `description` |

```text
heuristic_similarity = 0.5·tech_jaccard + 0.25·industry_match + 0.25·scope_jaccard
```

This reuses existing heuristic **inputs** without changing feasibility/novelty formulas.

### 5.4 Hybrid score

```text
hybrid_score = round(
    0.70 * semantic_similarity
  + 0.20 * weighted_similarity
  + 0.10 * heuristic_similarity,
  2,
)
```

Per-project aggregates on `relevancy_results`:

- `semantic_score` = max semantic_similarity vs corpus  
- `similarity_score` = max weighted_similarity (keep column meaning: TF-IDF)  
- `hybrid_score` = hybrid built from those maxima + heuristic at query side  

### 5.5 Duplicate detection

| Behavior | V1 | V2 |
|----------|----|----|
| Threshold check | `weighted_similarity >= duplicate_similarity_threshold` | **`semantic_similarity >= threshold`** |
| `matched_projects` inclusion | TF-IDF ≥ threshold | **Semantic ≥ threshold** |
| Stored pair score in `duplicate_reports` | TF-IDF only | **`semantic_score` + `hybrid_score`** (see schema) |
| Risk level (`HIGH` / `MEDIUM` / `LOW`) | Based on stored similarity | Based on **`semantic_score`** (primary) |

### 5.6 Overall relevancy score (novelty / overall)

Keep existing heuristic sub-scores (`novelty_score`, `feasibility_score`, etc.) but derive novelty from **hybrid overlap** instead of TF-IDF-only overlap:

```text
novelty_score = round(max(30, 100 - max_hybrid_score * 0.8), 2)
overall_score = round(
    innovation_score * 0.35
  + feasibility_score * 0.25
  + novelty_score * 0.25
  + (100 - max_hybrid_score) * 0.15,
  2,
)
```

`max_hybrid_score` replaces `max_similarity` in the current formula. Feasibility and market formulas stay unchanged.

### 5.7 Ollama (no scoring changes)

Pass updated score dict to `_apply_explanation_to_relevancy()`:

```python
scores = {
    "overall_score": analysis.overall_score,
    "similarity_score": analysis.semantic_score,      # primary overlap for narrative
    "weighted_similarity": analysis.weighted_similarity,
    "hybrid_score": analysis.hybrid_score,
    "novelty_score": analysis.novelty_score,
    "innovation_score": analysis.innovation_score,
}
```

Update Ollama prompt template to mention hybrid/semantic **for explanation context only** — no LLM-derived numeric scores.

---

## 6. Files Affected

### 6.1 New files

| File | Purpose |
|------|---------|
| `backend/app/ai/semantic_embeddings.py` | Lazy-loaded `SentenceTransformer` singleton, `encode_text()`, `semantic_similarity_between()`, batch encode for corpus |
| `backend/scripts/apply_relevancy_v2_migration.py` | Idempotent `ADD COLUMN IF NOT EXISTS` for new score columns |
| `backend/scripts/backfill_relevancy_v2.py` | Optional admin script: re-run analysis for all projects |
| `backend/tests/test_semantic_embeddings.py` | Unit tests for semantic text builder + similarity ordering |
| `backend/tests/test_relevancy_engine_v2.py` | Hybrid weights, duplicate gating, V1 fallback flag |

### 6.2 Modified files

| File | Changes |
|------|---------|
| `backend/app/ai/relevancy_engine.py` | `build_semantic_analysis_text()`, dual-branch analyze, extend `AnalysisResult` with `semantic_score`, `hybrid_score`, `weighted_similarity`, `heuristic_similarity`; matched dict includes all score components |
| `backend/app/ai/embeddings.py` | **No TF-IDF logic changes**; optionally export shared `cosine_similarity` only (already present) |
| `backend/app/config/settings.py` | `relevancy_engine_v2_enabled`, `sentence_transformer_model`, `semantic_similarity_threshold` (default = current duplicate threshold), `sentence_transformer_device` (`cpu` default) |
| `backend/app/models/relevancy.py` | Add `semantic_score`, `hybrid_score`, `weighted_similarity`, `heuristic_similarity` (nullable Float) |
| `backend/app/models/relevancy.py` (`MatchedProject`) | Add `semantic_score`, `hybrid_score`; keep `similarity` as weighted TF-IDF for backward compat |
| `backend/app/models/duplicate_report.py` | Add `semantic_score`, `hybrid_score` (nullable) |
| `backend/app/services/project_service.py` | Persist new fields in `run_relevancy_analysis()`; map to API responses |
| `backend/app/services/duplicate_service.py` | Accept semantic/hybrid in `upsert_duplicate_report()`; threshold on semantic; extend list/detail payloads |
| `backend/app/schemas/project.py` | Optional fields on `RelevancyExplanation`, `MatchedProjectResponse`, duplicate alert schemas |
| `backend/requirements.txt` | Add `sentence-transformers`, `torch` (CPU wheel) |
| `backend/tests/test_relevancy_engine.py` | Keep V1 tests passing with `relevancy_engine_v2_enabled=False` fixture |

### 6.3 Files explicitly not modified

- `backend/app/services/auth_service.py`, auth routes, JWT middleware  
- Notification services / models  
- Review workflow routes and professor approval logic  
- Frontend dashboard components (unless later asked to **display** new scores)  
- Proposal form components  
- `backend/app/ai/ollama_service.py` — prompt tweak only if score labels change (still no LLM scoring)  

### 6.4 Optional follow-up (not in initial V2)

| File | Change |
|------|--------|
| `frontend/src/app/components/RelevancyExplanationPanel.tsx` | Show semantic vs hybrid breakdown |
| `frontend/src/app/components/AdminAIReports.tsx` | Replace mock data with API (separate task) |

---

## 7. Required Packages

Add to `backend/requirements.txt`:

```text
# AI relevancy V2 — semantic embeddings
sentence-transformers>=3.3.0,<4
torch>=2.2.0,<3          # CPU index recommended for dev laptops
```

**Already present:** `numpy==2.2.1` (used by both TF-IDF and cosine on ST vectors).

### Install notes

| Environment | Recommendation |
|-------------|----------------|
| Windows dev | `pip install torch --index-url https://download.pytorch.org/whl/cpu` then `pip install sentence-transformers` |
| Linux server | CPU torch unless GPU available; set `sentence_transformer_device=cuda` when GPU present |
| Docker | Multi-stage build; pre-download model in image layer to avoid cold-start download |

**Model artifact:** `sentence-transformers/all-MiniLM-L6-v2` (~80 MB). First run downloads from Hugging Face unless cached via `SENTENCE_TRANSFORMERS_HOME` or baked into deployment.

**Disk / RAM:** ~400–600 MB RAM for model + PyTorch overhead on CPU.

---

## 8. Database Changes Needed

### 8.1 `relevancy_results`

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `semantic_score` | `FLOAT` | YES | Max semantic similarity vs corpus |
| `hybrid_score` | `FLOAT` | YES | Max hybrid score vs corpus |
| `weighted_similarity` | `FLOAT` | YES | Max TF-IDF similarity (explicit; today in `similarity_score`) |
| `heuristic_similarity` | `FLOAT` | YES | Query-side heuristic component used in hybrid |

**Column policy:** Keep `similarity_score` populated with **weighted TF-IDF max** for backward compatibility with existing API consumers and Ollama fallbacks. New consumers use `semantic_score` / `hybrid_score`.

### 8.2 `matched_projects`

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `semantic_score` | `FLOAT` | YES | Per-match semantic similarity |
| `hybrid_score` | `FLOAT` | YES | Per-match hybrid score |

Keep existing `similarity` column = weighted TF-IDF for each match.

### 8.3 `duplicate_reports`

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `semantic_score` | `FLOAT` | YES | Primary duplicate signal |
| `hybrid_score` | `FLOAT` | YES | Combined audit score |

Keep `similarity_score` = weighted TF-IDF at detection time for comparison / regression.

### 8.4 No changes to

- `project_ideas` table  
- Auth, notification, review tables  
- Ollama explanation columns (already on `relevancy_results`)  

### 8.5 Alembic

Project uses **idempotent Python migration scripts** (`backend/scripts/apply_*_migration.py`) rather than Alembic revisions for several features. V2 should follow the same pattern for consistency. An Alembic revision can be added later if the team standardizes on Alembic-only migrations.

---

## 9. Migration Strategy

### Phase A — Schema (zero downtime)

1. Deploy migration script: `python -m scripts.apply_relevancy_v2_migration`  
2. All new columns nullable — existing rows unaffected  
3. Backend deploy with `relevancy_engine_v2_enabled=false` (V1 behavior, new columns stay NULL)

### Phase B — Enable V2 in staging

1. Install Python deps + download model  
2. Set `RELEVANCY_ENGINE_V2_ENABLED=true` in `.env`  
3. Submit test proposals; verify semantic > TF-IDF on paraphrase pairs  
4. Run pytest suite  

### Phase C — Backfill existing projects

1. Run `python -m scripts.backfill_relevancy_v2` (loops projects, calls `run_relevancy_analysis`)  
2. Re-run `sync_duplicate_reports_from_matched_projects()` logic embedded in duplicate list  
3. Expect **Ollama re-generation** only when relevancy rows are deleted/recreated — consider skipping Ollama if `why_relevant` already exists (reuse `ensure_explanation` pattern)

**Backfill duration estimate:** ~2–5 s per project on CPU (model load once + N corpus encodes). 500 projects ≈ 15–40 minutes.

### Phase D — Production enable

1. Enable feature flag  
2. New submissions and edits (existing `_relevancy_rerun_needed`) auto-use V2  
3. Monitor latency and error logs for model load failures  

### Rollback

Set `RELEVANCY_ENGINE_V2_ENABLED=false` — engine reverts to TF-IDF-only paths; new columns ignored. No data loss.

---

## 10. Performance Impact

### 10.1 Latency (single analysis, CPU, corpus size N)

| Step | V1 (approx.) | V2 additive cost |
|------|--------------|------------------|
| TF-IDF pairwise | ~1–5 ms × N | unchanged |
| ST encode query | — | ~20–50 ms once |
| ST encode corpus | — | ~20–50 ms × N (batchable to ~5–15 ms × ceil(N/batch)) |
| Heuristics | ~1 ms | ~1 ms |
| Ollama | 5–120 s (async) | unchanged |

**Example:** N = 200 projects → V2 adds roughly **4–15 s CPU** without batching; **1–3 s** with batch encoding (batch size 32).

### 10.2 Optimizations (implement in V2)

1. **Singleton model** — load once per process (`@lru_cache` or module-level lazy init)  
2. **Batch corpus encoding** — `model.encode(all_corpus_texts, batch_size=32)`  
3. **Optional embedding cache** — in-memory dict keyed by `project_id` + content hash (invalidated on edit via `_relevancy_rerun_needed`)  
4. **Corpus limit** — existing `relevancy_corpus_limit` still applies  
5. **Async-friendly** — run `analyze()` in `asyncio.to_thread()` to avoid blocking FastAPI event loop during CPU-heavy encode  

### 10.3 Infrastructure

- Dev laptops: CPU-only acceptable for FYP demo scale (< 500 projects)  
- Production: consider dedicated worker process or GPU if corpus grows beyond ~1,000 projects  

### 10.4 Startup

First import of `sentence_transformers` adds **2–5 s** to cold start; document in deployment README.

---

## 11. Backward Compatibility

| Concern | Strategy |
|---------|----------|
| API clients expecting `similarity_score` | Continue populating with TF-IDF max; document new fields as additive |
| `matched_projects[].similarity` | Keep as TF-IDF; add optional `semanticScore`, `hybridScore` in JSON |
| Duplicate admin UI | Still reads `similarity`; add semantic/hybrid when frontend updated |
| Feature flag off | Identical to current V1 code path |
| Model missing / import error | Log warning; fall back to V1 TF-IDF; set `explanation_status` unchanged |
| Tests | V1 regression tests run with flag disabled; V2 tests with flag enabled |
| Ollama | Receives richer score dict; fallback templates unchanged if Ollama disabled |

### Version identifier

Add `engine_version: "v2"` (optional string field on API or in `summary` JSON snippet) for support/debug — stored in memory only unless a column is approved later.

---

## 12. Testing Plan

### Unit tests

| Test | Assert |
|------|--------|
| Paraphrase pair | `semantic_similarity(A, B) > weighted_similarity(A, B)` when wording differs but meaning aligns |
| Unrelated pair | Blockchain vs campus portal: semantic < 40, hybrid ordering preserved |
| Hybrid weights | Mock fixed sub-scores → verify 70/20/10 formula |
| Duplicate gate | Match included when semantic ≥ threshold even if TF-IDF < threshold |
| Empty semantic text | All nine fields empty → semantic 0, no crash |
| V1 fallback | Flag off → identical `AnalysisResult` to current tests |
| Heuristic component | Same technologies → higher heuristic_similarity |

### Integration tests

- `run_relevancy_analysis()` persists all new columns  
- `create_reports_from_matches()` writes semantic/hybrid to `duplicate_reports`  

### Manual viva checklist

1. Submit two paraphrased proposals → duplicate flagged on semantic score  
2. Relevancy results page shows scores (after optional UI update)  
3. Ollama panel still loads explanations; scores in prompt reflect semantic/hybrid  
4. Toggle V2 off → behavior matches pre-upgrade demo  

---

## 13. Rollout Phases

| Phase | Deliverable | Effort (est.) |
|-------|-------------|---------------|
| **1** | `semantic_embeddings.py` + settings + unit tests | 1–2 days |
| **2** | `relevancy_engine.py` hybrid logic + extended `AnalysisResult` | 1–2 days |
| **3** | DB migration + model/schema/service persistence | 1 day |
| **4** | Duplicate service semantic gating | 0.5 day |
| **5** | Backfill script + staging validation | 0.5–1 day |
| **6** | Documentation update (`AI_RELEVANCY_IMPROVEMENT_GUIDE.md` § implementation status) | 0.5 day |

**Total:** ~5–7 developer days excluding frontend score display.

---

## 14. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| PyTorch install failures on Windows | Blocked dev | Document CPU wheel; optional Docker dev container |
| Hugging Face download blocked offline | Model won't load | Bundle model in repo or local cache path |
| Analysis latency at viva demo | Slow submission | Pre-warm model on server start; limit corpus; batch encode |
| Schema constraint conflict | Can't persist scores | Approve scoped migration (§2) before coding |
| Semantic threshold too sensitive | More duplicate alerts | Tune `semantic_similarity_threshold` separately from TF-IDF threshold |
| RAM on shared host | OOM | Single worker; lazy load; disable V2 on low-memory env |

---

## 15. Out of Scope (Explicit)

- Cross-encoder reranking (Layer 2 in improvement guide)  
- OpenAI / cloud embeddings  
- Using Ollama for numeric scoring  
- Changing professor approval rules based on new scores  
- Retraining or fine-tuning `all-MiniLM-L6-v2` on university data  
- Frontend dashboard redesign (unless separately requested)  

---

## Appendix A — Proposed `AnalysisResult` Extension

```python
@dataclass
class AnalysisResult:
    overall_score: float
    novelty_score: float
    feasibility_score: float
    market_relevance: float
    innovation_score: float
    similarity_score: float          # max weighted TF-IDF (backward compat)
    semantic_score: float            # NEW — max semantic
    hybrid_score: float              # NEW — max hybrid
    weighted_similarity: float       # NEW — explicit alias (= similarity_score)
    heuristic_similarity: float      # NEW — query-side heuristic
    ai_confidence: float
    summary: str
    matched: list[dict]              # each match: semantic_score, hybrid_score, similarity
```

## Appendix B — Proposed Settings (`.env`)

```env
RELEVANCY_ENGINE_V2_ENABLED=true
SENTENCE_TRANSFORMER_MODEL=sentence-transformers/all-MiniLM-L6-v2
SENTENCE_TRANSFORMER_DEVICE=cpu
SEMANTIC_SIMILARITY_THRESHOLD=50.0
# DUPLICATE_SIMILARITY_THRESHOLD — retain for TF-IDF reference / legacy; gate uses SEMANTIC_*
```

## Appendix C — Decision Log (pre-implementation)

| # | Question | Proposed default |
|---|----------|------------------|
| 1 | Approve AI-table schema migration? | **Yes** (scoped exception) |
| 2 | Duplicate threshold on semantic only? | **Yes** (per requirements) |
| 3 | Rank matched projects by semantic or hybrid? | **Semantic** (primary signal) |
| 4 | Block FastAPI event loop during encode? | **Yes** — use thread pool |
| 5 | Re-run Ollama on backfill? | **No** — preserve existing explanations when possible |

---

*End of plan. No implementation code is included in this document.*
