# Relevancy Engine V2 — Implementation Plan

**Project:** AI-Based FYP Relevancy System  
**Document type:** Production implementation plan (no code in this phase)  
**Date:** June 2026  
**Companion:** `RELEVANCY_ENGINE_V2_GAP_ANALYSIS.md`  
**Goal:** Production-grade semantic relevancy engine suitable for FYP viva defense  

---

## 1. Executive Summary

V2 adds a **Sentence Transformer semantic layer** (`all-MiniLM-L6-v2`) alongside the existing **V1 TF-IDF engine**. V2 produces three defendable outputs:

| Output | Meaning | Primary consumer |
|--------|---------|------------------|
| **Relevancy score** | How strong/appropriate the proposal is (distinctiveness + quality signals) | Student dashboard, `project.relevancy_score` |
| **Duplicate risk score** | Max semantic overlap with corpus (0–100, higher = more duplicate risk) | Admin duplicate alerts, professor review |
| **Confidence score** | Trust in the analysis (field coverage, match clarity, engine health) | Review queue, AI insights |

**Ollama remains explanation-only.** V1 TF-IDF stays available behind `RELEVANCY_ENGINE_V2_ENABLED` for rollback and optional hybrid mode.

---

## 2. V2 Design Specification

### 2.1 Semantic input fields

Concatenate non-empty fields (space-separated, in fixed order):

1. `title`  
2. `description`  
3. `problem_statement`  
4. `proposed_solution`  
5. `unique_features`  
6. `innovation_aspect`  
7. `target_users`  
8. `target_industry`  

**Helper:** `build_semantic_analysis_text(project: dict) -> str` in `semantic_embeddings.py`.

All fields exist on `project_ideas` and are mapped via `_to_relevancy_analysis_dict()`.

---

### 2.2 Similarity method

```text
query_vec  = SentenceTransformer.encode(build_semantic_analysis_text(query), normalize=True)
corpus_vec = SentenceTransformer.encode(build_semantic_analysis_text(corpus_item), normalize=True)
semantic_similarity = cosine(query_vec, corpus_vec) × 100    # clip [0, 100]
```

Reuse `embeddings.cosine_similarity()` on numpy vectors from `semantic_embeddings.encode_texts()`.

**Corpus optimization:** batch-encode all corpus texts in one `model.encode(batch, batch_size=32)` call per analysis.

---

### 2.3 Score formulas (V2 primary mode)

When `RELEVANCY_ENGINE_V2_ENABLED=true`:

#### Duplicate risk score

```text
duplicate_risk_score = max(semantic_similarity vs each corpus project)
```

- Used for **matched_projects** inclusion: `semantic_similarity >= semantic_similarity_threshold` (default 50, configurable)
- Used for **duplicate_reports** risk: `similarity_to_risk(duplicate_risk_score)`
- Stored in new column `duplicate_risk_score`; also map to existing `similarity_score` in API docs as “overlap” for backward compat **or** keep `similarity_score` as TF-IDF when hybrid

#### Relevancy score

Semantic-first relevancy (distinctiveness-weighted):

```text
semantic_novelty = max(30, 100 - duplicate_risk_score × 0.85)
field_coverage   = (filled_semantic_fields / 8) × 100
relevancy_score  = round(
    semantic_novelty × 0.55
  + field_coverage × 0.20
  + feasibility_v1 × 0.15      # keep existing tech/scope heuristics
  + market_relevance_v1 × 0.10,
  2,
)
```

- Maps to `overall_score` and `project.relevancy_score`
- Preserves V1 feasibility/market heuristics for viva narrative (“hybrid AI scoring”)

#### Confidence score

```text
confidence_score = round(min(95,
    55
  + field_coverage × 0.25
  + min(20, len(matched_semantic) × 4)
  + (10 if model_loaded_offline else 0)
), 2)
```

- Maps to existing `ai_confidence`
- Low confidence when semantic text is empty or model fallback used

---

### 2.4 Hybrid mode (recommended for viva)

Combine semantic + V1 TF-IDF for robust defense:

```text
hybrid_similarity = 0.70 × semantic + 0.20 × tfidf + 0.10 × heuristic_overlap
```

Where `heuristic_overlap` = tech Jaccard + industry exact match (from prior plan).

- **Duplicate gate:** semantic similarity ≥ threshold (primary)
- **Display:** show semantic, TF-IDF, and hybrid in API optional fields

If timeline is tight, ship **semantic-primary** first; add hybrid in Phase 2.

---

### 2.5 V1 fallback

When `RELEVANCY_ENGINE_V2_ENABLED=false` OR model load fails:

- Run existing `RelevancyEngine.analyze()` unchanged
- Log warning; set `engine_version=v1`

---

## 3. Architecture

