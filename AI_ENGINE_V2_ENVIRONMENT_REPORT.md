# AI Engine V2 — Environment Prerequisites Report

**Project:** AI-Based FYP Relevancy System  
**Document type:** Environment setup report (prerequisites only)  
**Date:** June 2026  
**Scope:** Dependencies, settings, semantic module skeleton, model download utility — **no scoring, API, DB, or engine integration**

---

## Executive Summary

AI Engine V2 **prerequisites** are in place:

| Item | Status |
|------|--------|
| `requirements.txt` updated (`torch`, `sentence-transformers`) | **Done** |
| Settings + feature flag (`RELEVANCY_ENGINE_V2_ENABLED=false`) | **Done** |
| `semantic_embeddings.py` skeleton (lazy singleton) | **Done** |
| `scripts/download_sentence_transformer.py` | **Done** |
| Unit tests (feature flag / no model load when disabled) | **13 passed** |
| Model download + offline verification (this machine) | **Pending** — Hugging Face HTTP 429 |

Scoring, duplicate detection, APIs, and database schema were **not modified**.

---

## 1. Dependencies Added

### 1.1 `backend/requirements.txt`

```text
# AI relevancy V2 prerequisites (semantic embeddings — not wired to scoring yet)
# Python 3.12 compatible. On Windows CPU-only: pip install torch --index-url https://download.pytorch.org/whl/cpu
torch>=2.2.0,<3
sentence-transformers>=3.3.0,<6
```

| Package | Constraint | Python 3.12 | Notes |
|---------|------------|---------------|-------|
| `torch` | `>=2.2.0,<3` | Compatible | CPU wheel recommended on Windows (see comment in file) |
| `sentence-transformers` | `>=3.3.0,<6` | Compatible | Pulls `transformers`, `huggingface-hub`, etc. |
| `numpy` | `2.2.1` (existing) | Compatible | Shared with TF-IDF engine |

### 1.2 Verified on audit machine

| Package | Installed version | Import test |
|---------|-------------------|-------------|
| Python | 3.12.0 | OK |
| `torch` | 2.12.0+cpu | OK |
| `sentence-transformers` | 5.5.1 | OK |
| `numpy` | 2.2.1 | OK |

**Install command:**

```bash
cd backend
pip install -r requirements.txt
```

**Windows CPU-only (if default torch wheel is too large):**

```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install "sentence-transformers>=3.3.0,<6"
```

---

## 2. Settings & Feature Flag

**File:** `backend/app/config/settings.py`

| Setting | Env variable | Default | Purpose |
|---------|--------------|---------|---------|
| `relevancy_engine_v2_enabled` | `RELEVANCY_ENGINE_V2_ENABLED` | `false` | Gates all semantic model loading |
| `sentence_transformer_model` | `SENTENCE_TRANSFORMER_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` | Hugging Face model id |
| `sentence_transformer_device` | `SENTENCE_TRANSFORMER_DEVICE` | `cpu` | Device passed to SentenceTransformer |

**Example `.env` (optional — defaults are safe for V1):**

```env
RELEVANCY_ENGINE_V2_ENABLED=false
SENTENCE_TRANSFORMER_MODEL=sentence-transformers/all-MiniLM-L6-v2
SENTENCE_TRANSFORMER_DEVICE=cpu
```

---

## 3. Semantic Embeddings Skeleton

**File:** `backend/app/ai/semantic_embeddings.py`

| Function | Behavior when `RELEVANCY_ENGINE_V2_ENABLED=false` |
|----------|---------------------------------------------------|
| `is_semantic_engine_enabled()` | Returns `False` |
| `get_sentence_transformer()` | Returns `None` (no download, no load) |
| `preload_model()` | Returns `False` |
| `encode_texts()` | Raises `RuntimeError` with flag hint |
| `reset_model_cache()` | Clears in-process singleton (tests) |

**Design:**

- **Thread-safe singleton** via `threading.Lock`
- **Lazy load** on first `get_sentence_transformer()` / `preload_model()` when flag is `true`
- **Not imported** by `relevancy_engine.py`, `project_service.py`, or routes

---

## 4. Model Download Utility

**File:** `backend/scripts/download_sentence_transformer.py`

**Run:**

```bash
cd backend
python -m scripts.download_sentence_transformer
```

**Steps performed by script:**

1. Print configured model, device, and cache paths  
2. **Download** model from Hugging Face (network required)  
3. Encode a probe sentence  
4. **Offline verify** — reload with `local_files_only=True` and `HF_HUB_OFFLINE=1`

---

## 5. Model Cache Location

Sentence Transformers / Hugging Face resolve cache in this order:

