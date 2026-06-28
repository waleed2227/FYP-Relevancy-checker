# Relevancy Engine Readiness Audit

**Date:** 2026-06-07  
**Scope:** Audit only — no code changes  
**Context:** Proposal system upgraded to structured v3 form (10 sections, 29+ DB columns). Ollama explanation layer added separately from similarity scoring.

---

## Executive Summary

| Dimension | Readiness | Assessment |
|-----------|-----------|------------|
| **Similarity text inputs** | ✅ Largely ready | All 15 audited proposal fields are already concatenated into `combined_text` for TF-IDF similarity |
| **Heuristic scoring** | ⚠️ Partial | Feasibility / scope heuristics still use only `technologies` and `description` |
| **Field weighting** | ❌ Not implemented | All tokens in `combined_text` contribute equally; no domain-aware weighting |
| **Full proposal coverage** | ⚠️ Partial | 14 additional v3 columns exist in DB but are excluded from similarity |
| **Operational readiness** | ⚠️ Partial | Analysis runs on submit only; corpus capped at 100; UI copy still references legacy fields |
| **Explanation layer** | ✅ Separate | Ollama explains pre-computed scores; does not affect similarity |

**Verdict:** The engine is **functionally upgraded** for similarity (flat inclusion of core proposal fields) but **not fully aligned** with the richness of the new proposal form. Heuristics, weighting, corpus strategy, and lifecycle (re-analysis on edit) remain legacy-oriented.

---

## 1. Current Similarity Inputs

### 1.1 Primary similarity path (TF-IDF + cosine)

**Source:** `backend/app/ai/relevancy_engine.py` → `build_combined_analysis_text()` → `embeddings.similarity_between()`

**Mechanism:** Non-empty fields are joined with spaces into one string. The same builder is applied to the submitted project (query) and each corpus project. Pairwise cosine similarity is computed; matches above `duplicate_similarity_threshold` (default **50%**) are stored.

**Fields in `RELEVANCY_TEXT_FIELDS` (concatenation order):**

| # | Field | In user audit list | Used in similarity |
|---|--------|-------------------|-------------------|
| 1 | `title` | ✅ | ✅ |
| 2 | `description` | ✅ | ✅ |
| 3 | `technologies` | ✅ | ✅ |
| 4 | `problem_statement` | ✅ | ✅ |
| 5 | `current_challenges` | ✅ | ✅ |
| 6 | `existing_solutions` | ✅ | ✅ |
| 7 | `existing_solution_limitations` | — (extra) | ✅ |
| 8 | `proposed_solution` | ✅ | ✅ |
| 9 | `project_scope` | ✅ | ✅ |
| 10 | `target_users` | ✅ | ✅ |
| 11 | `target_industry` | ✅ | ✅ |
| 12 | `unique_features` | ✅ | ✅ |
| 13 | `innovation_aspect` | ✅ | ✅ |
| 14 | `competitive_advantage` | ✅ | ✅ |
| 15 | `market_gap` | ✅ | ✅ |
| 16 | `expected_impact` | ✅ | ✅ |

**Data plumbing:** `project_service._to_relevancy_analysis_dict()` maps `ProjectIdea` ORM attributes into the dict consumed by `RelevancyEngine.analyze()`. Corpus entries use the same shape.

**Trigger:** `run_relevancy_analysis()` on `POST /api/v1/projects` and lazy `GET /api/v1/projects/{id}/relevancy` when no result exists.

### 1.2 Secondary inputs (heuristic scores only — not similarity)

These fields influence **overall / feasibility / market** scores but **not** `similarity_between()`:

| Field | Used for | Logic |
|-------|----------|--------|
| `technologies` | `tech_score`, `market_relevance` | Keyword lists `MODERN_TECH` / `LEGACY_TECH` |
| `description` | `scope_score` → `feasibility_score` | Word count: `40 + len(description.split()) * 0.5` |
| `max_similarity` (from combined text) | `novelty_score`, `overall_score` | `100 - max_similarity * 0.8` |

`title` is read in `analyze()` but only passed indirectly via `combined_text` for similarity — it does not feed heuristics directly.

### 1.3 Explanation layer (Ollama — not similarity)

