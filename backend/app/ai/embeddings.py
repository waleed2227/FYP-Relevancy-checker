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


def similarity_between(text_a: str, text_b: str) -> float:
    global _fallback_warned
    try:
        matrix = semantic_embeddings.encode_texts([text_a, text_b])
        if matrix.shape[0] < 2:
            raise RuntimeError("encode_texts returned fewer than 2 vectors")
        return round(cosine_similarity(matrix[0], matrix[1]) * 100, 2)
    except Exception as exc:
        if not _fallback_warned:
            logger.warning(
                "Sentence-transformer similarity unavailable (%s); using bag-of-words fallback.",
                exc,
            )
            _fallback_warned = True
        return _similarity_between_bow(text_a, text_b)
