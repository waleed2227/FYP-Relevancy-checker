# Ollama Generation Report

**Date:** 23 June 2026  
**Scope:** University proposals IDs **31–40**  
**Model:** `llama3.2`  
**Script:** `backend/scripts/backfill_university_ollama_explanations.py --force`  
**Scoring modified:** **No** — only explanation fields updated

---

## Executive Summary

| Metric | Value |
|--------|------:|
| Ollama connection | ✅ Verified |
| Model `llama3.2` | ✅ Installed (Ollama 0.30.9) |
| Total processed | **10** |
| Success (`generated`) | **10** |
| Failed | **0** |
| Fallback remaining | **0** |
| Average Ollama response time | **19.79s** |
| Scores unchanged | ✅ All 10 verified |

**Result:** All university proposals now have **live Ollama-generated** explanations replacing prior fallback text.

---

## 1. Ollama Connection Verification

| Check | Result |
|-------|--------|
| `ollama --version` | `0.30.9` ✅ |
| `GET http://localhost:11434/api/tags` | HTTP 200 ✅ |
| Backend `OLLAMA_BASE_URL` | `http://localhost:11434` ✅ |
| Backend `OLLAMA_ENABLED` | `true` ✅ |

---

## 2. Model Verification

| Check | Result |
|-------|--------|
| `ollama list` | `llama3.2:latest` (2.0 GB) ✅ |
| Backend `OLLAMA_MODEL` | `llama3.2` ✅ |
| Model match | ✅ Compatible (`llama3.2:latest` resolves to `llama3.2`) |

---

## 3. Generation Run

### Command

```powershell
cd "d:\FYP UNI\FYP-Relevancy-checker\backend"
.\venv\Scripts\activate
python -m scripts.backfill_university_ollama_explanations --force
```

### Per-project results

| ID | Title (short) | Status | Time | Score (unchanged) |
|----|---------------|:------:|-----:|------------------:|
| 31 | Classroom noise + lecture notes | **generated** | 20.4s | 69.71 |
| 32 | Smart relocation / property | **generated** | 16.2s | 77.34 |
| 33 | Retinal disease detection | **generated** | 13.3s | 70.85 |
| 34 | IHIS health system | **generated** | 19.6s | 71.50 |
| 35 | Can I Resell This? | **generated** | 16.5s | 77.03 |
| 36 | AI tuition recommendation | **generated** | 27.9s | 67.57 |
| 37 | ScholarIQ scholarships | **generated** | 16.5s | 60.04 |
| 38 | CareerCraft interview/resume | **generated** | 18.4s | 63.63 |
| 39 | CipherPlay children's fitness | **generated** | 26.8s | 53.61 |
| 40 | Qaiser career coaching | **generated** | 22.3s | 56.68 |

### Summary statistics

| Metric | Value |
|--------|------:|
| **Total processed** | 10 |
| **Success (`generated`)** | 10 |
| **Failed** | 0 |
| **Fallback** | 0 |
| **Average response time** | **19.79s** |
| Min response time | 13.34s (ID 33) |
| Max response time | 27.87s (ID 36) |
| Total wall time | ~3.6 minutes |

---

## 4. Fallback → Generated Replacement

| Before | After |
|--------|-------|
| 10/10 `explanation_status = fallback` | **10/10 `generated`** |
| `ollama_model = llama3.2` (attempted) | `ollama_model = llama3.2` ✅ |
| Rule-based `why_relevant` text | LLM JSON-parsed explanations |

All `relevancy_results` rows for IDs 31–40 updated in place. **No new rows created. No score columns modified.**

---

## 5. Verification

### 5.1 Database — `explanation_status = generated`

| ID | status | ollama_model | `why_relevant` length |
|----|:------:|:------------:|----------------------:|
| 31 | generated | llama3.2 | 248 chars |
| 32 | generated | llama3.2 | 335 chars |
| 33 | generated | llama3.2 | 215 chars |
| 34 | generated | llama3.2 | 408 chars |
| 35 | generated | llama3.2 | 338 chars |
| 36 | generated | llama3.2 | 225 chars |
| 37 | generated | llama3.2 | 216 chars |
| 38 | generated | llama3.2 | 291 chars |
| 39 | generated | llama3.2 | 412 chars |
| 40 | generated | llama3.2 | 218 chars |

