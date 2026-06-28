"""Add structured proposal fields to project_ideas

Revision ID: 002
Revises: 001
Create Date: 2026-06-03

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("project_ideas", sa.Column("problem_statement", sa.Text(), nullable=True))
    op.add_column("project_ideas", sa.Column("objectives", sa.Text(), nullable=True))
    op.add_column("project_ideas", sa.Column("methodology", sa.Text(), nullable=True))
    op.add_column("project_ideas", sa.Column("expected_outcomes", sa.Text(), nullable=True))
    op.add_column("project_ideas", sa.Column("deliverables", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("project_ideas", "deliverables")
    op.drop_column("project_ideas", "expected_outcomes")
    op.drop_column("project_ideas", "methodology")
    op.drop_column("project_ideas", "objectives")
    op.drop_column("project_ideas", "problem_statement")
