# AI Relevancy & Duplicate Detection — Improvement Guide

**Project:** AI-Based FYP Relevancy System  
**Document type:** Technical architecture & upgrade roadmap  
**Version:** 1.0  
**Date:** June 2026  

---

## Table of Contents

1. Executive Summary  
2. Current System Analysis  
3. Limitations of TF-IDF / Bag-of-Words  
4. What Universities Expect from FYP Relevancy Tools  
5. Recommended Three-Layer Architecture  
6. Layer 1 — Semantic Embeddings (Free, Open Source)  
7. Layer 2 — Cross-Encoder Reranking  
8. Layer 3 — LLM Explanations (Ollama / Local)  
9. Hybrid Retrieval (BM25 + Embeddings)  
10. University-Agnostic Configuration  
11. Evaluation Methodology  
12. Phased Implementation Roadmap  
13. Ollama vs Cloud GPT Comparison  
14. Summary & Next Steps  

---

## 1. Executive Summary

The current backend relevancy engine uses **TF-IDF-style bag-of-words** cosine similarity plus **heuristic scoring rules**. It does **not** use transformer models, sentence embeddings, or large language models (LLMs) such as Ollama or GPT.

This document explains:

- Why the current approach has limited accuracy and no real justification text  
- Industry-standard techniques to improve duplicate detection and relevancy scoring  
- How to design the system so it works with **any university’s PostgreSQL database** without retraining per institution  
- A practical, phased upgrade path using **free open-source** tools  

---

## 2. Current System Analysis

### 2.1 Components in Use Today

| Component | Implementation | Location |
|-----------|----------------|----------|
| Text similarity | TF-IDF–style token vectors + cosine similarity | `backend/app/ai/embeddings.py` |
| Relevancy scoring | Heuristic formulas + hardcoded tech keyword lists | `backend/app/ai/relevancy_engine.py` |
| Summary text | Fixed if/else templates | `relevancy_engine.py` |
| Duplicate threshold | Configurable (default 50%) | `settings.duplicate_similarity_threshold` |
| Duplicate storage | `matched_projects` → `duplicate_reports` | PostgreSQL |

### 2.2 How Similarity Is Computed Today

1. Concatenate: `title + technologies + description`  
2. Tokenize into lowercase alphanumeric words  
3. Build vocabulary across the two texts  
4. Create bag-of-words vectors  
5. Compute cosine similarity → percentage (0–100)  

### 2.3 How Other Scores Are Computed Today

- **Novelty:** Derived from max similarity (higher overlap → lower novelty)  
- **Feasibility:** Based on count of “modern” vs “legacy” tech keywords + description length  
- **Market relevance / innovation:** Weighted combinations of the above  
- **AI confidence:** Increases with number of matched projects  

These rules are **not learned from data** and include **hardcoded technology lists** (React, Python, PHP, etc.) that may not apply to every university or department.

---

## 3. Limitations of TF-IDF / Bag-of-Words

| Limitation | Example |
|------------|---------|
| Word overlap ≠ meaning | “Smart campus navigation” vs “Indoor wayfinding for university buildings” may score low despite same idea |
| Buzzword inflation | Two unrelated projects both mentioning “AI” and “blockchain” may score artificially high |
| No justification | System returns a number, not *why* projects are similar |
| Paraphrase blindness | Copy-paste with synonym changes may evade detection |
| Corpus dependency | Quality depends entirely on what is already in the attached database (correct), but matching quality is weak |
| Non-universal heuristics | Hardcoded “modern tech” lists bias scores toward specific stacks |

**Conclusion:** TF-IDF is acceptable for a prototype but is **not** state-of-the-art for semantic duplicate detection or academic relevancy assessment.

---

## 4. What Universities Expect from FYP Relevancy Tools

Academic review typically requires four capabilities:

| # | Capability | Current system |
|---|------------|----------------|
| 1 | **Detection** — Is this too similar to an existing submission? | Partial (similarity %) |
| 2 | **Explanation** — Why is it similar? (objectives, methods, dataset) | Missing (template only) |
| 3 | **Recommendation** — What should the student change? | Partial (duplicate_reports.recommendation is generic) |
| 4 | **Auditability** — Evidence visible to professor/admin | Partial (matched project list) |

A single embedding percentage without narrative explanation is **insufficient** for universal acceptance by faculty. LLMs (local or cloud) are best used as an **explainer layer**, not as the sole scoring mechanism.

---

## 5. Recommended Three-Layer Architecture

