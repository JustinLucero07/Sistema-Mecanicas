from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import (
    EstadoComision,
    EstadoOrden,
    PrioridadOrden,
    TimestampMixin,
    TipoDetalleOrden,
    TipoFoto,
)


class OrdenTrabajo(Base, TimestampMixin):
    __tablename__ = "ordenes_trabajo"

    id: Mapped[int] = mapped_column(primary_key=True)
    vehiculo_id: Mapped[int] = mapped_column(ForeignKey("vehiculos.id"), nullable=False)
    mecanico_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))

    fecha_ingreso: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_entrega: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    kilometraje_ingreso: Mapped[int | None] = mapped_column(Integer)

    descripcion_problema: Mapped[str | None] = mapped_column(Text)
    diagnostico: Mapped[str | None] = mapped_column(Text)

    estado: Mapped[EstadoOrden] = mapped_column(
        Enum(EstadoOrden, name="estado_orden"), default=EstadoOrden.PENDIENTE, nullable=False
    )
    prioridad: Mapped[PrioridadOrden] = mapped_column(
        Enum(PrioridadOrden, name="prioridad_orden"), default=PrioridadOrden.NORMAL
    )

    vehiculo = relationship("Vehiculo", back_populates="ordenes")
    mecanico = relationship("Usuario", back_populates="ordenes_asignadas", foreign_keys=[mecanico_id])
    detalles = relationship(
        "DetalleOrden", back_populates="orden", cascade="all, delete-orphan"
    )
    fotos = relationship("Foto", back_populates="orden", cascade="all, delete-orphan")
    comision = relationship("Comision", back_populates="orden", uselist=False)

    @property
    def total(self) -> float:
        return sum(float(d.subtotal) for d in self.detalles)


class DetalleOrden(Base, TimestampMixin):
    __tablename__ = "detalle_ordenes"

    id: Mapped[int] = mapped_column(primary_key=True)
    orden_id: Mapped[int] = mapped_column(ForeignKey("ordenes_trabajo.id"), nullable=False)
    repuesto_id: Mapped[int | None] = mapped_column(ForeignKey("repuestos.id"))

    tipo: Mapped[TipoDetalleOrden] = mapped_column(Enum(TipoDetalleOrden, name="tipo_detalle_orden"))
    descripcion: Mapped[str] = mapped_column(String(255), nullable=False)
    cantidad: Mapped[float] = mapped_column(Numeric(10, 2), default=1)
    precio_unitario: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    orden = relationship("OrdenTrabajo", back_populates="detalles")
    repuesto = relationship("Repuesto")


class Foto(Base, TimestampMixin):
    """Fotos asociadas a una orden: placa, antes/después, comprobantes."""

    __tablename__ = "fotos"

    id: Mapped[int] = mapped_column(primary_key=True)
    orden_id: Mapped[int | None] = mapped_column(ForeignKey("ordenes_trabajo.id"))
    tipo: Mapped[TipoFoto] = mapped_column(Enum(TipoFoto, name="tipo_foto"))
    url: Mapped[str] = mapped_column(String(500), nullable=False)

    orden = relationship("OrdenTrabajo", back_populates="fotos")


class Comision(Base, TimestampMixin):
    __tablename__ = "comisiones"

    id: Mapped[int] = mapped_column(primary_key=True)
    mecanico_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    orden_id: Mapped[int] = mapped_column(ForeignKey("ordenes_trabajo.id"), unique=True, nullable=False)
    porcentaje: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    monto: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    estado: Mapped[EstadoComision] = mapped_column(
        Enum(EstadoComision, name="estado_comision"), default=EstadoComision.PENDIENTE
    )

    orden = relationship("OrdenTrabajo", back_populates="comision")
    mecanico = relationship("Usuario")
