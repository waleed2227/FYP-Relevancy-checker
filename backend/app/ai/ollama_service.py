"""
Ollama-powered natural-language explanations for relevancy analysis.

Similarity scores are computed separately (relevancy_engine + embeddings).
This module only generates human-readable explanations from existing scores.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from app.config.settings import get_settings

logger = logging.getLogger(__name__)

EXPLANATION_PROMPT_TEMPLATE = """You are an academic FYP project relevancy analyst. Similarity scores were already computed by a separate system — do NOT recalculate or invent new similarity percentages.

Submitted project:
Title: {title}
Technologies: {technologies}
Description: {description}
Problem statement: {problem_statement}
Proposed solution: {proposed_solution}
Project scope: {project_scope}
Unique features: {unique_features}
Innovation aspect: {innovation_aspect}
Target users: {target_users}
Target industry: {target_industry}

Pre-computed scores (use these exactly):
- Overall relevancy score: {overall_score}%
- Similarity score (overlap with existing projects): {similarity_score}%
- Novelty score: {novelty_score}%
- Innovation score: {innovation_score}%

Most similar existing projects (from separate similarity engine):
{matched_projects_block}

Respond with JSON only, using this exact schema:
{{
  "why_relevant": "1-3 sentences on why this project is relevant in its domain",
  "similar_projects_summary": "1-3 sentences naming the most similar projects and why",
  "objectives_overlap": "Which objectives or goals overlap with similar projects",
  "problem_domains_overlap": "Which problem domains or industries overlap",
  "unique_aspects": "What makes the submitted project unique or differentiated",
  "novelty_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}}

Be specific, concise, and grounded in the proposal text. novelty_suggestions must be actionable improvements (2-4 items)."""


def _field(project: dict, name: str) -> str:
    value = project.get(name)
    if value is None:
        return "Not provided"
    text = str(value).strip()
    return text if text else "Not provided"


def _format_matched_projects(matched: list[dict]) -> str:
    if not matched:
        return "None above the similarity threshold."
    lines = []
    for m in matched[:5]:
        lines.append(
            f"- \"{m.get('title', 'Unknown')}\" "
            f"(similarity {m.get('similarity', 0)}%, year {m.get('year', '—')}, author {m.get('author', 'Unknown')})"
        )
    return "\n".join(lines)


def build_explanation_prompt(
    project: dict,
    scores: dict[str, float],
    matched: list[dict],
) -> str:
    return EXPLANATION_PROMPT_TEMPLATE.format(
        title=_field(project, "title"),
        technologies=_field(project, "technologies"),
        description=_field(project, "description"),
        problem_statement=_field(project, "problem_statement"),
        proposed_solution=_field(project, "proposed_solution"),
        project_scope=_field(project, "project_scope"),
        unique_features=_field(project, "unique_features"),
        innovation_aspect=_field(project, "innovation_aspect"),
        target_users=_field(project, "target_users"),
        target_industry=_field(project, "target_industry"),
        overall_score=scores.get("overall_score", 0),
        similarity_score=scores.get("similarity_score", 0),
        novelty_score=scores.get("novelty_score", 0),
        innovation_score=scores.get("innovation_score", 0),
        matched_projects_block=_format_matched_projects(matched),
    )


def _parse_novelty_suggestions(raw: Any) -> list[str]:
    if isinstance(raw, list):
        return [str(s).strip() for s in raw if str(s).strip()]
    if isinstance(raw, str) and raw.strip():
        return [line.strip().lstrip("-•").strip() for line in raw.splitlines() if line.strip()]
    return []


def _parse_explanation_json(text: str) -> dict[str, Any] | None:
    text = text.strip()
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return None
    return None


def build_fallback_explanation(
    project: dict,
    scores: dict[str, float],
    matched: list[dict],
) -> dict[str, Any]:
    """Rule-based explanation when Ollama is unavailable."""
    similarity = scores.get("similarity_score", 0)
    title = _field(project, "title")
    unique = _field(project, "unique_features")
    problem = _field(project, "problem_statement")
    industry = _field(project, "target_industry")

    if matched:
        top = matched[0]
        similar_summary = (
            f"The closest match is \"{top.get('title', 'Unknown')}\" "
            f"at {top.get('similarity', 0)}% similarity."
        )
        if len(matched) > 1:
            similar_summary += f" {len(matched)} projects exceeded the similarity threshold."
    else:
        similar_summary = "No existing projects in the corpus exceeded the similarity threshold."

    why = (
        f"\"{title}\" addresses {problem if problem != 'Not provided' else 'the stated problem domain'} "
        f"with relevance score {scores.get('overall_score', 0):.0f}%."
    )
    if industry != "Not provided":
        why += f" It targets the {industry} industry."

    suggestions = []
    if similarity >= 50:
        suggestions.append("Emphasize unique features that distinguish this project from similar submissions.")
    if unique == "Not provided":
        suggestions.append("Add a dedicated unique features section highlighting differentiation.")
    suggestions.append("Expand innovation_aspect with measurable research or technical contributions.")
    if len(suggestions) < 3:
        suggestions.append("Consider adding domain-specific integrations or user segments not covered by similar projects.")

    return {
        "why_relevant": why,
        "similar_projects_summary": similar_summary,
        "objectives_overlap": (
            "Objectives may overlap in scope and deliverables with similar projects in the corpus."
            if matched
            else "No significant objective overlap detected with existing corpus projects."
        ),
        "problem_domains_overlap": (
            f"Shared problem domain: {problem}."
            if problem != "Not provided"
            else "Problem domain overlap could not be determined from the proposal."
        ),
        "unique_aspects": (
            unique if unique != "Not provided" else "Differentiation should be strengthened in the proposal."
        ),
        "novelty_suggestions": suggestions[:4],
        "status": "fallback",
    }


async def generate_relevancy_explanation(
    project: dict,
    scores: dict[str, float],
    matched: list[dict],
) -> dict[str, Any]:
    """
    Call Ollama to produce structured explanation fields.
    Returns dict with explanation fields and status ('generated' | 'fallback' | 'unavailable').
    """
    settings = get_settings()
    model = settings.ollama_model

    if not settings.ollama_enabled:
        result = build_fallback_explanation(project, scores, matched)
        result["ollama_model"] = None
        return result

    prompt = build_explanation_prompt(project, scores, matched)
    url = f"{settings.ollama_base_url.rstrip('/')}/api/generate"

    try:
        async with httpx.AsyncClient(timeout=settings.ollama_timeout_seconds) as client:
            response = await client.post(
                url,
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                },
            )
            response.raise_for_status()
            payload = response.json()
            parsed = _parse_explanation_json(payload.get("response", ""))
            if not parsed:
                raise ValueError("Ollama returned unparseable JSON")

            return {
                "why_relevant": str(parsed.get("why_relevant", "")).strip(),
                "similar_projects_summary": str(parsed.get("similar_projects_summary", "")).strip(),
                "objectives_overlap": str(parsed.get("objectives_overlap", "")).strip(),
                "problem_domains_overlap": str(parsed.get("problem_domains_overlap", "")).strip(),
                "unique_aspects": str(parsed.get("unique_aspects", "")).strip(),
                "novelty_suggestions": _parse_novelty_suggestions(parsed.get("novelty_suggestions")),
                "ollama_model": model,
                "status": "generated",
            }
    except Exception as exc:
        logger.warning("Ollama explanation failed, using fallback: %s", exc)
        result = build_fallback_explanation(project, scores, matched)
        result["ollama_model"] = model
        result["status"] = "fallback"
        return result
