# AI Engine Audit

**Project:** AI-Based FYP Relevancy System  
**Document type:** Read-only code audit  
**Date:** June 2026  
**Scope:** `backend/app/ai/*`, `backend/app/services/*`, `backend/app/routes/*`  
**Code modified:** None

---

## Executive Summary

Production AI today is **V1 only**: a **weighted lexical similarity engine** (`relevancy_engine.py` + `embeddings.py`) with **heuristic sub-scores**, plus **Ollama for explanations only**. `semantic_embeddings.py` exists but is **dormant** (feature flag off, not imported by scoring path). Duplicate detection reuses V1 similarity percentages from matched projects — not transformer embeddings.

| Component | Status |
|-----------|--------|
| V1 scoring (`RelevancyEngine`) | **Active — production** |
| Lexical similarity (`embeddings.py`) | **Active** |
| Sentence Transformers (`semantic_embeddings.py`) | **Dormant** |
| Ollama explanations | **Active** (with fallback when unavailable) |
| Ollama scoring | **Never used** |

---

## Question Index

| # | Topic | Short answer |
|---|-------|--------------|
| 1 | Relevancy algorithm | Weighted BOW cosine + heuristics |
| 2 | TF-IDF | **Labeled TF-IDF; implemented as BOW cosine (no IDF)** |
| 3 | SentenceTransformer in scoring | **No** |
| 4 | Cosine similarity | **Yes** (lexical vectors) |
| 5 | `semantic_embeddings.py` | **Dormant** |
| 6 | Duplicate detection | **Keyword/BOW similarity from V1 engine** |
| 7 | Ollama explanations | **Yes** (or rule-based fallback) |
| 8 | Ollama API endpoints | **None directly** — called from service layer |
| 9 | Relevancy score endpoints | `POST /projects`, `GET /projects/{id}/relevancy`, `PATCH /projects/{id}` |
| 10 | Student submit flow | Create → `run_relevancy_analysis()` → persist |
| 11–13 | Input fields | See sections below |
| 14 | Production blockers | See section 14 |
| 15 | V2 file list | See section 15 |

---

## 1. What algorithm currently calculates relevancy?

**Primary engine:** `RelevancyEngine.analyze()` in `backend/app/ai/relevancy_engine.py`

### Pipeline

```
_to_relevancy_analysis_dict(project)
       ↓
build_combined_analysis_text()     ← 17 fields, tier-weighted concatenation
       ↓
similarity_between(query, corpus)  ← pairwise vs all other projects
       ↓
Heuristic sub-scores:
  • tech_score      — modern vs legacy keyword sets
  • scope_score     — word count of project_scope / description
  • market_input    — word count of industry / market / impact text
       ↓
Derived scores:
  • novelty_score   = max(30, 100 - max_similarity × 0.8)
  • feasibility     = avg(tech_score, scope_score)
  • market_relevance = f(market_input)
  • innovation      = 0.6×novelty + 0.4×market_relevance
  • overall_score   = 0.35×innovation + 0.25×feasibility
                      + 0.25×novelty + 0.15×(100 - similarity)
  • ai_confidence   = min(95, 70 + 5×matched_count)
```

**Orchestrator:** `project_service.run_relevancy_analysis()` loads corpus, calls engine, persists `RelevancyResult`, `MatchedProject`, duplicate reports, and Ollama explanation.

There is **no neural network, no transformer, and no LLM** in the numeric scoring path.

---

## 2. Is TF-IDF used?

**Partially — naming only.**

`embeddings.py` docstring says "TF-IDF + cosine similarity," but the implementation is:

```54:56:backend/app/ai/embeddings.py
def similarity_between(text_a: str, text_b: str) -> float:
    vecs = embed_texts([text_a, text_b])
    return round(cosine_similarity(vecs[0], vecs[1]) * 100, 2)
```

Actual steps:
1. Tokenize to lowercase alphanumeric words
2. Build **shared vocabulary** from both documents only
3. Term-frequency vectors (raw counts, L2-normalized)
4. Cosine similarity × 100

**There is no inverse document frequency (IDF) term.** Accurate description: **bag-of-words (BOW) cosine similarity** on a pair-wise vocabulary, applied to weighted concatenated proposal text.

