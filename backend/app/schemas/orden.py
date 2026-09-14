from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.base import EstadoOrden, PrioridadOrden, TipoDetalleOrden, TipoFoto


class DetalleOrdenBase(BaseModel):
    tipo: TipoDetalleOrden
    descripcion: str
    cantidad: float = 1
    precio_unitario: float
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


class OrdenTrabajoBase(BaseModel):
    vehiculo_id: int
    mecanico_id: int | None = None
    fecha_ingreso: datetime
    kilometraje_ingreso: int | None = None
    descripcion_problema: str | None = None
    diagnostico: str | None = None
    prioridad: PrioridadOrden = PrioridadOrden.NORMAL


class OrdenTrabajoCreate(OrdenTrabajoBase):
    detalles: list[DetalleOrdenCreate] = []


class OrdenTrabajoUpdate(BaseModel):
    mecanico_id: int | None = None
    diagnostico: str | None = None
    estado: EstadoOrden | None = None
    prioridad: PrioridadOrden | None = None
    fecha_entrega: datetime | None = None


class OrdenTrabajoOut(OrdenTrabajoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    estado: EstadoOrden
    fecha_entrega: datetime | None = None
    detalles: list[DetalleOrdenOut] = []
    fotos: list[FotoOut] = []
    total: float
