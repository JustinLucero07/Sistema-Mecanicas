from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import MotivoMovimientoInventario, TimestampMixin, TipoMovimientoInventario


class Proveedor(Base, TimestampMixin):
    __tablename__ = "proveedores"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    contacto: Mapped[str | None] = mapped_column(String(150))
    telefono: Mapped[str | None] = mapped_column(String(30))
    ruc: Mapped[str | None] = mapped_column(String(20))


class Repuesto(Base, TimestampMixin):
    __tablename__ = "repuestos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    codigo: Mapped[str | None] = mapped_column(String(60), unique=True, index=True)
    categoria: Mapped[str | None] = mapped_column(String(80))
    stock_actual: Mapped[int] = mapped_column(Integer, default=0)
    stock_minimo: Mapped[int] = mapped_column(Integer, default=0)
    costo_compra: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    precio_venta: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    unidad: Mapped[str | None] = mapped_column(String(20), default="unidad")
    proveedor_id: Mapped[int | None] = mapped_column(ForeignKey("proveedores.id"))

    proveedor = relationship("Proveedor")


class MovimientoInventario(Base, TimestampMixin):
    __tablename__ = "movimientos_inventario"

    id: Mapped[int] = mapped_column(primary_key=True)
    repuesto_id: Mapped[int] = mapped_column(ForeignKey("repuestos.id"), nullable=False)
    tipo: Mapped[TipoMovimientoInventario] = mapped_column(
        Enum(TipoMovimientoInventario, name="tipo_movimiento_inventario")
    )
    motivo: Mapped[MotivoMovimientoInventario] = mapped_column(
        Enum(MotivoMovimientoInventario, name="motivo_movimiento_inventario")
    )
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    orden_id: Mapped[int | None] = mapped_column(ForeignKey("ordenes_trabajo.id"))
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    repuesto = relationship("Repuesto")
