# Embedding Audit

Read-only documentation of how text similarity is computed today, so `similarity_between()` in `backend/app/ai/embeddings.py` can be replaced with sentence-transformers without breaking callers. All line numbers refer to the repository state at audit time.

---

## 1. `similarity_between()` — signature and behavior

**File:** `backend/app/ai/embeddings.py`

**Signature:** `similarity_between(text_a: str, text_b: str) -> float`

**Inputs:** Two **raw strings** (`text_a`, `text_b`). No token lists are accepted at the public API. Internally, each string is tokenized inside `embed_texts()`.

**Return value:** A **0–100** float (percentage scale), rounded to two decimal places. The internal cosine is computed on a **0–1** scale, then multiplied by 100.

**Quoted function:**

```54:56:backend/app/ai/embeddings.py
def similarity_between(text_a: str, text_b: str) -> float:
    vecs = embed_texts([text_a, text_b])
    return round(cosine_similarity(vecs[0], vecs[1]) * 100, 2)
```

**Internal cosine (0–1, not exported to callers):**

```38:44:backend/app/ai/embeddings.py
def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    if a.size == 0 or b.size == 0:
        return 0.0
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.clip(np.dot(a, b) / denom, 0.0, 1.0))
```

**Replacement contract:** Keep `similarity_between(text_a: str, text_b: str) -> float` returning **0–100** with the same rounding. All production and test callers assume this scale.

---

## 2. Callers of `embeddings.py` exports

### Public exports used outside the module

| Symbol | External callers |
|---|---|
| `similarity_between` | 2 files (see below) |
| `embed_texts` | **None** (internal only) |
| `cosine_similarity` | **None** (internal only) |

Private helpers (`_tokenize`, `_build_vocab`, `_doc_vector`) have no external callers.

`backend/app/ai/__init__.py` re-exports only `RelevancyEngine` — not `embeddings` symbols.

---

### Caller 1 — production: `relevancy_engine.py`

| Field | Value |
|---|---|
| **File** | `backend/app/ai/relevancy_engine.py` |
| **Import** | Line 13: `from app.ai.embeddings import similarity_between` |
| **Call site** | Lines 132–134 |
| **How called** | `sim = similarity_between(query_text, corpus_text)` where both arguments are strings from `build_combined_analysis_text()` |
| **Use of return value** | Compared to `duplicate_similarity_threshold` (0–100); stored in `matched[].similarity`; tracked as `max_similarity`; drives `novelty_score`, `similarity_score`, and `overall_score` formulas (lines 135–167) |

```132:144:backend/app/ai/relevancy_engine.py
        for proj in existing_projects:
            corpus_text = build_combined_analysis_text(proj)
            sim = similarity_between(query_text, corpus_text)
            if sim >= match_threshold:
                matched.append({
                    "matched_project_id": proj.get("id"),
                    "title": proj.get("title", "Unknown"),
                    "similarity": sim,
                    "year": proj.get("year", "2024"),
                    "author": proj.get("author", "Unknown"),
                    "status": proj.get("status", "Completed"),
                })
            max_similarity = max(max_similarity, sim)
```

---

### Caller 2 — tests: `test_relevancy_engine.py`

| Field | Value |
|---|---|
| **File** | `backend/tests/test_relevancy_engine.py` |
| **Import** | Line 9: `from app.ai.embeddings import similarity_between` |
| **Call sites** | Lines 118–121, 122–125 |
| **How called** | `similarity_between(build_combined_analysis_text(critical_a), build_combined_analysis_text(critical_b))` and same with `desc_only_b` |
| **Use of return value** | Asserts `sim_critical > sim_desc` (line 126) — relative ordering only, still assumes 0–100 scale |

---

### Internal callers within `embeddings.py`

| Symbol | Called from | Line |
|---|---|---|
| `embed_texts` | `similarity_between` | 55 |
| `cosine_similarity` | `similarity_between` | 56 |
| `_tokenize` | `embed_texts` | 49 |
| `_build_vocab` | `embed_texts` | 50 |
| `_doc_vector` | `embed_texts` | 51 |

