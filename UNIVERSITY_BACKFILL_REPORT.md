# University Proposals Backfill Report

**Date:** 23 June 2026  
**Script:** `backend/scripts/backfill_university_proposals.py`  
**Scope:** Project IDs **31–40** (imported university proposals)  
**AI logic modified:** None — reused existing `run_relevancy_analysis()` pipeline

---

## Executive Summary

| Metric | Value |
|--------|------:|
| Projects targeted | **10** |
| Processed | **10** |
| Success | **10** |
| Failed | **0** |
| Skipped (re-run) | **10/10** — idempotent ✅ |
| Duplicate reports created (this run) | **4** |
| Duplicate reports involving university IDs (after) | **5** |
| Run duration | ~46 seconds |
| Ollama explanations | **10/10 fallback** (Ollama not running) |

**Result:** All university proposals now have `relevancy_results` rows. CareerCraft (#38) ↔ Qaiser (#40) duplicate pair detected at **52.69%** (LOW risk).

---

## Relevancy Pipeline Audit (Read-Only)

### 1. Function that creates `relevancy_results`

**Location:** `backend/app/services/project_service.py` — inside `run_relevancy_analysis()`

```521:533:backend/app/services/project_service.py
    relevancy = RelevancyResult(
        project_id=project.id,
        overall_score=analysis.overall_score,
        novelty_score=analysis.novelty_score,
        feasibility_score=analysis.feasibility_score,
        market_relevance=analysis.market_relevance,
        innovation_score=analysis.innovation_score,
        similarity_score=analysis.similarity_score,
        ai_confidence=analysis.ai_confidence,
        summary=analysis.summary,
    )
    db.add(relevancy)
    await db.flush()
```

Also creates `MatchedProject` rows, calls `duplicate_service.create_reports_from_matches()`, and `_apply_explanation_to_relevancy()` for Ollama/fallback text.

### 2. `run_relevancy_analysis()`

**Location:** `backend/app/services/project_service.py` (line 496)

**Flow:**
1. Load corpus (all other `project_ideas`, optional limit from settings)
2. `_to_relevancy_analysis_dict()` for query + corpus
3. `RelevancyEngine.analyze()` — V1 BOW cosine + heuristics
4. Persist `RelevancyResult` + `MatchedProject` rows
5. `duplicate_service.create_reports_from_matches()` — threshold 50%
6. `generate_relevancy_explanation()` via Ollama or fallback
7. Return `RelevancyResult`

**API triggers (unchanged):**
- `POST /api/v1/projects`
- `GET /api/v1/projects/{id}/relevancy` (if no result)
- `PATCH /api/v1/projects/{id}` (if proposal fields changed)

### 3. Existing backfill scripts

| Script | Target | Filter |
|--------|--------|--------|
| `backend/scripts/backfill_eval_relevancy.py` | Eval corpus | `title LIKE '[EVAL-%'` |
| `backend/scripts/backfill_university_proposals.py` | **New** | IDs **31–40** |

Both call `run_relevancy_analysis()` — no AI logic duplication.

---

## Backfill Execution

### Command

```powershell
cd backend
.\venv\Scripts\activate
python -m scripts.backfill_university_proposals
```

### Run output summary

| ID | Title (short) | Overall | Similarity | Matches | Explanation |
|----|---------------|--------:|-----------:|--------:|:-----------:|
| 31 | Classroom noise + lecture notes | 69.71 | 36.96 | 0 | fallback |
| 32 | Smart relocation / property | 77.34 | 24.86 | 0 | fallback |
| 33 | Retinal disease detection | 70.85 | 39.48 | 0 | fallback |
| 34 | IHIS health system | 71.50 | 44.49 | 0 | fallback |
| 35 | Can I Resell This? | 77.03 | 36.71 | 0 | fallback |
| 36 | AI tuition recommendation | 67.57 | 51.82 | 3 | fallback |
| 37 | ScholarIQ scholarships | 60.04 | 45.82 | 0 | fallback |
| 38 | CareerCraft interview/resume | 63.63 | 52.69 | 1 | fallback |
| 39 | CipherPlay children's fitness | 53.61 | 64.05 | 1 | fallback |
| 40 | Qaiser career coaching | 56.68 | 52.69 | 1 | fallback |

### Summary statistics

| Metric | Value |
|--------|------:|
| Total processed | 10 |
| Success | 10 |
| Failed | 0 |
| Duplicate reports before | 1 |
| Duplicate reports after | 5 |
| **Duplicate reports created** | **4** |

---

## Post-Backfill Verification

### Relevancy results (IDs 31–40)

| ID | `relevancy_results` row | Verified |
|----|:-----------------------:|:--------:|
| 31 | ✅ score=69.71 | ✅ |
| 32 | ✅ score=77.34 | ✅ |
| 33 | ✅ score=70.85 | ✅ |
| 34 | ✅ score=71.50 | ✅ |
| 35 | ✅ score=77.03 | ✅ |
| 36 | ✅ score=67.57 | ✅ |
| 37 | ✅ score=60.04 | ✅ |
| 38 | ✅ score=63.63 | ✅ |
| 39 | ✅ score=53.61 | ✅ |
| 40 | ✅ score=56.68 | ✅ |

**Coverage: 10/10 (100%)**

### Duplicate reports involving university IDs

| Project 1 | Project 2 | Similarity | Risk | Source |
|-----------|-----------|----------:|:----:|--------|
| #39 CipherPlay | #41 Scavenger Hunt | **64.05%** | MEDIUM | Pre-existing + confirmed |
| **#38 CareerCraft** | **#40 Qaiser career coaching** | **52.69%** | LOW | **New — key viva pair** |
| #21 EVAL-P1A | #36 AI Tuition | 51.82% | LOW | New |
| #3 Legacy relevancy | #36 AI Tuition | 50.39% | LOW | New |
| #6 Legacy relevancy | #36 AI Tuition | 50.39% | LOW | New |

**4 new duplicate reports** created during backfill (5 total involving university IDs).

### Idempotency check (second run)

```
Skipped (already analyzed): 10
Processed: 0
Duplicate reports created: 0
```

✅ Safe to run multiple times.

---

## Notable Findings

### CareerCraft (#38) vs Qaiser (#40)

| Metric | Value |
|--------|------:|
| Cross similarity | **52.69%** |
| Duplicate report | **Yes** (LOW risk) |
| Prior file audit estimate | ~67% |

V1 BOW engine scored this pair at **52.69%** — above the 50% threshold but below the prior manual audit estimate. Both projects flagged as related career-coaching domain.

### Highest-risk university project

**ID 39 (CipherPlay)** — lowest overall score (**53.61**), highest similarity (**64.05%**) vs ID 41 (Scavenger Hunt). MEDIUM duplicate risk.

### Highest overall score among university proposals

**ID 32 (Smart Relocation)** — **77.34** overall, **24.86%** max similarity (most novel in batch).

---

## Ollama Status

All 10 explanations used **fallback** text:

```
Ollama explanation failed, using fallback: All connection attempts failed
```

Scoring was unaffected. To get live Ollama explanations: start `ollama serve`, then run `--force` or open relevancy GET per project.

---

## Script Usage

```powershell
# Standard backfill (skip already analyzed)
python -m scripts.backfill_university_proposals

# Preview targets without running
python -m scripts.backfill_university_proposals --dry-run

# Re-analyze all 10 (e.g. after starting Ollama)
python -m scripts.backfill_university_proposals --force
```

---

## Viva Demo Impact

| Before backfill | After backfill |
|-----------------|----------------|
| University relevancy 0/10 | **10/10** ✅ |
| CareerCraft ↔ Qaiser in DB | **Yes** (52.69%) ✅ |
| University duplicate reports | 1 passive → **5 active** ✅ |
| Relevancy page for IDs 31–40 | Empty / slow first load → **Instant** ✅ |

---

## Files Created

| File | Purpose |
|------|---------|
| `backend/scripts/backfill_university_proposals.py` | Backfill script |
| `UNIVERSITY_BACKFILL_REPORT.md` | This report |

**Not modified:** AI engine, frontend, database schema, existing backfill scripts.

---

*Backfill completed 23 June 2026. All university proposals (IDs 31–40) are now AI-analyzed.*
