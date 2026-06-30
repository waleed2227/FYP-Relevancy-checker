# Matched Project Display — Implementation Report

## 1. Current implementation (before)

### Data flow

```
RelevancyEngine.analyze()
  → top 5 corpus pairs ≥ duplicate_similarity_threshold (default 50%)
  → persisted in matched_projects (title, similarity, year, author, status, matched_project_id)

GET /api/v1/projects/{id}/relevancy
  → build_relevancy_result_response()
  → RelevancyResultResponse.matched_projects[]
```

### Frontend (before)

- `RelevancyResults.tsx` fetched `matched_projects` from the API.
- Matches were shown in a bottom table titled **"Similar Existing Projects"** with title, similarity bar, year, author, and status only.
- The row `id` field was the **`matched_projects` table primary key**, not the matched `project_ideas.id`, so users could not identify which project caused the score.
- `RelevancyExplanationPanel.tsx` used the heading **"Most Similar Projects"** for Ollama prose (`similar_projects_summary`), which was easy to confuse with structured match data.

---

## 2. Investigation findings

| Question | Answer |
|----------|--------|
| **1. Is matched project information already stored?** | **Yes.** Table `matched_projects` links to `relevancy_results` and stores `matched_project_id`, `title`, `similarity`, `year`, `author`, `status`. |
| **2. Is it already returned by the API?** | **Yes, partially.** `GET /projects/{id}/relevancy` already included `matched_projects[]`. |
| **3. Is it only partially returned?** | **Yes.** Missing `project_id` (FK to `project_ideas`), `category`, and `risk_level`. The `id` field was the match-row id, not the project id. |
| **4. Is the frontend ignoring it?** | **No** — it rendered a table, but the UX did not clearly answer *which* project matched. |
| **5. Is `duplicate_reports` enough?** | **No for this page.** `duplicate_reports` is an admin alert store (denormalized pairs). Student relevancy should use `matched_projects` tied to the student's `relevancy_results` row. |
| **6. Is recalculation necessary?** | **No.** Stored `matched_projects.similarity` values are reused. Risk is derived at response time via existing `duplicate_service.similarity_to_risk()` (same thresholds as duplicate alerts: ≥75 HIGH, ≥60 MEDIUM, else LOW). |

### Database tables inspected

| Table | Role |
|-------|------|
| `project_ideas` | Submitted proposals; source for `matched_project_id` and `category` |
| `relevancy_results` | One row per project with overall/similarity scores and Ollama explanation |
| `matched_projects` | Top matches (≤5) above threshold, written at analysis time |
| `duplicate_reports` | Admin duplicate alerts; not used for student relevancy display |

### Models inspected

- `RelevancyResult` / `MatchedProject` — `backend/app/models/relevancy.py`
- `DuplicateReport` — `backend/app/models/duplicate_report.py`
- `ProjectIdea` — `backend/app/models/project.py`

### Services / engine inspected

- `RelevancyEngine` — `backend/app/ai/relevancy_engine.py` (unchanged)
- `ProjectService.build_relevancy_result_response()` — response assembly
- `ProjectService.run_relevancy_analysis()` — persistence only (unchanged scoring path)
- `duplicate_service.similarity_to_risk()` — risk label derivation

---

## 3. Design (Phase 2)

### Principle

Expose existing `matched_projects` data with clearer API fields and a prominent UI section. **No scoring, embedding, Ollama, or schema migration changes.**

### Backend

1. Add ORM relationship `MatchedProject.matched_idea` → `ProjectIdea` (read-only join for `category`; no migration).
2. Extend `MatchedProjectResponse` with `project_id`, `category`, `risk_level`.
3. Enrich `build_relevancy_result_response()` — sort by similarity desc, cap at 5, map new fields.
4. Eager-load `matched_idea` on `GET /projects/{id}/relevancy` and after `run_relevancy_analysis()` reload for category.

### Frontend

