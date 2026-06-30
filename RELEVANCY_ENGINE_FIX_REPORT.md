# Relevancy Engine — Similarity Accuracy Fix

_Date: 2026-07-01_

## Background
An external review of one result (AI-Based Disaster Response & Emergency Management
System) flagged that the similarity scores looked lexical (Bag-of-Words) and that a
cross-domain **healthcare** project was incorrectly ranked as the most similar.

## Investigation — what was actually happening
We reproduced the exact numbers from the database and confirmed:

- The engine was **already semantic** (sentence-transformers `all-MiniLM-L6-v2`),
  **not** Bag-of-Words. The shown 55.55 / 52.24 / 51.23 matched the semantic model's
  output exactly.
- The real root causes were:

  1. **256-token truncation.** MiniLM truncates input at 256 word-pieces. The combined
     proposal text was ~523 words (700+ tokens), so **half the proposal was silently
     dropped**.
  2. **Bag-of-Words–style repetition.** The text builder repeated critical fields ×3 and
     high fields ×2. With the 256-token limit, this filled the budget with a few repeated
     "AI predicts X → recommends resource allocation → dashboard → real-time alerts"
     fields — generic framing shared by almost any AI optimization project.
  3. **Domain fields were truncated away.** `category`, `target_industry`, and
     `target_users` were placed **last**, so they were the first content cut off — the very
     fields that distinguish *healthcare* from *disaster management* never reached the model.
  4. **AI Confidence** was a fixed heuristic (`70 + matches×5`) — now replaced (see below).

### Evidence
| Match | Shown (old) | Semantic (old) | Bag-of-Words |
|-------|-------------|----------------|--------------|
| #56 Emergency Room (Healthcare) | 55.55% | 55.55 | 38.48 |
| #87 Disaster Response Coordination | 52.24% | 52.24 | 40.12 |
| #72 Road Hazard | 51.23% | 51.23 | 31.19 |

Source proposal length: **523 words** vs model limit **256 word-pieces** → truncated.

## The fix (similarity only — scores' formulas unchanged)
1. **Chunk + mean-pool** (`app/ai/embeddings.py`): long text is split into ~180-word
   chunks, each encoded, then mean-pooled into one vector. The **whole proposal** now
   contributes — no more silent truncation.
2. **Clean, domain-first semantic text** (`app/ai/relevancy_engine.py` →
   `build_semantic_text()`): each field appears **once** (no ×3/×2 repetition), and
   domain-distinguishing fields (`category`, `target_industry`, `title`, `target_users`)
   come **first** so they always influence the embedding.
3. **`category` now feeds the analysis** (`app/services/project_service.py`): added to the
   analysis dict so it participates in similarity.
4. **Grounded AI Confidence** (`app/ai/relevancy_engine.py` → `_confidence_score()`):
   replaced the fixed `70 + matches×5` heuristic with a measure tied to real inputs:
   - **proposal completeness** — fraction of meaningful proposal fields actually filled in
   - **corpus adequacy** — how many approved reference projects exist to compare against

   `confidence = clamp( 100 × (0.65·completeness + 0.35·corpus_adequacy), 40, 98 )`
   where `corpus_adequacy = min(1, corpus_size / 20)`.

   | Proposal | Reference corpus | Confidence |
   |----------|------------------|-----------|
   | Full | 53 | 98.0 |
   | Full | 3 | 70.25 |
   | Sparse | 53 | 45.83 |
   | Sparse | 0 | 40.0 (floor) |

   This is defensible in a viva: confidence now means *"how much evidence the analysis is
   based on"*, not a number that only goes up with match count.

The Bag-of-Words path (`build_combined_analysis_text`, used only as a fallback when the
transformer is unavailable) is unchanged.

## Result (same disaster project, after fix)
| Match | Before | After |
|-------|--------|-------|
| **#87 Disaster Response Coordination** (same domain) | 52.24% — rank 2 | **68.27% — rank 1** ✅ |
| #56 Emergency Room (Healthcare) | 55.55% — rank 1 | 55.33% — rank 2 |
| #72 Road Hazard | 51.23% | 53.72% |

The same-domain disaster project now correctly ranks first, well above the cross-domain
healthcare project. The AI explanation (which lists matches in order) automatically
improves because it now receives the corrected ranking.

## What did NOT change
- ❌ No change to the submission form, project IDs, or any stored proposal field.
- ❌ No database schema change.
- ❌ No change to the score formulas (innovation/feasibility/novelty/overall) or to the
  matched-projects display.
- ✅ Only the *text fed to the embedding model* and *how long text is encoded* changed.

## Files changed
| File | Change |
|------|--------|
| `app/ai/embeddings.py` | Chunk + mean-pool semantic encoding (no truncation) |
| `app/ai/relevancy_engine.py` | `build_semantic_text()` (domain-first, no repetition); `analyze()` uses it |
| `app/services/project_service.py` | `category` added to analysis dict |
| `scripts/backfill_all_relevancy.py` | Per-project commit (safe/resumable re-analysis) |

## Re-analysis
All existing projects were re-analyzed with `python -m scripts.backfill_all_relevancy --force`
so stored similarity scores, matched lists, and AI explanations reflect the improved engine.
New submissions use the improved engine automatically.