Production-grade similarity systems use a pipeline:

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1 — RETRIEVAL (fast, deterministic)                    │
│  New project → normalize → embed → vector search in PostgreSQL  │
│  Output: Top-K candidate projects                                │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2 — RERANK (accuracy for duplicate pairs)                │
│  Cross-encoder scores each (query, candidate) pair jointly       │
│  Output: Final similarity scores for duplicate_reports           │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3 — EXPLAIN (optional LLM — Ollama / local)              │
│  If score > threshold → RAG prompt with both project texts       │
│  Output: ai_analysis, professor-facing justification             │
└─────────────────────────────────────────────────────────────────┘
```

**Key principle:** Layers 1 and 2 produce **scores**. Layer 3 produces **human-readable justification**. Do not let the LLM alone decide duplicate status (hallucination risk).

---

## 6. Layer 1 — Semantic Embeddings (Free, Open Source)

### 6.1 Replace TF-IDF With Sentence Transformers

**Library:** `sentence-transformers` (Hugging Face, open source, runs locally)

| Model | Approx. size | Best for |
|-------|--------------|----------|
| `all-MiniLM-L6-v2` | ~80 MB | Fast English FYP systems |
| `BAAI/bge-small-en-v1.5` | ~130 MB | Strong general retrieval |
| `intfloat/multilingual-e5-small` | ~470 MB | Multi-language / diverse uni corpora |

### 6.2 Implementation Pattern

1. On project submit: build text = `title + technologies + description`  
2. Generate embedding vector (384 or 768 dimensions depending on model)  
3. Store vector in PostgreSQL using **pgvector** extension  
4. On new submission: query `ORDER BY embedding <=> query_embedding LIMIT 10`  

### 6.3 Why This Is University-Agnostic

- No institution-specific training required  
- Corpus = all projects in the attached database  
- New university deployment = same code, different PostgreSQL data  
- Thresholds configurable via environment variables  

### 6.4 Expected Accuracy Improvement

Sentence embeddings typically outperform TF-IDF on:

- Paraphrased descriptions  
- Same concept, different vocabulary  
- Long-form project abstracts  

---

## 7. Layer 2 — Cross-Encoder Reranking

### 7.1 Problem With Embeddings Alone

Bi-encoder models (sentence transformers) encode each text **independently**. They are fast but can produce false positives for topically related but distinct projects.

### 7.2 Solution: Cross-Encoder

Models read **both texts together** and output a relevance score.

| Model | Use case |
|-------|----------|
| `cross-encoder/ms-marco-MiniLM-L-6-v2` | General pair scoring |
| `BAAI/bge-reranker-base` | Strong reranking |

### 7.3 Pipeline

1. Layer 1 retrieves top 10 candidates by embedding distance  
2. Layer 2 cross-encoder scores each pair  
3. Use rerank score for `duplicate_reports.similarity_score`  
4. Apply threshold (e.g. 50–75% depending on calibration)  

This is the standard approach in plagiarism detection and semantic duplicate systems: **retrieve → rerank**.

---

## 8. Layer 3 — LLM Explanations (Ollama / Local)

### 8.1 When to Invoke

Only when Layer 2 score exceeds the configured duplicate threshold.

### 8.2 Suggested Prompt Structure (RAG)

**Context provided to LLM:**

- Project A: title, technologies, description (truncated if long)  
- Project B: same fields  
- Similarity percentage from Layer 2  
- Instruction: compare objectives, methodology, dataset, and novelty  

**Example instruction:**

> Compare these two FYP proposals. List up to 3 specific overlaps. Suggest 2 ways the student could differentiate. Do not invent facts not present in the text.

### 8.3 Recommended Local Models (Ollama)

| Model | Notes |
|-------|-------|
| `llama3.2` | Good balance of quality and speed |
| `mistral` | Strong instruction following |
| `qwen2.5` | Good multilingual support |

### 8.4 Storage

Write LLM output to:

- `duplicate_reports.ai_analysis`  
- `relevancy_results.summary` (enhanced)  

### 8.5 Privacy Advantage

Local Ollama keeps student project data on the university server — important for FYP and GDPR-style data policies.

---

## 9. Hybrid Retrieval (BM25 + Embeddings)

Combine semantic and lexical signals for robustness across writing styles:

| Signal | Strength |
|--------|----------|
| Semantic embedding | Paraphrases, conceptual similarity |
| BM25 / PostgreSQL full-text search | Exact titles, acronyms, technology names |

**Example combined score:**

```
final_similarity = 0.7 × semantic_score + 0.3 × bm25_normalized
```

Weights can be tuned per deployment via configuration.

---

## 10. University-Agnostic Configuration

### 10.1 Remove Institution-Specific Hardcoding

Replace hardcoded `MODERN_TECH` / `LEGACY_TECH` lists with:

- Configurable weights in `.env`  
- Optional department-specific thresholds in database  
- Scope/feasibility signals derived from text structure or LLM (Layer 3), not fixed keyword lists  

### 10.2 Recommended Environment Variables

| Variable | Purpose |
|----------|---------|
| `DUPLICATE_SIMILARITY_THRESHOLD` | Minimum score to flag duplicate (already exists) |
| `EMBEDDING_MODEL` | Hugging Face model name |
| `RERANKER_MODEL` | Cross-encoder model name |
| `LLM_ENABLED` | true/false for Ollama explanations |
| `OLLAMA_BASE_URL` | e.g. `http://localhost:11434` |
| `RELEVANCY_WEIGHTS` | JSON: novelty, feasibility, overlap weights |

