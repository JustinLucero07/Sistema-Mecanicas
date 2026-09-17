from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import (
    EstadoComision,
    EstadoOrden,
    PrioridadOrden,
    TenantMixin,
    TimestampMixin,
    TipoDetalleOrden,
    TipoFoto,
)


class OrdenTrabajo(Base, TenantMixin, TimestampMixin):
    __tablename__ = "ordenes_trabajo"

    id: Mapped[int] = mapped_column(primary_key=True)
    numero_orden: Mapped[str | None] = mapped_column(String(30), index=True)
    sucursal_id: Mapped[int | None] = mapped_column(ForeignKey("sucursales.id"), nullable=True, index=True)
    vehiculo_id: Mapped[int] = mapped_column(ForeignKey("vehiculos.id"), nullable=False, index=True)
    cliente_id: Mapped[int | None] = mapped_column(ForeignKey("clientes.id"), nullable=True, index=True)
    mecanico_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True, index=True)

    fecha_ingreso: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_entrega_estimada: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    fecha_entrega_real: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    kilometraje_ingreso: Mapped[int | None] = mapped_column(Integer)

    motivo_ingreso: Mapped[str | None] = mapped_column(Text)
    trabajos_solicitados: Mapped[str | None] = mapped_column(Text)
    diagnostico: Mapped[str | None] = mapped_column(Text)
    trabajos_realizados: Mapped[str | None] = mapped_column(Text)
    observaciones: Mapped[str | None] = mapped_column(Text)

    estado: Mapped[EstadoOrden] = mapped_column(
        Enum(EstadoOrden, name="estado_orden"), default=EstadoOrden.RECEPCION, nullable=False
    )
    prioridad: Mapped[PrioridadOrden] = mapped_column(
        Enum(PrioridadOrden, name="prioridad_orden"), default=PrioridadOrden.NORMAL
    )

    # Valores económicos acumulados
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    descuento: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    impuestos: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    total: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    monto_pagado: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    # Firmas de conformidad
    firma_cliente_url: Mapped[str | None] = mapped_column(String(500))
    firma_mecanico_url: Mapped[str | None] = mapped_column(String(500))

    vehiculo = relationship("Vehiculo", back_populates="ordenes")
    cliente = relationship("Cliente", back_populates="ordenes")
    mecanico = relationship("Usuario", back_populates="ordenes_asignadas", foreign_keys=[mecanico_id])
    detalles = relationship("DetalleOrden", back_populates="orden", cascade="all, delete-orphan")
    fotos = relationship("Foto", back_populates="orden", cascade="all, delete-orphan")
    fotos_asociadas = relationship("FotoVehiculo", back_populates="orden")
    checklist_recepcion = relationship("ChecklistRecepcion", back_populates="orden", uselist=False)
    inspecciones = relationship("Inspeccion", back_populates="orden", cascade="all, delete-orphan")
    comision = relationship("Comision", back_populates="orden", uselist=False)

    @property
    def saldo_pendiente(self) -> float:
        return max(0.0, float(self.total) - float(self.monto_pagado))

    def recalcular_totales(self) -> None:
        sub = sum(float(d.subtotal) for d in self.detalles)
        self.subtotal = round(sub, 2)
        desc = float(self.descuento or 0)
        imp = float(self.impuestos or 0)
        self.total = round(max(0.0, sub - desc + imp), 2)


class DetalleOrden(Base, TimestampMixin):
    __tablename__ = "detalle_ordenes"

    id: Mapped[int] = mapped_column(primary_key=True)
    orden_id: Mapped[int] = mapped_column(ForeignKey("ordenes_trabajo.id"), nullable=False, index=True)
    repuesto_id: Mapped[int | None] = mapped_column(ForeignKey("repuestos.id"), nullable=True)

    tipo: Mapped[TipoDetalleOrden] = mapped_column(Enum(TipoDetalleOrden, name="tipo_detalle_orden"))
    descripcion: Mapped[str] = mapped_column(String(255), nullable=False)
    cantidad: Mapped[float] = mapped_column(Numeric(10, 2), default=1)
    precio_unitario: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    costo_unitario: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    orden = relationship("OrdenTrabajo", back_populates="detalles")
    repuesto = relationship("Repuesto")


class Foto(Base, TimestampMixin):
    """Fotos específicas de la orden de trabajo (antes, durante, después, comprobantes)."""

    __tablename__ = "fotos"

    id: Mapped[int] = mapped_column(primary_key=True)
    orden_id: Mapped[int | None] = mapped_column(ForeignKey("ordenes_trabajo.id"), index=True)
    tipo: Mapped[TipoFoto] = mapped_column(Enum(TipoFoto, name="tipo_foto"))
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(255))

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