---

### Related but separate module (NOT a caller of `embeddings.py`)

`backend/app/ai/semantic_embeddings.py` provides `encode_texts()` for sentence-transformers (V2 prerequisite). It is **not imported** by `relevancy_engine.py` or `embeddings.py` today. Gated by `relevancy_engine_v2_enabled` (default `false`, `backend/app/config/settings.py` lines 64–67).

---

## 3. Text preparation before similarity

Preparation happens in **two stages**: (A) field weighting / string assembly in `relevancy_engine.py`, then (B) tokenization / vectorization in `embeddings.py`.

### Stage A — weighted field concatenation (`relevancy_engine.py`)

Before `similarity_between()` is called, each project dict is converted to one long string:

```57:73:backend/app/ai/relevancy_engine.py
def build_combined_analysis_text(project: dict) -> str:
    """Join weighted proposal fields: critical×3, high×2, standard×1."""
    parts: list[str] = []
    for weight, fields in (
        (3, CRITICAL_FIELDS),
        (2, HIGH_FIELDS),
        (1, STANDARD_FIELDS),
    ):
        tier_chunks: list[str] = []
        for field in fields:
            text = _field_text(project, field)
            if text:
                tier_chunks.append(text)
        if tier_chunks:
            tier_text = " ".join(tier_chunks)
            parts.extend([tier_text] * weight)
    return " ".join(parts)
```

Field tiers (lines 17–37):

| Tier | Weight | Fields |
|---|---|---|
| Critical | ×3 | `problem_statement`, `proposed_solution`, `unique_features`, `innovation_aspect` |
| High | ×2 | `current_challenges`, `existing_solutions`, `project_scope`, `competitive_advantage`, `market_gap` |
| Standard | ×1 | `title`, `description`, `technologies`, `target_users`, `target_industry`, `expected_impact`, `existing_solution_limitations` |

`_field_text()` (lines 49–54): `str(value).strip()`; empty/None fields are skipped. **No lowercasing or stopword removal at this stage.**

`ai_technologies_used` is **not** included in `build_combined_analysis_text()` (used separately for tech scoring in `_tech_tokens()`, lines 99–103).

### Stage B — tokenization and BOW vectors (`embeddings.py`)

```16:17:backend/app/ai/embeddings.py
def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())
```

| Step | Where | What happens |
|---|---|---|
| Lowercasing | `_tokenize`, line 17 | `text.lower()` |
| Tokenization | `_tokenize`, line 17 | Regex `[a-z0-9]+` — alphanumeric tokens only |
| Stopword removal | **NOT FOUND** | — |
| Vocabulary | `_build_vocab`, lines 20–26 | Built **per call** from the documents in that batch only |
| Vectorization | `_doc_vector`, lines 29–35 | Bag-of-words **term counts** (not TF-IDF despite module docstring) |
| L2 normalization | `_doc_vector`, lines 34–35 | Each document vector divided by its L2 norm |
| Similarity | `cosine_similarity`, lines 38–44 | Dot product of normalized vectors, clipped to [0, 1] |
| Scale to percentage | `similarity_between`, line 56 | `× 100`, `round(..., 2)` |

**Important implementation note:** The module docstring (lines 4–5) says "TF-IDF + cosine similarity", but the code implements **labeled BOW counts with L2 normalization** — there is a weighting and **no IDF**. Each `similarity_between()` call builds a **fresh vocabulary from only the two input strings**.

Quoted `embed_texts`:

```47:51:backend/app/ai/embeddings.py
def embed_texts(texts: Iterable[str]) -> list[np.ndarray]:
    """Return L2-normalized bag-of-words vectors for a corpus."""
    tokenized = [_tokenize(t) for t in texts]
    vocab = _build_vocab(tokenized)
    return [_doc_vector(tokens, vocab) for tokens in tokenized]
```

---

## 4. Corpus loading and shape reaching the engine

### Load path — `project_service.run_relevancy_analysis()`

