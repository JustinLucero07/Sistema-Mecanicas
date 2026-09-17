from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import TenantMixin, TimestampMixin, TipoDocumento, TipoFoto


class Vehiculo(Base, TenantMixin, TimestampMixin):
    __tablename__ = "vehiculos"

    id: Mapped[int] = mapped_column(primary_key=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id"), nullable=False, index=True)

    # Placa normalizada (sin guiones ni espacios para búsqueda unificada)
    placa: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    vin_chasis: Mapped[str | None] = mapped_column(String(50), index=True)
    marca: Mapped[str | None] = mapped_column(String(60))
    modelo: Mapped[str | None] = mapped_column(String(60))
    anio: Mapped[int | None] = mapped_column(Integer)
    color: Mapped[str | None] = mapped_column(String(40))
    tipo: Mapped[str | None] = mapped_column(String(40))  # sedan, suv, camioneta, moto, camion...
    combustible: Mapped[str | None] = mapped_column(String(30))  # gasolina, diesel, hibrido, electrico, glp
    cilindraje: Mapped[str | None] = mapped_column(String(30))
    transmision: Mapped[str | None] = mapped_column(String(30))  # manual, automatica, cvt
    kilometraje_actual: Mapped[int | None] = mapped_column(Integer)
    kilometraje_anterior: Mapped[int | None] = mapped_column(Integer)
    proximo_mantenimiento_km: Mapped[int | None] = mapped_column(Integer)
    estado: Mapped[str] = mapped_column(String(30), default="activo")  # activo, en_taller, inactivo
    foto_placa_url: Mapped[str | None] = mapped_column(String(500))
    notas: Mapped[str | None] = mapped_column(Text)

    cliente = relationship("Cliente", back_populates="vehiculos")
    ordenes = relationship(
        "OrdenTrabajo", back_populates="vehiculo", order_by="OrdenTrabajo.fecha_ingreso.desc()"
    )
    fotos = relationship("FotoVehiculo", back_populates="vehiculo", cascade="all, delete-orphan")
    documentos = relationship("DocumentoVehiculo", back_populates="vehiculo", cascade="all, delete-orphan")


class FotoVehiculo(Base, TimestampMixin):
    """Galería de fotos históricas del vehículo o asociadas a una orden."""

    __tablename__ = "fotos_vehiculo"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehiculo_id: Mapped[int] = mapped_column(ForeignKey("vehiculos.id"), nullable=False, index=True)
    orden_id: Mapped[int | None] = mapped_column(ForeignKey("ordenes_trabajo.id"), nullable=True)
    tipo: Mapped[TipoFoto] = mapped_column(Enum(TipoFoto, name="tipo_foto_vehiculo"), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    observacion: Mapped[str | None] = mapped_column(String(255))

    vehiculo = relationship("Vehiculo", back_populates="fotos")
    orden = relationship("OrdenTrabajo", back_populates="fotos_asociadas")


class DocumentoVehiculo(Base, TimestampMixin):
    """Documentos adjuntos al vehículo (matrícula, seguro, manuales, facturas previas)."""

    __tablename__ = "documentos_vehiculo"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehiculo_id: Mapped[int] = mapped_column(ForeignKey("vehiculos.id"), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    tipo: Mapped[TipoDocumento] = mapped_column(
        Enum(TipoDocumento, name="tipo_documento_vehiculo"), default=TipoDocumento.OTRO
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)

    vehiculo = relationship("Vehiculo", back_populates="documentos")