| Env variable | Purpose |
|--------------|---------|
| `SENTENCE_TRANSFORMERS_HOME` | Optional override for ST cache root |
| `HF_HOME` | Hugging Face home directory |
| `HUGGINGFACE_HUB_CACHE` | Explicit hub cache path |

**Default (when no env vars set):**

```text
Windows: C:\Users\<user>\.cache\huggingface\hub
Linux:   ~/.cache/huggingface/hub
```

Model artifacts are stored under a repo folder such as:

```text
models--sentence-transformers--all-MiniLM-L6-v2
```

**Recommendation for viva / offline demo:**

```powershell
set SENTENCE_TRANSFORMERS_HOME=D:\FYP UNI\FYP-Relevancy-checker\backend\models\sentence_transformers
python -m scripts.download_sentence_transformer
```

Commit **`.gitignore`** entry for `backend/models/` if using a project-local cache (not added in this prerequisites pass).

---

## 6. Offline Verification

### 6.1 Automated script result (this session)

```text
Command: python -m scripts.download_sentence_transformer
Model:   sentence-transformers/all-MiniLM-L6-v2
Device:  cpu
Cache:   default_hf_hub=C:\Users\WaleedAwan\.cache\huggingface\hub

[1/2] Downloading model (network required)...
FAIL: Could not download model — Hugging Face HTTP 429 (Too Many Requests)
```

**Cause:** Hugging Face rate limiting; no complete local cache on this machine yet.

### 6.2 How to complete verification

1. Wait and retry, or set a Hugging Face token:
   ```powershell
   set HF_TOKEN=hf_xxxxxxxx
   python -m scripts.download_sentence_transformer
   ```
2. Or download manually from [Hugging Face model page](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) into the cache directory.
3. Re-run the script — step `[2/2] Offline verification OK` confirms offline readiness.

### 6.3 Manual offline check (after cache exists)

```python
from sentence_transformers import SentenceTransformer
model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2",
    device="cpu",
    local_files_only=True,
)
print(model.encode(["test"]).shape)
```

---

## 7. Feature Flag Verification

**Tests:** `backend/tests/test_semantic_embeddings_prereq.py`

| Test | Result |
|------|--------|
| Default `relevancy_engine_v2_enabled is False` | **PASS** |
| Default model = `all-MiniLM-L6-v2`, device = `cpu` | **PASS** |
| `get_sentence_transformer()` returns `None` when disabled | **PASS** |
| `preload_model()` returns `False` when disabled | **PASS** |
| `encode_texts()` raises when disabled | **PASS** |

**Full backend regression (V1 engine unchanged):**

```text
pytest tests/test_semantic_embeddings_prereq.py tests/test_relevancy_engine.py
13 passed
```

**Runtime check:**

```python
from app.config.settings import get_settings
from app.ai.semantic_embeddings import is_semantic_engine_enabled, get_sentence_transformer

assert get_settings().relevancy_engine_v2_enabled is False
assert is_semantic_engine_enabled() is False
assert get_sentence_transformer() is None  # no Hugging Face call
```

---

## 8. Files Created / Modified

| File | Change |
|------|--------|
| `backend/requirements.txt` | Added `torch`, `sentence-transformers` |
| `backend/app/config/settings.py` | Added 3 V2 settings |
| `backend/app/ai/semantic_embeddings.py` | **New** — skeleton module |
| `backend/scripts/download_sentence_transformer.py` | **New** — download + offline verify |
| `backend/tests/test_semantic_embeddings_prereq.py` | **New** — prerequisite tests |

**Not modified (per instructions):**

- `relevancy_engine.py`, `embeddings.py`, `project_service.py`, `duplicate_service.py`
- API routes / Pydantic response schemas
- Database models / migrations
- Ollama service
- Frontend

---

## 9. Next Steps (Future V2 Integration — Out of Scope Here)

1. Complete model download on a stable network (or with `HF_TOKEN`).
2. Approve scoped DB migration for `semantic_score` / `hybrid_score`.
3. Integrate `semantic_embeddings.py` into `relevancy_engine.py` behind `RELEVANCY_ENGINE_V2_ENABLED`.
4. Set `RELEVANCY_ENGINE_V2_ENABLED=true` only after integration tests pass.

---

## 10. Checklist Before Viva Demo

- [ ] `pip install -r requirements.txt` on demo machine  
- [ ] `python -m scripts.download_sentence_transformer` exits 0  
- [ ] Offline verification step passes  
- [ ] `RELEVANCY_ENGINE_V2_ENABLED=false` (V1 scoring unchanged until integration)  
- [ ] Existing relevancy pytest suite green  

---

*Prerequisites implementation complete. Sentence Transformers are not wired into scoring.*