```496:510:backend/app/services/project_service.py
async def run_relevancy_analysis(db: AsyncSession, project: ProjectIdea) -> RelevancyResult:
    corpus_query = (
        select(ProjectIdea)
        .where(ProjectIdea.id != project.id)
        .options(selectinload(ProjectIdea.student).selectinload(Student.user))
        .order_by(ProjectIdea.submitted_date.desc())
    )
    corpus_limit = get_settings().relevancy_corpus_limit
    if corpus_limit > 0:
        corpus_query = corpus_query.limit(corpus_limit)
    result = await db.execute(corpus_query)
    existing = result.scalars().all()
    corpus = [_to_relevancy_analysis_dict(p) for p in existing]

    analysis = engine.analyze(_to_relevancy_analysis_dict(project), corpus)
```

### Dict builder — `_to_relevancy_analysis_dict()`

```128:140:backend/app/services/project_service.py
def _to_relevancy_analysis_dict(project: ProjectIdea) -> dict:
    """Map a project row to the dict shape expected by RelevancyEngine.analyze."""
    data = {field: getattr(project, field, None) for field in RELEVANCY_TEXT_FIELDS}
    data["ai_technologies_used"] = project.ai_technologies_used
    data["id"] = project.id
    data["year"] = str(project.submitted_date.year)
    data["author"] = (
        project.student.user.full_name
        if project.student and project.student.user
        else "Unknown"
    )
    data["status"] = project.status.value
    return data
```

`RELEVANCY_TEXT_FIELDS` is imported from `relevancy_engine.py` line 46: `CRITICAL_FIELDS + HIGH_FIELDS + STANDARD_FIELDS` (17 snake_case text fields).

### Fields available on each corpus / query dict

| Key | Source column (`project_ideas`) | Used in similarity text? |
|---|---|---|
| `problem_statement` | `problem_statement` | Yes (critical ×3) |
| `proposed_solution` | `proposed_solution` | Yes (critical ×3) |
| `unique_features` | `unique_features` | Yes (critical ×3) |
| `innovation_aspect` | `innovation_aspect` | Yes (critical ×3) |
| `current_challenges` | `current_challenges` | Yes (high ×2) |
| `existing_solutions` | `existing_solutions` | Yes (high ×2) |
| `project_scope` | `project_scope` | Yes (high ×2) |
| `competitive_advantage` | `competitive_advantage` | Yes (high ×2) |
| `market_gap` | `market_gap` | Yes (high ×2) |
| `title` | `title` | Yes (standard ×1) |
| `description` | `description` | Yes (standard ×1) |
| `technologies` | `technologies` | Yes (standard ×1) |
| `target_users` | `target_users` | Yes (standard ×1) |
| `target_industry` | `target_industry` | Yes (standard ×1) |
| `expected_impact` | `expected_impact` | Yes (standard ×1) |
| `existing_solution_limitations` | `existing_solution_limitations` | Yes (standard ×1) |
| `ai_technologies_used` | `ai_technologies_used` | No (tech score only) |
| `id` | `id` | Metadata for matches |
| `year` | derived from `submitted_date` | Metadata for matches |
| `author` | derived from `student.user.full_name` | Metadata for matches |
| `status` | `status.value` | Metadata for matches |

Other `project_ideas` columns (e.g. `category`, feasibility text fields, impact fields not in `RELEVANCY_TEXT_FIELDS`) are **not** passed into the engine dict and **not** used in similarity text.

### Engine entry

`RelevancyEngine.analyze(project: dict, existing_projects: list[dict])` — line 125, `backend/app/ai/relevancy_engine.py`. Each corpus item is one dict as above; similarity compares `build_combined_analysis_text(project)` vs `build_combined_analysis_text(proj)` per pair.

---

## 5. Scale assumptions — every line that depends on similarity being 0–100

Replacements must preserve **0–100 percentage semantics** (not raw 0–1 cosine) at the `similarity_between()` boundary and everywhere downstream.

### 5.1 Scale conversion (source of truth)

| File | Line | Assumption |
|---|---|---|
| `backend/app/ai/embeddings.py` | 56 | `cosine_similarity(...) * 100` — public API is 0–100 |
| `backend/app/ai/embeddings.py` | 44 | Internal cosine clipped to `[0.0, 1.0]` before scaling |

