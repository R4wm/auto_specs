"""Add build_todos table for tracking tasks and action items

Revision ID: 005
Revises: 004
Create Date: 2025-01-30

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade():
    # Create build_todos table
    op.create_table(
        'build_todos',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('build_id', sa.Integer, sa.ForeignKey('builds.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id'), nullable=False),

        # Task details
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('category', sa.String(100), nullable=True),  # 'maintenance', 'upgrade', 'repair', 'inspection', etc.

        # Status tracking
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),  # 'pending', 'in_progress', 'completed', 'cancelled'
        sa.Column('priority', sa.String(50), nullable=True, server_default='medium'),  # 'low', 'medium', 'high', 'urgent'

        # Dates
        sa.Column('due_date', sa.Date, nullable=True),
        sa.Column('completed_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),

        # Completion details
        sa.Column('completion_notes', sa.Text, nullable=True),
        sa.Column('odometer_at_completion', sa.Numeric(10, 2), nullable=True),
        sa.Column('engine_hours_at_completion', sa.Numeric(10, 2), nullable=True),

        # Cost tracking (optional)
        sa.Column('estimated_cost', sa.Numeric(10, 2), nullable=True),
        sa.Column('actual_cost', sa.Numeric(10, 2), nullable=True),

        # Related records
        sa.Column('maintenance_record_id', sa.Integer, sa.ForeignKey('build_maintenance.id', ondelete='SET NULL'), nullable=True),

        # Custom fields (JSON for flexibility)
        sa.Column('custom_fields', postgresql.JSONB, nullable=True),

        # Sort order (for user-defined ordering)
        sa.Column('sort_order', sa.Integer, nullable=True, server_default='0')
    )

    # Create indexes for performance
    op.create_index('idx_todos_build', 'build_todos', ['build_id'])
    op.create_index('idx_todos_user', 'build_todos', ['user_id'])
    op.create_index('idx_todos_status', 'build_todos', ['status'])
    op.create_index('idx_todos_category', 'build_todos', ['category'])
    op.create_index('idx_todos_due_date', 'build_todos', ['due_date'])
    op.create_index('idx_todos_priority', 'build_todos', ['priority'])
    op.create_index('idx_todos_build_status', 'build_todos', ['build_id', 'status'])

    # Create index for sorting
    op.create_index('idx_todos_build_sort', 'build_todos', ['build_id', 'sort_order'])


def downgrade():
    # Drop indexes
    op.drop_index('idx_todos_build_sort', 'build_todos')
    op.drop_index('idx_todos_build_status', 'build_todos')
    op.drop_index('idx_todos_priority', 'build_todos')
    op.drop_index('idx_todos_due_date', 'build_todos')
    op.drop_index('idx_todos_category', 'build_todos')
    op.drop_index('idx_todos_status', 'build_todos')
    op.drop_index('idx_todos_user', 'build_todos')
    op.drop_index('idx_todos_build', 'build_todos')

    # Drop table
    op.drop_table('build_todos')
