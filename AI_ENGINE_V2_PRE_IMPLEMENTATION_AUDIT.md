# AI Relevancy Engine V2 — Pre-Implementation Audit

**Project:** AI-Based FYP Relevancy System  
**Document type:** Pre-implementation audit (no code changes)  
**Audit date:** June 2026  
**Reference plan:** `AI_ENGINE_V2_IMPLEMENTATION_PLAN.md`  
**Environment audited:** Windows 10, Python 3.12.0, PostgreSQL `fyp_relevancy_system` on localhost  

---

## Executive Summary

The three target persistence tables **exist**, are **populated**, and **align with current ORM models**. V2 can proceed using the same idempotent migration-script pattern already used for Ollama columns. **No V2 score columns exist yet** — migration is greenfield on AI tables only.

**Blockers before coding:**

1. **Approve scoped schema migration** on `relevancy_results`, `matched_projects`, and `duplicate_reports` (conflicts with earlier “no schema changes” constraint).
2. **Pin and document ML dependencies** — `requirements.txt` currently has only `numpy`; the dev machine has global `torch` + `sentence-transformers` but a clean install would not.
3. **Pre-cache the Hugging Face model** — live model load test failed with **HTTP 429** from Hugging Face; viva/demo must not depend on first-run download.

**Verdict:** Implementation is **feasible** with plan corrections below. Estimated effort remains **6–8 developer days** (backend only), plus **0.5–1 day** for model caching/offline setup.

---

## 1. Table Verification

Live query against PostgreSQL (`information_schema` + row counts) on audit date:

| Table | Status | Row count | Notes |
|-------|--------|-----------|-------|
| `relevancy_results` | **EXISTS** | 8 | Includes Ollama explanation columns (applied via script, not Alembic) |
| `matched_projects` | **EXISTS** | 1 | Child of `relevancy_results` |
| `duplicate_reports` | **EXISTS** | 1 | Populated from relevancy matches + sync helper |

### 1.1 `relevancy_results` — current columns

| Column | DB type | Nullable | ORM mapped | V2 plan column |
|--------|---------|----------|------------|----------------|
| `id` | integer | NO | Yes | — |
| `project_id` | integer | NO | Yes (unique FK) | — |
| `overall_score` | double precision | NO | Yes | unchanged |
| `novelty_score` | double precision | YES | Yes | formula change only |
| `feasibility_score` | double precision | YES | Yes | unchanged |
| `market_relevance` | double precision | YES | Yes | unchanged |
| `innovation_score` | double precision | YES | Yes | unchanged |
| `similarity_score` | double precision | YES | Yes | keep = max **TF-IDF** (plan) |
| `ai_confidence` | double precision | YES | Yes | unchanged |
| `summary` | text | YES | Yes | unchanged |
| `analyzed_at` | timestamptz | NO | Yes | unchanged |
| `ollama_model` … `explanation_status` | various | YES | Yes | unchanged (8 cols) |
| `semantic_score` | — | — | **No** | **NEW** |
| `hybrid_score` | — | — | **No** | **NEW** |
| `weighted_similarity` | — | — | **No** | **NEW (see correction §7)** |
| `heuristic_similarity` | — | — | **No** | **NEW (see correction §7)** |

### 1.2 `matched_projects` — current columns

| Column | DB type | Nullable | ORM | V2 plan |
|--------|---------|----------|-----|---------|
| `id` | integer | NO | Yes | — |
| `relevancy_result_id` | integer | NO | Yes | — |
| `matched_project_id` | integer | YES | Yes | — |
| `title` | varchar | NO | Yes | — |
| `similarity` | double precision | NO | Yes | keep = TF-IDF per match |
| `year`, `author`, `status` | varchar | YES | Yes | — |
| `semantic_score` | — | — | **No** | **NEW** |
| `hybrid_score` | — | — | **No** | **NEW** |

### 1.3 `duplicate_reports` — current columns

