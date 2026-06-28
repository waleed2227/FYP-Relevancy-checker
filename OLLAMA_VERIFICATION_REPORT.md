# Ollama Verification Report

**Date:** 23 June 2026  
**Required model:** `llama3.2`  
**Verification type:** Runtime + configuration check

---

## Verification Results

| Step | Command / check | Expected | Actual | Pass |
|------|-----------------|----------|--------|:----:|
| 1 | `ollama --version` | Version string | **Command not found** | ❌ |
| 2 | `ollama serve` | Server on :11434 | **Not runnable** — not installed | ❌ |
| 3 | `ollama list` | Model list | **Not runnable** | ❌ |
| 4 | `ollama pull llama3.2` | Model downloaded | **Not executed** | ❌ |
| 5 | `GET localhost:11434/api/tags` | HTTP 200 + models | **Timeout** | ❌ |
| 6 | Backend `OLLAMA_MODEL` | `llama3.2` | `llama3.2` | ✅ |
| 7 | Backend `OLLAMA_ENABLED` | `true` | `true` | ✅ |
| 8 | Test prompt via API | JSON explanation | **Not tested** — no Ollama | ❌ |

**Overall: FAILED** — Ollama runtime not available on this machine.

---

## Backend Configuration (Verified ✅)

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_ENABLED=true
OLLAMA_TIMEOUT_SECONDS=120
```

These settings match `backend/.env.example` and are correct for local development.

---

## Fallback Behavior Verified ✅

When Ollama is unreachable, `generate_relevancy_explanation()`:

1. Logs: `Ollama explanation failed, using fallback: All connection attempts failed`
2. Returns `status: "fallback"`
3. Populates all explanation text fields from `build_fallback_explanation()`
4. **Does not change** `overall_score`, `similarity_score`, or other scoring fields

Observed during university relevancy backfill (~10 consecutive fallback warnings).

---

## Prompt Test Status

| Test | Status |
|------|:------:|
| Live Ollama JSON prompt | ❌ Not executed |
| Fallback prompt path | ✅ Verified in production backfill |
| JSON schema in prompt | ✅ Defined in `EXPLANATION_PROMPT_TEMPLATE` |
| Score injection in prompt | ✅ Pre-computed scores passed verbatim |

---

## Manual Verification Checklist (Post-Install)

After installing Ollama, run these steps and re-run this verification:

```powershell
# Terminal 1
ollama serve

# Terminal 2
ollama pull llama3.2
ollama list
# Expected: llama3.2 in list

# Test generate
ollama run llama3.2 "Reply with JSON: {\"test\": \"ok\"}"

# Backend test
cd backend
.\venv\Scripts\activate
python -m scripts.backfill_university_ollama_explanations --force
# Expected: status=generated for IDs 31-40
```

Verify in database:

```sql
SELECT project_id, explanation_status, ollama_model
FROM relevancy_results
WHERE project_id BETWEEN 31 AND 40;
-- Expected: explanation_status = 'generated', ollama_model = 'llama3.2'
```

---

## Conclusion

| Area | Status |
|------|:------:|
| Backend config | ✅ Ready |
| Ollama install | ❌ Missing |
| Model `llama3.2` | ❌ Not pulled |
| Live explanations | ❌ 0 in database |
| Fallback path | ✅ Working |

**Next action:** Install Ollama from https://ollama.com/download, pull `llama3.2`, run explanation backfill script.

---

*Verification performed 23 June 2026. No Ollama binary found on system PATH.*
