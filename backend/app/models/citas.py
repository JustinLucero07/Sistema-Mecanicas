from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import EstadoBahia, EstadoCita, TenantMixin, TimestampMixin


class Bahia(Base, TenantMixin, TimestampMixin):
    """Puestos o bahías de trabajo en el taller."""

    __tablename__ = "bahias"

    id: Mapped[int] = mapped_column(primary_key=True)
    sucursal_id: Mapped[int | None] = mapped_column(ForeignKey("sucursales.id"), nullable=True)
    nombre: Mapped[str] = mapped_column(String(60), nullable=False)
    tipo: Mapped[str | None] = mapped_column(String(60))  # Ej: Elevador 2 columnas, Fosa, Diagnóstico
    estado: Mapped[EstadoBahia] = mapped_column(
        Enum(EstadoBahia, name="estado_bahia"), default=EstadoBahia.DISPONIBLE
    )
    vehiculo_actual_id: Mapped[int | None] = mapped_column(ForeignKey("vehiculos.id"), nullable=True)

    vehiculo_actual = relationship("Vehiculo")


class Cita(Base, TenantMixin, TimestampMixin):
    """Citas agendadas para atención o mantenimiento."""

    __tablename__ = "citas"

    id: Mapped[int] = mapped_column(primary_key=True)
    sucursal_id: Mapped[int | None] = mapped_column(ForeignKey("sucursales.id"), nullable=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id"), nullable=False, index=True)
    vehiculo_id: Mapped[int | None] = mapped_column(ForeignKey("vehiculos.id"), nullable=True, index=True)
    bahia_id: Mapped[int | None] = mapped_column(ForeignKey("bahias.id"), nullable=True)
    mecanico_asignado_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)

    fecha_inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    fecha_fin: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    tipo_servicio: Mapped[str] = mapped_column(String(100), nullable=False)
    estado: Mapped[EstadoCita] = mapped_column(
        Enum(EstadoCita, name="estado_cita"), default=EstadoCita.PROGRAMADA
    )
    notas: Mapped[str | None] = mapped_column(Text)

    cliente = relationship("Cliente")
    vehiculo = relationship("Vehiculo")
    bahia = relationship("Bahia")
    mecanico = relationship("Usuario")