| Column | DB type | Nullable | ORM | V2 plan |
|--------|---------|----------|-----|---------|
| `id` | integer | NO | Yes | — |
| `project1_id`, `project2_id` | integer | NO | Yes | — |
| `similarity_score` | double precision | NO | Yes | keep = TF-IDF at detection |
| `risk_level`, `status` | enum | NO | Yes | recompute from **semantic** |
| `matched_keywords` | ARRAY | YES | Yes | unused today |
| `ai_analysis`, `recommendation` | text | YES | Yes | — |
| `detected_date`, `created_at` | date/timestamptz | NO | Yes | — |
| `semantic_score` | — | — | **No** | **NEW** |
| `hybrid_score` | — | — | **No** | **NEW** |

**Conclusion:** All required base tables exist. V2 columns are absent and can be added with `ADD COLUMN IF NOT EXISTS` without touching `project_ideas` or auth tables.

---

## 2. Existing ORM Models

### 2.1 `RelevancyResult` / `MatchedProject`

**File:** `backend/app/models/relevancy.py`

- One-to-one `RelevancyResult` ↔ `ProjectIdea` (`project_id` unique, CASCADE delete).
- One-to-many `MatchedProject` with CASCADE from `relevancy_results`.
- `similarity_score` on result row = corpus-wide max TF-IDF today.
- `MatchedProject.similarity` = per-pair TF-IDF (NOT NULL).
- Ollama text fields already on `RelevancyResult` — ORM matches live DB.

### 2.2 `DuplicateReport`

**File:** `backend/app/models/duplicate_report.py`

- Unordered pair `(project1_id, project2_id)` normalized in service layer.
- `similarity_score` drives `risk_level` via `similarity_to_risk()` in `duplicate_service.py`.
- No ORM relationship to `matched_projects` — reports are denormalized copies.

### 2.3 Proposal field coverage for semantic text

All nine V2 semantic source fields exist on `ProjectIdea` (`backend/app/models/project.py`):

| Semantic field | `project_ideas` column | In `_to_relevancy_analysis_dict()` |
|----------------|------------------------|-------------------------------------|
| `title` | Yes | Yes (STANDARD tier) |
| `description` | Yes | Yes |
| `problem_statement` | Yes | Yes |
| `proposed_solution` | Yes | Yes |
| `unique_features` | Yes | Yes |
| `innovation_aspect` | Yes | Yes |
| `market_gap` | Yes | Yes |
| `target_users` | Yes | Yes |
| `expected_impact` | Yes | Yes |

**No proposal-table migration required** for semantic input — only analysis/persistence layers change.

### 2.4 ORM ↔ DB drift note

Ollama columns were added by `scripts/apply_ollama_explanation_migration.py`, not Alembic. The live DB and ORM are **in sync today**. Alembic revisions `001`–`003` are **stubs** (`pass` in upgrade) — schema evolution is script-driven + `init_schema.py` (`Base.metadata.create_all`).

---

## 3. Existing APIs Affected

### 3.1 Endpoints that read/write relevancy or duplicate data

| Method | Endpoint | Response model | Score fields today | V2 impact |
|--------|----------|------------------|-------------------|-----------|
| POST | `/api/v1/projects` | `ProjectResponse` | `relevancyScore` ← `project.relevancy_score` | **High** — `overall_score` formula changes |
| PATCH | `/api/v1/projects/{id}` | `ProjectResponse` | same | **High** — re-analysis on field change |
| GET | `/api/v1/projects/{id}/relevancy` | `RelevancyResultResponse` | `overall_score`, insights, `matched_projects[].similarity`, `explanation.similarity_score` | **High** |
| GET | `/api/v1/projects/review-queue` | `list[ReviewQueueItem]` | `similarityScore`, `relevancyScore`, `aiExplanation` | **Medium** |
| GET | `/api/v1/projects/my` | `list[ProjectResponse]` | `relevancyScore` only | **Medium** |
| GET | `/api/v1/admin/dashboard` | `AdminDashboardStats` | `duplicateAlerts[].similarity` | **High** |
| GET | `/api/v1/admin/duplicate-reports` | `list[DuplicateAlertItem]` | `similarity` | **High** |
| GET | `/api/v1/admin/duplicate-reports/{id}` | `DuplicateAlertItem` | `similarity` | **High** |

