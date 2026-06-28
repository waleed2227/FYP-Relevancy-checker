# AI V2 Roadmap

**Project:** AI-Based FYP Relevancy System  
**Document type:** Implementation roadmap only  
**Date:** 23 June 2026  
**Status:** **Not implemented** — planning document  
**Companion:** `RELEVANCY_ENGINE_V2_IMPLEMENTATION_PLAN.md`, `AI_ENGINE_AUDIT.md`

---

## 1. Current State (V1 Production)

| Component | Status |
|-----------|--------|
| Scoring | V1 BOW cosine + heuristics |
| Duplicate detection | V1 similarity ≥ 50% |
| Ollama | Explanations only |
| `semantic_embeddings.py` | Dormant skeleton |
| `RELEVANCY_ENGINE_V2_ENABLED` | `false` |
| ST model cached | No |

---

## 2. V2 Goals

1. **Sentence Transformer integration** — semantic similarity via `all-MiniLM-L6-v2`
2. **Semantic duplicate detection** — catch paraphrase pairs V1 misses (e.g. CareerCraft ↔ Qaiser)
3. **Hybrid scoring** — optional blend of V1 lexical + V2 semantic
4. **Persist V2 metrics** — `semantic_score`, `duplicate_risk_score`, `engine_version`

**Ollama remains explanation-only** — no LLM scoring.

---

## 3. Sentence Transformer Integration Plan

### Phase 1: Prerequisites (1–2 days)

| Task | File(s) |
|------|---------|
| Cache model offline | `scripts/download_sentence_transformer.py` |
| Extend `semantic_embeddings.py` | Add `build_semantic_analysis_text()`, `encode_texts()`, `semantic_similarity_percent()` |
| Set `HF_TOKEN` if needed | `.env` — avoid HF 429 rate limits |
| Unit tests (mocked ST) | `tests/test_semantic_embeddings.py` |

### Phase 2: Engine integration (2–3 days)

| Task | File(s) |
|------|---------|
| V2 branch in `RelevancyEngine.analyze()` | `relevancy_engine.py` |
| Hybrid mode flag | `settings.py` — `RELEVANCY_HYBRID_MODE` |
| Extended `AnalysisResult` | `relevancy_engine.py` |
| Thread offload for CPU encode | `project_service.py` — `asyncio.to_thread()` |

### Semantic input fields (8)

`title`, `description`, `problem_statement`, `proposed_solution`, `unique_features`, `innovation_aspect`, `target_users`, `target_industry`

---

## 4. Semantic Duplicate Detection Plan

### Current (V1)

```
RelevancyEngine → matched[] (BOW similarity)
       ↓
duplicate_service.create_reports_from_matches(threshold=50%)
```

### V2

```
RelevancyEngine → matched[] with semantic_similarity per pair
       ↓
duplicate_service:
  - Primary gate: semantic_similarity >= semantic_similarity_threshold (default 50)
  - Optional: require BOTH V1 and V2 above threshold (strict mode)
       ↓
Persist duplicate_risk_score on MatchedProject + DuplicateReport
```

### Expected improvements

