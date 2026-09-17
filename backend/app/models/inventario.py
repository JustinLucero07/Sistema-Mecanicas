from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import MotivoMovimientoInventario, TenantMixin, TimestampMixin, TipoMovimientoInventario


class Proveedor(Base, TenantMixin, TimestampMixin):
    __tablename__ = "proveedores"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    ruc: Mapped[str | None] = mapped_column(String(30), index=True)
    contacto: Mapped[str | None] = mapped_column(String(150))
    telefono: Mapped[str | None] = mapped_column(String(30))
    email: Mapped[str | None] = mapped_column(String(150))
    direccion: Mapped[str | None] = mapped_column(String(255))
    notas: Mapped[str | None] = mapped_column(Text)


class Repuesto(Base, TenantMixin, TimestampMixin):
    __tablename__ = "repuestos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    codigo: Mapped[str | None] = mapped_column(String(60), index=True)
    sku: Mapped[str | None] = mapped_column(String(60), index=True)
    barcode: Mapped[str | None] = mapped_column(String(60), index=True)
    categoria: Mapped[str | None] = mapped_column(String(80))
    marca: Mapped[str | None] = mapped_column(String(80))
    descripcion: Mapped[str | None] = mapped_column(Text)
    ubicacion: Mapped[str | None] = mapped_column(String(80))  # Ej: Estante A-3

    stock_actual: Mapped[int] = mapped_column(Integer, default=0)
    stock_minimo: Mapped[int] = mapped_column(Integer, default=0)
    costo_compra: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    precio_venta: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    unidad: Mapped[str | None] = mapped_column(String(20), default="unidad")
    proveedor_id: Mapped[int | None] = mapped_column(ForeignKey("proveedores.id"), nullable=True)

    proveedor = relationship("Proveedor")
    movimientos = relationship("MovimientoInventario", back_populates="repuesto", cascade="all, delete-orphan")


class MovimientoInventario(Base, TenantMixin, TimestampMixin):
    __tablename__ = "movimientos_inventario"

    id: Mapped[int] = mapped_column(primary_key=True)
    repuesto_id: Mapped[int] = mapped_column(ForeignKey("repuestos.id"), nullable=False, index=True)
    sucursal_id: Mapped[int | None] = mapped_column(ForeignKey("sucursales.id"), nullable=True)
    tipo: Mapped[TipoMovimientoInventario] = mapped_column(
        Enum(TipoMovimientoInventario, name="tipo_movimiento_inventario")
    )
    motivo: Mapped[MotivoMovimientoInventario] = mapped_column(
        Enum(MotivoMovimientoInventario, name="motivo_movimiento_inventario")
    )
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    stock_anterior: Mapped[int | None] = mapped_column(Integer)
    stock_nuevo: Mapped[int | None] = mapped_column(Integer)
    orden_id: Mapped[int | None] = mapped_column(ForeignKey("ordenes_trabajo.id"), nullable=True, index=True)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    observacion: Mapped[str | None] = mapped_column(String(255))

    repuesto = relationship("Repuesto", back_populates="movimientos")
