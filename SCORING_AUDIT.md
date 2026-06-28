# Scoring Audit

Read-only audit of how relevancy scores are produced, persisted, returned by the API, and displayed in the frontend. All line numbers refer to the repository state at audit time.

---

## 1. SCORE INVENTORY

| Score name | File path | Line number | How it's produced | Where it's stored |
|---|---|---:|---|---|
| **Similarity score** (max corpus overlap) | `backend/app/ai/relevancy_engine.py` | 134, 160 | **Computed in code** — `similarity_between()` (BOW cosine × 100) for each corpus project; `max_similarity` stored as `similarity_score` | `relevancy_results.similarity_score` (line 27, `backend/app/models/relevancy.py`); also copied into `RelevancyExplanation.similarity_score` at response time (not a separate DB column) |
| **Novelty score** | `backend/app/ai/relevancy_engine.py` | 156 | **Computed in code** — `max(30, 100 - max_similarity × 0.8)` | `relevancy_results.novelty_score` (line 23, `backend/app/models/relevancy.py`) |
| **Innovation score** | `backend/app/ai/relevancy_engine.py` | 159 | **Computed in code** — `0.6 × novelty_score + 0.4 × market_relevance` | `relevancy_results.innovation_score` (line 26, `backend/app/models/relevancy.py`) |
| **Feasibility score** | `backend/app/ai/relevancy_engine.py` | 153–157 | **Computed in code** — average of `tech_score` (modern/legacy tech tokens) and `scope_score` (word count of scope/description) | `relevancy_results.feasibility_score` (line 24, `backend/app/models/relevancy.py`) |
| **Market relevance** | `backend/app/ai/relevancy_engine.py` | 155, 158 | **Computed in code** — derived from `_market_input_score()` (target industry, market gap, expected impact text length) | `relevancy_results.market_relevance` (line 25, `backend/app/models/relevancy.py`) |
| **Overall relevancy score** | `backend/app/ai/relevancy_engine.py` | 161–167 | **Computed in code** — weighted blend: `0.35×innovation + 0.25×feasibility + 0.25×novelty + 0.15×(100−similarity)` | `relevancy_results.overall_score` (line 22, `backend/app/models/relevancy.py`); **also** denormalized to `project_ideas.relevancy_score` (line 69, `backend/app/models/project.py`) at `project_service.py` line 511 |
| **AI confidence** | `backend/app/ai/relevancy_engine.py` | 168 | **Computed in code** — `min(95, 70 + 5 × matched_count)` | `relevancy_results.ai_confidence` (line 28, `backend/app/models/relevancy.py`) |
| **Per-match similarity** (matched-project rows, not the headline score) | `backend/app/ai/embeddings.py` | 54–56 | **Computed in code** — same `similarity_between()` per corpus pair | `matched_projects.similarity` (line 59, `backend/app/models/relevancy.py`) |

**Ollama / llama3.2:** The explanation service (`backend/app/ai/ollama_service.py`) receives pre-computed scores in the prompt (lines 35–39, 93–96) and returns **text fields only** (lines 222–228). It does **not** parse numeric relevancy scores from the LLM JSON response.

**Not from LLM:** None of the seven headline scores above are parsed from Ollama output in production code.

---

## 2. DATA FLOW

### 2.1 Creation (all scores)

| Step | Location |
|---|---|
| Corpus load | `project_service.run_relevancy_analysis()` — `backend/app/services/project_service.py` lines 497–508 |
| Engine invocation | Line 510: `analysis = engine.analyze(...)` |
| Similarity primitive | `similarity_between()` — `backend/app/ai/embeddings.py` lines 54–56; called from `relevancy_engine.py` line 134 |
| Score formulas | `RelevancyEngine.analyze()` — `backend/app/ai/relevancy_engine.py` lines 125–187 |
| Denormalize overall to project row | `project.relevancy_score = analysis.overall_score` — `project_service.py` line 511 |
| Insert `RelevancyResult` row | `project_service.py` lines 521–531 |
| Insert matched-project rows | `project_service.py` lines 535–546 (`similarity` from `analysis.matched`) |
| Ollama explanation (text only, no score recalculation) | `_apply_explanation_to_relevancy()` — `project_service.py` lines 176–192; called at line 557 |
| Trigger on submit | `POST /projects` — `backend/app/routes/projects.py` lines 65–66 |
| Trigger on GET if missing | `GET /projects/{id}/relevancy` — `backend/app/routes/projects.py` lines 147–148 |

