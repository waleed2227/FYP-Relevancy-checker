# Ollama Readiness Report

**Date:** 23 June 2026  
**Scope:** `backend/app/ai/ollama_service.py`, explanation pipeline, API endpoints  
**Code modified:** None (audit only)

---

## Executive Summary

| Check | Status |
|-------|:------:|
| Ollama application installed | ❌ **Not found on PATH** |
| Ollama API reachable | ❌ `localhost:11434` timeout |
| Backend `.env` configured | ✅ Correct |
| Expected model `llama3.2` | ⚠️ Cannot verify — Ollama not installed |
| Explanation code path | ✅ Implemented |
| Live `generated` explanations in DB | ❌ **0** (31 fallback system-wide) |

**Verdict:** Backend is **configured for Ollama** but the **Ollama runtime is not installed** on this machine. All explanations use rule-based fallback.

---

## 1. Code Audit: `ollama_service.py`

**Location:** `backend/app/ai/ollama_service.py`

### Responsibilities

| Function | Purpose |
|----------|---------|
| `build_explanation_prompt()` | Builds JSON prompt from proposal fields + pre-computed scores |
| `generate_relevancy_explanation()` | Calls Ollama or returns fallback |
| `build_fallback_explanation()` | Rule-based text when Ollama unavailable |
| `_parse_explanation_json()` | Parses Ollama JSON response |

### Critical design constraint

Prompt explicitly instructs: *"do NOT recalculate or invent new similarity percentages"*. Ollama **never affects scoring**.

### Ollama HTTP call

```
POST {OLLAMA_BASE_URL}/api/generate
Body: { model, prompt, stream: false, format: "json" }
```

### Fallback trigger conditions

1. `OLLAMA_ENABLED=false`
2. HTTP connection failure
3. Timeout (default 120s)
4. Unparseable JSON response

On failure: logs warning, returns `status: "fallback"`.

---

## 2. Explanation Generation Pipeline

```
GET /projects/{id}/relevancy  OR  run_relevancy_analysis()
       ↓
ensure_relevancy_explanation()  [if why_relevant empty]
       OR
_apply_explanation_to_relevancy()  [during analysis]
       ↓
generate_relevancy_explanation(project_dict, scores, matched)
       ↓
Persist to relevancy_results:
  why_relevant, similar_projects_summary, objectives_overlap,
  problem_domains_overlap, unique_aspects, novelty_suggestions,
  explanation_status, ollama_model
```

**Score fields are read-only** in this path — only explanation columns are written.

---

## 3. Explanation API Endpoints

| Method | Path | Ollama involvement |
|--------|------|-------------------|
| `GET` | `/api/v1/projects/{id}/relevancy` | Calls `ensure_relevancy_explanation()` if `why_relevant` empty |
| `POST` | `/api/v1/projects` | Full analysis + explanation via `run_relevancy_analysis()` |
| `PATCH` | `/api/v1/projects/{id}` | Re-analysis if fields change |

No dedicated `/explain` endpoint — explanations are embedded in relevancy response under `explanation` object (`RelevancyExplanation` schema).

Review queue and professor views receive explanation via `_relevancy_explanation_from_result()` in `ReviewQueueItem.aiExplanation`.

---

## 4. Environment Configuration

From `backend/.env` (verified):

| Variable | Value | Status |
|----------|-------|:------:|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | ✅ Standard |
| `OLLAMA_MODEL` | `llama3.2` | ✅ Matches requirement |
| `OLLAMA_ENABLED` | `true` | ✅ Enabled |
| `OLLAMA_TIMEOUT_SECONDS` | `120` | ✅ |

Configuration is **correct**. Runtime is **missing**.

---

## 5. Runtime Verification

| Command / check | Result |
|-----------------|--------|
| `ollama --version` | **Command not found** |
| `%LOCALAPPDATA%\Programs\Ollama\ollama.exe` | **Not present** |
| `C:\Program Files\Ollama\ollama.exe` | **Not present** |
| `GET http://localhost:11434/api/tags` | **Connection timeout** |

---

## 6. Database Explanation State

| Metric | Value |
|--------|------:|
| Total `relevancy_results` | 39 |
| `explanation_status = generated` | **0** |
| `explanation_status = fallback` | **31** |
| Empty `why_relevant` | **8** (legacy IDs 3–10) |
| University (31–40) fallback | **10/10** |
| University (31–40) generated | **0/10** |

---

## 7. Configuration Steps Required

Install Ollama manually (automated install was not executed):

```powershell
# Option A: Download installer
# https://ollama.com/download/windows

# Option B: winget
winget install Ollama.Ollama

# After install:
ollama serve
ollama pull llama3.2
ollama list
```

Verify:

```powershell
curl http://localhost:11434/api/tags
```

Then regenerate explanations (scores unchanged):

```powershell
cd backend
.\venv\Scripts\activate
python -m scripts.backfill_university_ollama_explanations --force
```

---

## 8. Script Created for Explanation Backfill

**File:** `backend/scripts/backfill_university_ollama_explanations.py`

- Targets IDs 31–40 only
- Calls `_apply_explanation_to_relevancy()` — **does not re-run scoring**
- Supports `--force` to replace fallback explanations
- Idempotent when `explanation_status = generated`

---

## Related Documents

- `OLLAMA_VERIFICATION_REPORT.md`
- `UNIVERSITY_OLLAMA_BACKFILL_REPORT.md`
- `AI_ENGINE_AUDIT.md`

---

*Read-only audit. Ollama installation required on host machine.*
