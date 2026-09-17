from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.base import TipoDocumento, TipoFoto
from app.schemas.cliente import ClienteOut


class FotoVehiculoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tipo: TipoFoto
    url: str
    observacion: str | None = None
    creado_en: datetime | None = None


class DocumentoVehiculoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nombre: str
    tipo: TipoDocumento
    url: str
    creado_en: datetime | None = None


class VehiculoBase(BaseModel):
    placa: str
    marca: str | None = None
    modelo: str | None = None
    anio: int | None = None
    color: str | None = None
    vin_chasis: str | None = None
    tipo: str | None = None
    combustible: str | None = None
    cilindraje: str | None = None
    transmision: str | None = None
    kilometraje_actual: int | None = None
    kilometraje_anterior: int | None = None
    proximo_mantenimiento_km: int | None = None
    estado: str | None = "activo"
    notas: str | None = None


class VehiculoCreate(VehiculoBase):
    cliente_id: int


class VehiculoUpdate(BaseModel):
    marca: str | None = None
    modelo: str | None = None
    anio: int | None = None
    color: str | None = None
    vin_chasis: str | None = None
    tipo: str | None = None
    combustible: str | None = None
    cilindraje: str | None = None
    transmision: str | None = None
    kilometraje_actual: int | None = None
    proximo_mantenimiento_km: int | None = None
    estado: str | None = None
    notas: str | None = None
    cliente_id: int | None = None


class VehiculoOut(VehiculoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    cliente_id: int
    foto_placa_url: str | None = None
    cliente: ClienteOut | None = None
    fotos: list[FotoVehiculoOut] = []
    documentos: list[DocumentoVehiculoOut] = []


class PlacaDetectadaOut(BaseModel):
    """Resultado del reconocimiento de placa a partir de una foto."""

    placa_texto: str
    confianza: float
    vehiculo: VehiculoOut | None = None
    foto_url: str


class TimelineEventoOut(BaseModel):
    """Evento histórico del vehículo para el módulo de Línea de Tiempo."""

    orden_id: int
    numero_orden: str | None = None
    fecha: datetime
    kilometraje: int | None = None
    motivo: str | None = None
    diagnostico: str | None = None
    trabajos_realizados: str | None = None
    repuestos_utilizados: list[str] = []
    mecanico_nombre: str | None = None
    costo_total: float = 0.0
    estado: str
    fotos: list[str] = []
    observaciones: str | None = None