**Coverage: 10/10 (100%)**

### 5.2 API — returns generated explanation

| Project | Role | HTTP | `explanation.status` |
|---------|------|:----:|:--------------------:|
| #31 | Student (owner) | 200 | **generated** |
| #40 | Student (owner) | 200 | **generated** |
| #38 | Admin | 200 | **generated** |
| #39 | Admin | 200 | **generated** |
| #39 | Student (owner) | 200 | **generated** |

Access control verified: student `70140912` receives 400 for #38/#39 (owned by other students) — expected.

**Fix applied for API delivery:** `get_relevancy` route now eager-loads `professor.user` (resolves prior HTTP 500).

### 5.3 UI — displays generated explanation

| Component | Behavior | Verified |
|-----------|----------|:--------:|
| `RelevancyExplanationPanel.tsx` | Renders when `explanation.why_relevant` present | ✅ |
| API payload | Includes `explanation.status`, `ollama_model`, all text fields | ✅ |
| Badge | Shows "AI Generated" when `status === 'generated'` | ✅ Code path |

**UI test:** Log in as student → open My Projects → view relevancy for project **#31** or **#40** → AI Relevancy Explanation panel should show Ollama text with generated badge.

---

## 6. Sample Generated Explanations

### ID 32 — Smart Relocation Assistance (score 77.34, 16.2s)

**why_relevant:**
> The Smart Relocation Assistance and Property Finder System is relevant as it addresses a pressing need for users searching for property in unfamiliar areas, providing a structured search experience and integrated relocation services. This project's focus on Pakistan's specific context also brings a unique perspective to the field.

### ID 38 — CareerCraft AI (score 63.63, 18.4s)

**why_relevant:**
> CareerCraft AI addresses a significant gap in job seeker support by providing holistic career readiness with adaptive mock interviews, resume optimization, skill-gap detection, and progress dashboards, making it relevant to university students, graduates, and career-switching professionals.

**similar_projects_summary:**
> The most similar projects are 'AI-Powered Career Coaching and Job Preparation Platform' (2026) with a similarity score of 52.69%, which shares the goal of providing AI-powered support for job seekers.

### ID 39 — CipherPlay (score 53.61, 26.8s)

**why_relevant:**
> CipherPlay is relevant as it addresses a pressing issue of high daily passive screen time among children aged 4–14, promoting indoor physical activity under parental supervision. By leveraging AI-powered object detection and encryption, it bridges the gap between screen time and physical engagement.

**similar_projects_summary:**
> The most similar project is 'AI-Powered Privacy-First Scavenger Hunt for Children', with a similarity score of 64.05%. Both projects utilize AI technology (YOLO object detection and true random encryption).

---

## 7. Scoring Integrity

| Check | Result |
|-------|:------:|
| `overall_score` unchanged (all 10) | ✅ |
| `similarity_score` unchanged | ✅ |
| No `run_relevancy_analysis()` called | ✅ |
| Only explanation columns updated | ✅ |

---

## 8. Technical Notes

- **Lazy-load fix:** Backfill script loads `student.user`; relevancy API route loads `professor.user`.
- **Prompt constraint:** Ollama instructed not to recalculate similarity percentages — uses pre-computed scores from V1 engine.
- **Re-run safe:** `python -m scripts.backfill_university_ollama_explanations` skips already-generated unless `--force`.

---

## 9. Commands Reference

```powershell
# Regenerate all university explanations
cd backend
.\venv\Scripts\activate
python -m scripts.backfill_university_ollama_explanations --force

# Verify Ollama
ollama list
Invoke-WebRequest http://localhost:11434/api/tags -UseBasicParsing
```

---

*Generation completed 23 June 2026. All 10 university proposals have live Ollama explanations.*
