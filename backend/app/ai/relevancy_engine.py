"""
Relevancy analysis engine – scores projects and finds similar submissions.

Future integrations:
  - sentence_transformers (all-MiniLM-L6-v2)
  - OpenAI embeddings API
"""

from __future__ import annotations

from dataclasses import dataclass

from app.ai.embeddings import similarity_between
from app.config.settings import get_settings

# Field tiers for weighted similarity (text repeated per tier weight).
CRITICAL_FIELDS: tuple[str, ...] = (
    "problem_statement",
    "proposed_solution",
    "unique_features",
    "innovation_aspect",
)
HIGH_FIELDS: tuple[str, ...] = (
    "current_challenges",
    "existing_solutions",
    "project_scope",
    "competitive_advantage",
    "market_gap",
)
STANDARD_FIELDS: tuple[str, ...] = (
    "title",
    "description",
    "technologies",
    "target_users",
    "target_industry",
    "expected_impact",
    "existing_solution_limitations",
)

FIELD_WEIGHTS: dict[str, int] = {
    **{f: 3 for f in CRITICAL_FIELDS},
    **{f: 2 for f in HIGH_FIELDS},
    **{f: 1 for f in STANDARD_FIELDS},
}

RELEVANCY_TEXT_FIELDS: tuple[str, ...] = CRITICAL_FIELDS + HIGH_FIELDS + STANDARD_FIELDS


def _field_text(project: dict, field: str) -> str | None:
    value = project.get(field)
    if value is None:
        return None
    text = str(value).strip()
    return text if text else None


def build_combined_analysis_text(project: dict) -> str:
    """Join weighted proposal fields: critical×3, high×2, standard×1."""
    parts: list[str] = []
    for weight, fields in (
        (3, CRITICAL_FIELDS),
        (2, HIGH_FIELDS),
        (1, STANDARD_FIELDS),
    ):
        tier_chunks: list[str] = []
        for field in fields:
            text = _field_text(project, field)
            if text:
                tier_chunks.append(text)
        if tier_chunks:
            tier_text = " ".join(tier_chunks)
            parts.extend([tier_text] * weight)
    return " ".join(parts)


@dataclass
class AnalysisResult:
    overall_score: float
    novelty_score: float
    feasibility_score: float
    market_relevance: float
    innovation_score: float
    similarity_score: float
    ai_confidence: float
    summary: str
    matched: list[dict]


class RelevancyEngine:
    """Analyzes a project idea against a corpus of existing projects."""

    MODERN_TECH = {
        "react", "node", "python", "tensorflow", "pytorch", "blockchain",
        "ethereum", "flutter", "kubernetes", "aws", "azure", "ml", "ai",
        "nlp", "fastapi", "docker", "mongodb", "postgresql", "nextjs",
    }
    LEGACY_TECH = {"php", "mysql", "bootstrap", "jquery", "wordpress"}

    def _tech_tokens(self, project: dict) -> set[str]:
        technologies = str(project.get("technologies", "") or "")
        ai_tech = str(project.get("ai_technologies_used", "") or "")
        combined = f"{technologies} {ai_tech}"
        return {t.strip().lower() for t in combined.replace(",", " ").split() if t.strip()}

    def _scope_score(self, project: dict) -> float:
        scope_text = _field_text(project, "project_scope") or str(
            project.get("description", "") or ""
        ).strip()
        word_count = len(scope_text.split()) if scope_text else 0
        return min(100, 40 + word_count * 0.5)

    def _market_input_score(self, project: dict, tech_score: float) -> float:
        market_parts = [
            _field_text(project, "target_industry"),
            _field_text(project, "market_gap"),
            _field_text(project, "expected_impact"),
        ]
        market_text = " ".join(p for p in market_parts if p)
        if not market_text:
            return tech_score
        word_count = len(market_text.split())
        market_score = min(100, 55 + word_count * 0.6)
        return max(tech_score, market_score)

    def analyze(self, project: dict, existing_projects: list[dict]) -> AnalysisResult:
        query_text = build_combined_analysis_text(project)
        match_threshold = get_settings().duplicate_similarity_threshold

        matched: list[dict] = []
        max_similarity = 0.0

        for proj in existing_projects:
            corpus_text = build_combined_analysis_text(proj)
            sim = similarity_between(query_text, corpus_text)
            if sim >= match_threshold:
                matched.append({
                    "matched_project_id": proj.get("id"),
                    "title": proj.get("title", "Unknown"),
                    "similarity": sim,
                    "year": proj.get("year", "2024"),
                    "author": proj.get("author", "Unknown"),
                    "status": proj.get("status", "Completed"),
                })
            max_similarity = max(max_similarity, sim)

        matched.sort(key=lambda x: x["similarity"], reverse=True)
        matched = matched[:5]

        tech_tokens = self._tech_tokens(project)
        modern_count = len(tech_tokens & self.MODERN_TECH)
        legacy_count = len(tech_tokens & self.LEGACY_TECH)

        tech_score = min(100, 50 + modern_count * 10 - legacy_count * 15)
        scope_score = self._scope_score(project)
        market_input = self._market_input_score(project, tech_score)
        novelty_score = round(max(30, 100 - max_similarity * 0.8), 2)
        feasibility_score = round((tech_score + scope_score) / 2, 2)
        market_relevance = round(min(95, market_input * 0.9 + 10), 2)
        innovation_score = round((novelty_score * 0.6 + market_relevance * 0.4), 2)
        similarity_score = round(max_similarity, 2)
        overall = round(
            innovation_score * 0.35
            + feasibility_score * 0.25
            + novelty_score * 0.25
            + (100 - similarity_score) * 0.15,
            2,
        )
        ai_confidence = round(min(95, 70 + len(matched) * 5), 2)

        if overall >= 80:
            summary = "Strong relevancy with good innovative potential."
        elif overall >= 60:
            summary = "Moderate relevancy; consider refining scope or differentiation."
        else:
            summary = "Low relevancy; significant overlap or outdated approach detected."

        return AnalysisResult(
            overall_score=overall,
            novelty_score=novelty_score,
            feasibility_score=feasibility_score,
            market_relevance=market_relevance,
            innovation_score=innovation_score,
            similarity_score=similarity_score,
            ai_confidence=ai_confidence,
            summary=summary,
            matched=matched,
        )