### 5.2 Engine formulas (expect 0–100 similarity)

| File | Line | Assumption |
|---|---|---|
| `backend/app/ai/relevancy_engine.py` | 127 | `match_threshold = get_settings().duplicate_similarity_threshold` (default 50.0 = 50%) |
| `backend/app/ai/relevancy_engine.py` | 135 | `if sim >= match_threshold` — threshold on 0–100 scale |
| `backend/app/ai/relevancy_engine.py` | 139 | `"similarity": sim` stored as percentage |
| `backend/app/ai/relevancy_engine.py` | 156 | `novelty_score = max(30, 100 - max_similarity * 0.8)` — `max_similarity` is 0–100 |
| `backend/app/ai/relevancy_engine.py` | 160 | `similarity_score = round(max_similarity, 2)` — headline similarity 0–100 |
| `backend/app/ai/relevancy_engine.py` | 165 | `(100 - similarity_score) * 0.15` in overall formula |
| `backend/app/ai/relevancy_engine.py` | 170–175 | `overall >= 80` / `>= 60` summary thresholds (overall score, not similarity) |

### 5.3 Settings

| File | Line | Assumption |
|---|---|---|
| `backend/app/config/settings.py` | 58–59 | `duplicate_similarity_threshold: float = 50.0` — documented as "minimum similarity %" |

### 5.4 Persistence

| File | Line | Assumption |
|---|---|---|
| `backend/app/services/project_service.py` | 528 | `similarity_score=analysis.similarity_score` → `relevancy_results.similarity_score` |
| `backend/app/services/project_service.py` | 541 | `similarity=m["similarity"]` → `matched_projects.similarity` |
| `backend/app/models/relevancy.py` | 27 | `similarity_score` column (Float) |
| `backend/app/models/relevancy.py` | 59 | `matched_projects.similarity` column (Float) |

### 5.5 Duplicate detection (same 0–100 scale)

| File | Line | Assumption |
|---|---|---|
| `backend/app/services/duplicate_service.py` | 14–15 | `get_similarity_threshold()` returns settings value (50.0 default) |
| `backend/app/services/duplicate_service.py` | 18–23 | `similarity_to_risk`: `>= 75` HIGH, `>= 60` MEDIUM, else LOW |
| `backend/app/services/duplicate_service.py` | 33 | `f"{similarity:.1f}%"` in default AI analysis text |
| `backend/app/services/duplicate_service.py` | 49 | `if similarity_score < threshold` |
| `backend/app/services/duplicate_service.py` | 97–99 | `match.get("similarity", 0.0)` from engine matches |
| `backend/app/services/duplicate_service.py` | 109 | `MatchedProject.similarity >= threshold` |
| `backend/app/models/duplicate_report.py` | 33 | `similarity_score` column |

### 5.6 API / Ollama (display and prompts use %)

| File | Line | Assumption |
|---|---|---|
| `backend/app/services/project_service.py` | 164, 223, 487, 553 | `similarity_score` passed to responses / Ollama as percentage |
| `backend/app/services/project_service.py` | 450 | `similarity=m.similarity` in API matched projects |
| `backend/app/ai/ollama_service.py` | 37, 72 | Prompt and matched-project block format as `{similarity}%` |
| `backend/app/ai/ollama_service.py` | 131, 141, 156 | Fallback logic uses `similarity_score` and `similarity >= 50` |
| `backend/app/services/project_service.py` | 459 | `is_high_relevancy=rel.overall_score >= 70` (overall, not similarity) |

### 5.7 Frontend (display / UI thresholds)

| File | Line | Assumption |
|---|---|---|
| `Frontend/src/app/components/RelevancyResults.tsx` | 57, 83, 148, 162, 291 | `similarity_score` and `matched_projects[].similarity` shown with `%`; overall `>= 70` for "high relevancy" |
| `Frontend/src/app/components/RelevancyExplanationPanel.tsx` | 51–53 | `Similarity Score: {Math.round(score)}%` — displays 0–100 |
| `Frontend/src/app/components/AdvancedReviewModal.tsx` | 232–239 | Color coding when `similarityScore > 40`; bar width `${similarityScore}%` |
| `Frontend/src/app/components/AIInsightsPanel.tsx` | 83 | `(similarityScore ?? 0) >= 40` count for professor insights |

