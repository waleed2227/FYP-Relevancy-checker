# Final System Readiness Report

**Project:** AI-Based FYP Relevancy System  
**Document type:** End-to-end read-only system audit  
**Date:** 23 June 2026  
**Auditor method:** Live HTTP checks + PostgreSQL queries + codebase review  
**Code modified:** None

---

## Overall Verdict

| Readiness level | Assessment |
|-----------------|------------|
| **System operational** | ✅ Yes — frontend, backend, and database are running |
| **Viva demo (eval corpus)** | ✅ Yes — 20/20 eval projects fully analyzed |
| **Viva demo (university proposals)** | ❌ No — 0/10 analyzed (IDs 31–40) |
| **Full end-to-end AI demo** | ⚠️ Partial — scoring works; Ollama live explanations unavailable |
| **Production / V2 ready** | ❌ No — V2 semantic engine not integrated |

### One-line summary

The **platform stack is healthy and demo-capable on the eval corpus**, but **real university proposals are imported yet unprocessed**, **Ollama has never produced a live explanation**, and **V2 semantic relevancy remains unimplemented**.

---

## Readiness Dashboard

| Area | Status | Score |
|------|:------:|------:|
| 1. Frontend | ✅ Complete | 95% |
| 2. Backend | ✅ Complete | 90% |
| 3. Database | ✅ Complete | 95% |
| 4. AI engine (V1) | ✅ Complete | 85% |
| 5. Relevancy coverage | ⚠️ Partial | 72.5% |
| 6. Duplicate detection | ⚠️ Partial | 15% project involvement |
| 7. Ollama explanations | ⚠️ Partial | 0% live generated |
| 8. University proposals (31–40) | ❌ Missing | 0% |
| 9. Eval corpus (11–30) | ✅ Complete | 100% |
| 10. Viva readiness | ⚠️ Partial | ~70% |

---

## 1. Frontend Status

### Live check

| Check | Result |
|-------|--------|
| `http://localhost:5173` | **HTTP 200** — running |
| `Frontend/.env` | `VITE_API_URL=http://localhost:8000/api/v1` ✅ |
| `node_modules` | Installed (Vite present) |

### What is complete

| Feature | Component | Status |
|---------|-----------|:------:|
| Auth (login / register) | `Login.tsx`, `Registration.tsx`, `AuthContext` | ✅ |
| Student dashboard & submit | `StudentDashboard`, `IdeaSubmissionForm` | ✅ |
| Relevancy results page | `RelevancyResults.tsx` → `GET /projects/{id}/relevancy` | ✅ |
| Ollama explanation panel | `RelevancyExplanationPanel.tsx` | ✅ |
| Professor review queue | `ReviewQueue`, `AdvancedReviewModal` | ✅ |
| Admin dashboard & AI reports | `AdminDashboard`, `AdminAIReports` | ✅ |
| Notifications | `NotificationContext`, `Notifications` | ✅ |
| API client + token refresh | `services/api.ts` | ✅ |
| Role-based navigation | `App.tsx`, `navigation` | ✅ |

### What is partial

- Error message *"Cannot reach server"* appears when backend DB errors occur — misleading vs actual auth/DB failures.
- Relevancy page triggers **synchronous** backend analysis on first open for unanalyzed projects (31–40) — may cause long wait or timeout during demo.

### What is missing

- No dedicated loading UX for first-time relevancy analysis on large corpus.
- V2 semantic score labels not in UI (V2 not implemented).

---

## 2. Backend Status

### Live check

| Check | Result |
|-------|--------|
| `http://localhost:8000/health` | **HTTP 200** — `{"status":"ok","environment":"development"}` |
| `http://localhost:8000/docs` | **HTTP 200** — Swagger UI available |
| Uvicorn | Running with `--reload` on port 8000 |
| PostgreSQL connection | ✅ Working (queries succeed) |

### What is complete

