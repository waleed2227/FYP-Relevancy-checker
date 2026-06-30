"""
Sentence Transformer semantic embeddings (V2 prerequisite).

Lazy singleton model loading gated by RELEVANCY_ENGINE_V2_ENABLED.
Used by embeddings.similarity_between() when V2 is enabled.
"""

from __future__ import annotations

import threading
from typing import TYPE_CHECKING, Iterable

import numpy as np

from app.config.settings import get_settings

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer

_model_lock = threading.Lock()
_model: SentenceTransformer | None = None
_model_name_loaded: str | None = None


def is_semantic_engine_enabled() -> bool:
    """True when V2 semantic layer is enabled via settings."""
    return get_settings().relevancy_engine_v2_enabled


def get_model_cache_dir() -> str | None:
    """
    Return configured Hugging Face / sentence-transformers cache directory if set.
    Falls back to the library default (typically ~/.cache/huggingface/hub).
    """
    import os

    for key in ("SENTENCE_TRANSFORMERS_HOME", "HF_HOME", "HUGGINGFACE_HUB_CACHE"):
        value = os.environ.get(key)
        if value:
            return value
    return None


def get_sentence_transformer() -> SentenceTransformer | None:
    """
    Return the cached SentenceTransformer instance.

    Loads lazily on first call when RELEVANCY_ENGINE_V2_ENABLED=true.
    Returns None when the feature flag is off (no model load attempted).
    """
    if not is_semantic_engine_enabled():
        return None

    settings = get_settings()
    global _model, _model_name_loaded

    with _model_lock:
        if _model is not None and _model_name_loaded == settings.sentence_transformer_model:
            return _model

        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(
            settings.sentence_transformer_model,
            device=settings.sentence_transformer_device,
        )
        _model_name_loaded = settings.sentence_transformer_model
        return _model


def preload_model(*, local_files_only: bool = False) -> bool:
    """
    Force model load into the process singleton.

    Returns True when a model instance is available after the call.
    When V2 is disabled, returns False without loading.
    """
    if not is_semantic_engine_enabled():
        return False

    settings = get_settings()
    global _model, _model_name_loaded

    with _model_lock:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(
            settings.sentence_transformer_model,
            device=settings.sentence_transformer_device,
            local_files_only=local_files_only,
        )
        _model_name_loaded = settings.sentence_transformer_model
        return _model is not None


def encode_texts(
    texts: Iterable[str],
    *,
    normalize_embeddings: bool = True,
) -> np.ndarray:
    """
    Encode texts to embedding vectors.

    Raises RuntimeError when V2 is disabled or the model cannot be loaded.
    """
    model = get_sentence_transformer()
    if model is None:
        raise RuntimeError(
            "Semantic embeddings are disabled. Set RELEVANCY_ENGINE_V2_ENABLED=true "
            "after downloading the model cache."
        )

    batch = list(texts)
    if not batch:
        return np.empty((0, model.get_sentence_embedding_dimension()), dtype=float)

    return model.encode(
        batch,
        normalize_embeddings=normalize_embeddings,
        convert_to_numpy=True,
    )


def reset_model_cache() -> None:
    """Clear the in-process singleton (for tests or config reload)."""
    global _model, _model_name_loaded
    with _model_lock:
        _model = None
        _model_name_loaded = None
