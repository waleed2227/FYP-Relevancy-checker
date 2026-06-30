# AI Explanation & Approved-Project Search — Change Report

_Date: 2026-07-01_

This report answers your two questions and documents every change made.

---

## 1. Is the professor's AI explanation generated dynamically (real LLM) or precomputed?

**Answer: It is generated dynamically by a real LLM (Ollama), not a hard-coded/static template.**

### How it actually works

1. **At submission time** — when a student submits a proposal, `POST /projects`
   calls `run_relevancy_analysis()`.
   - File: `backend/app/routes/projects.py` → `submit_project()` (line ~77)
   - File: `backend/app/services/project_service.py` → `run_relevancy_analysis()`

2. The similarity/relevancy **scores** are computed by the relevancy engine
   (TF‑IDF / semantic engine). These are numeric and deterministic.

3. The **natural-language explanation** is then produced by calling a real LLM:
   - File: `backend/app/ai/ollama_service.py` → `generate_relevancy_explanation()`
   - It sends an HTTP request to Ollama at `POST {OLLAMA_BASE_URL}/api/generate`
     with the model from `.env` and a prompt built from **that specific
     proposal's text** (title, problem statement, proposed solution, unique
     features, the matched projects, etc.).
   - The model returns JSON: `why_relevant`, `similar_projects_summary`,
     `objectives_overlap`, `problem_domains_overlap`, `unique_aspects`,
     `novelty_suggestions`.

4. **Current LLM configuration** (`backend/.env`):
   ```
   OLLAMA_ENABLED=true
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.2
   OLLAMA_TIMEOUT_SECONDS=120
   ```

5. **Caching (why it's "stored"):** after the LLM generates the explanation, it is
   saved into the `relevancy_results` row. When the professor opens the review, the
   stored text is shown instantly. If a project somehow has scores but **no**
   explanation yet, `ensure_relevancy_explanation()` generates it **on demand** the
   first time it is viewed (`GET /projects/{id}/relevancy`).

> So it is **dynamic per project** (the LLM reads the real proposal and writes a
> fresh explanation), and the result is cached for speed. Regenerating it on every
> page view would be slow and would waste the model's time, with no benefit because
> the proposal text hasn't changed.

6. **Fallback:** only if Ollama is unreachable/times out does the system fall back
   to a rule-based summary (`build_fallback_explanation`), and it is tagged with
   `status = "fallback"` so you can tell the two apart.

**No change was required here** — the system already does what you asked. This
section is documentation/confirmation only.

---

## 2. Search panel: approved-projects-only + search by ID / title / description

### What you asked for
- The professor/admin search must access **only projects approved by professors**
  (the same corpus the AI compares against) — never pending/rejected/revision.
- Searchable by **project ID, project title, and project description**.
- "View Details" must show the **stored project features** (problem statement,
  existing solutions, proposed solution, unique features, etc.) and **NOT** any
  AI relevancy score / similarity / AI suggestions.

### What was already correct (no change)
- The search endpoint already filtered to `status == APPROVED` only.
- The detail modal already shows **only proposal features** (10 proposal sections)
  via `ProjectProposalSections` and contains **no** AI score, similarity, or
  AI explanation.

### What changed now

**Backend — search now also matches the description**
- File: `backend/app/services/project_service.py` → `search_projects()`
- Before: matched on **ID or title** only.
- After: matches on **ID, title, OR description** (partial, case-insensitive),
  still restricted to `APPROVED` projects.

```python
stmt = stmt.where(
    or_(
        cast(ProjectIdea.id, String).ilike(pattern),
        ProjectIdea.title.ilike(pattern),
        ProjectIdea.description.ilike(pattern),   # <-- added
    )
)
```

**Backend — endpoint summary updated**
- File: `backend/app/routes/projects.py`
- `GET /projects/search` summary now reads
  *"Search approved projects by id, title, or description"*.

**Frontend — UI text updated to reflect the new capability**
- File: `Frontend/src/app/components/ProjectSearchPanel.tsx`
  - Search box placeholder → *"Search by project ID, title, or description..."*
  - Panel description clarifies it is the **professor-approved corpus only**, the
    same set the AI checks relevancy against, and that you can use it to show a
    student which approved projects already cover their idea.

### Verified behaviour (live DB test)
| Search term | Results | Matched via |
|-------------|---------|-------------|
| `library`   | 1       | title/description |
| `AI`        | 32      | title/description |
| `health`    | 4       | description |
| `76`        | 1       | project ID |

All results were `APPROVED` projects only.

---

## 3. Files changed

| File | Change |
|------|--------|
| `backend/app/services/project_service.py` | `search_projects()` now also matches `description`; docstring clarified |
| `backend/app/routes/projects.py` | `/projects/search` summary updated |
| `Frontend/src/app/components/ProjectSearchPanel.tsx` | Search placeholder + panel description updated |

No database schema changes. No AI scoring/embedding changes. No new pages/routes.

---

## 4. Guarantees / confirmations

- ✅ AI explanation is produced by a **real LLM (Ollama `llama3.2`)**, dynamically
  per proposal, then cached for fast display.
- ✅ Search returns **approved projects only** (the relevancy reference corpus).
- ✅ Search matches **project ID, title, and description**.
- ✅ "View Details" shows **stored proposal features only** — no relevancy score,
  no similarity score, no AI suggestions.
- ✅ No change to AI scoring, embeddings, or database schema.
