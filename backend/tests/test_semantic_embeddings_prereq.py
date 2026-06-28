"""Tests for AI Engine V2 prerequisite module (no model load when disabled)."""

from __future__ import annotations

from app.ai import semantic_embeddings
from app.config.settings import get_settings


def test_feature_flag_disabled_by_default() -> None:
    settings = get_settings()
    assert settings.relevancy_engine_v2_enabled is False
    assert settings.sentence_transformer_model == "sentence-transformers/all-MiniLM-L6-v2"
    assert settings.sentence_transformer_device == "cpu"


def test_semantic_engine_disabled_returns_no_model() -> None:
    semantic_embeddings.reset_model_cache()
    assert semantic_embeddings.is_semantic_engine_enabled() is False
    assert semantic_embeddings.get_sentence_transformer() is None
    assert semantic_embeddings.preload_model() is False


def test_encode_raises_when_disabled() -> None:
    semantic_embeddings.reset_model_cache()
    try:
        semantic_embeddings.encode_texts(["hello"])
        raised = False
    except RuntimeError as exc:
        raised = True
        assert "RELEVANCY_ENGINE_V2_ENABLED" in str(exc)
    assert raised