| Layer | Details |
|-------|---------|
| FastAPI app | `app/main.py`, CORS for `localhost:5173` |
| JWT auth | Register, login, refresh, logout, `/me` |
| Projects API | Submit, update, relevancy, review queue |
| Admin API | Users, professors, departments, duplicate reports |
| AI pipeline | `run_relevancy_analysis()` on POST/PATCH/GET relevancy |
| Ollama service | Explanation generation with fallback |
| Scripts | `setup_db.py`, `backfill_eval_relevancy.py`, `import_university_proposals.py`, `verify_e2e_flows.py` |
| Migrations | Alembic versions 001–003 + apply scripts |

### What is partial

- `OLLAMA_ENABLED=true` but Ollama server **not reachable** at `localhost:11434`.
- `SECRET_KEY` likely still default in `.env` (acceptable for dev, not production).
- Scoring runs **in-request** (no background job queue).

### What is missing

- V2 semantic engine integration (`RELEVANCY_ENGINE_V2_ENABLED=false`).
- University proposal backfill script (only eval backfill exists).
- Background task offload for CPU-heavy analysis.

---

## 3. Database Status

### Live check

| Metric | Value |
|--------|------:|
| Database | `fyp_relevancy_system` |
| Connection | ✅ Active |
| Public tables | **12** |
| Seed users | **6** |
| Total projects | **40** |

### Schema coverage

Core tables present and populated:

- `users`, `students`, `professors`, `admins`, `departments`
- `project_ideas` (40 rows)
- `relevancy_results` (29 rows)
- `matched_projects` (linked to relevancy results)
- `duplicate_reports` (5 rows)
- `notifications`, `reviews`

### What is complete

- PostgreSQL installed and password configured (auth/login working).
- Eval corpus imported (IDs 11–30).
- University proposals imported (IDs 31–40).
- Proposal V3 fields populated on university rows.

### What is partial

- ID gap at **2** (expected — no project with ID 2).
- Extra project **ID 41** exists outside university import batch (post-import submission).

### What is missing

- V2 columns (`semantic_score`, `duplicate_risk_score`, `engine_version`) — not in schema.
- Relevancy rows for IDs **1, 31–40**.

---

## 4. AI Engine Status

Reference: `AI_ENGINE_AUDIT.md`

| Component | Status | Production use |
|-----------|:------:|:----------------|
| `RelevancyEngine` (V1) | ✅ Active | Scoring |
| `embeddings.py` (BOW cosine) | ✅ Active | Similarity |
| `semantic_embeddings.py` | ❌ Dormant | Not wired |
| `ollama_service.py` | ⚠️ Active with fallback | Explanations only |
| Sentence Transformers | ❌ Not used | Flag off, model not cached |
| LLM scoring | ❌ Never | By design |

### Scoring algorithm (production)

Weighted field concatenation → pairwise BOW cosine vs corpus → heuristic tech/scope/market sub-scores → aggregate `overall_score`.

### Known AI limitations

| Limitation | Impact |
|------------|--------|
| BOW labeled "TF-IDF" but no IDF term | Weak paraphrase detection |
| 50% duplicate threshold | Misses pairs at 49.79% (eval P4A↔P4B) |
| Only 1/5 eval paraphrase pairs flagged | Documented in `EVAL_CORPUS_ANALYSIS_REPORT.md` |
| V2 not integrated | No semantic embeddings in scoring |

---

## 5. Relevancy Results Coverage

### System-wide

| Metric | Value |
|--------|------:|
| Total projects | 40 |
| With `relevancy_results` | **29** (72.5%) |
| Missing | **11** (27.5%) |
| Average `overall_score` (analyzed) | **67.59** |
| Highest score | **80.71** — ID 3 |
| Lowest score | **44.02** — ID 6 |

### Missing relevancy (11 projects)

| ID | Segment |
|----|---------|
| 1 | Legacy |
| 31–40 | **All university proposals** |

### Coverage by segment

| Segment | Total | Analyzed | Coverage |
|---------|------:|---------:|---------:|
| Legacy (1, 3–10) | 9 | 8 | **88.9%** |
| Eval corpus (11–30) | 20 | 20 | **100%** |
| University (31–40) | 10 | 0 | **0%** |
| Other (41) | 1 | 1 | **100%** |

---

## 6. Duplicate Detection Coverage

