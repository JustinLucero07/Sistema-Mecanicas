from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.base import EstadoOrden, PrioridadOrden, TipoDetalleOrden, TipoFoto
from app.schemas.cliente import ClienteOut
from app.schemas.inspeccion import ChecklistRecepcionCreate, ChecklistRecepcionOut, InspeccionOut
from app.schemas.usuario import UsuarioOut
from app.schemas.vehiculo import VehiculoOut


class DetalleOrdenBase(BaseModel):
    tipo: TipoDetalleOrden
    descripcion: str
    cantidad: float = 1.0
    precio_unitario: float
    costo_unitario: float = 0.0
    repuesto_id: int | None = None


class DetalleOrdenCreate(DetalleOrdenBase):
    pass


class DetalleOrdenOut(DetalleOrdenBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    subtotal: float


class FotoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tipo: TipoFoto
    url: str
    descripcion: str | None = None
    creado_en: datetime | None = None


class OrdenTrabajoBase(BaseModel):
    vehiculo_id: int
    cliente_id: int | None = None
    mecanico_id: int | None = None
    sucursal_id: int | None = None
    numero_orden: str | None = None
    fecha_ingreso: datetime | None = None
    fecha_entrega_estimada: datetime | None = None
    kilometraje_ingreso: int | None = None
    motivo_ingreso: str | None = None
    trabajos_solicitados: str | None = None
    diagnostico: str | None = None
    trabajos_realizados: str | None = None
    observaciones: str | None = None
    prioridad: PrioridadOrden = PrioridadOrden.NORMAL


class OrdenTrabajoCreate(OrdenTrabajoBase):
    detalles: list[DetalleOrdenCreate] = []
    checklist: ChecklistRecepcionCreate | None = None


class OrdenTrabajoUpdate(BaseModel):
    mecanico_id: int | None = None
    sucursal_id: int | None = None
    motivo_ingreso: str | None = None
    trabajos_solicitados: str | None = None
    diagnostico: str | None = None
    trabajos_realizados: str | None = None
    observaciones: str | None = None
    estado: EstadoOrden | None = None
    prioridad: PrioridadOrden | None = None
    fecha_entrega_estimada: datetime | None = None
    fecha_entrega_real: datetime | None = None
    descuento: float | None = None
    impuestos: float | None = None
    firma_cliente_url: str | None = None
    firma_mecanico_url: str | None = None


class OrdenTrabajoOut(OrdenTrabajoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    estado: EstadoOrden
    subtotal: float
    descuento: float
    impuestos: float
    total: float
    monto_pagado: float
    saldo_pendiente: float
    fecha_ingreso: datetime
    fecha_entrega_real: datetime | None = None
    firma_cliente_url: str | None = None
    firma_mecanico_url: str | None = None

    detalles: list[DetalleOrdenOut] = []
    fotos: list[FotoOut] = []
    checklist_recepcion: ChecklistRecepcionOut | None = None
    inspecciones: list[InspeccionOut] = []
    vehiculo: VehiculoOut | None = None
    cliente: ClienteOut | None = None
    mecanico: UsuarioOut | None = None