Throughout the codebase and docs this is referred to as "TF-IDF" for historical/planning reasons.

---

## 3. Is SentenceTransformer actually used in production scoring?

**No.**

| Check | Result |
|-------|--------|
| `semantic_embeddings` imported by `relevancy_engine.py` | No |
| `semantic_embeddings` imported by `project_service.py` | No |
| `RELEVANCY_ENGINE_V2_ENABLED` default | `false` (`settings.py`) |
| Production code paths calling `encode_texts()` | **None** |

`semantic_embeddings.py` can load `all-MiniLM-L6-v2` when the flag is on, but **no scoring, duplicate, or API code calls it today**.

---

## 4. Is cosine similarity used?

**Yes — for lexical similarity only.**

```38:44:backend/app/ai/embeddings.py
def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    ...
    return float(np.clip(np.dot(a, b) / denom, 0.0, 1.0))
```

Used in `similarity_between()` → `RelevancyEngine.analyze()` for:
- Corpus pairwise comparison
- `similarity_score` (max match)
- `matched_projects` inclusion (≥ `duplicate_similarity_threshold`, default 50%)
- `novelty_score` and `overall_score` indirectly

**Not used:** cosine on Sentence Transformer embeddings (V2 not wired).

---

## 5. Is `semantic_embeddings.py` active or dormant?

**Dormant — prerequisite skeleton only.**

| Function | Purpose | Called in production? |
|----------|---------|:--------------------:|
| `is_semantic_engine_enabled()` | Reads `relevancy_engine_v2_enabled` | No (scoring) |
| `get_sentence_transformer()` | Lazy model load | No |
| `preload_model()` | Force load | Scripts/tests only |
| `encode_texts()` | ST encoding | Tests only |
| `reset_model_cache()` | Test helper | Tests only |

File header explicitly states: *"Not integrated into relevancy scoring or duplicate detection yet."*

Only consumer: `backend/tests/test_semantic_embeddings_prereq.py`

---

## 6. Does duplicate detection use embeddings or keywords?

**Keywords / lexical similarity (V1 engine output) — not transformer embeddings.**

Flow:

```
RelevancyEngine.analyze()
  → matched[] with similarity % from similarity_between()
       ↓
duplicate_service.create_reports_from_matches()
  → upsert_duplicate_report() if similarity ≥ threshold (50%)
```

`duplicate_service.py`:
- Does **not** import `embeddings.py` or `semantic_embeddings.py`
- Uses `match["similarity"]` passed from relevancy analysis
- `_default_ai_analysis()` text says "AI semantic similarity" — **marketing wording only**; score is BOW-based

Duplicate threshold: `duplicate_similarity_threshold` in settings (default **50.0**).

---

## 7. Does Ollama actually generate explanations?

**Yes, when enabled and reachable — otherwise rule-based fallback.**

`ollama_service.generate_relevancy_explanation()`:

| Condition | Behavior |
|-----------|----------|
| `ollama_enabled=false` | `build_fallback_explanation()` immediately |
| Ollama HTTP success + valid JSON | `status: "generated"` |
| Ollama error / timeout / bad JSON | `status: "fallback"` + warning log |

Ollama call: `POST {ollama_base_url}/api/generate` with `format: "json"`.

**Critical:** Prompt instructs Ollama *"do NOT recalculate or invent new similarity percentages"* — scores are injected from V1 engine.

Persisted fields on `relevancy_results`:
- `why_relevant`, `similar_projects_summary`, `objectives_overlap`, `problem_domains_overlap`, `unique_aspects`, `novelty_suggestions`, `explanation_status`, `ollama_model`

Eval corpus backfill logs show `"Ollama explanation failed, using fallback: All connection attempts failed"` when Ollama is not running — scoring still succeeds.

---

## 8. Which API endpoints call Ollama?

**No route calls Ollama directly.** Ollama is invoked only from the service layer:

| Trigger | File | Function |
|---------|------|----------|
| After new analysis | `project_service.py` | `_apply_explanation_to_relevancy()` ← `generate_relevancy_explanation()` |
| Missing explanation on GET | `project_service.py` | `ensure_relevancy_explanation()` |

### Indirect API paths (Ollama may run)