### 5.8 Tests

| File | Line | Assumption |
|---|---|---|
| `backend/tests/test_relevancy_engine.py` | 61 | `similarity_score == 0.0` with empty corpus |
| `backend/tests/test_relevancy_engine.py` | 91 | Relative `similarity_score` comparison |

**Migration note:** If sentence-transformers cosine is naturally 0–1, multiply by 100 inside `similarity_between()` (or ensure normalized embeddings so cosine ∈ [0, 1] before scaling). Do **not** change downstream thresholds without recalibrating `duplicate_similarity_threshold` (50), risk bands (60/75), and UI breakpoints (40).

---

## 6. Vector persistence and caching

### 6.1 Is any embedding vector stored today?

**No.** Confirmed:

| Check | Result |
|---|---|
| `backend/app/models/project.py` | Text and score columns only; no vector/embedding column |
| `backend/app/models/relevancy.py` | Stores numeric scores and text explanations; no vectors |
| `backend/alembic/` grep for `embedding` / `vector` | **NOT FOUND** |
| `embeddings.py` | Vectors are ephemeral NumPy arrays per call |
| `semantic_embeddings.py` | In-process model singleton only; no DB persistence |

Similarity results are persisted as **scalar percentages** in `relevancy_results.similarity_score` and `matched_projects.similarity`, not as embedding vectors.

### 6.2 Natural place to cache embeddings (documentation only — do not modify)

| Option | Rationale |
|---|---|
| **`project_ideas` table** (`backend/app/models/project.py`, `__tablename__ = "project_ideas"`) | One row per submission; holds all source text fields; `_to_relevancy_analysis_dict()` already reads from here. A new nullable column (e.g. `analysis_embedding` JSON/BLOB or pgvector) keyed by `project_ideas.id` would align with "one embedding per project." |
| **Invalidation hook** | `run_relevancy_analysis()` (lines 496–561) already deletes and recreates `relevancy_results` on rerun; embedding cache should invalidate when any `RELEVANCY_TEXT_FIELDS` value changes (see `_relevancy_rerun_needed` in tests, `test_relevancy_engine.py` lines 162–204). |
| **`relevancy_results.analyzed_at`** | Line 38–39, `backend/app/models/relevancy.py` — timestamp of last analysis; useful metadata but not tied to source text hash today. |
| **Existing V2 helper** | `semantic_embeddings.encode_texts()` (`backend/app/ai/semantic_embeddings.py` lines 96–121) can batch-encode strings; intended integration point when replacing BOW inside `similarity_between()` or precomputing corpus embeddings in `run_relevancy_analysis()`. |

**Recommended cache key input:** Output of `build_combined_analysis_text(project_dict)` (same string passed to `similarity_between()` today), so weighted field repetition remains consistent with current behavior unless weighting is changed separately.

---

## 7. Safe replacement checklist

1. **Preserve** `similarity_between(text_a: str, text_b: str) -> float` returning **0–100**, `round(..., 2)`.
2. **Only two external callers** of `similarity_between`: `relevancy_engine.py:134` and tests at `test_relevancy_engine.py:118–125`.
3. **Do not change** `build_combined_analysis_text()` unless intentionally revisiting field weighting.
4. **Keep** `duplicate_similarity_threshold` (50), risk bands (60/75), novelty formula (`100 - sim * 0.8`), and UI threshold (40) unless recalibrated for new embedding geometry.
5. **Optional optimization:** Pre-encode corpus in `run_relevancy_analysis()` using cached vectors on `project_ideas` — no schema change exists yet; would require a migration if added later.
6. **`semantic_embeddings.py`** is the existing sentence-transformers wrapper but is **not wired** into scoring; swapping BOW inside `embeddings.py` is the minimal caller-safe path.

---

*Audit completed without modifying application code.*