### 2.2 Persistence

| Score | DB table.column |
|---|---|
| Overall | `relevancy_results.overall_score` + `project_ideas.relevancy_score` |
| Novelty, innovation, feasibility, market, similarity, AI confidence | `relevancy_results.*` (see `backend/app/models/relevancy.py` lines 22–28) |
| Per-match similarity | `matched_projects.similarity` |

### 2.3 API endpoints that return scores

| Score | Endpoint | Builder | Response field |
|---|---|---|---|
| Overall | `GET /api/v1/projects/{id}/relevancy` | `build_relevancy_result_response()` line 458 | `overall_score` |
| Novelty | Same endpoint | Lines 430–433 (`insights[0]`, formatted as `"{novelty_score}%"`) | `insights[0].value` |
| Feasibility | Same endpoint | Lines 435–438 (numeric threshold → `"High"` / `"Moderate"`) | `insights[1].value` |
| Market relevance | Same endpoint | Lines 440–443 | `insights[2].value` |
| Similarity (headline) | Same endpoint | `_relevancy_explanation_from_result()` line 164 | `explanation.similarity_score` |
| Per-match similarity | Same endpoint | Lines 446–455 | `matched_projects[].similarity` |
| Innovation | **NOT** in `RelevancyResultResponse` | — | NOT FOUND on student relevancy endpoint |
| AI confidence | **NOT** in `RelevancyResultResponse` | — | NOT FOUND on student relevancy endpoint |
| Overall (list) | `GET /api/v1/projects/my` | `_project_to_response()` line 239 | `relevancyScore` |
| Overall + innovation + similarity + feasibility + AI confidence | `GET /api/v1/projects/assigned` | `_to_review_queue_item()` lines 219–225 | `relevancyScore`, `innovationScore`, `similarityScore`, `feasibilityScore`, `aiConfidence` |
| Same professor queue shape | `GET /api/v1/projects/review-queue` | `get_review_queue()` line 644 → `_to_review_queue_item()` | Same fields as assigned |

Route definitions: `backend/app/routes/projects.py` lines 83–87 (my), 97–101 (assigned), 104–108 (review-queue), 129–152 (relevancy).

### 2.4 Frontend display

| Score | Component | Source |
|---|---|---|
| Overall relevancy | `Frontend/src/app/components/RelevancyResults.tsx` | Lines 41–54: `GET /projects/{id}/relevancy` → `data.overall_score`; displayed lines 139–163 |
| Novelty, feasibility, market | `RelevancyResults.tsx` | Lines 55, 177–188: `data.insights` |
| Similarity (headline) | `RelevancyResults.tsx` → `RelevancyExplanationPanel.tsx` | Lines 57, 170–173: `data.explanation?.similarity_score`; panel displays line 53 of `RelevancyExplanationPanel.tsx` |
| Per-match similarity | `RelevancyResults.tsx` | Lines 58–66, 280–291: `matched_projects[].similarity` |
| Overall (dashboard list) | `Frontend/src/app/components/StudentDashboard.tsx` | Lines 267–268: `project.relevancyScore` from `GET /projects/my` |
| Overall (my projects) | `Frontend/src/app/components/MyProjects.tsx` | Lines 234–235: `project.relevancyScore` |
| Innovation, similarity, feasibility, AI confidence | `Frontend/src/app/components/AdvancedReviewModal.tsx` | Lines 217–269: `project.innovationScore`, `project.similarityScore`, `project.feasibilityScore`, `project.aiConfidence` from `GET /projects/assigned` payload |
| Innovation (queue table) | `Frontend/src/app/components/ReviewQueue.tsx` | Lines 158–161: `submission.innovationScore` from `GET /projects/review-queue` line 23 |
| Overall (professor dashboard) | `Frontend/src/app/components/ProfessorDashboard.tsx` | Lines 365–366: `submission.relevancyScore` from `GET /projects/assigned` line 28 |
| Explanation text + similarity fallback | `AdvancedReviewModal.tsx` | Lines 55–61: optional `GET /projects/{id}/relevancy` for explanation only |

**Innovation score on student relevancy page:** NOT FOUND (not included in `RelevancyResultResponse` or `RelevancyResults.tsx`).