**Source:** `backend/app/ai/ollama_service.py`  
Uses a **subset** of proposal text plus **pre-computed scores** to generate narrative explanation. Does **not** call `similarity_between()` or alter scores.

---

## 2. Missing / Ignored Inputs

### 2.1 User-audited fields (15 fields)

**None of the 15 listed fields are ignored for similarity** when populated. All are included in `RELEVANCY_TEXT_FIELDS`.

**Caveats:**

| Issue | Detail |
|-------|--------|
| **Equal weight** | No field is weighted higher; long `description` can dominate token frequency vs. concise `innovation_aspect` |
| **Null = skipped** | Empty v3 sections contribute nothing; behavior matches legacy submissions |
| **Heuristics ignore 13/15** | Only `description` and `technologies` affect feasibility / scope / market heuristics among the audited set |

### 2.2 Additional v3 proposal columns ignored by similarity

| Field | Section | Relevancy relevance |
|-------|---------|---------------------|
| `category` | Project Overview | High — domain classifier |
| `secondary_target_users` | Target Users | Medium — audience overlap |
| `ai_technologies_used` | AI / Tech | High — overlaps with `technologies` but more specific |
| `technical_feasibility` | Feasibility | Medium — could inform feasibility score |
| `financial_feasibility` | Feasibility | Medium |
| `operational_feasibility` | Feasibility | Medium |
| `academic_impact` | Impact | Medium — distinct from `expected_impact` |
| `business_impact` | Impact | Medium |
| `social_impact` | Impact | Medium |
| `future_enhancements` | Future scope | Low–medium |
| `scalability_opportunities` | Future scope | Low–medium |
| `commercialization_potential` | Future scope | Medium |
| `privacy_concerns` | Ethics & risk | Low for similarity |
| `security_concerns` | Ethics & risk | Low |
| `ethical_considerations` | Ethics & risk | Low |
| `future_scope` | Legacy | Low |
| `risk_assessment` | Legacy | Low |

### 2.3 System / integration gaps

| Gap | Location | Impact |
|-----|----------|--------|
| **No re-analysis on edit** | `update_project()` does not call `run_relevancy_analysis()` | Scores stale after student revises proposal sections |
| **Corpus limit 100** | `run_relevancy_analysis()` `.limit(100)` | Duplicates beyond first 100 projects may be missed |
| **Unordered corpus** | No `ORDER BY` on corpus query | Non-deterministic match set if DB order changes |
| **UI copy outdated** | `IdeaSubmissionForm.tsx` | Still says engine analyzes "title, technologies, and description" only |
| **Stored scores for pre-upgrade projects** | `relevancy_results` | Older rows computed on 3-field text until re-triggered |

---

## 3. Safe Incorporation Strategy (Without Breaking Existing Functionality)

### 3.1 Principles

1. **Keep similarity and explanation separate** — Ollama must not compute or override similarity (already enforced).
2. **Preserve null-skip semantics** — `build_combined_analysis_text()` should continue skipping blank fields so legacy projects behave identically when proposal columns are empty.
3. **Symmetric corpus treatment** — query and corpus must use the same field set and builder (already true).
4. **Avoid changing score formulas in the same release as field expansion** — add fields to similarity first; tune heuristics in a follow-up.
5. **Version or flag stored results** — optional `analysis_version` column would let dashboards distinguish old vs. new scoring (not present today).

### 3.2 Recommended incorporation phases

| Phase | Change | Risk |
|-------|--------|------|
| **A (done)** | Flat concatenation of 16 text fields | Low — backward compatible |
| **B** | Weighted field groups in `combined_text` (repeat or prefix weighting) | Low–medium — may shift scores for rich proposals |
| **C** | Extend heuristics to `project_scope`, `ai_technologies_used`, feasibility fields | Medium — changes `overall_score` without changing similarity |
| **D** | Add `category`, impact sub-fields to similarity set | Low if null-skipped |
| **E** | Optional re-run on `PATCH` when proposal attrs change | Medium — professor review may see new scores mid-workflow |
| **F** | Sentence-transformers / persistent embeddings | High — algorithm change; requires migration plan |

### 3.3 Backward compatibility strategy

