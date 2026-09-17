from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.base import MotivoMovimientoInventario, TipoMovimientoInventario


class ProveedorBase(BaseModel):
    nombre: str
    ruc: str | None = None
    contacto: str | None = None
    telefono: str | None = None
    email: str | None = None
    direccion: str | None = None
    notas: str | None = None


class ProveedorCreate(ProveedorBase):
    pass


class ProveedorOut(ProveedorBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class RepuestoBase(BaseModel):
    nombre: str
    codigo: str | None = None
    sku: str | None = None
    barcode: str | None = None
    categoria: str | None = None
    marca: str | None = None
    descripcion: str | None = None
    ubicacion: str | None = None
    stock_minimo: int = 0
    costo_compra: float = 0.0
    precio_venta: float = 0.0
    unidad: str = "unidad"
    proveedor_id: int | None = None


class RepuestoCreate(RepuestoBase):
    stock_actual: int = 0


class RepuestoUpdate(BaseModel):
    nombre: str | None = None
    codigo: str | None = None
    sku: str | None = None
    barcode: str | None = None
    categoria: str | None = None
    marca: str | None = None
    descripcion: str | None = None
    ubicacion: str | None = None
    stock_minimo: int | None = None
    costo_compra: float | None = None
    precio_venta: float | None = None
    unidad: str | None = None
    proveedor_id: int | None = None


class RepuestoOut(RepuestoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    stock_actual: int


class MovimientoInventarioCreate(BaseModel):
    repuesto_id: int
    tipo: TipoMovimientoInventario
    motivo: MotivoMovimientoInventario
    cantidad: int
    orden_id: int | None = None
    observacion: str | None = None


class MovimientoInventarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    repuesto_id: int
    tipo: TipoMovimientoInventario
    motivo: MotivoMovimientoInventario
    cantidad: int
    stock_anterior: int | None = None
    stock_nuevo: int | None = None
    orden_id: int | None = None
    fecha: datetime
    observacion: str | None = None
