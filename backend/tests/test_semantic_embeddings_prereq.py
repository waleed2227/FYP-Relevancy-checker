"""Tests for AI Engine V2 prerequisite module (no model load when disabled)."""

from __future__ import annotations

import pytest

from app.ai import semantic_embeddings
from app.config.settings import Settings, get_settings


@pytest.fixture
def v2_disabled(monkeypatch: pytest.MonkeyPatch):
    """Isolate tests from developer .env where V2 may be enabled."""
    monkeypatch.setenv("RELEVANCY_ENGINE_V2_ENABLED", "false")
    get_settings.cache_clear()
    semantic_embeddings.reset_model_cache()
    yield
    get_settings.cache_clear()
    semantic_embeddings.reset_model_cache()


def test_feature_flag_disabled_by_default(v2_disabled) -> None:
    settings = get_settings()
    assert settings.relevancy_engine_v2_enabled is False
    assert settings.sentence_transformer_model == "sentence-transformers/all-MiniLM-L6-v2"
    assert settings.sentence_transformer_device == "cpu"


def test_settings_class_default_is_v2_off() -> None:
    """Code default before .env override is V2 disabled."""
    field = Settings.model_fields["relevancy_engine_v2_enabled"]
    assert field.default is False


def test_semantic_engine_disabled_returns_no_model(v2_disabled) -> None:
    assert semantic_embeddings.is_semantic_engine_enabled() is False
    assert semantic_embeddings.get_sentence_transformer() is None
    assert semantic_embeddings.preload_model() is False


def test_encode_raises_when_disabled(v2_disabled) -> None:
    with pytest.raises(RuntimeError, match="RELEVANCY_ENGINE_V2_ENABLED"):
        semantic_embeddings.encode_texts(["hello"])
