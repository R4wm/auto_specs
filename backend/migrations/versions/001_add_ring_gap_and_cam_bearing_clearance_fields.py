"""add_ring_gap_and_cam_bearing_clearance_fields

Revision ID: 001
Revises:
Create Date: 2025-10-16 05:08:35.542653

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add ring gap measurement columns and cam bearing clearance to builds table."""
    # Add ring gap measurement columns (top, second, oil rings)
    op.add_column('builds', sa.Column('ring_gap_top_in', sa.Numeric(10, 4), nullable=True))
    op.add_column('builds', sa.Column('ring_gap_second_in', sa.Numeric(10, 4), nullable=True))
    op.add_column('builds', sa.Column('ring_gap_oil_in', sa.Numeric(10, 4), nullable=True))

    # Add cam bearing clearance column
    op.add_column('builds', sa.Column('cam_bearing_clearance_in', sa.Numeric(10, 4), nullable=True))


def downgrade() -> None:
    """Remove ring gap and cam bearing clearance columns from builds table."""
    # Remove columns in reverse order
    op.drop_column('builds', 'cam_bearing_clearance_in')
    op.drop_column('builds', 'ring_gap_oil_in')
    op.drop_column('builds', 'ring_gap_second_in')
    op.drop_column('builds', 'ring_gap_top_in')
