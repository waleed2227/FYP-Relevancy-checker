"""
Embedding utilities for semantic similarity.

Uses a lightweight TF-IDF + cosine similarity approach by default.
Designed to swap in sentence-transformers or OpenAI embeddings later.
"""

from __future__ import annotations

import logging
import re
from typing import Iterable

import numpy as np

from app.ai import semantic_embeddings

logger = logging.getLogger(__name__)
_fallback_warned = False


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def _build_vocab(docs: list[list[str]]) -> dict[str, int]:
    vocab: dict[str, int] = {}
    for tokens in docs:
        for t in tokens:
            if t not in vocab:
                vocab[t] = len(vocab)
    return vocab


def _doc_vector(tokens: list[str], vocab: dict[str, int]) -> np.ndarray:
    vec = np.zeros(len(vocab), dtype=float)
    for t in tokens:
        if t in vocab:
            vec[vocab[t]] += 1.0
    norm = np.linalg.norm(vec)
    return vec / norm if norm > 0 else vec


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    if a.size == 0 or b.size == 0:
        return 0.0
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.clip(np.dot(a, b) / denom, 0.0, 1.0))


def embed_texts(texts: Iterable[str]) -> list[np.ndarray]:
    """Return L2-normalized bag-of-words vectors for a corpus."""
    tokenized = [_tokenize(t) for t in texts]
    vocab = _build_vocab(tokenized)
    return [_doc_vector(tokens, vocab) for tokens in tokenized]


def _similarity_between_bow(text_a: str, text_b: str) -> float:
    vecs = embed_texts([text_a, text_b])
    return round(cosine_similarity(vecs[0], vecs[1]) * 100, 2)


# all-MiniLM-L6-v2 truncates input at 256 word-pieces. Encoding a long proposal as
# a single vector silently drops everything past that limit. We instead split the
# text into word chunks, encode each, and mean-pool — so the whole proposal
# contributes to the similarity, not just the first ~180 words.
_SEMANTIC_CHUNK_WORDS = 180


def _chunk_words(text: str, size: int = _SEMANTIC_CHUNK_WORDS) -> list[str]:
    words = text.split()
    if not words:
        return [""]
    return [" ".join(words[i : i + size]) for i in range(0, len(words), size)]


def _semantic_vector(text: str) -> np.ndarray:
    """Mean-pooled, L2-normalized sentence-transformer vector over word chunks."""
    chunks = _chunk_words(text)
    matrix = semantic_embeddings.encode_texts(chunks)
    if matrix.shape[0] == 0:
        raise RuntimeError("encode_texts returned no vectors")
    pooled = matrix.mean(axis=0)
    norm = np.linalg.norm(pooled)
    return pooled / norm if norm > 0 else pooled


def similarity_between(text_a: str, text_b: str) -> float:
    global _fallback_warned
    try:
        vec_a = _semantic_vector(text_a)
        vec_b = _semantic_vector(text_b)
        return round(cosine_similarity(vec_a, vec_b) * 100, 2)
    except Exception as exc:
        if not _fallback_warned:
            logger.warning(
                "Sentence-transformer similarity unavailable (%s); using bag-of-words fallback.",
                exc,
            )
            _fallback_warned = True
        return _similarity_between_bow(text_a, text_b)