| Method | Path | When Ollama runs |
|--------|------|------------------|
| `POST` | `/api/v1/projects` | After `run_relevancy_analysis()` on submit |
| `GET` | `/api/v1/projects/{id}/relevancy` | If result exists but `why_relevant` is empty |
| `PATCH` | `/api/v1/projects/{id}` | After relevancy re-run if proposal fields changed |

Ollama is **never** called from: auth, notifications, admin duplicate routes, profile routes.

---

## 9. Which API endpoints generate relevancy scores?

| Method | Path | Scoring trigger |
|--------|------|-----------------|
| `POST` | `/api/v1/projects` | Always — `run_relevancy_analysis()` after create |
| `GET` | `/api/v1/projects/{id}/relevancy` | If no `relevancy_result` row exists |
| `PATCH` | `/api/v1/projects/{id}` | If `_relevancy_rerun_needed()` is true |

### Endpoints that read scores but do not compute

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/v1/projects/my` | Returns `relevancyScore` from project row |
| `GET` | `/api/v1/projects/review-queue` | Includes relevancy from existing result |
| `GET` | `/api/v1/projects/all` | Admin/professor list |
| `GET` | `/api/v1/admin/duplicate-reports` | Uses stored duplicate reports |

### Offline / script scoring (not HTTP)

| Script | Calls |
|--------|-------|
| `scripts/backfill_eval_relevancy.py` | `run_relevancy_analysis()` |

Router prefix: `settings.api_prefix` = `/api/v1` (`main.py`).

---

## 10. What happens when a student submits a proposal?

```
POST /api/v1/projects  (StudentUser)
       ↓
project_service.create_project()
  • Validate professor email → resolve professor_id
  • Insert project_ideas (status=PENDING)
  • Notify professor (notification — not AI)
       ↓
project_service.run_relevancy_analysis()
  1. Load corpus: all other project_ideas (optional limit)
  2. _to_relevancy_analysis_dict() for query + each corpus row
  3. RelevancyEngine.analyze() → AnalysisResult
  4. Set project.relevancy_score = overall_score
  5. Delete prior RelevancyResult if any
  6. Insert RelevancyResult (all sub-scores + summary)
  7. Insert MatchedProject rows (top matches ≥ threshold)
  8. duplicate_service.create_reports_from_matches()
  9. generate_relevancy_explanation() → persist explanation fields
       ↓
