from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import CategoriaEgreso, EstadoCuenta, MetodoPago, TenantMixin, TimestampMixin


class Ingreso(Base, TenantMixin, TimestampMixin):
    """Todo dinero que entra al taller: pagos de órdenes, abonos u otros conceptos."""

    __tablename__ = "ingresos"

    id: Mapped[int] = mapped_column(primary_key=True)
    sucursal_id: Mapped[int | None] = mapped_column(ForeignKey("sucursales.id"), nullable=True)
    orden_id: Mapped[int | None] = mapped_column(ForeignKey("ordenes_trabajo.id"), nullable=True, index=True)
    cliente_id: Mapped[int | None] = mapped_column(ForeignKey("clientes.id"), nullable=True, index=True)
    concepto: Mapped[str] = mapped_column(String(255), nullable=False)
    monto: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    metodo_pago: Mapped[MetodoPago] = mapped_column(Enum(MetodoPago, name="metodo_pago"))
    numero_referencia: Mapped[str | None] = mapped_column(String(100))
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    usuario_registro_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    comprobante_url: Mapped[str | None] = mapped_column(String(500))

    orden = relationship("OrdenTrabajo")
    cliente = relationship("Cliente")


class Egreso(Base, TenantMixin, TimestampMixin):
    """Gastos operativos del taller: nómina, repuestos, arriendo, herramientas, etc."""

    __tablename__ = "egresos"

    id: Mapped[int] = mapped_column(primary_key=True)
    sucursal_id: Mapped[int | None] = mapped_column(ForeignKey("sucursales.id"), nullable=True)
    categoria: Mapped[CategoriaEgreso] = mapped_column(Enum(CategoriaEgreso, name="categoria_egreso"))
    descripcion: Mapped[str] = mapped_column(String(255), nullable=False)
    monto: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    proveedor_id: Mapped[int | None] = mapped_column(ForeignKey("proveedores.id"), nullable=True)
    metodo_pago: Mapped[MetodoPago] = mapped_column(Enum(MetodoPago, name="metodo_pago_egreso"))
    numero_comprobante: Mapped[str | None] = mapped_column(String(100))
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    usuario_registro_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    comprobante_url: Mapped[str | None] = mapped_column(String(500))

    proveedor = relationship("Proveedor")


class CajaDiaria(Base, TenantMixin, TimestampMixin):
    """Control de apertura y cierre de caja por día o turno."""

    __tablename__ = "caja_diaria"

    id: Mapped[int] = mapped_column(primary_key=True)
    sucursal_id: Mapped[int | None] = mapped_column(ForeignKey("sucursales.id"), nullable=True)
    fecha: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    usuario_apertura_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    monto_apertura: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    usuario_cierre_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"))
    monto_cierre_esperado: Mapped[float | None] = mapped_column(Numeric(10, 2))
    monto_cierre_real: Mapped[float | None] = mapped_column(Numeric(10, 2))
    diferencia: Mapped[float | None] = mapped_column(Numeric(10, 2))
    observaciones: Mapped[str | None] = mapped_column(Text)
    cerrada: Mapped[bool] = mapped_column(default=False)


class CuentaPorCobrar(Base, TenantMixin, TimestampMixin):
    """Saldo pendiente de clientes (crédito sobre órdenes)."""

    __tablename__ = "cuentas_por_cobrar"

    id: Mapped[int] = mapped_column(primary_key=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id"), nullable=False, index=True)
    orden_id: Mapped[int | None] = mapped_column(ForeignKey("ordenes_trabajo.id"), nullable=True, index=True)
    monto_total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    monto_pagado: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    fecha_vencimiento: Mapped[date | None] = mapped_column(Date)
    estado: Mapped[EstadoCuenta] = mapped_column(
        Enum(EstadoCuenta, name="estado_cuenta_cobrar"), default=EstadoCuenta.PENDIENTE
    )

    cliente = relationship("Cliente")
    orden = relationship("OrdenTrabajo")

    @property
    def saldo(self) -> float:
        return max(0.0, float(self.monto_total) - float(self.monto_pagado))


class CuentaPorPagar(Base, TenantMixin, TimestampMixin):
    """Deudas del taller con proveedores por repuestos o servicios."""

    __tablename__ = "cuentas_por_pagar"

    id: Mapped[int] = mapped_column(primary_key=True)
    proveedor_id: Mapped[int] = mapped_column(ForeignKey("proveedores.id"), nullable=False, index=True)
    concepto: Mapped[str] = mapped_column(String(255), nullable=False)
    monto_total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    monto_pagado: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    fecha_vencimiento: Mapped[date | None] = mapped_column(Date)
    estado: Mapped[EstadoCuenta] = mapped_column(
        Enum(EstadoCuenta, name="estado_cuenta_pagar"), default=EstadoCuenta.PENDIENTE
    )

    proveedor = relationship("Proveedor")

    @property
    def saldo(self) -> float:
        return max(0.0, float(self.monto_total) - float(self.monto_pagado))