```
run_relevancy_analysis()                    [async — project_service]
       │
       ├─ asyncio.to_thread(…)              ← avoid blocking event loop
       │
       ▼
RelevancyEngine.analyze(query, corpus)
       │
       ├─ [V2] build_semantic_analysis_text × (1 + N)
       │         semantic_embeddings.encode_corpus_batch()
       │         pairwise semantic_similarity
       │
       ├─ [V1] build_combined_analysis_text + similarity_between  (keep)
       │
       ├─ compute duplicate_risk_score, relevancy_score, confidence_score
       │
       └─ AnalysisResult (extended)
                 │
                 ├─ persist relevancy_results + matched_projects
                 ├─ duplicate_service.create_reports_from_matches()
                 └─ ollama_service (explanations only)
```

---

## 4. Files Affected

### 4.1 New files

| File | Purpose |
|------|---------|
| `backend/app/ai/semantic_embeddings.py` | Extend: `SEMANTIC_FIELDS`, `build_semantic_analysis_text()`, `semantic_similarity_percent()`, `encode_corpus_batch()` |
| `backend/scripts/apply_relevancy_v2_migration.py` | Idempotent ADD COLUMN |
| `backend/scripts/backfill_relevancy_v2.py` | Re-analyze all projects (optional) |
| `backend/tests/test_semantic_embeddings.py` | Mocked ST tests |
| `backend/tests/test_relevancy_engine_v2.py` | V2 scoring + duplicate gate |
| `RELEVANCY_ENGINE_V2_GAP_ANALYSIS.md` | This audit (done) |

### 4.2 Modified files

| File | Changes |
|------|---------|
| `app/ai/relevancy_engine.py` | V2 branch, extended `AnalysisResult`, `build_semantic_analysis_text` import |
| `app/ai/embeddings.py` | No TF-IDF logic change; reuse `cosine_similarity` |
| `app/ai/semantic_embeddings.py` | Production helpers + optional local model path |
| `app/ai/ollama_service.py` | Prompt: label duplicate_risk_score / relevancy_score (no LLM scoring) |
| `app/config/settings.py` | `semantic_similarity_threshold`, `relevancy_engine_hybrid_enabled` |
| `app/models/relevancy.py` | `semantic_score`, `duplicate_risk_score`, `engine_version` |
| `app/models/relevancy.py` (`MatchedProject`) | `semantic_score`, `duplicate_risk_score` |
| `app/models/duplicate_report.py` | `semantic_score`, `duplicate_risk_score` |
| `app/services/project_service.py` | Persist, thread offload, response mapping |
| `app/services/duplicate_service.py` | Semantic gate, new columns |
| `app/schemas/project.py` | Optional response fields |
| `app/schemas/admin.py` | `DuplicateAlertItem` extensions |
| `backend/requirements.txt` | Already includes torch + ST |
| `backend/tests/test_relevancy_engine.py` | V1 regression with flag off |

### 4.3 Explicitly not modified (per project constraints)

- Authentication, notifications, review workflow routes  
- Proposal form frontend components  
- Ollama scoring logic (prompt context only)  

---

## 5. Database Migration

### 5.1 Columns (additive, nullable)

```sql
-- relevancy_results
ALTER TABLE relevancy_results ADD COLUMN IF NOT EXISTS semantic_score DOUBLE PRECISION;
ALTER TABLE relevancy_results ADD COLUMN IF NOT EXISTS duplicate_risk_score DOUBLE PRECISION;
ALTER TABLE relevancy_results ADD COLUMN IF NOT EXISTS engine_version VARCHAR(10);

-- matched_projects
ALTER TABLE matched_projects ADD COLUMN IF NOT EXISTS semantic_score DOUBLE PRECISION;
ALTER TABLE matched_projects ADD COLUMN IF NOT EXISTS duplicate_risk_score DOUBLE PRECISION;

-- duplicate_reports
ALTER TABLE duplicate_reports ADD COLUMN IF NOT EXISTS semantic_score DOUBLE PRECISION;
ALTER TABLE duplicate_reports ADD COLUMN IF NOT EXISTS duplicate_risk_score DOUBLE PRECISION;
```

### 5.2 Column mapping (V2 enabled)

| Legacy column | V2 content |
|---------------|------------|
| `overall_score` | **relevancy_score** |
| `similarity_score` | TF-IDF max (hybrid) or semantic max (semantic-only mode — document in viva) |
| `ai_confidence` | **confidence_score** |
| `duplicate_risk_score` | **new** — primary duplicate signal |
| `semantic_score` | **new** — max semantic similarity |

### 5.3 Migration strategy

| Phase | Action |
|-------|--------|
| A | Run `apply_relevancy_v2_migration.py` on staging/prod |
| B | Deploy code with `RELEVANCY_ENGINE_V2_ENABLED=false` |
| C | Download model; verify offline script |
| D | Enable V2 on staging; run backfill |
| E | Enable V2 in production after viva rehearsal |

**Rollback:** set flag false; nullable columns ignored.

---

## 6. API Changes (Additive)

### 6.1 `GET /projects/{id}/relevancy`

Extend `RelevancyResultResponse`:

```json
{
  "overall_score": 72.5,
  "duplicate_risk_score": 41.2,
  "confidence_score": 78.0,
  "semantic_score": 41.2,
  "engine_version": "v2",
  "matched_projects": [
    {
      "similarity": 38.5,
      "semantic_score": 41.2,
      "duplicate_risk_score": 41.2
    }
  ]
}
```

