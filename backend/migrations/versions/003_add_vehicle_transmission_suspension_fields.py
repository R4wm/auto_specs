"""add_vehicle_transmission_suspension_fields

Revision ID: 003
Revises: 002
Create Date: 2025-10-16 06:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add vehicle, transmission, suspension, tires, and fluids fields to builds table."""

    # Vehicle Information
    op.add_column('builds', sa.Column('vehicle_year', sa.Integer(), nullable=True))
    op.add_column('builds', sa.Column('vehicle_make', sa.String(255), nullable=True))
    op.add_column('builds', sa.Column('vehicle_model', sa.String(255), nullable=True))
    op.add_column('builds', sa.Column('vehicle_trim', sa.String(255), nullable=True))
    op.add_column('builds', sa.Column('vin', sa.String(50), nullable=True))
    op.add_column('builds', sa.Column('vehicle_weight_lbs', sa.Numeric(10, 2), nullable=True))

    # Transmission
    op.add_column('builds', sa.Column('transmission_type', sa.String(255), nullable=True))
    op.add_column('builds', sa.Column('transmission_model', sa.String(255), nullable=True))
    op.add_column('builds', sa.Column('transmission_gears', sa.Integer(), nullable=True))
    op.add_column('builds', sa.Column('final_drive_ratio', sa.String(50), nullable=True))

    # Suspension & Handling
    op.add_column('builds', sa.Column('suspension_front', sa.String(255), nullable=True))
    op.add_column('builds', sa.Column('suspension_rear', sa.String(255), nullable=True))
    op.add_column('builds', sa.Column('spring_rate_front', sa.String(100), nullable=True))
    op.add_column('builds', sa.Column('spring_rate_rear', sa.String(100), nullable=True))
    op.add_column('builds', sa.Column('sway_bar_front', sa.String(100), nullable=True))
    op.add_column('builds', sa.Column('sway_bar_rear', sa.String(100), nullable=True))

    # Tires & Wheels
    op.add_column('builds', sa.Column('tire_size_front', sa.String(100), nullable=True))
    op.add_column('builds', sa.Column('tire_size_rear', sa.String(100), nullable=True))
    op.add_column('builds', sa.Column('tire_brand', sa.String(255), nullable=True))
    op.add_column('builds', sa.Column('tire_model', sa.String(255), nullable=True))
    op.add_column('builds', sa.Column('wheel_size_front', sa.String(100), nullable=True))
    op.add_column('builds', sa.Column('wheel_size_rear', sa.String(100), nullable=True))

    # Fluids & Lubricants
    op.add_column('builds', sa.Column('engine_oil_type', sa.String(255), nullable=True))
    op.add_column('builds', sa.Column('engine_oil_weight', sa.String(50), nullable=True))
    op.add_column('builds', sa.Column('engine_oil_capacity', sa.String(50), nullable=True))
    op.add_column('builds', sa.Column('transmission_fluid_type', sa.String(255), nullable=True))
    op.add_column('builds', sa.Column('differential_fluid_type', sa.String(255), nullable=True))
    op.add_column('builds', sa.Column('coolant_type', sa.String(255), nullable=True))


def downgrade() -> None:
    """Remove vehicle, transmission, suspension, tires, and fluids fields from builds table."""

    # Fluids
    op.drop_column('builds', 'coolant_type')
    op.drop_column('builds', 'differential_fluid_type')
    op.drop_column('builds', 'transmission_fluid_type')
    op.drop_column('builds', 'engine_oil_capacity')
    op.drop_column('builds', 'engine_oil_weight')
    op.drop_column('builds', 'engine_oil_type')

    # Tires & Wheels
    op.drop_column('builds', 'wheel_size_rear')
    op.drop_column('builds', 'wheel_size_front')
    op.drop_column('builds', 'tire_model')
    op.drop_column('builds', 'tire_brand')
    op.drop_column('builds', 'tire_size_rear')
    op.drop_column('builds', 'tire_size_front')

    # Suspension
    op.drop_column('builds', 'sway_bar_rear')
    op.drop_column('builds', 'sway_bar_front')
    op.drop_column('builds', 'spring_rate_rear')
    op.drop_column('builds', 'spring_rate_front')
    op.drop_column('builds', 'suspension_rear')
    op.drop_column('builds', 'suspension_front')

    # Transmission
    op.drop_column('builds', 'final_drive_ratio')
    op.drop_column('builds', 'transmission_gears')
    op.drop_column('builds', 'transmission_model')
    op.drop_column('builds', 'transmission_type')

    # Vehicle
    op.drop_column('builds', 'vehicle_weight_lbs')
    op.drop_column('builds', 'vin')
    op.drop_column('builds', 'vehicle_trim')
    op.drop_column('builds', 'vehicle_model')
    op.drop_column('builds', 'vehicle_make')
    op.drop_column('builds', 'vehicle_year')