**AI confidence on student relevancy page:** NOT FOUND.

---

## 3. STUDENT VS PROFESSOR VIEW

Both roles ultimately read from the **same underlying DB records** (`relevancy_results` joined to `project_ideas`), but they use **different API endpoints** and **different response shapes**.

### Same stored record

Scores are written once in `run_relevancy_analysis()`:

```521:531:backend/app/services/project_service.py
    relevancy = RelevancyResult(
        project_id=project.id,
        overall_score=analysis.overall_score,
        novelty_score=analysis.novelty_score,
        feasibility_score=analysis.feasibility_score,
        market_relevance=analysis.market_relevance,
        innovation_score=analysis.innovation_score,
        similarity_score=analysis.similarity_score,
        ai_confidence=analysis.ai_confidence,
        summary=analysis.summary,
    )
```

Overall is also copied to the project row:

```510:511:backend/app/services/project_service.py
    analysis = engine.analyze(_to_relevancy_analysis_dict(project), corpus)
    project.relevancy_score = analysis.overall_score
```

### Student path

- **List / dashboard:** `GET /projects/my` returns `ProjectResponse.relevancyScore` from `project.relevancy_score` (not the full `relevancy_results` row):

```238:239:backend/app/services/project_service.py
        status=project.status.value,
        relevancyScore=project.relevancy_score,
```

- **Detail relevancy page:** `GET /projects/{id}/relevancy` returns `RelevancyResultResponse` built from `rel.*` fields:

```457:464:backend/app/services/project_service.py
    return RelevancyResultResponse(
        overall_score=rel.overall_score,
        is_high_relevancy=rel.overall_score >= 70,
        insights=insights,
        matched_projects=matched,
        explanation=_relevancy_explanation_from_result(rel),
        project=_project_to_response(project, prof_name),
    )
```

Student frontend fetch:

```41:57:Frontend/src/app/components/RelevancyResults.tsx
        const data = await api.get<{
          overall_score: number;
          insights: { label: string; value: string; description: string }[];
          explanation?: RelevancyExplanationData | null;
          matched_projects: {
            id: number;
            title: string;
            similarity: number;
            year?: string;
            status?: string;
            author?: string;
          }[];
        }>(`/projects/${idea.id}/relevancy`);
        setRelevancyScore(Math.round(data.overall_score));
        setInsights(data.insights);
        setExplanation(data.explanation ?? null);
        setSimilarityScore(data.explanation?.similarity_score ?? null);
```

### Professor path

- **Dashboard / assigned list:** `GET /projects/assigned` returns `ReviewQueueItem` with scores read from `project.relevancy_result`:

```219:226:backend/app/services/project_service.py
        relevancyScore=project.relevancy_score,
        status=project.status.value,
        feedback=project.feedback,
        innovationScore=rel.innovation_score if rel else project.relevancy_score,
        similarityScore=rel.similarity_score if rel else None,
        feasibilityScore=rel.feasibility_score if rel else None,
        aiConfidence=rel.ai_confidence if rel else None,
        aiExplanation=_relevancy_explanation_from_result(rel),
```

Professor frontend fetch:

```28:29:Frontend/src/app/components/ProfessorDashboard.tsx
      const data = await api.get<any[]>('/projects/assigned');
      setSubmissions(data);
```

- **Review queue:** Same `ReviewQueueItem` shape via `GET /projects/review-queue` (`ReviewQueue.tsx` line 23).
- **Modal explanation (optional second fetch):** `GET /projects/{id}/relevancy` when `aiExplanation` is not already embedded (`AdvancedReviewModal.tsx` lines 55–61).

### Summary

| Aspect | Student | Professor |
|---|---|---|
| Primary endpoint | `GET /projects/{id}/relevancy` (+ `GET /projects/my` for list) | `GET /projects/assigned` / `GET /projects/review-queue` |
| Same DB row? | Yes — `relevancy_results` for detail; `project_ideas.relevancy_score` for list | Yes — `relevancy_results` via `_to_review_queue_item()` |
| Innovation score exposed? | No | Yes (`innovationScore`) |
| AI confidence exposed? | No | Yes (`aiConfidence`) |
| Feasibility format | `"High"` / `"Moderate"` string in `insights` | Raw numeric `feasibilityScore` |