**Not affected (per plan):** `/auth/*`, `/notifications/*`, `/profile`, review POST `/projects/{id}/review`, admin user CRUD.

### 3.2 Current response shapes (verified in code)

**`RelevancyResultResponse`** (`schemas/project.py` + `project_service.build_relevancy_result_response()`):

```json
{
  "overall_score": 72.5,
  "is_high_relevancy": true,
  "insights": [ { "label", "value", "description" } ],
  "matched_projects": [
    { "id", "title", "similarity", "year", "status", "author" }
  ],
  "explanation": {
    "similarity_score": 45.0,
    "why_relevant": "...",
    "similar_projects_summary": "...",
    "objectives_overlap": "...",
    "problem_domains_overlap": "...",
    "unique_aspects": "...",
    "novelty_suggestions": [],
    "ollama_model": "llama3.2",
    "status": "ok"
  },
  "project": { "...ProjectResponse", "relevancyScore": 72.5 }
}
```

**`ReviewQueueItem`:** exposes `similarityScore` from `rel.similarity_score` (TF-IDF max).

**`DuplicateAlertItem`:** exposes single `similarity` from `duplicate_reports.similarity_score` (TF-IDF at flag time).

### 3.3 Frontend consumers (backward-compat sensitivity)

| Component | Fields used | Break risk if TF-IDF hidden |
|-----------|-------------|-------------------------------|
| `RelevancyResults.tsx` | `matched_projects[].similarity`, `explanation.similarity_score` | **Medium** — UI labels say “similarity” |
| `AdvancedReviewModal.tsx` | `similarityScore`, `explanation.similarity_score` | **Medium** |
| `RelevancyExplanationPanel.tsx` | `similarity_score` / prop | **Medium** |
| `AdminDashboard.tsx` | `duplicateAlerts[].similarity` | **High** — duplicate gate becomes semantic |
| `ProfessorDashboard.tsx` / `AIInsightsPanel.tsx` | `similarityScore >= 40` heuristic | **High** — threshold semantics change |
| `AdminAIReports.tsx` | mock data only | **None** (not wired to API) |

**Plan gap:** Frontend is listed as “optional follow-up” but duplicate/risk UX **will change behavior** even if API adds fields additively. Minimum: document that `similarity` on duplicate alerts should become **semantic** or add `semanticScore` + `hybridScore` without removing `similarity`.

### 3.4 Internal write path (today)

```
run_relevancy_analysis()
  → engine.analyze()                    # TF-IDF + heuristics
  → RelevancyResult (similarity_score)  # max TF-IDF
  → MatchedProject (similarity)         # TF-IDF per match ≥ threshold
  → duplicate_service.create_reports_from_matches()
  → _apply_explanation_to_relevancy() # Ollama, uses similarity_score in prompt
```

V2 must update **all four persistence touchpoints** plus `sync_duplicate_reports_from_matched_projects()` backfill logic.

---

## 4. Migration Feasibility

### 4.1 Compatibility with existing migration practice

| Mechanism | Status | V2 fit |
|-----------|--------|--------|
| `scripts/apply_*_migration.py` | **Used** (Ollama, proposal fields, photo_url) | **Recommended** — copy `apply_ollama_explanation_migration.py` pattern |
| `scripts/init_schema.py` | Creates all tables from ORM | New installs get V2 columns **after** ORM update |
| Alembic `001`–`003` | Stub migrations | **Do not rely on** for V2 |
| `alembic_version` table | May exist | Not source of truth for AI columns |

**Proposed V2 script columns (feasible):**

```sql
-- relevancy_results
ALTER TABLE relevancy_results ADD COLUMN IF NOT EXISTS semantic_score DOUBLE PRECISION;
ALTER TABLE relevancy_results ADD COLUMN IF NOT EXISTS hybrid_score DOUBLE PRECISION;

-- matched_projects
ALTER TABLE matched_projects ADD COLUMN IF NOT EXISTS semantic_score DOUBLE PRECISION;
ALTER TABLE matched_projects ADD COLUMN IF NOT EXISTS hybrid_score DOUBLE PRECISION;

-- duplicate_reports
ALTER TABLE duplicate_reports ADD COLUMN IF NOT EXISTS semantic_score DOUBLE PRECISION;
ALTER TABLE duplicate_reports ADD COLUMN IF NOT EXISTS hybrid_score DOUBLE PRECISION;
```

