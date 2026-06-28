"""Proposal v2 fields and remove project attachments

Revision ID: 003
Revises: 002
Create Date: 2026-06-03

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NEW_COLUMNS = (
    "current_challenges",
    "existing_solution_limitations",
    "proposed_solution",
    "unique_features",
    "innovation_aspect",
    "market_gap",
    "target_users",
    "ai_technologies_used",
    "expected_impact",
    "future_scope",
    "risk_assessment",
)

OLD_COLUMNS = (
    "objectives",
    "methodology",
    "expected_outcomes",
    "deliverables",
)


def upgrade() -> None:
    op.add_column("project_ideas", sa.Column("problem_statement", sa.Text(), nullable=True))
    for col in NEW_COLUMNS:
        op.add_column("project_ideas", sa.Column(col, sa.Text(), nullable=True))
    for col in OLD_COLUMNS:
        op.drop_column("project_ideas", col)
    op.drop_table("project_attachments")


def downgrade() -> None:
    op.create_table(
        "project_attachments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("project_id", sa.Integer(), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["project_ideas.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    for col in OLD_COLUMNS:
        op.add_column("project_ideas", sa.Column(col, sa.Text(), nullable=True))
    for col in reversed(NEW_COLUMNS):
        op.drop_column("project_ideas", col)
    op.drop_column("project_ideas", "problem_statement")