Duplicate reports are created when V1 similarity ≥ **50%** during `run_relevancy_analysis()`.

### System-wide

| Metric | Value |
|--------|------:|
| Total duplicate reports | **5** |
| Projects involved in ≥1 report | **6** (IDs 3, 6, 21, 25, 26, 39, 41) |
| Analyzed projects with **no** duplicate involvement | **23** |
| Unanalyzed (cannot generate own reports) | **11** |

### All duplicate pairs (ranked)

| Rank | Pair | Similarity | Risk |
|------|------|----------:|:----:|
| 1 | #3 ↔ #6 (Legacy exact duplicate) | 100.00% | HIGH |
| 2 | #39 ↔ #41 (CipherPlay ↔ Scavenger Hunt) | 64.05% | MEDIUM |
| 3 | #3 ↔ #21 (Legacy ↔ EVAL-P1A) | 58.16% | LOW |
| 4 | #6 ↔ #21 (Legacy ↔ EVAL-P1A) | 58.16% | LOW |
| 5 | #25 ↔ #26 (EVAL-P3A ↔ EVAL-P3B paraphrase) | 53.27% | LOW |

### Coverage by segment

| Segment | In duplicate report | Notes |
|---------|:-------------------:|-------|
| Legacy | 2/9 (IDs 3, 6) | Exact duplicate detected |
| Eval | 3/20 (IDs 21, 25, 26) | 1/5 paraphrase pairs flagged |
| University | 1/10 (ID 39 only, passive) | Triggered when ID 41 analyzed, not from own run |

### Not yet detected (pending university backfill)