Optional `weighted_similarity` / `heuristic_similarity` on `relevancy_results` — **see corrections §7** (may be redundant).

### 4.2 Backfill / data migration risks

| Scenario | Behavior | Risk |
|----------|----------|------|
| New submission | Full V2 analysis | Low |
| PATCH proposal field | `run_relevancy_analysis()` **deletes** existing `RelevancyResult` row | **Ollama explanations regenerated** (cost/latency) |
| `backfill_relevancy_v2.py` (planned) | Re-runs analysis for all projects | Same Ollama regen unless `ensure_explanation` skip logic added |
| `sync_duplicate_reports_from_matched_projects()` | Reads `MatchedProject.similarity` (TF-IDF) | **Must update** to semantic/hybrid or stale duplicate rows |
| Existing 8 relevancy rows | NULL semantic/hybrid until backfill | Acceptable if nullable |

### 4.3 Rollback

- Feature flag `RELEVANCY_ENGINE_V2_ENABLED=false` (not in settings yet) → TF-IDF-only path.
- New columns can remain NULL; no downgrade script required for viva.

**Migration feasibility verdict:** **Green** — additive nullable columns, idempotent script, consistent with project conventions.

---

## 5. SentenceTransformer / Environment Compatibility

### 5.1 `requirements.txt` vs runtime (critical gap)

| Package | In `requirements.txt` | Installed globally (audit machine) | Clean `pip install -r requirements.txt` |
|---------|----------------------|-------------------------------------|----------------------------------------|
| `numpy` | `2.2.1` | `2.2.1` | OK |
| `torch` | **Missing** | `2.12.0+cpu` | **Would fail V2** |
| `sentence-transformers` | **Missing** | `5.5.1` | **Would fail V2** |
| `transformers` (transitive) | **Missing** | `5.9.0` | Pulled by ST |

**Finding:** V2 is **not reproducible** from repo dependencies alone. Plan must pin versions in `requirements.txt` (or document a two-step install).

### 5.2 Plan version pin vs environment

Plan specifies:

```text
sentence-transformers>=3.3.0,<4
torch>=2.2.0,<3
```

Audit machine has **sentence-transformers 5.5.1** and **torch 2.12.0** — the `<4` upper bound is **invalid** for current working installs. Update plan to:

```text
sentence-transformers>=3.3.0
torch>=2.2.0,<3
```

Or pin tested combo: `sentence-transformers==5.5.1`, `torch==2.12.0+cpu`.

### 5.3 Import and runtime tests

| Test | Result |
|------|--------|
| `import sentence_transformers` | **PASS** |
| `import torch` | **PASS** (2.12.0+cpu) |
| Load `sentence-transformers/all-MiniLM-L6-v2` | **FAIL** — Hugging Face **HTTP 429**; model not in local cache |
| Python version | 3.12.0 — **compatible** with ST 5.x / torch 2.12 |
| Backend virtualenv (`.venv`) | **Not present** — global site-packages used |

### 5.4 Deployment implications

- **Model size:** ~80 MB download (+ PyTorch ~400–600 MB RAM at runtime).
- **First request latency:** Model load + encode — plan’s 1–15 s estimate is reasonable for N≈200 on CPU.
- **FastAPI async:** CPU encode **must** run in `asyncio.to_thread()` (plan correct) to avoid blocking event loop.
- **Offline / viva:** Pre-download model to `SENTENCE_TRANSFORMERS_HOME` or vendor into repo/ Docker image; add HF token or mirror if rate-limited.

**Package compatibility verdict:** **Compatible** on Python 3.12 **after** dependency pinning and **model caching**. Not production-ready until `requirements.txt` updated and model availability verified.

---

## 6. Estimated Implementation Effort

Based on current codebase size and verified touchpoints:

