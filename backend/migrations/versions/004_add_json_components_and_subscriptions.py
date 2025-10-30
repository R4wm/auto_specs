"""Add JSON component columns, snapshots, and subscription system

Revision ID: 004
Revises: 003
Create Date: 2025-01-26

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    # Add JSON columns to builds table for flexible component storage
    op.add_column('builds', sa.Column('engine_internals_json', postgresql.JSONB, nullable=True))
    op.add_column('builds', sa.Column('suspension_json', postgresql.JSONB, nullable=True))
    op.add_column('builds', sa.Column('tires_wheels_json', postgresql.JSONB, nullable=True))
    op.add_column('builds', sa.Column('rear_differential_json', postgresql.JSONB, nullable=True))
    op.add_column('builds', sa.Column('transmission_json', postgresql.JSONB, nullable=True))
    op.add_column('builds', sa.Column('frame_json', postgresql.JSONB, nullable=True))
    op.add_column('builds', sa.Column('cab_interior_json', postgresql.JSONB, nullable=True))
    op.add_column('builds', sa.Column('brakes_json', postgresql.JSONB, nullable=True))
    op.add_column('builds', sa.Column('additional_components_json', postgresql.JSONB, nullable=True))

    # Add storage tracking to users table
    op.add_column('users', sa.Column('storage_used_bytes', sa.BigInteger, nullable=True, server_default='0'))

    # Create build_json_snapshots table for version history
    op.create_table(
        'build_json_snapshots',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('build_id', sa.Integer, sa.ForeignKey('builds.id', ondelete='CASCADE'), nullable=False),
        sa.Column('maintenance_id', sa.Integer, sa.ForeignKey('build_maintenance.id', ondelete='SET NULL'), nullable=True),

        # Full JSON snapshots
        sa.Column('engine_internals_json', postgresql.JSONB, nullable=True),
        sa.Column('suspension_json', postgresql.JSONB, nullable=True),
        sa.Column('tires_wheels_json', postgresql.JSONB, nullable=True),
        sa.Column('rear_differential_json', postgresql.JSONB, nullable=True),
        sa.Column('transmission_json', postgresql.JSONB, nullable=True),
        sa.Column('frame_json', postgresql.JSONB, nullable=True),
        sa.Column('cab_interior_json', postgresql.JSONB, nullable=True),
        sa.Column('brakes_json', postgresql.JSONB, nullable=True),
        sa.Column('additional_components_json', postgresql.JSONB, nullable=True),

        # Metadata
        sa.Column('snapshot_type', sa.String, nullable=False),  # 'maintenance', 'manual_edit', 'initial', 'before_change', 'after_change'
        sa.Column('change_description', sa.Text, nullable=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
    )

    # Create indexes for snapshots
    op.create_index('idx_snapshots_build', 'build_json_snapshots', ['build_id'])
    op.create_index('idx_snapshots_maintenance', 'build_json_snapshots', ['maintenance_id'])
    op.create_index('idx_snapshots_created', 'build_json_snapshots', ['created_at'])

    # Create subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tier', sa.String, nullable=False, server_default='default'),
        sa.Column('status', sa.String, nullable=False),  # 'active', 'cancelled', 'expired'
        sa.Column('stripe_customer_id', sa.String, nullable=True),
        sa.Column('stripe_subscription_id', sa.String, nullable=True),
        sa.Column('start_date', sa.DateTime, nullable=False),
        sa.Column('end_date', sa.DateTime, nullable=True),
        sa.Column('cancelled_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
    )

    # Create indexes for subscriptions
    op.create_index('idx_subscriptions_user', 'subscriptions', ['user_id'])
    op.create_index('idx_subscriptions_status', 'subscriptions', ['status'])

    # Create maintenance_attachments table
    op.create_table(
        'maintenance_attachments',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('maintenance_id', sa.Integer, sa.ForeignKey('build_maintenance.id', ondelete='CASCADE'), nullable=False),
        sa.Column('file_path', sa.String, nullable=False),
        sa.Column('file_name', sa.String, nullable=False),
        sa.Column('file_size_bytes', sa.BigInteger, nullable=False),
        sa.Column('file_type', sa.String, nullable=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('uploaded_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'))
    )

    # Create index for maintenance attachments
    op.create_index('idx_maintenance_attachments', 'maintenance_attachments', ['maintenance_id'])

    # Add cost field to build_maintenance if it doesn't exist
    # (Some implementations might already have this from the schema)
    try:
        op.add_column('build_maintenance', sa.Column('cost', sa.Numeric(10, 2), nullable=True))
    except:
        pass  # Column might already exist


def downgrade():
    # Drop indexes
    op.drop_index('idx_maintenance_attachments', 'maintenance_attachments')
    op.drop_index('idx_subscriptions_status', 'subscriptions')
    op.drop_index('idx_subscriptions_user', 'subscriptions')
    op.drop_index('idx_snapshots_created', 'build_json_snapshots')
    op.drop_index('idx_snapshots_maintenance', 'build_json_snapshots')
    op.drop_index('idx_snapshots_build', 'build_json_snapshots')

    # Drop tables
    op.drop_table('maintenance_attachments')
    op.drop_table('subscriptions')
    op.drop_table('build_json_snapshots')

    # Remove columns from users table
    op.drop_column('users', 'storage_used_bytes')

    # Remove JSON columns from builds table
    op.drop_column('builds', 'additional_components_json')
    op.drop_column('builds', 'brakes_json')
    op.drop_column('builds', 'cab_interior_json')
    op.drop_column('builds', 'frame_json')
    op.drop_column('builds', 'transmission_json')
    op.drop_column('builds', 'rear_differential_json')
    op.drop_column('builds', 'tires_wheels_json')
    op.drop_column('builds', 'suspension_json')
    op.drop_column('builds', 'engine_internals_json')

    # Remove cost column from build_maintenance if we added it
    try:
        op.drop_column('build_maintenance', 'cost')
    except:
        pass
