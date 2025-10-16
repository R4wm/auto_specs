"""add_cost_to_parts

Revision ID: 002
Revises: 001
Create Date: 2025-10-16 05:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add cost field to parts table for tracking part expenses."""
    op.add_column('parts', sa.Column('cost', sa.Numeric(10, 2), nullable=True))


def downgrade() -> None:
    """Remove cost field from parts table."""
    op.drop_column('parts', 'cost')
