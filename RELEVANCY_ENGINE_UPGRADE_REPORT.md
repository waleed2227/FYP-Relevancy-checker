# Relevancy Engine Upgrade Report

**Date:** 2026-06-03  
**Scope:** AI relevancy analysis only — no changes to authentication, notifications, review/approval workflows, database schema, dashboards, or Ollama integration.

---

## Summary

The relevancy engine now builds a **combined analysis text** from the full structured proposal (plus core title, description, and technologies) before running semantic similarity and duplicate detection. Scoring formulas, embedding logic (`similarity_between`), match thresholds, and downstream persistence are unchanged.

---

## Fields Used

`build_combined_analysis_text()` concatenates non-empty values in this order (space-separated):

| # | Field | Source column |
|---|--------|----------------|
| 1 | `title` | `project_ideas.title` |
| 2 | `description` | `project_ideas.description` |
| 3 | `technologies` | `project_ideas.technologies` |
| 4 | `problem_statement` | `project_ideas.problem_statement` |
| 5 | `current_challenges` | `project_ideas.current_challenges` |
| 6 | `existing_solutions` | `project_ideas.existing_solutions` |
| 7 | `existing_solution_limitations` | `project_ideas.existing_solution_limitations` |
| 8 | `proposed_solution` | `project_ideas.proposed_solution` |
| 9 | `project_scope` | `project_ideas.project_scope` |
| 10 | `target_users` | `project_ideas.target_users` |
| 11 | `target_industry` | `project_ideas.target_industry` |
| 12 | `unique_features` | `project_ideas.unique_features` |
| 13 | `innovation_aspect` | `project_ideas.innovation_aspect` |
| 14 | `competitive_advantage` | `project_ideas.competitive_advantage` |
| 15 | `market_gap` | `project_ideas.market_gap` |
| 16 | `expected_impact` | `project_ideas.expected_impact` |

Null or blank fields are skipped. Metadata fields (`id`, `year`, `author`, `status`) are included in corpus dicts for match reporting but are **not** part of `RELEVANCY_TEXT_FIELDS`.

**Example** (conceptual):

```
combined_text = title + description + technologies + problem_statement + … + expected_impact
```

---

## Files Modified

| File | Change |
|------|--------|
| `backend/app/ai/relevancy_engine.py` | Added `RELEVANCY_TEXT_FIELDS`, `build_combined_analysis_text()`, updated `analyze()` to accept a project dict and use combined text for query and corpus comparisons |
| `backend/app/services/project_service.py` | Added `_to_relevancy_analysis_dict()`, expanded corpus entries with proposal fields, updated `run_relevancy_analysis()` call site |

**Not modified:** `embeddings.py`, routes, models, schemas, notifications, review/approval services, dashboards, duplicate report schema, frontend.

---

## Impact on Similarity Calculation

| Aspect | Before | After |
|--------|--------|-------|
| Algorithm | TF-IDF bag-of-words + cosine via `similarity_between()` | **Unchanged** |
| Match threshold | `duplicate_similarity_threshold` from settings | **Unchanged** |
| Input text (query) | `title + technologies + description` | `build_combined_analysis_text(project)` |
| Input text (corpus) | `title + technologies + description` per project | `build_combined_analysis_text(proj)` per project |
| Tech / scope heuristics | `technologies` token lists; `description` word count | **Unchanged** (still use raw `technologies` and `description`, not combined text) |
| Overall score formula | innovation × 0.35 + feasibility × 0.25 + novelty × 0.25 + (100 − similarity) × 0.15 | **Unchanged** |

**Practical effect:** Similarity and novelty scores will reflect overlap across problem statements, solutions, innovation language, and market context—not only title/description/tech. Projects with rich proposals get more discriminative duplicate detection; near-duplicate ideas with different titles but similar `proposed_solution` text are more likely to match.

---

## Backward Compatibility Verification

| Scenario | Expected behavior | Verified |
|----------|-------------------|----------|
| Legacy project (only `title`, `description`, `technologies`; all proposal columns `NULL`) | Combined text contains the same token set as the old `f"{title} {technologies} {description}"` string; scores identical for the same corpus | Yes — token-set equivalence and matching `overall_score` / `similarity_score` confirmed via script |
| Partial proposal (some new fields filled) | Only populated fields contribute; empty fields ignored | Yes — `build_combined_analysis_text` skips null/blank values |
| Corpus mix (old + new submissions) | Each corpus entry uses its own available fields; comparison is symmetric | Yes — both sides use the same builder |
| Re-analysis on edit | Updates still do **not** auto re-run relevancy (existing behavior) | Unchanged — `update_student_project` does not call `run_relevancy_analysis` |
| API response shape | `RelevancyResultResponse`, matched projects, duplicate reports | Unchanged |

**Note:** Stored relevancy scores for projects analyzed **before** this upgrade used the narrower text. Re-running analysis (e.g. via `GET /api/v1/projects/{id}/relevancy` when no result exists, or on new submission) uses the upgraded combined text.

---

## Out of Scope (per requirements)

- Ollama / LLM integration
- Database migrations or schema changes
- Authentication, notifications, review workflow, approval workflow, dashboards
- Relevancy re-run on project edit