Return ProjectResponse (includes relevancyScore)
```

**Synchronous in request thread** — no `asyncio.to_thread` offload; large corpus + Ollama can slow POST.

---

## 11. What data is sent into the AI engine?

### Scoring input — `_to_relevancy_analysis_dict()`

Built from `ProjectIdea` ORM row:

| Key | Source |
|-----|--------|
| All `RELEVANCY_TEXT_FIELDS` (17) | ORM columns |
| `ai_technologies_used` | ORM (heuristics only) |
| `id`, `year`, `author`, `status` | Metadata for matched project display |

### Combined similarity text — `build_combined_analysis_text()`

Weighted concatenation of non-empty fields (text repeated per tier weight).

### Ollama input — `build_explanation_prompt()`

Proposal text fields + pre-computed scores + matched project list (no raw corpus).

### Not sent to scoring engine

- `category`, `professor_email`, `professor_id`, `student_id`
- File uploads (none in engine)
- Review/notification data

---

## 12. Which proposal fields affect scoring?

### A. Weighted similarity string (17 fields)

| Tier | Weight | Fields |
|------|-------:|--------|
| Critical | ×3 | `problem_statement`, `proposed_solution`, `unique_features`, `innovation_aspect` |
| High | ×2 | `current_challenges`, `existing_solutions`, `project_scope`, `competitive_advantage`, `market_gap` |
| Standard | ×1 | `title`, `description`, `technologies`, `target_users`, `target_industry`, `expected_impact`, `existing_solution_limitations` |

### B. Heuristic-only (not in weighted string)

| Field | Used in |
|-------|---------|
| `technologies` | Also in similarity string; `_tech_tokens()` |
| `ai_technologies_used` | `_tech_tokens()` modern/legacy keyword sets |
| `project_scope` | `_scope_score()` (fallback: `description`) |
| `target_industry`, `market_gap`, `expected_impact` | `_market_input_score()` (`expected_impact` also in similarity string) |

### C. Triggers re-analysis on PATCH

`title`, `technologies`, `description`, and all `_PROPOSAL_ATTRS` (30 optional proposal columns).

---

## 13. Which proposal fields are ignored?

These DB columns are **not read** by `_to_relevancy_analysis_dict()` or `RelevancyEngine`:

| Ignored field | Notes |
|---------------|-------|
| `category` | Stored; not scored |
| `secondary_target_users` | Not in engine |
| `technical_feasibility` | Not in engine |
| `financial_feasibility` | Not in engine |
| `operational_feasibility` | Not in engine |
| `academic_impact` | Not in engine |
| `business_impact` | Not in engine |
| `social_impact` | Not in engine |
| `future_enhancements` / `future_scope` | Not in engine |
| `scalability_opportunities` | Not in engine |
| `commercialization_potential` | Not in engine |
| `privacy_concerns` | Not in engine |
| `security_concerns` | Not in engine |
| `ethical_considerations` | Not in engine |
| `risk_assessment` | Not in engine |
| `feedback` | Review workflow only |
| `professor_email`, `professor_id` | Assignment only |

Ollama prompt includes a **subset** of fields (title, description, problem, solution, scope, unique features, innovation, target users, industry) — still ignored for **numeric** scoring if not in the lists above.

---

## 14. What prevents production readiness?

### V1 production (current) — usable with caveats

| Issue | Impact |
|-------|--------|
| BOW labeled "TF-IDF" | Misleading for viva; paraphrase detection weak |
| No semantic layer | CareerCraft/Qaiser-style pairs under-detected |
| Synchronous scoring + Ollama in POST | Timeouts on large corpus / slow Ollama |
| Ollama optional but default on | Fallback works; `explanation_status=fallback` common if Ollama down |
| `relevancy_corpus_limit=0` | Compares all projects — O(n) per submission |
| No score versioning | Cannot A/B V1 vs V2 on same row without migration |
| Misleading duplicate copy | "AI semantic similarity" text but BOW scores |

### V2 production — blockers

| Blocker | Status |
|---------|--------|
| `RELEVANCY_ENGINE_V2_ENABLED=false` | Semantic path disabled |
| `semantic_embeddings.py` not integrated | No production callers |
| `all-MiniLM-L6-v2` not cached offline | Model download / HF rate limits |
| No DB columns for `semantic_score`, `duplicate_risk_score`, `engine_version` | Cannot persist V2 outputs |
| No hybrid scoring in `relevancy_engine.py` | V2 plan not implemented |
| No V2 integration tests on real corpus | Eval shows 1/5 paraphrase pairs detected by V1 |
| Blocking event loop | CPU-heavy ST encode not offloaded |

### Environment / ops

| Issue | Notes |
|-------|-------|
| Ollama dependency | Explanations degrade gracefully |
| Model size / CPU | ST inference needs thread offload for FastAPI |
| Corpus growth | 39+ projects manageable; scales linearly |

---

## 15. What exact files must change to complete V2 semantic relevancy?

Per `RELEVANCY_ENGINE_V2_GAP_ANALYSIS.md` and `RELEVANCY_ENGINE_V2_IMPLEMENTATION_PLAN.md` — **no code modified in this audit**.

### Core AI layer

| File | Required change |
|------|-----------------|
| `backend/app/ai/semantic_embeddings.py` | Add `SEMANTIC_FIELDS`, `build_semantic_analysis_text()`, `semantic_similarity_percent()`, batch encode |
| `backend/app/ai/relevancy_engine.py` | V2 branch in `analyze()`; hybrid or semantic-primary scoring; extended `AnalysisResult` |
| `backend/app/ai/embeddings.py` | Optional: keep BOW; reuse `cosine_similarity()` for numpy ST vectors |
| `backend/app/ai/ollama_service.py` | Prompt labels only (duplicate_risk / semantic scores) — **no LLM scoring** |

### Services

| File | Required change |
|------|-----------------|
| `backend/app/services/project_service.py` | Persist V2 fields; `asyncio.to_thread()` for encode; map scores to response |
| `backend/app/services/duplicate_service.py` | Semantic threshold gate; persist `duplicate_risk_score` |

### Config

| File | Required change |
|------|-----------------|
| `backend/app/config/settings.py` | `semantic_similarity_threshold`, optional hybrid flag (partially present) |
| `backend/.env.example` | Document V2 env vars |

### Database / ORM

| File | Required change |
|------|-----------------|
| `backend/app/models/relevancy.py` | `semantic_score`, `duplicate_risk_score`, `engine_version` on `RelevancyResult` / `MatchedProject` |
| `backend/app/models/duplicate_report.py` | Optional semantic columns |
| `backend/alembic/versions/*` or `scripts/apply_relevancy_v2_migration.py` | ADD COLUMN migration |

### API schemas (additive)

| File | Required change |
|------|-----------------|
| `backend/app/schemas/project.py` | Optional V2 response fields on `RelevancyResultResponse` |
| `backend/app/schemas/admin.py` | Optional duplicate alert fields |

### Routes

| File | Change |
|------|--------|
| `backend/app/routes/projects.py` | **Minimal** — inherits service changes via existing endpoints |

### Tests

| File | Purpose |
|------|---------|
| `backend/tests/test_semantic_embeddings.py` | ST helpers (mocked) |
| `backend/tests/test_relevancy_engine_v2.py` | V2 scoring + paraphrase cases |
| `backend/tests/test_relevancy_engine.py` | V1 regression with flag off |

### Scripts / ops

| File | Purpose |
|------|---------|
| `backend/scripts/download_sentence_transformer.py` | Model cache (exists) |
| `backend/scripts/backfill_eval_relevancy.py` | Re-run after V2 (exists) |
| `backend/scripts/apply_relevancy_v2_migration.py` | New — idempotent migration |

### Explicitly out of scope for V2 engine work

- `backend/app/services/auth_service.py`
- `backend/app/routes/auth.py`, `notifications.py`, review workflow logic
- Frontend proposal forms (unless displaying new score labels)
- `backend/app/ai/__init__.py` — optional export of semantic helpers

**Estimated touch count:** ~15 backend files + 2 scripts + 2 test modules (per implementation plan).

---

## Architecture Diagram (Current Production)

```
                    ┌─────────────────────┐
                    │  POST/PATCH/GET     │
                    │  /api/v1/projects/* │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  project_service    │
                    │ run_relevancy_      │
                    │   analysis()        │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
   ┌──────────▼─────────┐      │     ┌──────────▼──────────┐
   │ RelevancyEngine    │      │     │ ollama_service        │
   │ (V1 BOW + heur.)   │      │     │ explanations ONLY     │
   └──────────┬─────────┘      │     └──────────┬──────────┘
              │                │                │
   ┌──────────▼─────────┐      │                │
   │ embeddings.py      │      │                │
   │ BOW + cosine       │      │                │
   └────────────────────┘      │                │
                               │
                    ┌──────────▼──────────┐
                    │ duplicate_service   │
                    │ (V1 similarity %)   │
                    └─────────────────────┘

   ┌─────────────────────┐
   │ semantic_embeddings │  ← DORMANT (flag off)
   │ .py                 │
   └─────────────────────┘
```

---

## File Reference Map

| File | Role |
|------|------|
| `app/ai/relevancy_engine.py` | V1 scoring orchestration |
| `app/ai/embeddings.py` | BOW cosine similarity |
| `app/ai/semantic_embeddings.py` | V2 prerequisite (unused) |
| `app/ai/ollama_service.py` | NL explanations |
| `app/services/project_service.py` | Analysis orchestration + persistence |
| `app/services/duplicate_service.py` | Duplicate reports from V1 matches |
| `app/routes/projects.py` | HTTP triggers for scoring |
| `app/config/settings.py` | Thresholds, flags, Ollama config |
| `app/models/relevancy.py` | Score storage schema |

---

## Related Documents

- `RELEVANCY_ENGINE_V2_GAP_ANALYSIS.md`
- `RELEVANCY_ENGINE_V2_IMPLEMENTATION_PLAN.md`
- `EVAL_CORPUS_ANALYSIS_REPORT.md` — V1 paraphrase detection gap (1/5 pairs)
- `AI_ENGINE_V2_READINESS.md` — environment + dataset readiness

---

*Read-only audit. No application code was modified.*