| Phase | Work | Estimate |
|-------|------|----------|
| 1 | `semantic_embeddings.py`, settings, feature flag, thread-pool wrapper | 1.5 days |
| 2 | `relevancy_engine.py` hybrid logic + heuristic component | 1.5–2 days |
| 3 | Migration script + ORM + `project_service` persistence | 1 day |
| 4 | `duplicate_service` semantic gating + sync backfill fix | 0.5–1 day |
| 5 | Schema/API optional fields + Ollama prompt context | 0.5 day |
| 6 | Tests (V1 regression + V2 semantic ordering) | 1 day |
| 7 | Model cache, requirements pin, README/deploy notes | 0.5–1 day |
| 8 | Backfill script + staging validation | 0.5–1 day |

**Total:** **6–8 developer days** (backend only).  
Plan estimate of 5–7 days is **slightly optimistic** due to dependency reproducibility, HF model caching, and duplicate-sync edge cases.

Frontend score display (optional in plan): **+1–2 days** if required for viva.

---

## 7. Risks

| Risk | Severity | Evidence |
|------|----------|----------|
| Schema change not approved | **Blocker** | V2 requires storing `semantic_score` / `hybrid_score` |
| Hugging Face rate limit / offline demo | **High** | Model load failed with HTTP 429 during audit |
| Non-reproducible ML deps | **High** | `torch` / ST absent from `requirements.txt` |
| Duplicate alert behavior shift | **High** | Semantic gating may flag different pairs vs today |
| Professor “similarity ≥ 40%” insights | **Medium** | `AIInsightsPanel` uses TF-IDF `similarityScore` |
| Backfill Ollama cost | **Medium** | `run_relevancy_analysis()` deletes + regenerates explanations |
| Analysis latency on submit | **Medium** | ST encode × corpus on CPU blocks if not threaded |
| ORM/DB drift on new installs | **Low** | Update ORM + migration script together |
| Alembic confusion | **Low** | Team may expect Alembic revision — project uses scripts |
| `weighted_similarity` column redundancy | **Low** | Duplicates `similarity_score` semantics |

---

## 8. Required Corrections to the Implementation Plan

### 8.1 Must fix before implementation

1. **Update dependency pins** in plan §7: remove `sentence-transformers<4`; add explicit pins to `requirements.txt` including `torch` (CPU wheel note for Windows).

2. **Resolve schema approval** explicitly in project sign-off — scoped AI-table-only migration is required; “no schema changes” cannot hold simultaneously with persist requirement.

3. **Add model provisioning step** to rollout Phase B: download `all-MiniLM-L6-v2` before enabling V2; document HF 429 mitigation (cache dir, token, bundled artifact).

4. **Clarify `similarity_score` semantics** across layers:
   - DB `relevancy_results.similarity_score` → keep **TF-IDF max** (backward compat).
   - Ollama prompt `similarity_score` → plan says use **semantic** — document that this is **prompt-only**, not DB overwrite.
   - API `RelevancyExplanation.similarity_score` → add **`semantic_score`** and **`hybrid_score`** optional fields rather than overloading existing field without version bump.

5. **Fix plan contradiction** §5.7 vs §6.3: `ollama_service.py` **will need** prompt template updates for hybrid/semantic context — list it under modified files.

6. **Update `duplicate_service.sync_duplicate_reports_from_matched_projects()`** in plan file list — today it backfills from `MatchedProject.similarity` (TF-IDF only).

7. **Document backfill Ollama behavior** — extend `ensure_explanation` pattern during backfill to avoid re-calling Ollama when explanations exist.

### 8.2 Should simplify in plan

8. **Drop `weighted_similarity` column** on `relevancy_results` — use existing `similarity_score` as TF-IDF max; add property/alias in code only. Reduces migration surface.

9. **Drop or defer `heuristic_similarity` persistence** — it is query-pair derived, not a corpus max; store only on `matched_projects` if needed for audit, not on parent row.

10. **Separate thresholds in settings** — plan proposes `semantic_similarity_threshold`; keep `duplicate_similarity_threshold` documented as legacy TF-IDF reference to avoid config confusion.

11. **Matched-project ranking** — plan says rank by semantic; also specify whether `matched_projects` **inclusion** uses semantic ≥ threshold (required) while API still returns TF-IDF in `similarity` field.

