# University Analysis Results

**Project:** AI-Based FYP Relevancy System  
**Document type:** Read-only post-backfill analysis  
**Date:** 23 June 2026  
**Data source:** Live PostgreSQL query (`fyp_relevancy_system`)  
**Code modified:** None

---

## Executive Summary

| Metric | Value |
|--------|------:|
| Projects with `relevancy_results` | **39 / 40** (97.5%) |
| University proposals with scores (31–40) | **10 / 10** (100%) |
| Duplicate pairs involving university IDs | **5** |
| CareerCraft (#38) ↔ Career Coaching (#40) | **52.69%** — LOW risk, duplicate flagged |
| CipherPlay (#39) ↔ Scavenger Hunt (#41) | **64.05%** — MEDIUM risk, duplicate flagged |
| **Viva readiness (university demo)** | **✅ Yes** — with noted caveats |

---

## 1. How Many Projects Have `relevancy_results` Now?

| Metric | Count |
|--------|------:|
| Total projects in database | 40 |
| Projects with `relevancy_results` | **39** |
| Coverage | **97.5%** |

### Only missing project

| ID | Title | Segment |
|----|-------|---------|
| 1 | Smart Campus Navigation System | Legacy seed |

All other segments are fully covered:

| Segment | Analyzed | Total |
|---------|:--------:|:-----:|
| Legacy (3–10) | 8 | 8 |
| Eval corpus (11–30) | 20 | 20 |
| University (31–40) | **10** | **10** |
| Other (41) | 1 | 1 |

---

## 2. Which University Proposals Have Scores?

**All 10 university proposals (IDs 31–40) have relevancy scores.**

| ID | Title | Overall Score | Max Similarity | Explanation |
|----|-------|:-------------:|:--------------:|:-----------:|
| 31 | AI-Powered Real-Time Classroom Noise Detection and Automatic Lecture Notes Generator | 69.71 | 36.96% | fallback |
| 32 | Smart Relocation Assistance and Property Finder System | 77.34 | 24.86% | fallback |
| 33 | AI-Based Retinal Disease Detection System Using Deep Learning | 70.85 | 39.48% | fallback |
| 34 | Integrated Health Information System (IHIS) | 71.50 | 44.49% | fallback |
| 35 | AI-Based "Can I Resell This?" System for Waste-to-Value Optimization | 77.03 | 36.71% | fallback |
| 36 | AI Smart Tuition Recommendation System | 67.57 | 51.82% | fallback |
| 37 | ScholarIQ — AI Scholarship Recommendation Platform | 60.04 | 45.82% | fallback |
| 38 | CareerCraft AI — Intelligent Interview and Resume Mastery Platform | 63.63 | 52.69% | fallback |
| 39 | CipherPlay — AI-Powered Children's Indoor Fitness Game | 53.61 | 64.05% | fallback |
| 40 | AI-Powered Career Coaching and Job Preparation Platform | 56.68 | 52.69% | fallback |

**Score range (university):** 53.61 – 77.34  
**Average (university):** 66.79

---

## 3. Top 5 Highest Scoring University Proposals

| Rank | ID | Overall Score | Max Similarity | Title |
|------|----|:-------------:|:--------------:|-------|
| 🥇 1 | **32** | **77.34** | 24.86% | Smart Relocation Assistance and Property Finder System |
| 🥈 2 | **35** | **77.03** | 36.71% | AI-Based "Can I Resell This?" System for Waste-to-Value Optimization |
| 🥉 3 | **34** | **71.50** | 44.49% | Integrated Health Information System (IHIS) |
| 4 | **33** | **70.85** | 39.48% | AI-Based Retinal Disease Detection System Using Deep Learning |
| 5 | **31** | **69.71** | 36.96% | AI-Powered Real-Time Classroom Noise Detection and Automatic Lecture Notes Generator |

**Interpretation:** Highest scores correlate with **lower corpus similarity** (more novel relative to existing projects). Smart Relocation (#32) is the most distinct university proposal in the batch.

### Bottom 3 (for context)

| Rank | ID | Overall Score | Notes |
|------|----|:-------------:|-------|
| 8 | 38 | 63.63 | CareerCraft — matched to #40 |
| 9 | 40 | 56.68 | Qaiser career coaching — matched to #38 |
| 10 | 39 | 53.61 | CipherPlay — highest similarity in batch (64.05% vs #41) |

---

## 4. Duplicate Pairs Involving IDs 31–40

**5 duplicate reports** involve at least one university proposal ID:

| Rank | Project 1 | Project 2 | Similarity | Risk | Relationship |
|------|-----------|-----------|----------:|:----:|--------------|
| 1 | **#39** CipherPlay | **#41** Scavenger Hunt | **64.05%** | **MEDIUM** | Children's game domain overlap |
| 2 | **#38** CareerCraft | **#40** Career Coaching | **52.69%** | LOW | Career prep domain overlap |
| 3 | #21 EVAL-P1A | **#36** AI Tuition | 51.82% | LOW | Cross-corpus (eval ↔ university) |
| 4 | #3 Legacy FYP System | **#36** AI Tuition | 50.39% | LOW | Cross-corpus (legacy ↔ university) |
| 5 | #6 Legacy FYP System | **#36** AI Tuition | 50.39% | LOW | Cross-corpus (legacy ↔ university) |

### University-only pairs

| Pair | Similarity | Risk | In duplicate reports |
|------|----------:|:----:|:--------------------:|
| #38 ↔ #40 | 52.69% | LOW | ✅ Yes |
| #39 ↔ #41 | 64.05% | MEDIUM | ✅ Yes |

**Note:** #36 (AI Tuition) matched three legacy/eval projects at ~50–52% — all just above the 50% threshold.

---

## 5. CareerCraft (#38) vs Career Coaching (#40) Similarity

| Field | Value |
|-------|-------|
| **Cross similarity** | **52.69%** |
| Duplicate report | ✅ Yes |
| Risk level | **LOW** |
| Source project (when analyzed) | #38 matched #40 |
| Reverse match | #40 matched #38 at 52.69% |

### Score context

| ID | Title | Overall | Max Similarity |
|----|-------|--------:|---------------:|
| 38 | CareerCraft AI — Interview and Resume Mastery | 63.63 | 52.69% |
| 40 | AI-Powered Career Coaching and Job Preparation | 56.68 | 52.69% |

Both projects scored **below batch average** (66.79) due to high mutual similarity penalizing novelty. The V1 engine correctly flagged them as related career-domain proposals above the 50% duplicate threshold.

**Prior file audit estimate (~67%) vs engine score (52.69%):** V1 BOW cosine scored lower than the manual audit — typical paraphrase/lexical gap documented in `AI_ENGINE_AUDIT.md`.

---

## 6. CipherPlay (#39) vs Scavenger Hunt (#41) Similarity

| Field | Value |
|-------|-------|
| **Cross similarity** | **64.05%** |
| Duplicate report | ✅ Yes |
| Risk level | **MEDIUM** |
| Source | #39 matched #41 (also confirmed when #41 was analyzed earlier) |

### Score context

| ID | Title | Overall | Max Similarity |
|----|-------|--------:|---------------:|
| 39 | CipherPlay — AI-Powered Children's Indoor Fitness Game | **53.61** | **64.05%** |
| 41 | AI-Powered Privacy-First Scavenger Hunt for Children | 61.12 | 64.05% |

CipherPlay (#39) has the **lowest overall score** among university proposals because its highest corpus match (64.05%) is well above the duplicate threshold and heavily penalizes the novelty component.

This pair is the **strongest duplicate-risk demo** in the university batch.

---

## 7. Is the System Now Viva-Ready?

### Verdict: **✅ Yes — for university proposal demo** (with minor caveats)

| Check | Status | Detail |
|-------|:------:|--------|
| Frontend running | ✅ | `http://localhost:5173` — HTTP 200 |
| Backend running | ✅ | `http://localhost:8000/health` — HTTP 200 |
| Database connected | ✅ | Queries succeed |
| University relevancy (31–40) | ✅ | **10/10 scored** |
| Eval corpus (11–30) | ✅ | 20/20 scored |
| Duplicate detection | ✅ | 5 pairs involving university IDs |
| Key demo pairs in DB | ✅ | #38↔#40, #39↔#41 |
| Relevancy UI | ✅ | `GET /projects/{id}/relevancy` returns data instantly |
| Ollama live explanations | ⚠️ | 0 generated; all 10 university = fallback |
| V2 semantic engine | ⚠️ | Not integrated (not required for V1 viva) |
| Legacy ID 1 | ⚠️ | Still missing relevancy (non-blocking) |

### Recommended viva demo flow

1. **Smart Relocation (#32)** — highest score (77.34), low similarity — show as a novel proposal.
2. **CareerCraft (#38) vs Career Coaching (#40)** — duplicate pair at 52.69% — show career-domain overlap detection.
3. **CipherPlay (#39) vs Scavenger Hunt (#41)** — strongest match at 64.05% MEDIUM risk.
4. **Eval paraphrase pair (#25 ↔ #26)** — 53.27% — show eval corpus duplicate detection.
5. **Legacy exact duplicate (#3 ↔ #6)** — 100% HIGH — show worst-case scenario.

### Remaining caveats (acknowledge honestly in viva)

| Caveat | Impact |
|--------|--------|
| Ollama not running | Explanations show fallback text, not live LLM output |
| V1 BOW engine | Weaker on paraphrase than semantic V2 would be |
| CareerCraft ↔ Qaiser scored 52.69% not ~67% | Engine is lexical, not semantic |
| ID 1 unanalyzed | One legacy gap — irrelevant to university demo |

### Before viva (optional, not blocking)

```powershell
# Start Ollama for live explanation demo
ollama serve
ollama pull llama3.2

# Re-generate explanations (optional)
cd backend
python -m scripts.backfill_university_proposals --force
```

---

## Coverage Comparison: Before vs After Backfill

| Metric | Before (pre-backfill) | After (now) |
|--------|----------------------:|------------:|
| `relevancy_results` total | 29 | **39** |
| University analyzed | 0/10 | **10/10** |
| #38 ↔ #40 in duplicate reports | No | **Yes (52.69%)** |
| University duplicate reports | 1 passive | **5** |
| Viva-ready (university) | ❌ No | **✅ Yes** |

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `UNIVERSITY_BACKFILL_REPORT.md` | Backfill execution log |
| `AI_EVALUATION_REPORT.md` | Pre-backfill evaluation |
| `FINAL_SYSTEM_READINESS_REPORT.md` | Full system audit |
| `AI_ENGINE_AUDIT.md` | AI engine code audit |

---

*Read-only analysis. No application code was modified.*