- **CareerCraft (#38) ↔ Qaiser career coaching (#40)** — ~67% in file audit, **not in DB**.

---

## 7. Ollama Explanation Coverage

### Live check

| Check | Result |
|-------|--------|
| `http://localhost:11434` | **Not reachable** |
| `OLLAMA_ENABLED` in settings | `true` |
| `explanation_status = generated` in DB | **0** |
| `explanation_status = fallback` in DB | **21** |
| Empty `why_relevant` | **8** (legacy IDs 3–10) |

### Coverage by segment

| Segment | Fallback | Generated | Empty | N/A (no relevancy) |
|---------|:--------:|:---------:|:-----:|:------------------:|
| Legacy (3–10 analyzed) | 0 | 0 | **8** | 1 (ID 1) |
| Eval (11–30) | **20** | 0 | 0 | 0 |
| University (31–40) | 0 | 0 | 0 | **10** |
| Other (41) | 1 | 0 | 0 | 0 |

### Interpretation

Ollama integration **exists in code** but **live generation has never succeeded** in this environment. Eval backfill used rule-based fallback text. Legacy projects pre-date Ollama migration and have empty explanation fields.

---

## 8. University Proposal Coverage (IDs 31–40)

| ID | Title (short) | Relevancy | Duplicate | Ollama | Demo-ready |
|----|---------------|:---------:|:---------:|:------:|:----------:|
| 31 | Classroom noise + lecture notes | ❌ | ❌ | ❌ | ❌ |
| 32 | Smart relocation / property finder | ❌ | ❌ | ❌ | ❌ |
| 33 | Retinal disease detection | ❌ | ❌ | ❌ | ❌ |
| 34 | IHIS health system | ❌ | ❌ | ❌ | ❌ |
| 35 | "Can I Resell This?" waste-to-value | ❌ | ❌ | ❌ | ❌ |
| 36 | AI tuition recommendation | ❌ | ❌ | ❌ | ❌ |
| 37 | ScholarIQ scholarships | ❌ | ❌ | ❌ | ❌ |
| 38 | CareerCraft interview/resume | ❌ | ❌ | ❌ | ❌ |
| 39 | CipherPlay children's fitness | ❌ | ⚠️ passive | ❌ | ❌ |
| 40 | Qaiser career coaching | ❌ | ❌ | ❌ | ❌ |

### Summary

| Metric | Value |
|--------|------:|
| Imported | **10/10** |
| Proposal fields populated | **10/10** |
| Relevancy analyzed | **0/10** |
| Demo-ready | **0/10** |

**Root cause:** Import intentionally skipped AI analysis (`UNIVERSITY_PROPOSALS_IMPORT_REPORT.md`). No backfill script has been run for IDs 31–40.

---

## 9. Evaluation Corpus Coverage (IDs 11–30)

| Metric | Value |
|--------|------:|
| Projects present | **20/20** |
| Relevancy analyzed | **20/20** ✅ |
| Ollama fallback explanations | **20/20** ✅ |
| Ollama generated explanations | **0/20** |
| In duplicate reports | **3/20** (IDs 21, 25, 26) |
| Average `overall_score` | **67.44** |
| Score range | 56.67 – 76.37 |

### Eval duplicate detection (designed paraphrase pairs)

| Pair | Detected? | Similarity |
|------|:---------:|----------:|
| P1A ↔ P1B | No | — |
| P2A ↔ P2B | No | — |
| P3A ↔ P3B | **Yes** | 53.27% |
| P4A ↔ P4B | No | 49.79% (below threshold) |
| P5A ↔ P5B | No | — |

**Eval corpus is the strongest demo asset** — fully scored, labeled, and repeatable.

---

## 10. Remaining Blockers Before Viva

### Critical (must address for full demo)

| # | Blocker | Impact | Effort |
|---|---------|--------|--------|
| **C1** | **University proposals 31–40 not analyzed** | Cannot demo real imported PDF/DOCX proposals | ~5–15 min backfill |
| **C2** | **CareerCraft (#38) vs Qaiser (#40) not scored** | Key duplicate demo pair missing from DB | Resolved by C1 |
| **C3** | **Ollama not running** | No live AI explanation demo; all fallback | Start `ollama serve` |

### High (should address)

| # | Blocker | Impact |
|---|---------|--------|
| H1 | Legacy IDs 3–10 have empty explanations | Relevancy page shows no explanation panel for legacy |
| H2 | Legacy ID 1 missing relevancy | Gap in legacy corpus |
| H3 | V1 paraphrase detection weak | Only 1/5 eval pairs flagged — be honest in viva |
| H4 | First GET on unanalyzed project runs sync analysis | Demo latency risk |

### Medium (acknowledge, not blocking)

| # | Blocker | Impact |
|---|---------|--------|
| M1 | V2 semantic engine not integrated | Cannot claim SentenceTransformer scoring |
| M2 | ST model not cached offline | V2 blocked even if enabled |
| M3 | Default `SECRET_KEY` in `.env` | Dev-only security |
| M4 | BOW labeled TF-IDF | Terminology accuracy in viva |

### Low (post-viva)

| # | Blocker |
|---|---------|
| L1 | 3 university PDFs skipped (Not Ready) |
| L2 | Background job queue for analysis |
| L3 | Production hardening (workers, secrets) |

---

## Summary Matrix: Complete / Partial / Missing

### ✅ Complete

- React frontend running with full role-based UI
- FastAPI backend running with health check and Swagger
- PostgreSQL connected with 40 projects and 6 users
- JWT authentication (student, professor, admin)
- V1 relevancy engine production-ready
- Eval corpus 100% analyzed (20/20)
- University proposals 100% imported (10/10)
- Duplicate detection pipeline functional (5 reports exist)
- Ollama explanation code path with fallback
- Proposal V3 form fields in DB
- Admin duplicate reports API
- Documentation: `AI_ENGINE_AUDIT.md`, `AI_EVALUATION_REPORT.md`, import reports

### ⚠️ Partially complete

- Relevancy coverage overall (29/40 = 72.5%)
- Legacy segment (8/9 analyzed; no explanations on 3–10)
- Duplicate detection (6/40 projects involved; paraphrase gaps)
- Ollama (21 fallback, 0 generated; server down)
- Viva readiness (~70% — eval yes, university no)
- AI engine (V1 only; V2 prerequisites exist but dormant)

### ❌ Missing

- Relevancy analysis for university IDs **31–40**
- Relevancy analysis for legacy ID **1**
- Live Ollama-generated explanations (0 in DB)
- V2 semantic scoring integration
- DB columns for V2 scores
- Cached Sentence Transformer model
- University proposal backfill script (must reuse existing pipeline manually)
- CareerCraft ↔ Qaiser duplicate report in DB

---

## Critical Issues

| Priority | Issue | Evidence |
|:--------:|-------|----------|
| 🔴 P0 | **10/10 university proposals unanalyzed** | `relevancy_results` has 0 rows for IDs 31–40 |
| 🔴 P0 | **Ollama server offline** | `localhost:11434` unreachable; 0 `generated` explanations |
| 🟠 P1 | **Misleading frontend error on DB failures** | Login showed "Cannot reach server" during PG password error |
| 🟠 P1 | **V1 paraphrase blind spot** | 4/5 eval paraphrase pairs not flagged |
| 🟡 P2 | **Legacy explanations empty** | IDs 3–10 analyzed pre-Ollama migration |
| 🟡 P2 | **V2 not production-ready** | Flag off, no integration, no model cache |

---

## Recommended Next Actions

### Before viva (ordered by priority)

| Step | Action | Command / method | Time |
|------|--------|------------------|-----:|
| **1** | **Backfill relevancy for IDs 31–40 and 1** | Run `run_relevancy_analysis()` per project via script or open each relevancy page once while logged in | 10–20 min |
| **2** | **Verify CareerCraft (#38) vs Qaiser (#40) duplicate** | Check admin duplicate reports after step 1 | 2 min |
| **3** | **Start Ollama (optional live demo)** | `ollama serve` → `ollama pull llama3.2` → re-open relevancy GET for 1–2 projects | 15 min |
| **4** | **Pre-warm demo projects** | Open relevancy for EVAL-P3A (#25), legacy #3/#6, and 2 university IDs | 5 min |
| **5** | **Run E2E verification** | `python -m scripts.verify_e2e_flows` from `backend/` | 2 min |
| **6** | **Prepare viva narrative** | Demo eval paraphrase pair (#25↔#26); acknowledge V1 limits; show university scores post-backfill | — |

### Minimum viva path (if no time for backfill)

Demo **eval corpus only**:
- Exact duplicate: #3 ↔ #6 (100%)
- Paraphrase: #25 ↔ #26 (53.27%)
- Cross-corpus: #21 vs legacy #3 (58.16%)
- State university proposals are imported and analysis is the immediate next step

### Post-viva (deferred)

- Implement V2 per `RELEVANCY_ENGINE_V2_IMPLEMENTATION_PLAN.md`
- Cache `all-MiniLM-L6-v2` via `download_sentence_transformer.py`
- Add university backfill script (mirror `backfill_eval_relevancy.py`)
- Backfill legacy explanation fields (GET relevancy with Ollama running)

---

## Live Environment Snapshot (23 June 2026)

| Service | URL | Status |
|---------|-----|:------:|
| Frontend | http://localhost:5173 | ✅ Up |
| Backend API | http://localhost:8000/api/v1 | ✅ Up |
| Backend health | http://localhost:8000/health | ✅ Up |
| Swagger | http://localhost:8000/docs | ✅ Up |
| Ollama | http://localhost:11434 | ❌ Down |
| PostgreSQL | localhost:5432 | ✅ Up |

### Test accounts

| Role | Email | Password |
|------|-------|----------|
| Student | `70140912@student.uol.edu.pk` | `Student123` |
| Professor | `professor@uol.edu.pk` | `Professor123` |
| Admin | `admin@uol.edu.pk` | `Admin123` |

---

## Related Documents

| Document | Scope |
|----------|-------|
| `AI_ENGINE_AUDIT.md` | AI engine code audit |
| `AI_EVALUATION_REPORT.md` | Database + AI evaluation |
| `EVAL_CORPUS_ANALYSIS_REPORT.md` | Eval backfill metrics |
| `UNIVERSITY_PROPOSALS_IMPORT_REPORT.md` | University import |
| `RELEVANCY_ENGINE_V2_IMPLEMENTATION_PLAN.md` | V2 roadmap |
| `AI_ENGINE_V2_READINESS.md` | V2 environment readiness |

---

*Read-only end-to-end audit. No application code was modified.*
