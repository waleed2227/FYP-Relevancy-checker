# AI Engine V2 Readiness Assessment

**Workflow:** Evaluation Corpus Deployment — Phase 8  
**Date:** June 2026  
**Context:** Post-deploy eval corpus (20 projects) + V1 backfill complete  
**Final recommendation:** **NOT READY** (implementation-ready, environment-blocked)

---

## Executive Summary

The evaluation corpus deployment **succeeded**. The project now has a **viva-grade labeled dataset** with full semantic fields and baseline V1 scores. However, **AI Engine V2 cannot be enabled yet** because the Sentence Transformer model is **not cached offline** and V2 **code integration is not implemented** (by design — planning phase only).

| Readiness area | Status |
|----------------|--------|
| Evaluation dataset | **Ready** |
| Proposal field quality | **Ready** |
| V1 baseline metrics | **Ready** |
| ST model cached | **Not ready** |
| V2 engine integrated | **Not ready** |
| DB V2 columns | **Not ready** |

---

## 1. Is Dataset Size Sufficient?

| Goal | Minimum | Current | Verdict |
|------|--------:|--------:|---------|
| V2 smoke test | 10–15 | **29 total / 20 eval** | **Ready** |
| Paraphrase eval | 5 pairs | **5 pairs labeled** | **Ready** |
| Near-dup calibration | 5 cluster | **5 healthcare (S01–S05)** | **Ready** |
| Unrelated controls | 5 | **5 (U01–U05)** | **Ready** |
| Production tuning | 40–60 | 29 | Partial |

**Answer:** **Yes** for V2 development, viva demo, and offline evaluation. Not yet at production-scale (40+).

---

## 2. Are Proposal Fields Populated Enough?

Eval corpus field completeness:

| Field set | Coverage |
|-----------|----------|
| V2 semantic (9 fields) | **20 / 20 (100%)** |
| Evaluation required fields | **20 / 20 (100%)** |
| Average semantic text length | ~900–1,400 chars (vs 94–264 on legacy sparse rows) |

Legacy 9 projects remain partially filled — eval corpus is isolated by `[EVAL-*` prefix for testing.

**Answer:** **Yes** — eval corpus is fully populated for semantic embedding input.

---

## 3. Is Semantic Testing Now Possible?

| Requirement | Status |
|-------------|--------|
| Rich text corpus | **Yes** — 20 complete proposals |
| Labeled paraphrase ground truth | **Yes** — 5 pairs in JSON |
| Baseline V1 scores for comparison | **Yes** — backfill complete |
| `sentence-transformers` installed | **Yes** (global Python 3.12) |
| `all-MiniLM-L6-v2` cached locally | **No** — HF 429 / empty cache |
| V2 scoring code wired | **No** — flag off, skeleton only |

**Answer:** **Partially** — dataset and labels are ready; **model cache and V2 integration** block live semantic testing.

### V1 baseline proves semantic need

| Metric | Result |
|--------|--------|
| Paraphrase pairs flagged by V1 | **1 / 5** (P3 only) |
| P4 missed duplicate threshold | 49.79% vs 50% cutoff |
| P1B not matched to P1A | Max sim 40% vs expected 75%+ semantic |

This gap is the **primary viva justification** for V2.

---

## 4. Ready For…

### Sentence Transformers

| Gate | Ready? |
|------|:------:|
| Python package | Yes |
| Eval corpus text | Yes |
| Offline model files | **No** |
| `semantic_embeddings.py` production helpers | **No** |

**Verdict:** **NOT READY** until model download succeeds.

**Action:** `HF_TOKEN` + `python -m scripts.download_sentence_transformer`

---

### Hybrid Similarity (70% semantic + 20% TF-IDF + 10% heuristic)

| Gate | Ready? |
|------|:------:|
| TF-IDF baseline on eval corpus | Yes |
| Semantic layer | No |
| Feature flag | Exists (`RELEVANCY_ENGINE_V2_ENABLED=false`) |
| Implementation plan | Yes (`RELEVANCY_ENGINE_V2_IMPLEMENTATION_PLAN.md`) |

**Verdict:** **NOT READY** — plan approved, implementation not started.

---

### Semantic Duplicate Detection

| Gate | Ready? |
|------|:------:|
| Labeled duplicate pairs | Yes (5 paraphrase + 3 legacy overlap) |
| V1 duplicate reports baseline | Yes (4 total, 3 eval-related) |
| Semantic similarity function | **No** |
| `duplicate_risk_score` DB column | **No** |

**Verdict:** **NOT READY** — dataset ready; engine and schema pending.

---

## 5. Environment Blockers

From `ENVIRONMENT_DIAGNOSTIC_REPORT.md` and prior audits:

| Blocker | Impact |
|---------|--------|
| Model not cached | Cannot run offline viva demo |
| No project `.venv` | IDE warnings only; packages installed globally |
| Ollama offline | Explanations use fallback (non-blocking for V2) |

---

## 6. Implementation Checklist (Post-Readiness)

When proceeding to V2 (not in this workflow):

- [ ] Download and verify `all-MiniLM-L6-v2`
- [ ] Run scoped DB migration (`semantic_score`, `duplicate_risk_score`)
- [ ] Extend `semantic_embeddings.py` (no auth/API changes)
- [ ] Integrate V2 branch in `relevancy_engine.py` behind flag
- [ ] Re-run `python -m scripts.backfill_eval_relevancy --force`
- [ ] Validate paraphrase recall ≥ 4/5 at 50% semantic threshold

---

## 7. Final Recommendation

### **NOT READY** for AI Engine V2 go-live

### Justification

1. **Dataset and labels:** **READY** — deployment workflow completed successfully.
2. **V1 baseline:** **READY** — demonstrates TF-IDF paraphrase gap (1/5 pairs).
3. **Sentence Transformer runtime:** **NOT READY** — model not cached.
4. **V2 code integration:** **NOT READY** — intentionally not implemented per project plan.
5. **Database V2 schema:** **NOT READY** — migration pending approval.

### Path to **READY**

| Step | Effort | Unblocks |
|------|--------|----------|
| Cache ST model | 0.5 day | Offline inference |
| Implement V2 per plan | 7–8 days | Semantic scoring |
| DB migration | 0.5 day | Persist V2 scores |
| Re-backfill eval corpus | 1 hour | V2 metrics report |

**Estimated time to READY:** ~8–9 developer days after explicit go-ahead.

---

## 8. What This Deployment Achieved

| Deliverable | Status |
|-------------|--------|
| 20 eval projects in DB | Done |
| Legacy data preserved | Done |
| 20/20 relevancy analyses | Done |
| Labeled test matrix | Done |
| V1 baseline for V2 comparison | Done |
| V2 implementation | **Not started** (correct) |

The project is **prepared and validated** for V2 implementation. It is **not yet ready to enable V2 in production**.

---

*Assessment based on post-deploy database state and V1 backfill results. No V2 code was implemented in this workflow.*
