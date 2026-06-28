# Weighted Relevancy Implementation Report

**Date:** 2026-06-07  
**Scope:** Phase 2 (weighted similarity + heuristics) and Phase 4 (corpus + edit re-analysis) from `RELEVANCY_ENGINE_READINESS_AUDIT.md`

---

## Summary

The relevancy engine now uses **tiered field weighting** for TF-IDF similarity, **improved heuristic inputs** aligned with the v3 proposal form, **automatic re-analysis on proposal edits**, and a **configurable, ordered corpus**. TF-IDF cosine similarity is retained. No database schema, API contract, Ollama, auth, notification, or review workflow changes were made.

---

## Files Modified

| File | Change |
|------|--------|
| `backend/app/ai/relevancy_engine.py` | Weighted `build_combined_analysis_text()`, heuristic input helpers |
| `backend/app/services/project_service.py` | Corpus query, `_relevancy_rerun_needed()`, edit-triggered re-analysis, `ai_technologies_used` in analysis dict |
| `backend/app/config/settings.py` | `relevancy_corpus_limit` setting |
| `backend/.env.example` | `RELEVANCY_CORPUS_LIMIT` documentation |
| `backend/requirements.txt` | `pytest`, `pytest-asyncio` |
| `backend/pytest.ini` | **New** — test configuration |
| `backend/tests/test_relevancy_engine.py` | **New** — 10 regression tests |

**Explicitly unchanged:** `embeddings.py` (TF-IDF), `ollama_service.py`, auth routes, notifications, review/approval routes, dashboards, admin/professor/student management, database models/migrations.

---

## Part 1 — Weighted Similarity

### Implementation

`build_combined_analysis_text()` groups fields into tiers and **repeats each tier's concatenated text** by weight:

| Tier | Weight | Fields |
|------|--------|--------|
| **Critical** | 3× | `problem_statement`, `proposed_solution`, `unique_features`, `innovation_aspect` |
| **High** | 2× | `current_challenges`, `existing_solutions`, `project_scope`, `competitive_advantage`, `market_gap` |
| **Standard** | 1× | `title`, `description`, `technologies`, `target_users`, `target_industry`, `expected_impact`, `existing_solution_limitations` |

Empty/null fields are skipped per tier. `similarity_between()` is unchanged — only the input string is weighted.

### Effect

- Long `description` text no longer dominates vs. concise innovation/problem fields.
- Shared critical fields (problem + solution) produce higher similarity than shared description alone (verified in tests).

---

## Part 2 — Heuristic Improvements

Formulas unchanged; **inputs** improved:

| Score | Before | After |
|-------|--------|-------|
| `scope_score` | `description` word count | `project_scope` word count; fallback to `description` |
| `tech_score` tokens | `technologies` only | `technologies` + `ai_technologies_used` |
| `market_relevance` input | `tech_score` only | `max(tech_score, market_score)` where `market_score` derives from `target_industry`, `market_gap`, `expected_impact` word richness; falls back to `tech_score` when all absent |

Downstream formulas preserved:

- `feasibility_score = (tech_score + scope_score) / 2`
- `market_relevance = min(95, market_input * 0.9 + 10)`
- `innovation_score = novelty * 0.6 + market_relevance * 0.4`
- `overall = innovation×0.35 + feasibility×0.25 + novelty×0.25 + (100−similarity)×0.15`

---

## Part 3 — Relevancy Re-run on Project Edit

### Trigger

`PATCH /api/v1/projects/{id}` → `update_project()`

### Logic

`_relevancy_rerun_needed()` compares incoming `ProjectUpdate` against the stored project for:

- `title`, `technologies`, `description`
- All `_PROPOSAL_ATTRS` (29 snake_case proposal columns)

**Does not re-run** when only `professor_email` changes (or when provided values are unchanged).

On match → `run_relevancy_analysis()` after flush (same path as new submission).

---

## Part 4 — Corpus Improvements

| Before | After |
|--------|-------|
| `.limit(100)` hardcoded | `relevancy_corpus_limit` setting (default **0** = no limit) |
| No ordering | `ORDER BY submitted_date DESC` |

**Setting:** `RELEVANCY_CORPUS_LIMIT=0` (unlimited) or positive integer to cap corpus size.

---

## Part 5 — Backward Compatibility

| Scenario | Behavior |
|----------|----------|
| Legacy project (title + description + technologies only) | Critical/high tiers empty; standard tier tokens appear **once** — equivalent to pre-weighting legacy similarity |
| Null proposal fields | Skipped (unchanged) |
| API responses | `RelevancyResultResponse`, `ReviewQueueItem` shapes unchanged |
| Database schema | No migrations; existing `relevancy_results` rows valid (re-analysis on next edit or lazy GET replaces scores) |
| Ollama | Unmodified; explanation still generated post-similarity via existing `_apply_explanation_to_relevancy()` |

---

## Part 6 — Testing

**Run:** `cd backend && python -m pytest tests/test_relevancy_engine.py -v`

| Test | Verifies |
|------|----------|
| `test_legacy_project_generates_scores` | Legacy 3-field projects produce valid scores |
| `test_rich_proposal_generates_scores` | Full proposal projects produce valid scores |
| `test_weighted_text_repeats_critical_fields` | Critical text repeated 3× |
| `test_legacy_weighted_text_matches_standard_tier_only` | Legacy token frequency preserved |
| `test_similar_projects_score_higher_than_unrelated` | Similar > unrelated similarity |
| `test_critical_overlap_beats_description_only_overlap` | Weighting prioritizes critical fields |
| `test_scope_score_prefers_project_scope` | Scope heuristic uses `project_scope` |
| `test_tech_score_includes_ai_technologies` | AI tech tokens counted |
| `test_market_relevance_uses_industry_fields` | Market fields boost market input |
| `test_relevancy_rerun_when_proposal_field_changes` | Edit trigger logic |

**Result:** 10/10 passed.

---

## Before vs After Comparison

| Dimension | Before | After |
|-----------|--------|-------|
| Similarity text weighting | Flat (all fields 1×) | Tiered 3× / 2× / 1× |
| Description dominance | High (long text skews TF-IDF) | Reduced (critical fields amplified) |
| Scope heuristic | `description` length | `project_scope` → `description` fallback |
| Tech heuristic | `technologies` | `technologies` + `ai_technologies_used` |
| Market heuristic | Proxy via `tech_score` | `target_industry`, `market_gap`, `expected_impact` when present |
| Edit re-analysis | None | Auto on proposal field change |
| Corpus | 100 projects, unordered | All projects (default), `submitted_date DESC` |
| TF-IDF algorithm | `embeddings.similarity_between()` | **Unchanged** |
| Sentence transformers | Not used | Not used |
| Ollama | Separate explanation layer | **Unchanged** |

---

## Explicit Confirmations

| Area | Status |
|------|--------|
| **TF-IDF retained** | ✅ `embeddings.py` untouched |
| **Ollama unchanged** | ✅ No edits to `ollama_service.py` |
| **Authentication unchanged** | ✅ |
| **Notifications unchanged** | ✅ |
| **Review workflow unchanged** | ✅ |
| **Approval workflow unchanged** | ✅ |
| **Dashboards unchanged** | ✅ |
| **Professor / Student / Admin management unchanged** | ✅ |
| **Database schema unchanged** | ✅ |
| **API contracts unchanged** | ✅ |

---

## Configuration

```env
# backend/.env
RELEVANCY_CORPUS_LIMIT=0          # 0 = full corpus; e.g. 500 to cap
DUPLICATE_SIMILARITY_THRESHOLD=50 # unchanged
```
