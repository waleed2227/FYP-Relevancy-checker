# University Ollama Backfill Report

**Date:** 23 June 2026  
**Script:** `backend/scripts/backfill_university_ollama_explanations.py`  
**Target:** Project IDs **31–40**  
**Constraint:** Explanation fields only — **scores unchanged**

---

## Executive Summary

| Metric | Value |
|--------|------:|
| Script created | ✅ Yes |
| Script executed (full run) | ⚠️ **Partial / blocked** |
| Ollama available during run | ❌ No |
| University explanations in DB | **10/10** |
| `explanation_status = generated` | **0/10** |
| `explanation_status = fallback` | **10/10** |
| Scores unchanged | ✅ Verified in DB |

**Result:** Explanation **records exist** for all university proposals but all are **fallback text**, not live Ollama output. Real Ollama generation requires installing Ollama and re-running with `--force`.

---

## Script Design

**File:** `backend/scripts/backfill_university_proposals.py` (scoring) — separate  
**File:** `backend/scripts/backfill_university_ollama_explanations.py` (explanations only)

### Behavior

| Flag | Effect |
|------|--------|
| (default) | Skip projects with existing explanation (including fallback) |
| `--force` | Regenerate explanation via Ollama/fallback |
| `--dry-run` | List targets without writing |

### Pipeline (no scoring)

```
Load ProjectIdea + RelevancyResult + MatchedProject
       ↓
Build project_dict from _to_relevancy_analysis_dict()
Build scores from EXISTING rel.overall_score, similarity_score, etc.
       ↓
_apply_explanation_to_relevancy()  ← same as API path
       ↓
Verify overall_score unchanged
       ↓
Commit
```

---

## Execution Log

### Attempt 1: `--force` (partial)

```
University Ollama explanation backfill (IDs 31–40, scores unchanged)
  [RUN    ] id=31  generating explanation...
```

Run terminated with exit code 1 before completing remaining IDs (environment execution constraint).

### Current database state (verified post-attempt)

| ID | Overall score | `explanation_status` | `why_relevant` populated |
|----|:-------------:|:--------------------:|:------------------------:|
| 31 | 69.71 | fallback | ✅ |
| 32 | 77.34 | fallback | ✅ |
| 33 | 70.85 | fallback | ✅ |
| 34 | 71.50 | fallback | ✅ |
| 35 | 77.03 | fallback | ✅ |
| 36 | 67.57 | fallback | ✅ |
| 37 | 60.04 | fallback | ✅ |
| 38 | 63.63 | fallback | ✅ |
| 39 | 53.61 | fallback | ✅ |
| 40 | 56.68 | fallback | ✅ |

Scores match `UNIVERSITY_ANALYSIS_RESULTS.md` — **unchanged**.

Explanations were originally populated during `backfill_university_proposals.py` (relevancy backfill), which also calls `_apply_explanation_to_relevancy()` at the end of each analysis.

---

## Verification: Explanation Exists

| Check | Result |
|-------|:------:|
| DB `why_relevant` non-empty (31–40) | **10/10** ✅ |
| DB `similar_projects_summary` | Populated |
| DB `novelty_suggestions` | Populated (JSON) |
| `explanation_status` | All `fallback` |

---

## Verification: API Returns Explanation

| Test | Result |
|------|:------:|
| `GET /projects/31/relevancy` (student owner) | ❌ **HTTP 500** |
| `GET /projects/38/relevancy` (admin) | ❌ **HTTP 500** |

**Root cause (from server logs):** `MissingGreenlet` lazy-load on `project.professor.user` in `build_relevancy_result_response()` — route loads `professor` but not `professor.user`.

**Impact:** Explanation data **exists in DB** but relevancy API **currently fails** before returning JSON. This blocks UI display until eager-load is fixed in `get_relevancy` route (out of scope for this phase).

---

## Verification: UI Can Display Explanation

| Component | Status |
|-----------|:------:|
| `RelevancyExplanationPanel.tsx` | ✅ Implemented — renders when `explanation.why_relevant` present |
| `RelevancyResults.tsx` | ✅ Calls `GET /projects/{id}/relevancy` |
| End-to-end display | ❌ **Blocked by API 500** |

UI code is ready; API response path is broken for current async session configuration.

---

## Commands to Complete Ollama Backfill

```powershell
# 1. Install and start Ollama
ollama serve
ollama pull llama3.2

# 2. Regenerate explanations (scores unchanged)
cd backend
.\venv\Scripts\activate
python -m scripts.backfill_university_ollama_explanations --force

# 3. Verify
python -c "
# query explanation_status for 31-40 — expect 'generated'
"
```

---

## Summary

| Item | Status |
|------|:------:|
| Script created | ✅ |
| Explanations populated (fallback) | ✅ 10/10 |
| Real Ollama generated | ❌ 0/10 |
| Scores preserved | ✅ |
| API delivery | ❌ 500 error |
| UI component | ✅ Ready |

---

*Explanation backfill script created. Live Ollama generation pending Ollama installation + API lazy-load fix.*