Existing clients ignore new fields.

### 6.2 Review queue / admin duplicates

Add optional camelCase fields: `duplicateRiskScore`, `semanticScore`, `confidenceScore`.

---

## 7. Implementation Phases

| Phase | Deliverable | Days |
|-------|-------------|------|
| **0** | Model cache + HF token; offline verify | 0.5 |
| **1** | Extend `semantic_embeddings.py` + unit tests | 1.5 |
| **2** | `relevancy_engine.py` V2 scoring + V1 fallback | 2 |
| **3** | DB migration + ORM + `project_service` persistence | 1 |
| **4** | `duplicate_service` semantic gate | 0.5 |
| **5** | Schema/API additive fields + Ollama prompt labels | 0.5 |
| **6** | Integration tests + backfill script | 1 |
| **7** | Viva demo data + documentation update | 0.5 |

**Total:** **7–8 developer days** (backend only)

---

## 8. Effort Estimate

| Role | Effort |
|------|--------|
| Backend implementation | 7–8 days |
| Frontend score labels (optional) | 1–2 days |
| Viva rehearsal + model cache setup | 0.5 day |
| **Total to demo-ready** | **~8–10 days** |

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| HF model unavailable | Medium | High | Pre-cache; local `models/all-MiniLM-L6-v2`; HF_TOKEN |
| Slow submission on CPU | Medium | Medium | `asyncio.to_thread`, batch encode, warm model on startup |
| Score drift vs V1 demo data | High | Medium | Feature flag; side-by-side logging; viva script with paraphrase example |
| DB migration rejected | Low | High | Scoped AI tables only; document in gap analysis |
| basedpyright / typing on numpy | Low | Low | Type ignores only in semantic module if needed |
| Ollama regen on backfill | Medium | Low | Skip explanation if `why_relevant` exists |

---

## 10. Migration Impact

| Area | Impact |
|------|--------|
| Existing relevancy rows | NULL new columns until backfill or re-submit |
| `project.relevancy_score` | **Will change** when V2 enabled (new formula) |
| Duplicate alerts | Different pairs possible (semantic vs TF-IDF) |
| Frontend | Works unchanged; optional UI for new scores |
| Tests | 10 V1 tests must pass with flag off; +8–12 V2 tests |
| Performance | +1–15 s CPU per analysis (corpus size dependent) |

---

## 11. Testing Plan

| Test | Assert |
|------|--------|
| Paraphrase vs corpus | Semantic similarity > TF-IDF when wording differs |
| Unrelated projects | duplicate_risk_score < 40 |
| Empty semantic fields | Low confidence; no crash |
| V2 off | Bit-identical to current `test_relevancy_engine.py` |
| Duplicate gate | Semantic ≥ threshold flags pair even if TF-IDF < threshold |
| API | New fields present when V2 on; absent/null when V2 off |
| Offline model | Analysis works with `local_files_only=True` |

---

## 12. Viva Defense Talking Points

1. **Two-layer AI:** lexical TF-IDF (baseline) + transformer semantics (V2)  
2. **Model:** `all-MiniLM-L6-v2` — 384-dim, CPU-friendly, industry-standard for short text  
3. **Three outputs:** relevancy (quality), duplicate risk (overlap), confidence (trust)  
4. **Ollama:** explanations only — no LLM scoring (auditable numeric pipeline)  
5. **Feature flag:** safe rollback to V1  
6. **Live demo:** submit paraphrased proposal → higher semantic duplicate risk than unrelated topic  

---

## 13. Configuration (`.env`)

```env
RELEVANCY_ENGINE_V2_ENABLED=false
SENTENCE_TRANSFORMER_MODEL=sentence-transformers/all-MiniLM-L6-v2
SENTENCE_TRANSFORMER_DEVICE=cpu
SEMANTIC_SIMILARITY_THRESHOLD=50.0
DUPLICATE_SIMILARITY_THRESHOLD=50.0
RELEVANCY_ENGINE_HYBRID_ENABLED=true
HF_TOKEN=hf_xxxxxxxx
```

---

## 14. Pre-Implementation Gates

| Gate | Status (audit date) |
|------|---------------------|
| Gap analysis | **Complete** |
| `sentence-transformers` installed | **Yes** |
| Model cached offline | **No** — run download script |
| `semantic_embeddings.py` production helpers | **No** |
| DB migration approved | **Pending** |
| Implementation | **Not started** (this plan only) |

---

## 15. Decision Log

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | Semantic-only vs hybrid | **Hybrid** for viva (semantic primary, TF-IDF retained) |
| 2 | Duplicate gate | **Semantic similarity** threshold |
| 3 | Map relevancy score | **`overall_score`** column (no rename) |
| 4 | Map confidence | **`ai_confidence`** column (no rename) |
| 5 | New duplicate column | **`duplicate_risk_score`** on relevancy + reports |
| 6 | Block event loop | **`asyncio.to_thread`** in `run_relevancy_analysis` |

---

*Implementation must not begin until model cache and DB migration are approved. See `RELEVANCY_ENGINE_V2_GAP_ANALYSIS.md` for current-state details.*
