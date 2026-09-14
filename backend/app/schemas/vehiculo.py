from pydantic import BaseModel, ConfigDict

from app.schemas.cliente import ClienteOut


class VehiculoBase(BaseModel):
    placa: str
    marca: str | None = None
    modelo: str | None = None
    anio: int | None = None
    color: str | None = None
    vin_chasis: str | None = None
    tipo: str | None = None
    kilometraje_actual: int | None = None


class VehiculoCreate(VehiculoBase):
    cliente_id: int


class VehiculoUpdate(BaseModel):
    marca: str | None = None
    modelo: str | None = None
    anio: int | None = None
    color: str | None = None
    vin_chasis: str | None = None
    tipo: str | None = None
    kilometraje_actual: int | None = None
    cliente_id: int | None = None


class VehiculoOut(VehiculoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    cliente_id: int
    foto_placa_url: str | None = None
    cliente: ClienteOut | None = None


class PlacaDetectadaOut(BaseModel):
    """Resultado del reconocimiento de placa a partir de una foto."""

    placa_texto: str
    confianza: float
    vehiculo: VehiculoOut | None = None
    foto_url: str
