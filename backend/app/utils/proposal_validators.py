"""Proposal content validation for AI relevancy analysis."""

from __future__ import annotations

import re
from typing import Any

PLACEHOLDER_VALUES = frozenset({
    "not provided",
    "n/a",
    "na",
    "-",
    "none",
    "null",
    "tbd",
    "todo",
})

# api_field_name -> (min_length, human_label)
REQUIRED_TEXT_FIELDS: dict[str, tuple[int, str]] = {
    "title": (10, "Title"),
    "description": (100, "Description"),
    "problem_statement": (80, "Problem Statement"),
    "proposed_solution": (80, "Proposed Solution"),
    "academic_impact": (50, "Academic Impact (Objectives)"),
    "existing_solutions": (50, "Existing Solutions"),
    "project_scope": (50, "Project Scope"),
    "target_industry": (3, "Target Industry"),
    "target_users": (20, "Primary Target Users"),
    "expected_impact": (40, "Expected Impact"),
    "innovation_aspect": (40, "Innovation Aspect"),
    "unique_features": (40, "Unique Features"),
}


def is_placeholder(value: str) -> bool:
    return value.strip().lower() in PLACEHOLDER_VALUES


def validate_proposal_text(
    value: str | None,
    *,
    min_length: int,
    label: str,
    required: bool = True,
) -> str:
    if value is None or not str(value).strip():
        if required:
            raise ValueError(f"{label} is required.")
        return ""
    text = str(value).strip()
    if is_placeholder(text):
        raise ValueError(f'{label} cannot be "{text}". Provide a real description.')
    if len(text) < min_length:
        raise ValueError(
            f"{label} must contain at least {min_length} meaningful characters."
        )
    return text


def validate_technologies(value: str | None) -> str:
    if value is None or not str(value).strip():
        raise ValueError(
            "Technologies must list at least one technology (e.g. Python, React)."
        )
    text = str(value).strip()
    if is_placeholder(text):
        raise ValueError(
            "Technologies cannot be a placeholder. List real tools or frameworks."
        )
    tokens = [t.strip() for t in re.split(r"[,;|/]+", text) if t.strip()]
    tokens = [t for t in tokens if not is_placeholder(t)]
    if not tokens:
        raise ValueError(
            "Technologies must list at least one technology (e.g. Python, React)."
        )
    return text


def validate_project_create_payload(data: dict[str, Any]) -> None:
    """Raise ValueError with first failing field message."""
    validate_technologies(data.get("technologies"))
    for field, (min_len, label) in REQUIRED_TEXT_FIELDS.items():
        validate_proposal_text(data.get(field), min_length=min_len, label=label)