### 8.3 Frontend / API additions to plan

12. Add **`semantic_score` / `hybrid_score`** to:
    - `MatchedProjectResponse`
    - `DuplicateAlertItem`
    - `ReviewQueueItem` (optional)

13. Note **`AdminAIReports.tsx`** remains mock — out of V2 scope but duplicate UX is live via `AdminDashboard.tsx`.

14. **`project.relevancy_score`** on `project_ideas` will change when overall formula uses `max_hybrid_score` — document impact on dashboards showing relevancy %.

### 8.4 Testing additions

15. Mock SentenceTransformer in unit tests — do not depend on HF network in CI.

16. Add regression test: V2 disabled → identical output to current `test_relevancy_engine.py`.

17. Add test: duplicate report created when semantic ≥ threshold but TF-IDF < threshold (core V2 value prop).

---

## 9. Plan vs Reality Checklist

| Plan assumption | Audit result |
|-----------------|--------------|
| Tables `relevancy_results`, `matched_projects`, `duplicate_reports` exist | **Confirmed** |
| ORM models match DB for V1 columns | **Confirmed** (incl. Ollama cols) |
| V2 columns absent | **Confirmed** |
| Semantic input fields on proposals | **Confirmed** (no `project_ideas` migration) |
| TF-IDF engine preserved | **Confirmed** in `embeddings.py` / `relevancy_engine.py` |
| Ollama explanation-only | **Confirmed** |
| Alembic migration for V2 | **Not aligned** — use script pattern |
| `sentence-transformers` in requirements | **Not present** |
| Model loads in current env | **Not verified** (HF 429) |
| API backward compatible with additive fields | **Feasible** if `similarity` fields retain TF-IDF meaning |
| 5–7 day estimate | **Adjust to 6–8 days** |

---

## 10. Recommended Go / No-Go

| Gate | Status |
|------|--------|
| Tables exist | **GO** |
| ORM ready for extension | **GO** |
| Migration path clear | **GO** (script-based) |
| API extension non-breaking | **GO** (with additive fields) |
| Dependencies reproducible | **NO-GO** until `requirements.txt` updated |
| Model available offline | **NO-GO** until cached / bundled |
| Schema change approved | **PENDING** user/stakeholder decision |

**Recommendation:** Proceed with implementation **only after** (1) scoped migration approval, (2) dependency + model cache checklist complete, (3) plan corrections in §8 applied to `AI_ENGINE_V2_IMPLEMENTATION_PLAN.md`.

---

## Appendix A — Files to Touch (validated)

| File | Audit note |
|------|------------|
| `backend/app/ai/semantic_embeddings.py` | New — required |
| `backend/app/ai/relevancy_engine.py` | Hybrid analyze — required |
| `backend/app/ai/embeddings.py` | Keep TF-IDF — no change required |
| `backend/app/ai/ollama_service.py` | Prompt context update — **plan should list as modified** |
| `backend/app/services/project_service.py` | Persist + API mapping — required |
| `backend/app/services/duplicate_service.py` | Semantic gate + sync — required |
| `backend/app/models/relevancy.py` | Add columns — required |
| `backend/app/models/duplicate_report.py` | Add columns — required |
| `backend/app/schemas/project.py` | Additive response fields — required |
| `backend/app/schemas/admin.py` | `DuplicateAlertItem` — required |
| `backend/app/config/settings.py` | Feature flag + thresholds — required |
| `backend/requirements.txt` | Pin torch + ST — **required before deploy** |
| `backend/scripts/apply_relevancy_v2_migration.py` | New — required |
| `backend/tests/test_relevancy_engine.py` | V1 regression — required |

---

## Appendix B — Audit Commands Run

- PostgreSQL column inspection via SQLAlchemy `information_schema` queries
- Row counts on three target tables
- Code review: models, schemas, routes, services, plan document
- `pip show numpy torch sentence-transformers transformers`
- `import sentence_transformers`, `import torch`
- Attempted `SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')` — failed HF 429
- `pip install sentence-transformers --dry-run` — resolves against torch 2.12, numpy 2.2.1

---

*End of audit. No implementation code was changed.*