| Scenario | Expected behavior | Safe approach |
|----------|-------------------|---------------|
| Legacy project (only title, description, technologies) | Same token set as pre-upgrade (order differs; bag-of-words is order-invariant) | Keep current null-skip builder |
| Partial v3 proposal | Only filled sections contribute | No change required |
| Mixed corpus (old + new) | Each row uses its own available fields | Symmetric builder per project |
| Existing `relevancy_results` rows | Frozen until re-analysis | `ensure_relevancy_explanation()` backfills **explanation only**; does not recalculate similarity |
| API contracts | `RelevancyResultResponse`, `ReviewQueueItem` | Add fields as optional; never remove score fields |

---

## 4. Recommended Weighting

Current engine uses **implicit equal weighting** (single bag-of-words vector). For a proposal-aware engine, **field-group weighting** is recommended without changing the core `similarity_between()` API:

### 4.1 Suggested relative weights for similarity text

| Tier | Weight | Fields | Rationale |
|------|--------|--------|-----------|
| **Critical** | 3× | `problem_statement`, `proposed_solution`, `unique_features`, `innovation_aspect` | Core novelty and duplicate detection |
| **High** | 2× | `project_scope`, `market_gap`, `competitive_advantage`, `current_challenges`, `existing_solutions` | Domain and differentiation context |
| **Standard** | 1× | `title`, `description`, `technologies`, `target_users`, `target_industry`, `expected_impact` | Baseline + legacy parity |
| **Optional add** | 1–2× | `category`, `ai_technologies_used`, `existing_solution_limitations` | Structured form extras |

**Implementation pattern (future):** Repeat field text N times in `build_combined_analysis_text()` or build separate sub-vectors per group and blend:  
`sim = 0.5 * sim(critical) + 0.3 * sim(high) + 0.2 * sim(standard)`

### 4.2 Suggested heuristic score adjustments

| Score | Current input | Recommended input |
|-------|---------------|-------------------|
| `scope_score` | `description` word count | `project_scope` length, fallback to `description` |
| `tech_score` | `technologies` keywords | Union of `technologies` + `ai_technologies_used` |
| `market_relevance` | `tech_score` proxy | `target_industry`, `market_gap`, `expected_impact` keyword signals |
| `feasibility_score` | tech + scope | Incorporate `technical_feasibility` / `operational_feasibility` if present |

### 4.3 Overall score blend (unchanged formula, better inputs)

Keep:  
`overall = innovation×0.35 + feasibility×0.25 + novelty×0.25 + (100−similarity)×0.15`  

Improve inputs to `innovation_score` and `feasibility_score` using proposal fields above rather than changing weights initially.

---

## 5. Risks

| # | Risk | Severity | Description |
|---|------|----------|-------------|
| R1 | **Text dilution** | Medium | Long proposals add many generic tokens; similarity may under-emphasize distinctive phrases |
| R2 | **False positives** | Medium | Shared academic boilerplate across students inflates similarity |
| R3 | **False negatives** | Medium | Paraphrased duplicates score low with bag-of-words TF-IDF |
| R4 | **Stale scores after edit** | High | Student fills v3 sections post-submit; relevancy not recomputed |
| R5 | **Incomplete corpus** | Medium | 100-project cap may miss true duplicates |
| R6 | **Heuristic / similarity mismatch** | Medium | High similarity but high `feasibility_score` if description is long and technologies are "modern" |
| R7 | **Score drift on re-analysis** | Low | Re-running analysis after field-weighting changes affects historical comparability |
| R8 | **User expectation gap** | Low | UI and docs understate which fields drive analysis |
| R9 | **Explanation vs. score confusion** | Low | Ollama narrative may sound authoritative while similarity is heuristic TF-IDF |

---

## 6. Implementation Plan

### Phase 1 — Documentation & UX alignment (low risk)

- [ ] Update `IdeaSubmissionForm` copy to list structured sections used in analysis
- [ ] Document in student guide: relevancy runs at submit; edits do not auto-refresh scores
- [ ] Add `analysis_version` to `relevancy_results` (optional metadata)

### Phase 2 — Field-weighted similarity (medium risk)

