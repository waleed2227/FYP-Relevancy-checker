"""Initial schema

Revision ID: 001
Revises:
Create Date: 2025-01-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Tables are created via Base.metadata.create_all in seed for dev.
    # This migration documents the schema; run alembic upgrade head after models change.
    pass


def downgrade() -> None:
    pass
