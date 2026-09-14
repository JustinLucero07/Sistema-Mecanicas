from pydantic import BaseModel, ConfigDict


class ProveedorBase(BaseModel):
    nombre: str
    contacto: str | None = None
    telefono: str | None = None
    ruc: str | None = None


class ProveedorCreate(ProveedorBase):
    pass


class ProveedorOut(ProveedorBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class RepuestoBase(BaseModel):
    nombre: str
    codigo: str | None = None
    categoria: str | None = None
    stock_minimo: int = 0
    costo_compra: float = 0
    precio_venta: float = 0
    unidad: str = "unidad"
    proveedor_id: int | None = None


class RepuestoCreate(RepuestoBase):
    stock_actual: int = 0


class RepuestoUpdate(BaseModel):
    nombre: str | None = None
    categoria: str | None = None
    stock_minimo: int | None = None
    costo_compra: float | None = None
    precio_venta: float | None = None
    proveedor_id: int | None = None


class RepuestoOut(RepuestoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    stock_actual: int


class MovimientoInventarioCreate(BaseModel):
    repuesto_id: int
    tipo: str
    motivo: str
    cantidad: int
    orden_id: int | None = None