| Pair | V1 score | V2 expected |
|------|----------|-------------|
| CareerCraft (#38) ↔ Qaiser (#40) | 52.69% | ~60–70% (closer to file audit) |
| Eval P4A ↔ P4B | 49.79% (miss) | Likely ≥ 50% |
| Eval P1A ↔ P1B | Not cross-matched | Semantic match expected |

---

## 5. Hybrid Scoring Plan

When `RELEVANCY_ENGINE_V2_ENABLED=true` and `RELEVANCY_HYBRID_MODE=true`:

```text
lexical_score  = V1 overall_score (existing)
semantic_score = V2 semantic relevancy (distinctiveness-weighted)
overall_score  = 0.4 × lexical_score + 0.6 × semantic_score   # tunable
duplicate_risk = max(semantic_similarity corpus)
similarity_score (API) = duplicate_risk for backward compat OR expose both
```

When V2 only (hybrid off):

```text
overall_score      = semantic_relevancy_score
duplicate_risk     = max semantic similarity
similarity_score   = duplicate_risk
```

**Rollback:** Set `RELEVANCY_ENGINE_V2_ENABLED=false` — instant V1-only path unchanged.

---

## 6. Database Migration Plan

New columns on `relevancy_results`:

| Column | Type | Purpose |
|--------|------|---------|
| `semantic_score` | Float nullable | V2 relevancy component |
| `duplicate_risk_score` | Float nullable | Max semantic overlap |
| `engine_version` | String(10) | `v1` / `v2` / `hybrid` |

Optional on `matched_projects` / `duplicate_reports`:

| Column | Purpose |
|--------|---------|
| `semantic_similarity` | Per-pair semantic % |

Migration script: `scripts/apply_relevancy_v2_migration.py` (idempotent).

---

## 7. API & Frontend (Additive)

| Change | Type |
|--------|------|
| `RelevancyResultResponse.semantic_score` | Optional new field |
| `RelevancyResultResponse.engine_version` | Optional new field |
| UI label: "Semantic overlap" | Display only |
| No breaking changes to existing fields | Backward compatible |

---

## 8. Testing Plan

| Test | Purpose |
|------|---------|
| V1 regression (flag off) | No behavior change |
| Eval paraphrase pairs (5) | ≥ 3/5 detected at 50% |
| CareerCraft ↔ Qaiser | Above 50% semantic |
| Unrelated pairs (U01–U05) | Below 40% semantic |
| Performance | 40-project corpus < 30s on CPU |

---

## 9. Risks

| Risk | Likelihood | Mitigation |
|------|:----------:|------------|
| HF model download 429 | High | `HF_TOKEN`, offline cache script |
| CPU inference slow | Medium | `asyncio.to_thread`, batch encode |
| Score drift vs V1 viva narrative | Medium | Hybrid mode, document both scores |
| False positives on broad domains | Medium | Tunable threshold, professor review |
| Scope creep | High | Phase gates; Ollama stays explanation-only |
| Disk space (torch + model) | Low | CPU-only torch wheel (~123 MB) |

---

## 10. Estimated Effort

| Phase | Tasks | Effort |
|-------|-------|-------:|
| **Phase 1** | Model cache, semantic_embeddings helpers, tests | **2–3 days** |
| **Phase 2** | Engine V2 branch, hybrid scoring | **3–4 days** |
| **Phase 3** | DB migration, service persistence | **1–2 days** |
| **Phase 4** | Duplicate service semantic gate | **1 day** |
| **Phase 5** | Eval corpus re-backfill + report | **1 day** |
| **Phase 6** | API schema + optional UI labels | **1–2 days** |
| **Total** | | **9–13 days** |

Post-V2 optional: background job queue (+2–3 days), production hardening (+3–5 days).

---

## 11. Files to Modify (V2 Complete)

| File | Change |
|------|--------|
| `app/ai/semantic_embeddings.py` | Core ST helpers |
| `app/ai/relevancy_engine.py` | V2 scoring branch |
| `app/services/project_service.py` | Persist V2, thread offload |
| `app/services/duplicate_service.py` | Semantic threshold |
| `app/models/relevancy.py` | New columns |
| `app/config/settings.py` | V2 flags/thresholds |
| `app/schemas/project.py` | Optional response fields |
| `alembic/versions/` or apply script | Migration |
| `tests/test_relevancy_engine_v2.py` | New tests |

**Explicitly unchanged:** auth, notifications, review workflow, proposal forms, Ollama scoring.

---

## 12. Success Criteria

| Criterion | Target |
|-----------|--------|
| Eval paraphrase detection | ≥ 3/5 pairs at 50% |
| CareerCraft ↔ Qaiser | Flagged as duplicate |
| V1 rollback | Flag off = identical V1 scores |
| Offline viva demo | Model cached, no HF download |
| No LLM in scoring path | Ollama explanation-only unchanged |

---

*Roadmap only. No V2 code implemented in this phase.*
