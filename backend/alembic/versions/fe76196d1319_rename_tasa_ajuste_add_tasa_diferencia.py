"""rename_tasa_ajuste_add_tasa_diferencia

Revision ID: fe76196d1319
Revises: cefbbb8f358e
Create Date: 2025-12-12 18:05:01.072461

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fe76196d1319'
down_revision = 'cefbbb8f358e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('recaudacion_maquina', 'tasa_ajuste', new_column_name='ajuste')
    op.add_column('recaudacion_maquina', sa.Column('tasa_diferencia', sa.Numeric(precision=12, scale=2), nullable=True))


def downgrade() -> None:
    op.drop_column('recaudacion_maquina', 'tasa_diferencia')
    op.alter_column('recaudacion_maquina', 'ajuste', new_column_name='tasa_ajuste')