Both views can call the **same** relevancy detail endpoint for explanations; numeric scores on the professor modal come from the list endpoint, not from Ollama.

---

## 4. ROOT-CAUSE CANDIDATES (LLM vs code drift)

### 4.1 No numeric scores parsed from LLM (production)

`generate_relevancy_explanation()` only extracts text from the Ollama JSON response:

```222:228:backend/app/ai/ollama_service.py
            return {
                "why_relevant": str(parsed.get("why_relevant", "")).strip(),
                "similar_projects_summary": str(parsed.get("similar_projects_summary", "")).strip(),
                "objectives_overlap": str(parsed.get("objectives_overlap", "")).strip(),
                "problem_domains_overlap": str(parsed.get("problem_domains_overlap", "")).strip(),
                "unique_aspects": str(parsed.get("unique_aspects", "")).strip(),
                "novelty_suggestions": _parse_novelty_suggestions(parsed.get("novelty_suggestions")),
                "ollama_model": model,
```

There is **no** `parsed.get("similarity_score")`, `parsed.get("overall_score")`, or similar. Headline scores are **not** sourced from llama3.2 output in code.

`similarity_score` on the explanation object is injected from the DB at build time, not from the LLM:

```163:164:backend/app/services/project_service.py
    return RelevancyExplanation(
        similarity_score=rel.similarity_score,
```

### 4.2 Narrative drift (LLM prose may contradict stored numbers)

These lines persist **free-text** from Ollama that may embed percentages or rankings not validated against stored scores:

| File | Lines | Risk |
|---|---|---|
| `backend/app/ai/ollama_service.py` | 21, 35–39 | Prompt instructs LLM to use pre-computed scores but cannot enforce compliance |
| `backend/app/ai/ollama_service.py` | 222–228 | Parsed LLM text fields stored to DB |
| `backend/app/services/project_service.py` | 184–188 | LLM text written to `why_relevant`, `similar_projects_summary`, etc. |
| `Frontend/src/app/components/RelevancyExplanationPanel.tsx` | 59–61, 63–67 | User-visible prose from LLM may mention hardcoded percentages |
| `backend/app/ai/ollama_service.py` | 139–141 | Fallback `similar_projects_summary` embeds `{top.get('similarity')}%` from **code** matched list (not LLM) |

If users report "the explanation says 80% but the score shows 52%", the mismatch is in **narrative text**, not in parsed score fields.

### 4.3 Cross-view / cross-field inconsistencies (code, not LLM)

| File | Lines | Issue |
|---|---|---|
| `backend/app/services/project_service.py` | 222 | `innovationScore` falls back to `project.relevancy_score` (overall) when `rel` is missing — conflates two different metrics |
| `backend/app/services/project_service.py` | 437 | Feasibility returned to students as categorical `"High"` / `"Moderate"`, while professors see raw `feasibilityScore` |
| `backend/app/schemas/project.py` | 151–157 | `RelevancyResultResponse` omits `innovation_score` and `ai_confidence` — student UI cannot show same numbers as professor modal |
| `project_ideas.relevancy_score` vs `relevancy_results.overall_score` | `project_service.py` 511 vs 523 | Same value at write time; if one were updated without the other, list vs detail could diverge (no separate update path found) |

### 4.4 Hardcoded / mock scores (not production pipeline)

These components display **hardcoded** numbers and do **not** read from `relevancy_results`:

| File | Lines | Notes |
|---|---|---|
| `Frontend/src/app/components/AllProjects.tsx` | 25–61, 166 | Static `innovationScore` in mock array |
| `Frontend/src/app/components/AIAnalytics.tsx` | 35, 279 | Hardcoded `aiConfidence: 85` |
| `Frontend/src/app/components/AdminAIReports.tsx` | 31–97, 267 | Mock `similarityScore` values |

### 4.5 Verdict on "drift bugs"

- **Structured numeric scores:** All seven inventory scores are **computed in code** (`relevancy_engine.py` + `embeddings.py`) and stored in PostgreSQL. **No production line parses a relevancy percentage from llama3.2 JSON into a score field.**
- **Likely perceived drift sources:** (1) LLM explanation prose citing different percentages; (2) student vs professor seeing different metrics/formats from the same DB row; (3) mock admin/demo pages with hardcoded values.

---

*Audit completed without modifying application code.*
