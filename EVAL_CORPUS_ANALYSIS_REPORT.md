# Eval Corpus Analysis Report

**Workflow:** Evaluation Corpus Deployment — Phases 6–7  
**Date:** June 2026  
**Engine:** V1 TF-IDF relevancy engine (unchanged)  
**Backfill script:** `backend/scripts/backfill_eval_relevancy.py`

---

## 1. Projects Analyzed

| Metric | Value |
|--------|------:|
| Eval projects found | 20 |
| Relevancy analyses run | **20** |
| Skipped | 0 |
| Failed | 0 |
| Eval without `relevancy_results` | **0** |

Backfill completed in ~54 seconds. Ollama explanations used **fallback text** (Ollama not running — expected; scoring unaffected).

---

## 2. Average Relevancy Score (Eval Corpus)

| Metric | Value |
|--------|------:|
| Average `overall_score` | **67.44** |
| Min | 56.67 (EVAL-P3A) |
| Max | 76.37 (EVAL-U05) |
| Average `similarity_score` | ~41.5 |
| Average `novelty_score` | ~67.8 |
| Average `ai_confidence` | 70.5 |

---

## 3. Duplicate Pairs Detected (≥50% TF-IDF)

Eval-involved duplicate reports after backfill:

| Project 1 | Project 2 | Similarity | Risk |
|-----------|-----------|----------:|------|
| Legacy #3 — AI FYP Relevancy System | EVAL-P1A (#21) | 58.16% | LOW |
| Legacy #6 — AI FYP Relevancy System | EVAL-P1A (#21) | 58.16% | LOW |
| EVAL-P3A (#25) | EVAL-P3B (#26) | **53.27%** | LOW |

**Total eval-related duplicate reports:** 3 (of 4 system-wide)

### Paraphrase pairs NOT flagged as duplicates (V1 gap)

| Pair | Cross similarity | Threshold | Flagged? |
|------|----------------:|----------:|:--------:|
| P1A ↔ P1B | Not cross-matched | 50% | **No** |
| P2A ↔ P2B | Not cross-matched | 50% | **No** |
| P4A ↔ P4B | 49.79% | 50% | **No** (just below) |
| P5A ↔ P5B | Not cross-matched | 50% | **No** |

Only **1 of 5** designed paraphrase pairs triggered duplicate detection under V1 TF-IDF.

---

## 4. Top 10 Similarity Matches (Eval Queries)

| Rank | Query | Matched | Similarity |
|------|-------|---------|----------:|
| 1 | EVAL-P1A (#21) | Legacy #6 — AI FYP Relevancy System | 58.16% |
| 2 | EVAL-P1A (#21) | Legacy #3 — AI FYP Relevancy System | 58.16% |
| 3 | EVAL-P3A (#25) | EVAL-P3B (#26) | 53.27% |
| 4 | EVAL-P3B (#26) | EVAL-P3A (#25) | 53.27% |

Only **4 eval-pair matches** exceeded internal ranking; no other eval-eval pairs reached the matched_projects table (threshold filtering).

**Corpus-wide totals after backfill:**

| Table | Count |
|-------|------:|
| relevancy_results | 28 |
| matched_projects | 5 |
| duplicate_reports | 4 |

---

## 5. Failed Analyses

| Category | Count |
|----------|------:|
| Relevancy engine failures | **0** |
| Ollama explanation failures | 20 (all used fallback — non-blocking) |

No project failed scoring. All 20 eval projects have persisted `relevancy_results`.

---

## 6. Paraphrase Pair Results (V1 TF-IDF)

Designed pairs vs observed max corpus similarity:

| Pair | A max sim | B max sim | Cross-pair in matches? | V1 duplicate? |
|------|----------:|----------:|:----------------------:|:-------------:|
| P1A ↔ P1B | 58.16 (legacy) | 40.13 | No | No |
| P2A ↔ P2B | 47.54 | 39.52 | No | No |
| P3A ↔ P3B | 53.27 | 53.27 | **Yes** | **Yes** |
| P4A ↔ P4B | 49.79 | 49.79 | No | No |
| P5A ↔ P5B | 43.78 | 41.78 | No | No |

**Key finding:** V1 TF-IDF detects **campus navigation paraphrase (P3)** but misses **relevancy checker, waste, attendance, and mental health paraphrases** — confirming the need for semantic V2.

---

## 7. Unrelated Project Results (Controls)

| ID | Title | Overall | Max Similarity | Novelty |
|----|-------|--------:|---------------:|--------:|
| 11 | EVAL-U01 Agriculture | 65.05 | 41.71 | 66.63 |
| 12 | EVAL-U02 Energy | 69.15 | 33.20 | 73.44 |
| 13 | EVAL-U03 Accessibility | 71.09 | 39.39 | 68.49 |
| 14 | EVAL-U04 Cybersecurity | 66.97 | 47.45 | 62.04 |
| 15 | EVAL-U05 Education | 76.37 | **24.35** | **80.52** |

**Expected behavior observed:** Unrelated controls show **lower max similarity** (24–47%) vs paraphrase pairs. EVAL-U05 (Education) has the lowest overlap and highest novelty — good negative control.

No unrelated pair triggered duplicate reports.

---

## 8. Similar-Domain Cluster (Healthcare S01–S05)

| ID | Overall | Max Similarity | Novelty |
|----|--------:|---------------:|--------:|
| 16 S01 | 69.99 | 36.43 | 70.86 |
| 17 S02 | 73.04 | 35.62 | 71.50 |
| 18 S03 | 71.42 | 33.66 | 73.07 |
| 19 S04 | 66.59 | 38.14 | 69.49 |
| 20 S05 | 72.59 | 31.53 | 74.78 |

Intra-cluster similarities stayed **below 50%** — near-duplicate cluster did not produce false duplicate alerts under V1 (appropriate calibration for near-dups vs true duplicates).

---

## 9. Recommendations Before AI Engine V2

1. **Proceed with V2 integration** — eval corpus proves V1 paraphrase gap (1/5 pairs detected).
2. **Cache `all-MiniLM-L6-v2`** before enabling V2 — HF download still required.
3. **Re-run backfill after V2** with `--force` to compare semantic vs TF-IDF on same corpus.
4. **Use P1, P2, P4, P5 paraphrase pairs** as primary V2 success metrics (should flag ≥50% semantic similarity).
5. **Keep EVAL-U05 and EVAL-S cluster** as negative/near-dup calibration sets.
6. **Start Ollama** optionally for live explanations during viva (scoring already complete with fallbacks).
7. **Legacy junk rows** (IDs 5, 9) — consider excluding from corpus limit in eval runs.

---

## 10. Per-Project Score Table

| ID | Eval | Overall | Similarity | Novelty | Confidence |
|----|------|--------:|-----------:|--------:|-----------:|
| 11 | U01 | 65.05 | 41.71 | 66.63 | 70 |
| 12 | U02 | 69.15 | 33.20 | 73.44 | 70 |
| 13 | U03 | 71.09 | 39.39 | 68.49 | 70 |
| 14 | U04 | 66.97 | 47.45 | 62.04 | 70 |
| 15 | U05 | 76.37 | 24.35 | 80.52 | 70 |
| 16 | S01 | 69.99 | 36.43 | 70.86 | 70 |
| 17 | S02 | 73.04 | 35.62 | 71.50 | 70 |
| 18 | S03 | 71.42 | 33.66 | 73.07 | 70 |
| 19 | S04 | 66.59 | 38.14 | 69.49 | 70 |
| 20 | S05 | 72.59 | 31.53 | 74.78 | 70 |
| 21 | P1A | 61.49 | 58.16 | 53.47 | 80 |
| 22 | P1B | 72.33 | 40.13 | 67.90 | 70 |
| 23 | P2A | 66.68 | 47.54 | 61.97 | 70 |
| 24 | P2B | 64.02 | 39.52 | 68.38 | 70 |
| 25 | P3A | 56.67 | 53.27 | 57.38 | 75 |
| 26 | P3B | 61.32 | 53.27 | 57.38 | 75 |
| 27 | P4A | 65.45 | 49.79 | 60.17 | 70 |
| 28 | P4B | 60.43 | 49.79 | 60.17 | 70 |
| 29 | P5A | 68.50 | 43.78 | 64.98 | 70 |
| 30 | P5B | 69.60 | 41.78 | 66.58 | 70 |

---

*Analysis generated from V1 engine backfill on deployed eval corpus. No engine logic was modified.*