1. New `MostSimilarProjectsPanel.tsx` — card layout per user spec.
2. Place section **above** the Ollama explanation on `RelevancyResults.tsx`.
3. Remove redundant bottom table.
4. Rename Ollama subsection to **"AI Similarity Summary"** to avoid duplicate "Most Similar Projects" heading.

---

## 4. API changes

### `MatchedProjectResponse` (extended)

```json
{
  "id": 32,
  "project_id": 25,
  "title": "CareerCraft AI — Intelligent Interview and Resume Mastery Platform",
  "similarity": 52.69,
  "year": "2026",
  "status": "pending",
  "author": "Jane Doe",
  "category": "Education",
  "risk_level": "LOW"
}
```

- `id` — match row id (backward compatible)
- `project_id` — `project_ideas.id` of the matched submission
- `risk_level` — derived from stored `similarity` via `similarity_to_risk()` (not recalculated similarity)

### Endpoint

`GET /api/v1/projects/{project_id}/relevancy` — same route; enriched `matched_projects` payload only.

---

## 5. Frontend changes

### New section: **Most Similar Projects**

- Top 5 cards, similarity descending
- Each card: Project #, Title, Similarity %, Risk badge, Category, Submitted year, Status
- Empty state: *"No similar projects exceeded the similarity threshold."*

### Files

| File | Change |
|------|--------|
| `Frontend/src/app/components/MostSimilarProjectsPanel.tsx` | **New** — card UI |
| `Frontend/src/app/components/RelevancyResults.tsx` | Wire panel; remove old table; typed API mapping |
| `Frontend/src/app/components/RelevancyExplanationPanel.tsx` | Rename Ollama block title |

---

## 6. Files modified (backend)

| File | Why |
|------|-----|
| `backend/app/models/relevancy.py` | `matched_idea` relationship for category lookup without schema change |
| `backend/app/schemas/project.py` | Extended `MatchedProjectResponse` DTO |
| `backend/app/services/project_service.py` | Populate new fields; sort top 5; reload with eager load after analysis |
| `backend/app/routes/projects.py` | `selectinload(MatchedProject.matched_idea)` on relevancy GET |

---

## 7. Before / after (UI)

### Before

- Overall score and Ollama explanation visible
- Similar projects in a low-visibility table at page bottom
- No project ID, category, or risk on matches
- "Most Similar Projects" label used only for AI prose

### After

- **Most Similar Projects** card section immediately after the overall score
- Each match shows **Project #&lt;id&gt;**, title, **52.69%** similarity, **LOW/MEDIUM/HIGH** risk, category, year, status
- Ollama prose under **AI Similarity Summary**
- Empty threshold message when no matches stored

*Screenshots: capture from running app at `/relevancy-results` after loading a project with known matches (e.g. project with `matched_project_id` in local DB).*

---

## 8. Confirmations

| Requirement | Status |
|-------------|--------|
| AI scoring unchanged | ✓ `relevancy_engine.py` not modified |
| Embeddings unchanged | ✓ No changes to `embeddings.py` or similarity computation |
| Database schema unchanged | ✓ Only ORM relationship added; no migrations |
| Existing similarity data reused | ✓ Reads `matched_projects.similarity` from DB |
| No duplicate detection logic changes | ✓ `duplicate_service` risk helper reused as-is |
| No Ollama changes | ✓ Explanation generation untouched |
| No re-analysis on GET | ✓ `ensure_relevancy_explanation` still only fills missing prose |

---

## 9. Example API response excerpt

```json
{
  "overall_score": 68.4,
  "matched_projects": [
    {
      "id": 32,
      "project_id": 38,
      "title": "CareerCraft AI — Intelligent Interview and Resume Mastery Platform",
      "similarity": 52.69,
      "year": "2026",
      "status": "pending",
      "author": "Student Name",
      "category": "Education",
      "risk_level": "LOW"
    }
  ]
}
```

---

*Report generated as part of matched-project display feature implementation.*
