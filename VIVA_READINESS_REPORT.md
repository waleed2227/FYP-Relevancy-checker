# Viva Readiness Report

**Date:** 23 June 2026  
**Project:** AI-Based FYP Relevancy System  
**Type:** Read-only evaluation — no implementation

---

## Overall Viva Readiness: ⚠️ **Conditional — 75%**

The system demonstrates a **complete FYP architecture** with working auth, submission, V1 AI scoring, duplicate detection, and a rich dataset. Two gaps reduce demo confidence: **relevancy API HTTP 500** and **no live Ollama explanations**.

---

## 1. Feature Completeness Matrix

### ✅ Complete

| Feature | Evidence |
|---------|----------|
| JWT authentication (student/professor/admin) | E2E login PASS |
| Role-based dashboards | Frontend routes in `App.tsx` |
| Proposal submission (V3 fields) | `IdeaSubmissionForm`, `POST /projects` |
| V1 relevancy scoring engine | 39/40 projects scored in DB |
| Eval corpus (20 projects) | 100% analyzed |
| University proposals (10 real PDFs) | 100% imported + scored |
| Duplicate detection | 9 reports in DB |
| Admin duplicate alerts API | `GET /admin/duplicate-reports` PASS |
| Professor review queue | `GET /projects/review-queue` PASS |
| Notifications | `GET /notifications` PASS |
| Fallback AI explanations in DB | 31 rows with `why_relevant` |
| Backfill scripts | eval + university + ollama explanation |

### ⚠️ Partially Complete

| Feature | Gap |
|---------|-----|
| Relevancy results page | API returns 500 (lazy-load bug) |
| Ollama explanations | 0 generated; all fallback |
| Legacy projects | ID 1 unanalyzed; IDs 3–10 no explanation text |
| Paraphrase detection | 1/5 eval pairs flagged (V1 limit) |
| Production security | Default `SECRET_KEY` in `.env` |

### ❌ Missing

| Feature | Notes |
|---------|-------|
| V2 semantic / SentenceTransformer scoring | Planned only (`AI_V2_ROADMAP.md`) |
| Live Ollama runtime | Not installed on machine |
| True TF-IDF (IDF term) | Implementation is BOW cosine |
| 3 university PDFs | Skipped at import (Not Ready format) |

---

## 2. Recommended Demo Flow (Viva Day)

### Primary flow (15–20 minutes)

| Step | Action | Talking point |
|------|--------|---------------|
| 1 | Login as **student** | JWT auth, role-based access |
| 2 | Show **My Projects** | Real university + eval submissions |
| 3 | Open **Smart Relocation (#32)** relevancy | Highest score 77.34 — low overlap = novel |
| 4 | Show **CareerCraft (#38) vs Qaiser (#40)** | Duplicate report 52.69% — career domain overlap |
| 5 | Show **CipherPlay (#39) vs Scavenger (#41)** | Strongest match 64.05% MEDIUM risk |
| 6 | Login as **admin** → Duplicate Reports | Admin oversight of AI flags |
| 7 | Login as **professor** → Review Queue | Workflow integration |
| 8 | Show **Swagger** `/docs` | REST API design |

### Backup if relevancy page fails (API 500)

- Demo via **Swagger** `GET /projects/{id}/relevancy` after fix, OR
- Show **admin duplicate reports** + **review queue scores** (`relevancyScore` field)
- Show **database rows** / backfill reports as evidence scoring works

### Eval corpus backup demo

- **#3 ↔ #6** exact duplicate (100% HIGH)
- **#25 ↔ #26** paraphrase pair (53.27% LOW)

---

## 3. Likely Viva Questions & Answers

| Question | Honest answer |
|----------|---------------|
| How does relevancy scoring work? | Weighted field concatenation → bag-of-words cosine vs corpus → heuristic sub-scores → weighted overall score (V1). See `AI_ENGINE_AUDIT.md`. |
| Is TF-IDF used? | Named TF-IDF in docs; implementation is BOW cosine without IDF. |
| Does the LLM calculate scores? | **No.** Ollama generates explanations only from pre-computed scores. |
| Why use Ollama if it doesn't score? | Natural-language explanations for students/professors; improves interpretability. |
| How is duplicate detection done? | V1 similarity ≥ 50% during analysis → `duplicate_reports` table. Not transformer embeddings yet. |
| Why didn't CareerCraft vs Qaiser score ~67%? | V1 lexical engine scored 52.69%. Paraphrase/semantic gap — V2 planned. |
| How many projects in your dataset? | 40 total: 9 legacy, 20 eval, 10 real university, 1 extra submission. |
| What is the eval corpus for? | Labeled test set with designed paraphrase/near-dup/unrelated pairs for engine validation. |
| What is V2? | Sentence Transformer semantic layer — roadmap only, not implemented. See `AI_V2_ROADMAP.md`. |
| What are system limitations? | BOW paraphrase weakness, Ollama optional, synchronous scoring, no background jobs. |
| How do you ensure data quality? | Import audit (`UNIVERSITY_PROPOSAL_AUDIT.md`), validation reports, backfill scripts. |
| Is it production-ready? | **No** — dev config, V1 engine, no V2, default secrets. Suitable as **FYP prototype**. |

---

## 4. Limitations to Acknowledge Honestly

| Limitation | Detail |
|------------|--------|
| **V1 lexical engine** | Misses 4/5 designed eval paraphrase pairs |
| **BOW not true TF-IDF** | No IDF weighting |
| **Ollama not scoring** | Explanations only; fallback when Ollama down |
| **No V2 semantic layer** | `RELEVANCY_ENGINE_V2_ENABLED=false` |
| **Synchronous analysis** | Large corpus slows POST/GET relevancy |
| **API 500 on relevancy GET** | Lazy-load bug — fix before demo if possible |
| **0 live Ollama explanations** | Install Ollama for generated status |
| **3 proposals not imported** | PDF format not matching V3 field extraction |

---

## 5. Pre-Viva Checklist

| Priority | Task | Status |
|:--------:|------|:------:|
| P0 | Fix `GET /relevancy` 500 (eager-load professor.user) | ❌ |
| P0 | Install Ollama + pull llama3.2 | ❌ |
| P1 | Run `backfill_university_ollama_explanations --force` | ❌ |
| P1 | Test relevancy page in browser for #32, #38, #39 | ❌ |
| P2 | Start backend + frontend + PostgreSQL | ✅ |
| P2 | Prepare admin login for duplicate demo | ✅ |
| P3 | Print/export key reports for panel | Optional |

---

## 6. Readiness by Stakeholder

| Stakeholder | Can demo? | Notes |
|-------------|:---------:|-------|
| Student | ⚠️ | Login OK; relevancy page may 500 |
| Professor | ✅ | Review queue works |
| Admin | ✅ | Duplicate reports work |
| External examiner (AI) | ✅ | Scoring + duplicates in DB; explain V1 limits |
| External examiner (live Ollama) | ❌ | Not installed |

---

## Related Documents

- `FINAL_E2E_VERIFICATION_REPORT.md`
- `FINAL_PROJECT_STATUS.md`
- `UNIVERSITY_ANALYSIS_RESULTS.md`
- `AI_V2_ROADMAP.md`

---

*Read-only viva assessment. No code changes in this document.*
