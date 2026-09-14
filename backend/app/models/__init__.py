"""Importa todos los modelos para que Alembic los detecte (autogenerate)."""

from app.models.cliente import Cliente
from app.models.financiero import CajaDiaria, CuentaPorCobrar, CuentaPorPagar, Egreso, Ingreso
from app.models.inventario import MovimientoInventario, Proveedor, Repuesto
from app.models.orden import Comision, DetalleOrden, Foto, OrdenTrabajo
from app.models.usuario import Usuario
from app.models.vehiculo import Vehiculo

__all__ = [
    "Cliente",
    "CajaDiaria",
    "CuentaPorCobrar",
    "CuentaPorPagar",
    "Egreso",
    "Ingreso",
    "MovimientoInventario",
    "Proveedor",
    "Repuesto",
    "Comision",
    "DetalleOrden",
    "Foto",
    "OrdenTrabajo",
    "Usuario",
    "Vehiculo",
]
