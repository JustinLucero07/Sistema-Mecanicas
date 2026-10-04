"""Importa todos los modelos para que SQLAlchemy y Alembic los detecten."""

from app.models.auditoria import AuditLog  # noqa: F401
from app.models.citas import Bahia, Cita
from app.models.cliente import Cliente
from app.models.financiero import CajaDiaria, CuentaPorCobrar, CuentaPorPagar, Egreso, Ingreso
from app.models.inspeccion import ChecklistRecepcion, DetalleInspeccion, Inspeccion
from app.models.inventario import MovimientoInventario, Proveedor, Repuesto
from app.models.orden import Comision, DetalleOrden, Foto, OrdenTrabajo
from app.models.tenant import Organizacion, Sucursal
from app.models.usuario import Usuario
from app.models.vehiculo import DocumentoVehiculo, FotoVehiculo, Vehiculo

__all__ = [
    "Organizacion",
    "Sucursal",
    "Usuario",
    "Cliente",
    "Vehiculo",
    "FotoVehiculo",
    "DocumentoVehiculo",
    "OrdenTrabajo",
    "DetalleOrden",
    "Foto",
    "Comision",
    "ChecklistRecepcion",
    "Inspeccion",
    "DetalleInspeccion",
    "Proveedor",
    "Repuesto",
    "MovimientoInventario",
    "Ingreso",
    "Egreso",
    "CajaDiaria",
    "CuentaPorCobrar",
    "CuentaPorPagar",
    "Bahia",
    "Cita",
]
