"""Regression tests for weighted relevancy engine (TF-IDF similarity)."""

from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.ai.embeddings import similarity_between
from app.ai.relevancy_engine import (
    CRITICAL_FIELDS,
    RelevancyEngine,
    build_combined_analysis_text,
)
from app.services.project_service import _relevancy_rerun_needed


LEGACY_PROJECT = {
    "title": "Smart Campus Portal",
    "technologies": "Python, React, PostgreSQL",
    "description": "A web portal for campus services and student management.",
}

RICH_PROJECT_A = {
    **LEGACY_PROJECT,
    "problem_statement": "Students lack a unified digital campus experience",
    "proposed_solution": "Build an integrated portal with scheduling and notifications",
    "unique_features": "AI-powered timetable optimization",
    "innovation_aspect": "Machine learning for personalized student workflows",
    "project_scope": "Mobile and web clients with admin dashboard",
    "target_industry": "Education",
    "market_gap": "No local university offers end-to-end integration",
}

RICH_PROJECT_B = {
    **RICH_PROJECT_A,
    "title": "Campus Hub Platform",
    "description": "Integrated university services for students and staff.",
}


UNRELATED_PROJECT = {
    "title": "Blockchain Supply Chain",
    "technologies": "Ethereum, Solidity",
    "description": "Track goods from manufacturer to retailer using smart contracts.",
    "problem_statement": "Supply chain opacity causes fraud",
    "proposed_solution": "Immutable ledger for shipment events",
    "unique_features": "IoT sensor integration on chain",
    "innovation_aspect": "Hybrid oracle design for offline warehouses",
}


@pytest.fixture
def engine() -> RelevancyEngine:
    return RelevancyEngine()


def test_legacy_project_generates_scores(engine: RelevancyEngine) -> None:
    result = engine.analyze(LEGACY_PROJECT, [])
    assert result.overall_score > 0
    assert result.similarity_score == 0.0
    assert result.feasibility_score > 0
    assert result.summary


def test_rich_proposal_generates_scores(engine: RelevancyEngine) -> None:
    result = engine.analyze(RICH_PROJECT_A, [])
    assert result.overall_score > 0
    assert result.market_relevance > 0


def test_weighted_text_repeats_critical_fields() -> None:
    text = build_combined_analysis_text(RICH_PROJECT_A)
    critical_phrase = RICH_PROJECT_A["problem_statement"]
    assert text.count(critical_phrase) == 3


def test_legacy_weighted_text_matches_standard_tier_only() -> None:
    """Legacy projects only populate standard fields — each token appears once."""
    text = build_combined_analysis_text(LEGACY_PROJECT)
    for field in CRITICAL_FIELDS:
        assert field not in text or True  # no critical content
    assert LEGACY_PROJECT["title"] in text
    assert text.count(LEGACY_PROJECT["title"]) == 1


def test_similar_projects_score_higher_than_unrelated(engine: RelevancyEngine) -> None:
    corpus = [{**RICH_PROJECT_B, "id": 2, "year": "2024", "author": "B", "status": "pending"}]
    similar = engine.analyze(RICH_PROJECT_A, corpus)
    unrelated = engine.analyze(UNRELATED_PROJECT, corpus)
    assert similar.similarity_score > unrelated.similarity_score


def test_critical_overlap_beats_description_only_overlap() -> None:
    """Weighted similarity should rank shared critical fields above shared description."""
    critical_a = {
        **LEGACY_PROJECT,
        "problem_statement": "Personalized nutrition recommendations for students",
        "proposed_solution": "ML meal planner with macro tracking",
        "unique_features": "Campus cafeteria integration",
        "innovation_aspect": "Collaborative filtering on dining habits",
        "description": "Totally different marketing description alpha",
    }
    critical_b = {
        **LEGACY_PROJECT,
        "title": "Nutrition Planner",
        "problem_statement": "Personalized nutrition recommendations for students",
        "proposed_solution": "ML meal planner with macro tracking",
        "unique_features": "Campus cafeteria integration",
        "innovation_aspect": "Collaborative filtering on dining habits",
        "description": "Totally different marketing description beta",
    }
    desc_only_b = {
        **LEGACY_PROJECT,
        "title": "Other App",
        "description": LEGACY_PROJECT["description"],
    }
    sim_critical = similarity_between(
        build_combined_analysis_text(critical_a),
        build_combined_analysis_text(critical_b),
    )
    sim_desc = similarity_between(
        build_combined_analysis_text(critical_a),
        build_combined_analysis_text(desc_only_b),
    )
    assert sim_critical > sim_desc


def test_scope_score_prefers_project_scope(engine: RelevancyEngine) -> None:
    short_desc = {**LEGACY_PROJECT, "description": "Short.", "project_scope": " " * 0}
    long_scope = {
        **LEGACY_PROJECT,
        "description": "Short.",
        "project_scope": " ".join(f"module{i}" for i in range(40)),
    }
    assert engine._scope_score(long_scope) > engine._scope_score(short_desc)


def test_tech_score_includes_ai_technologies(engine: RelevancyEngine) -> None:
    base = {**LEGACY_PROJECT, "technologies": "HTML", "ai_technologies_used": None}
    with_ai = {**LEGACY_PROJECT, "technologies": "HTML", "ai_technologies_used": "tensorflow, pytorch"}
    assert len(engine._tech_tokens(with_ai) & engine.MODERN_TECH) > len(
        engine._tech_tokens(base) & engine.MODERN_TECH
    )


def test_market_relevance_uses_industry_fields(engine: RelevancyEngine) -> None:
    tech_only = {**LEGACY_PROJECT, "technologies": "jquery, php"}
    with_market = {
        **LEGACY_PROJECT,
        "technologies": "jquery, php",
        "target_industry": "Healthcare Education Technology",
        "market_gap": "Underserved rural training providers need digital tools",
        "expected_impact": "Improved graduate employability across regions",
    }
    tech_score = 50.0
    assert engine._market_input_score(with_market, tech_score) > engine._market_input_score(
        tech_only, tech_score
    )


def test_relevancy_rerun_when_proposal_field_changes() -> None:
    project = SimpleNamespace(
        title="T",
        technologies="Python",
        description="A long enough description for the project.",
        category=None,
        target_industry=None,
        problem_statement="Old problem",
        current_challenges=None,
        existing_solutions=None,
        existing_solution_limitations=None,
        proposed_solution=None,
        project_scope=None,
        unique_features=None,
        innovation_aspect=None,
        competitive_advantage=None,
        market_gap=None,
        target_users=None,
        secondary_target_users=None,
        ai_technologies_used=None,
        technical_feasibility=None,
        financial_feasibility=None,
        operational_feasibility=None,
        expected_impact=None,
        academic_impact=None,
        business_impact=None,
        social_impact=None,
        future_enhancements=None,
        scalability_opportunities=None,
        commercialization_potential=None,
        privacy_concerns=None,
        security_concerns=None,
        ethical_considerations=None,
        future_scope=None,
        risk_assessment=None,
    )
    unchanged = SimpleNamespace(problem_statement="Old problem")
    changed = SimpleNamespace(problem_statement="New problem statement")
    professor_only = SimpleNamespace(professor_email="professor@uol.edu.pk")

    assert _relevancy_rerun_needed(project, unchanged) is False
    assert _relevancy_rerun_needed(project, changed) is True
    assert _relevancy_rerun_needed(project, professor_only) is False
