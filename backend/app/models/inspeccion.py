from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import EstadoInspeccionItem, TimestampMixin


class ChecklistRecepcion(Base, TimestampMixin):
    """Checklist visual 360° y accesorios en la recepción del auto."""

    __tablename__ = "checklists_recepcion"

    id: Mapped[int] = mapped_column(primary_key=True)
    orden_id: Mapped[int] = mapped_column(ForeignKey("ordenes_trabajo.id"), unique=True, nullable=False)

    # Estado exterior y accesorios
    nivel_combustible: Mapped[int] = mapped_column(Integer, default=50)  # 0 a 100%
    radio: Mapped[bool] = mapped_column(Boolean, default=True)
    herramientas: Mapped[bool] = mapped_column(Boolean, default=True)
    gato_palanca: Mapped[bool] = mapped_column(Boolean, default=True)
    llanta_emergencia: Mapped[bool] = mapped_column(Boolean, default=True)
    antena: Mapped[bool] = mapped_column(Boolean, default=True)
    documentos_vehiculo: Mapped[bool] = mapped_column(Boolean, default=False)

    # Registro de daños en carrocería (JSON con coordenadas x, y, vista y tipo de daño)
    danos_graficos_json: Mapped[str | None] = mapped_column(Text)
    observaciones_recepcion: Mapped[str | None] = mapped_column(Text)
    firma_cliente_url: Mapped[str | None] = mapped_column(String(500))

    orden = relationship("OrdenTrabajo", back_populates="checklist_recepcion")


class Inspeccion(Base, TimestampMixin):
    """Inspección técnica multipunto del vehículo."""

    __tablename__ = "inspecciones"

    id: Mapped[int] = mapped_column(primary_key=True)
    orden_id: Mapped[int] = mapped_column(ForeignKey("ordenes_trabajo.id"), nullable=False, index=True)
    inspector_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    observaciones: Mapped[str | None] = mapped_column(Text)

    orden = relationship("OrdenTrabajo", back_populates="inspecciones")
    detalles = relationship("DetalleInspeccion", back_populates="inspeccion", cascade="all, delete-orphan")


class DetalleInspeccion(Base, TimestampMixin):
    """Punto evaluado en la inspección (ej: motor, frenos, suspensión, etc.)."""

    __tablename__ = "detalle_inspecciones"

    id: Mapped[int] = mapped_column(primary_key=True)
    inspeccion_id: Mapped[int] = mapped_column(ForeignKey("inspecciones.id"), nullable=False, index=True)
    sistema: Mapped[str] = mapped_column(String(60), nullable=False)  # motor, frenos, suspension, direccion, etc.
    estado: Mapped[EstadoInspeccionItem] = mapped_column(
        Enum(EstadoInspeccionItem, name="estado_inspeccion_item"), default=EstadoInspeccionItem.BUENO
    )
    observacion: Mapped[str | None] = mapped_column(String(255))
    foto_url: Mapped[str | None] = mapped_column(String(500))

    inspeccion = relationship("Inspeccion", back_populates="detalles")
