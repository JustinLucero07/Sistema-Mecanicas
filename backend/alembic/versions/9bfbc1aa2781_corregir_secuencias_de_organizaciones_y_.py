"""corregir secuencias de organizaciones y sucursales

Revision ID: 9bfbc1aa2781
Revises: 79d82987b130
Create Date: 2026-10-04 17:39:34.750053

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9bfbc1aa2781'
down_revision: Union[str, None] = '79d82987b130'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLAS_CON_TENANT = [
    "clientes", "cuentas_por_cobrar", "cuentas_por_pagar", "egresos", "ingresos",
    "movimientos_inventario", "ordenes_trabajo", "proveedores", "repuestos", "vehiculos",
    "caja_diaria", "bahias", "citas",
]


def upgrade() -> None:
    conexion = op.get_bind()
    # Sin valor por defecto: un registro sin taller debe fallar, no caer en el taller 1.
    for tabla in TABLAS_CON_TENANT:
        existe = conexion.execute(
            sa.text(
                "SELECT 1 FROM information_schema.columns WHERE table_name = :t AND column_name = 'organizacion_id'"
            ),
            {"t": tabla},
        ).first()
        if existe:
            op.alter_column(tabla, "organizacion_id", server_default=None)

    # La organización y sucursal heredadas se insertaron con id fijo: se
    # alinea el contador para que los próximos talleres no choquen.
    for tabla in ("organizaciones", "sucursales"):
        op.execute(
            f"SELECT setval(pg_get_serial_sequence('{tabla}', 'id'), "
            f"COALESCE((SELECT MAX(id) FROM {tabla}), 0) + 1, false)"
        )


def downgrade() -> None:
    # No se restaura el valor por defecto inseguro.
    pass
