from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.base import CategoriaEgreso, EstadoCuenta, MetodoPago


class IngresoCreate(BaseModel):
    orden_id: int | None = None
    cliente_id: int | None = None
    concepto: str
    monto: float
    metodo_pago: MetodoPago
    numero_referencia: str | None = None


class IngresoOut(IngresoCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    fecha: datetime
    comprobante_url: str | None = None


class PagoOrdenRequest(BaseModel):
    monto: float
    metodo_pago: MetodoPago
    numero_referencia: str | None = None
    concepto: str | None = None


class EgresoCreate(BaseModel):
    categoria: CategoriaEgreso
    descripcion: str
    monto: float
    proveedor_id: int | None = None
    metodo_pago: MetodoPago
    numero_comprobante: str | None = None


class EgresoOut(EgresoCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    fecha: datetime
    comprobante_url: str | None = None


class AperturaCajaRequest(BaseModel):
    monto_apertura: float


class CierreCajaRequest(BaseModel):
    monto_cierre_real: float
    observaciones: str | None = None


class CajaDiariaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    fecha: date
    monto_apertura: float
    monto_cierre_esperado: float | None = None
    monto_cierre_real: float | None = None
    diferencia: float | None = None
    cerrada: bool
    observaciones: str | None = None


class CuentaPorCobrarCreate(BaseModel):
    cliente_id: int
    orden_id: int | None = None
    monto_total: float
    fecha_vencimiento: date | None = None


class CuentaPorCobrarPago(BaseModel):
    monto: float


class CuentaPorCobrarOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    cliente_id: int
    orden_id: int | None = None
    monto_total: float
    monto_pagado: float
    saldo: float
    fecha_vencimiento: date | None = None
    estado: EstadoCuenta


class CuentaPorPagarCreate(BaseModel):
    proveedor_id: int
    concepto: str
    monto_total: float
    fecha_vencimiento: date | None = None


class CuentaPorPagarPago(BaseModel):
    monto: float


class CuentaPorPagarOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    proveedor_id: int
    concepto: str
    monto_total: float
    monto_pagado: float
    saldo: float
    fecha_vencimiento: date | None = None
    estado: EstadoCuenta
