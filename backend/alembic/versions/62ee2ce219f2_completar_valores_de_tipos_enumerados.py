"""completar valores de tipos enumerados

Revision ID: 62ee2ce219f2
Revises: 9bfbc1aa2781
Create Date: 2026-10-04 17:42:06.963050

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '62ee2ce219f2'
down_revision: Union[str, None] = '9bfbc1aa2781'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Valores que el código usa. Algunos se habían agregado a mano en bases
# existentes y nunca quedaron en una migración: una instalación nueva fallaba.
VALORES = {
    'categoria_egreso': ['NOMINA', 'REPUESTOS', 'ALQUILER', 'SERVICIOS_BASICOS', 'HERRAMIENTAS', 'IMPUESTOS', 'MARKETING', 'MANTENIMIENTO_LOCAL', 'OTROS'],
    'estado_bahia': ['DISPONIBLE', 'OCUPADA', 'MANTENIMIENTO', 'RESERVADA'],
    'estado_cita': ['PROGRAMADA', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO'],
    'estado_comision': ['PENDIENTE', 'PAGADO'],
    'estado_cuenta_cobrar': ['PENDIENTE', 'PARCIAL', 'PAGADO', 'VENCIDO'],
    'estado_cuenta_pagar': ['PENDIENTE', 'PARCIAL', 'PAGADO', 'VENCIDO'],
    'estado_inspeccion_item': ['BUENO', 'REVISAR', 'DEFICIENTE', 'REQUIERE_REPARACION'],
    'estado_orden': ['RECEPCION', 'DIAGNOSTICO', 'ESPERANDO_APROBACION', 'ESPERANDO_REPUESTOS', 'EN_REPARACION', 'CONTROL_CALIDAD', 'LISTO_PARA_ENTREGAR', 'ENTREGADO', 'CANCELADO', 'PENDIENTE', 'EN_PROCESO', 'COMPLETADO'],
    'metodo_pago': ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE', 'OTRO'],
    'metodo_pago_egreso': ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CHEQUE', 'OTRO'],
    'motivo_movimiento_inventario': ['COMPRA', 'USO_EN_ORDEN', 'AJUSTE_INVENTARIO', 'DEVOLUCION'],
    'prioridad_orden': ['BAJA', 'NORMAL', 'ALTA', 'URGENTE'],
    'rol_usuario': ['SUPERADMIN', 'ADMIN_TALLER', 'GERENTE', 'RECEPCIONISTA', 'MECANICO', 'INVENTARIO', 'CONTABILIDAD', 'CLIENTE', 'ADMIN', 'CAJERO'],
    'tipo_detalle_orden': ['MANO_OBRA', 'REPUESTO', 'SERVICIO_EXTERNO'],
    'tipo_documento_vehiculo': ['MATRICULA', 'SEGURO', 'MANUAL', 'PERITAJE', 'FACTURA', 'OTRO'],
    'tipo_foto': ['PLACA', 'FRENTE', 'PARTE_TRASERA', 'LATERAL_IZQUIERDO', 'LATERAL_DERECHO', 'INTERIOR', 'MOTOR', 'DANIO', 'ANTES', 'DESPUES', 'COMPROBANTE'],
    'tipo_foto_vehiculo': ['PLACA', 'FRENTE', 'PARTE_TRASERA', 'LATERAL_IZQUIERDO', 'LATERAL_DERECHO', 'INTERIOR', 'MOTOR', 'DANIO', 'ANTES', 'DESPUES', 'COMPROBANTE'],
    'tipo_movimiento_inventario': ['ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION'],
}


def upgrade() -> None:
    # ADD VALUE no puede usarse en la misma transacción en que se crea: se
    # ejecuta fuera del bloque transaccional de Alembic.
    with op.get_context().autocommit_block():
        for tipo, valores in VALORES.items():
            for valor in valores:
                op.execute(f"ALTER TYPE {tipo} ADD VALUE IF NOT EXISTS '{valor}'")


def downgrade() -> None:
    # PostgreSQL no permite quitar valores de un tipo enumerado.
    pass
