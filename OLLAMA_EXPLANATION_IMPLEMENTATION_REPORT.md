# Ollama Explanation Layer — Implementation Report

**Date:** 2026-06-07  
**Scope:** Natural-language relevancy explanations via Ollama. Similarity scoring remains in `relevancy_engine.py` + `embeddings.py` (unchanged).

---

## Summary

After the TF-IDF similarity engine computes scores and matched projects, the system calls **Ollama** to produce a structured explanation (why relevant, overlaps, uniqueness, suggestions). Explanations are **persisted in PostgreSQL** and returned through the existing relevancy API for students, professors, and admins.

If Ollama is unavailable, a **rule-based fallback** explanation is stored instead (`explanation_status = fallback`).

---

## Ollama Model Used

| Setting | Default | Env variable |
|---------|---------|--------------|
| Model | `llama3.2` | `OLLAMA_MODEL` |
| Base URL | `http://localhost:11434` | `OLLAMA_BASE_URL` |
| Enabled | `true` | `OLLAMA_ENABLED` |
| Timeout | `120` seconds | `OLLAMA_TIMEOUT_SECONDS` |

**API used:** `POST {OLLAMA_BASE_URL}/api/generate` with `"format": "json"` and `"stream": false`.

**Prerequisite:** Install and run Ollama locally, then pull the model:

```bash
ollama pull llama3.2
```

---

## Prompt Template

Defined in `backend/app/ai/ollama_service.py` as `EXPLANATION_PROMPT_TEMPLATE`.

The prompt:

1. Instructs the model **not** to recalculate similarity (scores are pre-computed).
2. Includes submitted project fields (title, technologies, description, problem statement, proposed solution, scope, unique features, innovation, target users/industry).
3. Includes pre-computed scores: overall, similarity, novelty, innovation.
4. Lists matched projects with their **existing** similarity percentages from the separate engine.
5. Requests **JSON only** with this schema:

```json
{
  "why_relevant": "1-3 sentences on why this project is relevant in its domain",
  "similar_projects_summary": "1-3 sentences naming the most similar projects and why",
  "objectives_overlap": "Which objectives or goals overlap with similar projects",
  "problem_domains_overlap": "Which problem domains or industries overlap",
  "unique_aspects": "What makes the submitted project unique or differentiated",
  "novelty_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}
```

**Example output shape (as shown to users):**

```
Similarity Score: 82%

Why Similar:
Both projects focus on personalized food recommendations and nutritional guidance.

Unique Aspects:
The submitted project includes grocery planning and budget optimization.

Suggestions:
• Add allergy-aware recommendations.
• Add restaurant integration.
• Add multilingual support.
```

---

## API Endpoints

| Method | Endpoint | Change |
|--------|----------|--------|
| `POST` | `/api/v1/projects` | Unchanged route; after similarity analysis, Ollama explanation is generated and stored |
| `GET` | `/api/v1/projects/{project_id}/relevancy` | Response now includes `explanation` object; access extended to **assigned professor** and **admin** (not only student owner). Backfills explanation for older rows missing explanation fields |

### `explanation` response object

| Field | Type | Description |
|-------|------|-------------|
| `similarity_score` | `float \| null` | From similarity engine (not Ollama) |
| `why_relevant` | `string \| null` | Why the project is relevant / similar |
| `similar_projects_summary` | `string \| null` | Most similar existing projects |
| `objectives_overlap` | `string \| null` | Overlapping objectives |
| `problem_domains_overlap` | `string \| null` | Overlapping problem domains |
| `unique_aspects` | `string \| null` | Differentiators |
| `novelty_suggestions` | `string[]` | Actionable improvement suggestions |
| `ollama_model` | `string \| null` | Model name when generated |
| `status` | `string \| null` | `generated`, `fallback`, or `unavailable` |

### Review queue / admin list

`GET /api/v1/projects/review-queue`, `GET /api/v1/projects/assigned`, and `GET /api/v1/projects/all` include `aiExplanation` on each `ReviewQueueItem` when explanation data exists.

---

## Database Fields Added

**Table:** `relevancy_results`  
**Migration:** `python -m scripts.apply_ollama_explanation_migration`

| Column | Type | Purpose |
|--------|------|---------|
| `ollama_model` | `VARCHAR(100)` | Model used for generation |
| `why_relevant` | `TEXT` | Relevancy / similarity narrative |
| `similar_projects_summary` | `TEXT` | Summary of closest corpus projects |
| `objectives_overlap` | `TEXT` | Overlapping objectives |
| `problem_domains_overlap` | `TEXT` | Overlapping domains / industries |
| `unique_aspects` | `TEXT` | Unique differentiators |
| `novelty_suggestions` | `TEXT` | JSON array of suggestion strings |
| `explanation_status` | `VARCHAR(20)` | `generated` or `fallback` |

Existing similarity columns (`overall_score`, `similarity_score`, `matched_projects`, etc.) are **unchanged**.

---

## Files Modified / Added

### Backend

| File | Role |
|------|------|
| `app/ai/ollama_service.py` | **New** — Ollama client, prompt, JSON parsing, fallback |
| `app/models/relevancy.py` | Explanation columns on `RelevancyResult` |
| `app/config/settings.py` | Ollama settings |
| `app/services/project_service.py` | Generate/store explanation after similarity; `ensure_relevancy_explanation()` backfill |
| `app/schemas/project.py` | `RelevancyExplanation`, extended `RelevancyResultResponse` and `ReviewQueueItem` |
| `app/routes/projects.py` | Relevancy access control; `explanation` in response |
| `scripts/apply_ollama_explanation_migration.py` | **New** — idempotent migration |
| `requirements.txt` | Added `httpx` |
| `.env.example` | Ollama env vars |

### Frontend

| File | Role |
|------|------|
| `components/RelevancyExplanationPanel.tsx` | **New** — shared explanation UI |
| `components/RelevancyResults.tsx` | Student relevancy results page |
| `components/AdvancedReviewModal.tsx` | Professor review page (lazy-loads explanation if missing) |
| `components/AdminProjects.tsx` | Admin project analysis detail modal |

---

## Pages Updated

| Page | Role | How explanation is loaded |
|------|------|---------------------------|
| **Student Relevancy Results** | `RelevancyResults.tsx` | `GET /projects/{id}/relevancy` → `explanation` |
| **Professor Review** | `AdvancedReviewModal.tsx` | `aiExplanation` from queue, or `GET /projects/{id}/relevancy` on open |
| **Admin Project Analysis** | `AdminProjects.tsx` detail modal | `GET /projects/{id}/relevancy` when viewing project |

---

## Separation of Concerns

```
Submission
    │
    ▼
relevancy_engine.analyze()  ──► TF-IDF similarity, scores, matched_projects
    │
    ▼
ollama_service.generate_relevancy_explanation()  ──► text explanation only
    │
    ▼
relevancy_results + matched_projects (PostgreSQL)
```

Ollama **never** calls `similarity_between()` or modifies scores. It only interprets pre-computed results and proposal text.

---

## Verification

1. Run migration: `python -m scripts.apply_ollama_explanation_migration`
2. Ensure Ollama is running with `llama3.2` (or set `OLLAMA_MODEL`)
3. Submit a new project or open `GET /api/v1/projects/{id}/relevancy`
4. Confirm `explanation.status` is `generated` (or `fallback` if Ollama is down)
5. View explanation on student relevancy page, professor review modal, and admin project detail

**Fallback test:** Set `OLLAMA_ENABLED=false` — explanation still populates with `status: fallback`.
