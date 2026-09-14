from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_finanzas, require_staff
from app.database import get_db
from app.models.base import EstadoCuenta
from app.models.financiero import CajaDiaria, CuentaPorCobrar, CuentaPorPagar, Egreso, Ingreso
from app.models.usuario import Usuario
from app.schemas.financiero import (
    AperturaCajaRequest,
    CajaDiariaOut,
    CierreCajaRequest,
    CuentaPorCobrarCreate,
    CuentaPorCobrarOut,
    CuentaPorCobrarPago,
    CuentaPorPagarCreate,
    CuentaPorPagarOut,
    CuentaPorPagarPago,
    EgresoCreate,
    EgresoOut,
    IngresoCreate,
    IngresoOut,
)

router = APIRouter(prefix="/api/financiero", tags=["financiero"], dependencies=[Depends(require_finanzas)])


# ---------------------------------------------------------------- Ingresos
@router.get("/ingresos", response_model=list[IngresoOut])
def listar_ingresos(
    desde: date | None = None, hasta: date | None = None, db: Session = Depends(get_db)
) -> list[Ingreso]:
    query = db.query(Ingreso)
    if desde:
        query = query.filter(Ingreso.fecha >= desde)
    if hasta:
        query = query.filter(Ingreso.fecha <= hasta)
    return query.order_by(Ingreso.fecha.desc()).all()


@router.post("/ingresos", response_model=IngresoOut, status_code=201)
def registrar_ingreso(
    payload: IngresoCreate, db: Session = Depends(get_db), usuario: Usuario = Depends(require_staff)
) -> Ingreso:
    ingreso = Ingreso(**payload.model_dump(), usuario_registro_id=usuario.id)
    db.add(ingreso)
    db.commit()
    db.refresh(ingreso)
    return ingreso


# ----------------------------------------------------------------- Egresos
@router.get("/egresos", response_model=list[EgresoOut])
def listar_egresos(
    desde: date | None = None, hasta: date | None = None, db: Session = Depends(get_db)
) -> list[Egreso]:
    query = db.query(Egreso)
    if desde:
        query = query.filter(Egreso.fecha >= desde)
    if hasta:
        query = query.filter(Egreso.fecha <= hasta)
    return query.order_by(Egreso.fecha.desc()).all()


@router.post("/egresos", response_model=EgresoOut, status_code=201)
def registrar_egreso(
    payload: EgresoCreate, db: Session = Depends(get_db), usuario: Usuario = Depends(require_staff)
) -> Egreso:
    egreso = Egreso(**payload.model_dump(), usuario_registro_id=usuario.id)
    db.add(egreso)
    db.commit()
    db.refresh(egreso)
    return egreso


# ------------------------------------------------------------- Caja diaria
def _calcular_esperado_caja(db: Session, fecha: date, monto_apertura: float) -> float:
    siguiente_dia = fecha + timedelta(days=1)
    ingresos_dia = (
        db.query(Ingreso.monto).filter(Ingreso.fecha >= fecha, Ingreso.fecha < siguiente_dia).all()
    )
    egresos_dia = (
        db.query(Egreso.monto).filter(Egreso.fecha >= fecha, Egreso.fecha < siguiente_dia).all()
    )
    total_ingresos = sum(float(m[0]) for m in ingresos_dia)
    total_egresos = sum(float(m[0]) for m in egresos_dia)
    return monto_apertura + total_ingresos - total_egresos


@router.get("/caja/hoy", response_model=CajaDiariaOut | None)
def obtener_caja_hoy(db: Session = Depends(get_db)) -> CajaDiaria | None:
    return db.query(CajaDiaria).filter(CajaDiaria.fecha == date.today()).first()


@router.post("/caja/abrir", response_model=CajaDiariaOut, status_code=201)
def abrir_caja(
    payload: AperturaCajaRequest, db: Session = Depends(get_db), usuario: Usuario = Depends(require_staff)
) -> CajaDiaria:
    hoy = date.today()
    if db.query(CajaDiaria).filter(CajaDiaria.fecha == hoy).first():
        raise HTTPException(status_code=400, detail="La caja de hoy ya fue abierta")

    caja = CajaDiaria(fecha=hoy, monto_apertura=payload.monto_apertura, usuario_apertura_id=usuario.id)
    db.add(caja)
    db.commit()
    db.refresh(caja)
    return caja


@router.post("/caja/cerrar", response_model=CajaDiariaOut)
def cerrar_caja(
    payload: CierreCajaRequest, db: Session = Depends(get_db), usuario: Usuario = Depends(require_staff)
) -> CajaDiaria:
    hoy = date.today()
    caja = db.query(CajaDiaria).filter(CajaDiaria.fecha == hoy).first()
    if not caja:
        raise HTTPException(status_code=404, detail="No se ha abierto la caja de hoy")
    if caja.cerrada:
        raise HTTPException(status_code=400, detail="La caja de hoy ya está cerrada")

    esperado = _calcular_esperado_caja(db, hoy, float(caja.monto_apertura))
    caja.monto_cierre_esperado = esperado
    caja.monto_cierre_real = payload.monto_cierre_real
    caja.diferencia = payload.monto_cierre_real - esperado
    caja.observaciones = payload.observaciones
    caja.usuario_cierre_id = usuario.id
    caja.cerrada = True

    db.commit()
    db.refresh(caja)
    return caja