- [ ] Introduce `FIELD_WEIGHTS` map in `relevancy_engine.py`
- [ ] Implement weighted `build_combined_analysis_text()` or multi-vector blend
- [ ] Regression tests: legacy 3-field projects must produce stable scores (± small tolerance)
- [ ] Golden-file tests with 3–5 fixture proposal pairs

### Phase 3 — Heuristic alignment (medium risk)

- [ ] Extend `scope_score` to prefer `project_scope`
- [ ] Merge `ai_technologies_used` into tech tokenization
- [ ] Add light `market_relevance` signals from `target_industry` / `market_gap`

### Phase 4 — Corpus & lifecycle (medium risk)

- [ ] Remove or raise `.limit(100)`; add status filter (e.g. exclude rejected)
- [ ] Add `ORDER BY submitted_date DESC` for deterministic corpus
- [ ] Optional: re-run relevancy on `PATCH` when `_PROPOSAL_ATTRS` change (feature flag)

### Phase 5 — Embedding upgrade (high risk, high reward)

- [ ] Replace `similarity_between()` with sentence-transformers (`all-MiniLM-L6-v2`)
- [ ] Cache embeddings per project in DB
- [ ] Batch corpus comparison for performance

### Phase 6 — Expand similarity field set (low risk)

- [ ] Add `category`, `ai_technologies_used`, `secondary_target_users` to `RELEVANCY_TEXT_FIELDS`
- [ ] Exclude ethics/risk fields unless duplicate detection in compliance topics is desired

---

## 7. Field-by-Field Audit Summary

| Field | Similarity (`combined_text`) | Heuristics | Ollama explanation | Status |
|-------|------------------------------|------------|-------------------|--------|
| `title` | ✅ | ❌ | ✅ (prompt) | Included |
| `description` | ✅ | ✅ scope | ✅ | Included |
| `technologies` | ✅ | ✅ tech/market | ✅ | Included |
| `problem_statement` | ✅ | ❌ | ✅ | Included |
| `current_challenges` | ✅ | ❌ | ❌ | Similarity only |
| `existing_solutions` | ✅ | ❌ | ❌ | Similarity only |
| `proposed_solution` | ✅ | ❌ | ✅ | Included |
| `project_scope` | ✅ | ❌ | ✅ | Similarity only; should feed scope heuristic |
| `target_users` | ✅ | ❌ | ✅ | Included |
| `target_industry` | ✅ | ❌ | ✅ | Included |
| `unique_features` | ✅ | ❌ | ✅ | Included |
| `innovation_aspect` | ✅ | ❌ | ✅ | Included |
| `competitive_advantage` | ✅ | ❌ | ❌ | Similarity only |
| `market_gap` | ✅ | ❌ | ❌ | Similarity only |
| `expected_impact` | ✅ | ❌ | ❌ | Similarity only |

---

## 8. Conclusion

The relevancy engine has **already incorporated** all 15 audited proposal fields into **similarity calculation** via flat text concatenation. It is **readiness-ready for basic duplicate detection** on structured proposals, with strong **backward compatibility** for legacy submissions.

Gaps that prevent **full alignment** with the upgraded proposal system:

1. No **field-level weighting** — innovation/problem/solution text should count more than boilerplate.
2. **Heuristic scores** still reflect the old 3-field model.
3. **14 additional DB columns** are unused for similarity.
4. **Operational lifecycle** (re-analysis, corpus limits, UI accuracy) lags the form upgrade.

Recommended next step: **Phase 2 (weighted similarity)** plus **Phase 4 (corpus/lifecycle)** before investing in embedding model upgrades.

---

## References (code locations)

| Component | Path |
|-----------|------|
| Similarity engine | `backend/app/ai/relevancy_engine.py` |
| Embeddings | `backend/app/ai/embeddings.py` |
| Analysis orchestration | `backend/app/services/project_service.py` → `run_relevancy_analysis()` |
| Ollama explanations | `backend/app/ai/ollama_service.py` |
| Proposal DB model | `backend/app/models/project.py` |
| Prior upgrade report | `RELEVANCY_ENGINE_UPGRADE_REPORT.md` |
| Ollama layer report | `OLLAMA_EXPLANATION_IMPLEMENTATION_REPORT.md` |