### 10.3 Deployment Model for Any University

1. Install backend + PostgreSQL + pgvector  
2. Seed or import that university’s departments, users, projects  
3. Configure thresholds in `.env`  
4. No code changes required per institution  

---

## 11. Evaluation Methodology

Build a labeled evaluation set (20–50 project pairs):

| Label | Definition |
|-------|------------|
| **Duplicate** | Same idea, same scope, unacceptable overlap |
| **Related** | Same domain, different method or outcome |
| **Unrelated** | Different topics |

### Metrics

| Metric | Meaning |
|--------|---------|
| **Precision@K** | Of top K matches, how many are truly similar? |
| **Recall** | Are all known duplicates detected? |
| **False positive rate** | Unrelated projects incorrectly flagged |

### Comparison Table (for FYP documentation)

| Method | Precision@5 | Recall | Notes |
|--------|-------------|--------|-------|
| TF-IDF (current) | Baseline | Baseline | Word overlap only |
| Sentence transformer | Higher | Higher | Semantic retrieval |
| Transformer + reranker | Highest | Highest | Best for duplicates |

Document results in your FYP thesis to justify the upgrade.

---

## 12. Phased Implementation Roadmap

| Phase | Duration | Deliverable | Tools |
|-------|----------|-------------|-------|
| **Phase 1** | 1–2 days | Semantic embeddings + pgvector storage on submit | sentence-transformers, pgvector |
| **Phase 2** | 1 day | Cross-encoder reranking for duplicate_reports | cross-encoder / bge-reranker |
| **Phase 3** | 1 day | Ollama RAG explanations in admin/professor UI | Ollama, llama3.2 |
| **Phase 4** | Optional | Hybrid BM25 + embedding; per-uni config UI | PostgreSQL FTS |

**Minimum viable upgrade for FYP defense:** Phase 1 + Phase 2.  
**Full “AI with justification” story:** Phase 1 + 2 + 3.

---

## 13. Ollama vs Cloud GPT Comparison

| Criterion | Ollama (local) | OpenAI GPT (cloud) |
|-----------|----------------|---------------------|
| Cost | Free (hardware only) | API fees per token |
| Data privacy | Stays on university server | Requires policy / DPA |
| Offline deployment | Yes | No |
| Best role | Explain matches, suggest revisions | Same, if API approved |
| Similarity scoring | **Not recommended alone** | **Not recommended alone** |
| FYP demonstration | Strong open-source AI narrative | Depends on uni policy |

**Recommendation:** Use embeddings + reranker for **accuracy**; use Ollama for **justification**.

---

## 14. Summary & Next Steps

### Current State

- TF-IDF word overlap  
- Heuristic relevancy scores  
- Template summaries  
- No transformer, no LLM  

### Target State

| Problem | Solution |
|---------|----------|
| Low semantic accuracy | Sentence-transformer embeddings + pgvector |
| Duplicate false positives/negatives | Cross-encoder reranking |
| No explanation for faculty | Ollama RAG over matched project texts |
| Not universal | Config-driven thresholds; DB corpus only; remove hardcoded tech lists |
| Not auditable | Retrieve → score → explain pipeline with stored evidence |

### Immediate Next Step

Replace `similarity_between()` in `backend/app/ai/embeddings.py` with a sentence-transformer model and persist vectors in PostgreSQL. The codebase already documents this future path in `relevancy_engine.py` comments.

---

## Appendix A — File References (Current Codebase)

| File | Role |
|------|------|
| `backend/app/ai/embeddings.py` | TF-IDF similarity (to be upgraded) |
| `backend/app/ai/relevancy_engine.py` | Scoring and matching logic |
| `backend/app/services/duplicate_service.py` | duplicate_reports from matched_projects |
| `backend/app/config/settings.py` | `duplicate_similarity_threshold` |
| `backend/requirements.txt` | Currently numpy only for AI |

## Appendix B — Suggested New Dependencies

```
sentence-transformers>=3.0.0
torch>=2.0.0
pgvector>=0.3.0
httpx>=0.27.0   # Ollama API client
```

---

*End of document — AI-Based FYP Relevancy System Improvement Guide*