@router.get("/caja/historial", response_model=list[CajaDiariaOut])
def historial_caja(desde: date | None = None, hasta: date | None = None, db: Session = Depends(get_db)) -> list[CajaDiaria]:
    query = db.query(CajaDiaria)
    if desde:
        query = query.filter(CajaDiaria.fecha >= desde)
    if hasta:
        query = query.filter(CajaDiaria.fecha <= hasta)
    return query.order_by(CajaDiaria.fecha.desc()).all()


# ------------------------------------------------------- Cuentas por cobrar
@router.get("/cuentas-por-cobrar", response_model=list[CuentaPorCobrarOut])
def listar_cuentas_por_cobrar(estado: EstadoCuenta | None = None, db: Session = Depends(get_db)) -> list[CuentaPorCobrar]:
    query = db.query(CuentaPorCobrar)
    if estado:
        query = query.filter(CuentaPorCobrar.estado == estado)
    return query.order_by(CuentaPorCobrar.fecha_vencimiento).all()


@router.post("/cuentas-por-cobrar", response_model=CuentaPorCobrarOut, status_code=201)
def crear_cuenta_por_cobrar(payload: CuentaPorCobrarCreate, db: Session = Depends(get_db)) -> CuentaPorCobrar:
    cuenta = CuentaPorCobrar(**payload.model_dump())
    db.add(cuenta)
    db.commit()
    db.refresh(cuenta)
    return cuenta


@router.post("/cuentas-por-cobrar/{cuenta_id}/pagos", response_model=CuentaPorCobrarOut)
def registrar_pago_por_cobrar(cuenta_id: int, payload: CuentaPorCobrarPago, db: Session = Depends(get_db)) -> CuentaPorCobrar:
    cuenta = db.get(CuentaPorCobrar, cuenta_id)
    if not cuenta:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    cuenta.monto_pagado = float(cuenta.monto_pagado) + payload.monto
    if cuenta.monto_pagado >= float(cuenta.monto_total):
        cuenta.estado = EstadoCuenta.PAGADO
    elif cuenta.monto_pagado > 0:
        cuenta.estado = EstadoCuenta.PARCIAL

    db.add(
        Ingreso(
            cliente_id=cuenta.cliente_id,
            orden_id=cuenta.orden_id,
            concepto=f"Abono cuenta por cobrar #{cuenta.id}",
            monto=payload.monto,
            metodo_pago="efectivo",
        )
    )

    db.commit()
    db.refresh(cuenta)
    return cuenta


# -------------------------------------------------------- Cuentas por pagar
@router.get("/cuentas-por-pagar", response_model=list[CuentaPorPagarOut])
def listar_cuentas_por_pagar(estado: EstadoCuenta | None = None, db: Session = Depends(get_db)) -> list[CuentaPorPagar]:
    query = db.query(CuentaPorPagar)
    if estado:
        query = query.filter(CuentaPorPagar.estado == estado)
    return query.order_by(CuentaPorPagar.fecha_vencimiento).all()


@router.post("/cuentas-por-pagar", response_model=CuentaPorPagarOut, status_code=201)
def crear_cuenta_por_pagar(payload: CuentaPorPagarCreate, db: Session = Depends(get_db)) -> CuentaPorPagar:
    cuenta = CuentaPorPagar(**payload.model_dump())
    db.add(cuenta)
    db.commit()
    db.refresh(cuenta)
    return cuenta


@router.post("/cuentas-por-pagar/{cuenta_id}/pagos", response_model=CuentaPorPagarOut)
def registrar_pago_por_pagar(cuenta_id: int, payload: CuentaPorPagarPago, db: Session = Depends(get_db)) -> CuentaPorPagar:
    cuenta = db.get(CuentaPorPagar, cuenta_id)
    if not cuenta:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    cuenta.monto_pagado = float(cuenta.monto_pagado) + payload.monto
    if cuenta.monto_pagado >= float(cuenta.monto_total):
        cuenta.estado = EstadoCuenta.PAGADO
    elif cuenta.monto_pagado > 0:
        cuenta.estado = EstadoCuenta.PARCIAL

    db.add(
        Egreso(
            categoria="otros",
            descripcion=f"Pago cuenta por pagar #{cuenta.id} - {cuenta.concepto}",
            monto=payload.monto,
            proveedor_id=cuenta.proveedor_id,
            metodo_pago="efectivo",
        )
    )

    db.commit()
    db.refresh(cuenta)
    return cuenta
