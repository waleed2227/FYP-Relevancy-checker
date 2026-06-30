"""Tests for proposal validation on ProjectCreate / ProjectUpdate."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.schemas.project import ProjectCreate, ProjectUpdate
from app.utils.proposal_validators import (
    is_placeholder,
    validate_proposal_text,
    validate_technologies,
)


def _pad(text: str, min_len: int) -> str:
    if len(text) >= min_len:
        return text
    return text + " " + "x" * (min_len - len(text) - 1)


VALID_BASE = {
    "title": _pad("Smart Campus Navigation System", 10),
    "technologies": "Python, React, PostgreSQL",
    "description": _pad(
        "A comprehensive final year project that helps students navigate campus "
        "buildings using indoor and outdoor routing with a mobile application.",
        100,
    ),
    "professor_email": "professor@uol.edu.pk",
    "target_industry": "Education",
    "problem_statement": _pad(
        "New students waste significant time locating lecture halls because campus "
        "maps are static and lack room-level indoor navigation guidance.",
        80,
    ),
    "existing_solutions": _pad(
        "Static PDF maps and generic Google Maps lack indoor floor plans and "
        "department-specific room numbers for large university campuses.",
        50,
    ),
    "proposed_solution": _pad(
        "Build a mobile wayfinding app with BLE beacons and graph-based routing "
        "that provides turn-by-turn directions inside and outside buildings.",
        80,
    ),
    "project_scope": _pad(
        "Deliver Android app, admin dashboard, beacon integration, and outdoor GPS "
        "routing for one faculty block as the MVP scope.",
        50,
    ),
    "unique_features": _pad(
        "Offline indoor maps, accessibility routes, and professor office lookup.",
        40,
    ),
    "innovation_aspect": _pad(
        "Combines low-cost BLE positioning with open campus graph data for indoor nav.",
        40,
    ),
    "target_users": _pad("Undergraduate students and campus visitors", 20),
    "expected_impact": _pad(
        "Reduces late arrivals and improves first-year orientation experience.",
        40,
    ),
    "academic_impact": _pad(
        "Demonstrates applied mobile development, IoT, and spatial algorithms learning outcomes.",
        50,
    ),
}


def test_valid_proposal_create_passes() -> None:
    project = ProjectCreate(**VALID_BASE)
    assert project.title.startswith("Smart Campus")


def test_empty_title_rejected() -> None:
    data = {**VALID_BASE, "title": ""}
    with pytest.raises(ValidationError):
        ProjectCreate(**data)


def test_short_description_rejected() -> None:
    data = {**VALID_BASE, "description": "Too short."}
    with pytest.raises(ValidationError) as exc:
        ProjectCreate(**data)
    assert "100 characters" in str(exc.value)


def test_placeholder_problem_statement_rejected() -> None:
    data = {**VALID_BASE, "problem_statement": "N/A"}
    with pytest.raises(ValidationError) as exc:
        ProjectCreate(**data)
    assert "Problem Statement" in str(exc.value) or "at least 80" in str(exc.value)


def test_not_provided_existing_solutions_rejected() -> None:
    data = {**VALID_BASE, "existing_solutions": "Not Provided"}
    with pytest.raises(ValidationError):
        ProjectCreate(**data)


def test_whitespace_only_target_users_rejected() -> None:
    data = {**VALID_BASE, "target_users": "   "}
    with pytest.raises(ValidationError):
        ProjectCreate(**data)


def test_technologies_placeholder_rejected() -> None:
    data = {**VALID_BASE, "technologies": "-"}
    with pytest.raises(ValidationError):
        ProjectCreate(**data)


def test_technologies_requires_at_least_one_token() -> None:
    with pytest.raises(ValueError, match="at least one technology"):
        validate_technologies("")


def test_patch_partial_update_allows_omitted_fields() -> None:
    update = ProjectUpdate(title=_pad("Updated Project Title Here", 10))
    assert update.title is not None
    assert update.problem_statement is None


def test_patch_validates_field_when_present() -> None:
    with pytest.raises(ValidationError):
        ProjectUpdate(problem_statement="N/A")


def test_patch_short_field_when_present_rejected() -> None:
    with pytest.raises(ValidationError):
        ProjectUpdate(expected_impact="short")


def test_is_placeholder_case_insensitive() -> None:
    assert is_placeholder("NOT PROVIDED")
    assert is_placeholder("todo")
    assert is_placeholder("TBD")


def test_validate_proposal_text_meaningful_message() -> None:
    with pytest.raises(ValueError, match="at least 80 meaningful characters"):
        validate_proposal_text("short", min_length=80, label="Problem Statement")


def test_missing_required_field_rejected() -> None:
    data = {k: v for k, v in VALID_BASE.items() if k != "problem_statement"}
    with pytest.raises(ValidationError):
        ProjectCreate(**data)


def test_validate_project_create_payload_helper() -> None:
    from app.utils.proposal_validators import validate_project_create_payload

    validate_project_create_payload(VALID_BASE)
    with pytest.raises(ValueError, match="Existing Solutions"):
        validate_project_create_payload({**VALID_BASE, "existing_solutions": ""})


def test_required_field_rules_count() -> None:
    """Frontend proposalValidation.ts RULES must stay aligned with REQUIRED_TEXT_FIELDS."""
    from app.utils.proposal_validators import REQUIRED_TEXT_FIELDS

    assert len(REQUIRED_TEXT_FIELDS) == 12
    assert "academic_impact" in REQUIRED_TEXT_FIELDS


def test_frontend_mirror_rules_placeholder() -> None:
    for bad in ("Not Provided", "N/A", "None", "Todo", "TBD"):
        assert is_placeholder(bad)
