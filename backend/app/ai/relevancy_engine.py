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
    """Join weighted proposal fields: critical×3, high×2, standard×1.

    Used by the bag-of-words fallback path, where token repetition acts as a
    weighting signal. The semantic path uses build_semantic_text() instead.
    """
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


# Order for the semantic representation: domain-distinguishing fields FIRST so they
# always reach the transformer (and dominate short proposals), followed by the
# substantive proposal content. Each field appears ONCE — repeating text is a
# bag-of-words trick that only wastes the transformer's token budget and inflates
# similarity between structurally-similar but topically-different proposals.
SEMANTIC_FIELD_ORDER: tuple[str, ...] = (
    "category",
    "target_industry",
    "title",
    "target_users",
    "problem_statement",
    "proposed_solution",
    "unique_features",
    "innovation_aspect",
    "project_scope",
    "current_challenges",
    "existing_solutions",
    "existing_solution_limitations",
    "competitive_advantage",
    "market_gap",
    "expected_impact",
    "technologies",
    "ai_technologies_used",
    "description",
)


def build_semantic_text(project: dict) -> str:
    """Clean, de-duplicated, domain-first text for sentence-transformer encoding."""
    parts: list[str] = []
    for field in SEMANTIC_FIELD_ORDER:
        text = _field_text(project, field)
        if text:
            parts.append(text)
    return ". ".join(parts)


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

    # Fields that meaningfully describe a proposal — used to measure how complete the
    # submission is (and therefore how much the AI has to work with).
    COMPLETENESS_FIELDS: tuple[str, ...] = RELEVANCY_TEXT_FIELDS + (
        "category",
        "ai_technologies_used",
    )

    def _proposal_completeness(self, project: dict) -> float:
        """Fraction of meaningful proposal fields that are actually filled in (0..1)."""
        total = len(self.COMPLETENESS_FIELDS)
        if total == 0:
            return 0.0
        filled = sum(1 for f in self.COMPLETENESS_FIELDS if _field_text(project, f))
        return filled / total

    def _confidence_score(self, project: dict, corpus_size: int) -> float:
        """Grounded analysis confidence.

        Reflects how much evidence the analysis is based on, not a fixed number:
          - proposal completeness: a fuller proposal gives the model more to reason about
          - corpus adequacy: more approved reference projects = a more reliable comparison
        """
        completeness = self._proposal_completeness(project)
        corpus_adequacy = min(1.0, corpus_size / 20.0)
        raw = 100.0 * (0.65 * completeness + 0.35 * corpus_adequacy)
        return round(min(98.0, max(40.0, raw)), 2)

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
        query_text = build_semantic_text(project)
        match_threshold = get_settings().duplicate_similarity_threshold

        matched: list[dict] = []
        max_similarity = 0.0

        for proj in existing_projects:
            corpus_text = build_semantic_text(proj)
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
        ai_confidence = self._confidence_score(project, len(existing_projects))

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
