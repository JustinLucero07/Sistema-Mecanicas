from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.base import EstadoInspeccionItem


class ChecklistRecepcionCreate(BaseModel):
    nivel_combustible: int = 50  # 0 a 100%
    radio: bool = True
    herramientas: bool = True
    gato_palanca: bool = True
    llanta_emergencia: bool = True
    antena: bool = True
    documentos_vehiculo: bool = False
    danos_graficos_json: str | None = None  # Coordenadas de marcas en carrocería
    observaciones_recepcion: str | None = None
    firma_cliente_url: str | None = None


class ChecklistRecepcionOut(ChecklistRecepcionCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    orden_id: int
    creado_en: datetime | None = None


class DetalleInspeccionCreate(BaseModel):
    sistema: str  # motor, frenos, suspension, direccion, neumaticos, luces, etc.
    estado: EstadoInspeccionItem = EstadoInspeccionItem.BUENO
    observacion: str | None = None
    foto_url: str | None = None


class DetalleInspeccionOut(DetalleInspeccionCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int


class InspeccionCreate(BaseModel):
    observaciones: str | None = None
    detalles: list[DetalleInspeccionCreate] = []


class InspeccionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    orden_id: int
    inspector_id: int | None = None
    observaciones: str | None = None
    detalles: list[DetalleInspeccionOut] = []
    creado_en: datetime | None = None
