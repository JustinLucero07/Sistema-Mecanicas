from datetime import date

from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import require_finanzas
from app.database import get_db
from app.models.base import CategoriaEgreso, EstadoComision, EstadoOrden
from app.models.cliente import Cliente
from app.models.financiero import CuentaPorCobrar, CuentaPorPagar, Egreso, Ingreso
from app.models.inventario import Repuesto
from app.models.orden import Comision, OrdenTrabajo
from app.models.usuario import Usuario
from app.schemas.reportes import (
    DashboardFinanciero,
    EgresoPorCategoria,
    IngresoPorMetodoPago,
    PuntoTendencia,
    ReporteCliente,
    ReporteMecanico,
    RepuestoBajoStock,
    ResumenMensual,
)

router = APIRouter(prefix="/api/reportes", tags=["reportes"], dependencies=[Depends(require_finanzas)])


def _rango_mes(anio: int, mes: int) -> tuple[date, date]:
    inicio = date(anio, mes, 1)
    fin = inicio + relativedelta(months=1)
    return inicio, fin


def _totales_mes(db: Session, anio: int, mes: int) -> tuple[float, float]:
    inicio, fin = _rango_mes(anio, mes)
    total_ingresos = (
        db.query(func.coalesce(func.sum(Ingreso.monto), 0))
        .filter(Ingreso.fecha >= inicio, Ingreso.fecha < fin)
        .scalar()
    )
    total_egresos = (
        db.query(func.coalesce(func.sum(Egreso.monto), 0))
        .filter(Egreso.fecha >= inicio, Egreso.fecha < fin)
        .scalar()
    )
    return float(total_ingresos), float(total_egresos)


def _variacion_pct(actual: float, anterior: float) -> float | None:
    if anterior == 0:
        return None
    return round((actual - anterior) / abs(anterior) * 100, 2)


@router.get("/resumen-mensual", response_model=ResumenMensual)
def resumen_mensual(anio: int | None = None, mes: int | None = None, db: Session = Depends(get_db)) -> ResumenMensual:
    hoy = date.today()
    anio = anio or hoy.year
    mes = mes or hoy.month

    ingresos, egresos = _totales_mes(db, anio, mes)
    fecha_anterior = date(anio, mes, 1) - relativedelta(months=1)
    ingresos_ant, egresos_ant = _totales_mes(db, fecha_anterior.year, fecha_anterior.month)

    balance = ingresos - egresos
    balance_ant = ingresos_ant - egresos_ant

    return ResumenMensual(
        anio=anio,
        mes=mes,
        ingresos_total=ingresos,
        egresos_total=egresos,
        balance_neto=balance,
        variacion_ingresos_pct=_variacion_pct(ingresos, ingresos_ant),
        variacion_egresos_pct=_variacion_pct(egresos, egresos_ant),
        variacion_balance_pct=_variacion_pct(balance, balance_ant),
    )


@router.get("/tendencia-mensual", response_model=list[PuntoTendencia])
def tendencia_mensual(meses: int = 12, db: Session = Depends(get_db)) -> list[PuntoTendencia]:
    hoy = date.today()
    puntos = []
    for i in range(meses - 1, -1, -1):
        fecha = date(hoy.year, hoy.month, 1) - relativedelta(months=i)
        ingresos, egresos = _totales_mes(db, fecha.year, fecha.month)
        puntos.append(
            PuntoTendencia(
                anio=fecha.year,
                mes=fecha.month,
                ingresos_total=ingresos,
                egresos_total=egresos,
                balance_neto=ingresos - egresos,
            )
        )
    return puntos


@router.get("/egresos-por-categoria", response_model=list[EgresoPorCategoria])
def egresos_por_categoria(
    anio: int | None = None, mes: int | None = None, db: Session = Depends(get_db)
) -> list[EgresoPorCategoria]:
    hoy = date.today()
    anio, mes = anio or hoy.year, mes or hoy.month
    inicio, fin = _rango_mes(anio, mes)

    filas = (
        db.query(Egreso.categoria, func.sum(Egreso.monto))
        .filter(Egreso.fecha >= inicio, Egreso.fecha < fin)
        .group_by(Egreso.categoria)
        .all()
    )
    total = sum(float(monto) for _, monto in filas) or 1
    return [
        EgresoPorCategoria(
            categoria=categoria.value if isinstance(categoria, CategoriaEgreso) else categoria,
            total=float(monto),
            porcentaje=round(float(monto) / total * 100, 2),
        )
        for categoria, monto in filas
    ]


@router.get("/ingresos-por-metodo-pago", response_model=list[IngresoPorMetodoPago])
def ingresos_por_metodo_pago(
    anio: int | None = None, mes: int | None = None, db: Session = Depends(get_db)
) -> list[IngresoPorMetodoPago]:
    hoy = date.today()
    anio, mes = anio or hoy.year, mes or hoy.month
    inicio, fin = _rango_mes(anio, mes)

    filas = (
        db.query(Ingreso.metodo_pago, func.sum(Ingreso.monto))
        .filter(Ingreso.fecha >= inicio, Ingreso.fecha < fin)
        .group_by(Ingreso.metodo_pago)
        .all()
    )
    total = sum(float(monto) for _, monto in filas) or 1
    return [
        IngresoPorMetodoPago(
            metodo_pago=metodo.value if hasattr(metodo, "value") else metodo,
            total=float(monto),
            porcentaje=round(float(monto) / total * 100, 2),
        )
        for metodo, monto in filas
    ]


@router.get("/por-mecanico", response_model=list[ReporteMecanico])
def reporte_por_mecanico(
    anio: int | None = None, mes: int | None = None, db: Session = Depends(get_db)
) -> list[ReporteMecanico]:
    hoy = date.today()
    anio, mes = anio or hoy.year, mes or hoy.month
    inicio, fin = _rango_mes(anio, mes)

    mecanicos = db.query(Usuario).filter(Usuario.rol == "mecanico").all()
    resultado = []
    for mecanico in mecanicos:
        ordenes = (
            db.query(OrdenTrabajo)
            .filter(
                OrdenTrabajo.mecanico_id == mecanico.id,
                OrdenTrabajo.estado.in_([EstadoOrden.COMPLETADO, EstadoOrden.ENTREGADO]),
                OrdenTrabajo.fecha_ingreso >= inicio,
                OrdenTrabajo.fecha_ingreso < fin,
            )
            .all()
        )
        ingresos_generados = sum(o.total for o in ordenes)

        comisiones_pendientes = (
            db.query(func.coalesce(func.sum(Comision.monto), 0))
            .filter(Comision.mecanico_id == mecanico.id, Comision.estado == EstadoComision.PENDIENTE)
            .scalar()
        )
        comisiones_pagadas = (
            db.query(func.coalesce(func.sum(Comision.monto), 0))
            .filter(Comision.mecanico_id == mecanico.id, Comision.estado == EstadoComision.PAGADO)
            .scalar()
        )

        resultado.append(
            ReporteMecanico(
                mecanico_id=mecanico.id,
                nombre=mecanico.nombre,
                ordenes_completadas=len(ordenes),
                ingresos_generados=ingresos_generados,
                comisiones_pendientes=float(comisiones_pendientes),
                comisiones_pagadas=float(comisiones_pagadas),
            )
        )
    return sorted(resultado, key=lambda r: r.ingresos_generados, reverse=True)


@router.get("/por-cliente", response_model=list[ReporteCliente])
def reporte_por_cliente(limite: int = 20, db: Session = Depends(get_db)) -> list[ReporteCliente]:
    clientes = db.query(Cliente).all()
    resultado = []
    for cliente in clientes:
        ordenes = [o for v in cliente.vehiculos for o in v.ordenes]
        if not ordenes:
            continue
        total_gastado = sum(o.total for o in ordenes)
        ultima = max(o.fecha_ingreso for o in ordenes)
        resultado.append(
            ReporteCliente(
                cliente_id=cliente.id,
                nombre=cliente.nombre,
                total_gastado=total_gastado,
                numero_visitas=len(ordenes),
                ultima_visita=ultima.isoformat(),
            )
        )
    return sorted(resultado, key=lambda r: r.total_gastado, reverse=True)[:limite]


@router.get("/dashboard", response_model=DashboardFinanciero)
def dashboard(db: Session = Depends(get_db)) -> DashboardFinanciero:
    resumen = resumen_mensual(db=db)
    tendencia = tendencia_mensual(db=db)
    por_categoria = egresos_por_categoria(db=db)

    total_por_cobrar = float(
        db.query(func.coalesce(func.sum(CuentaPorCobrar.monto_total - CuentaPorCobrar.monto_pagado), 0))
        .filter(CuentaPorCobrar.estado != "pagado")
        .scalar()
    )
    total_por_pagar = float(
        db.query(func.coalesce(func.sum(CuentaPorPagar.monto_total - CuentaPorPagar.monto_pagado), 0))
        .filter(CuentaPorPagar.estado != "pagado")
        .scalar()
    )

    repuestos_bajos = (
        db.query(Repuesto).filter(Repuesto.stock_actual <= Repuesto.stock_minimo).all()
    )

    return DashboardFinanciero(
        resumen_mes_actual=resumen,
        tendencia_12_meses=tendencia,
        egresos_por_categoria=por_categoria,
        cuentas_por_cobrar_total=total_por_cobrar,
        cuentas_por_pagar_total=total_por_pagar,
        repuestos_bajo_stock=[
            RepuestoBajoStock(
                repuesto_id=r.id, nombre=r.nombre, stock_actual=r.stock_actual, stock_minimo=r.stock_minimo
            )
            for r in repuestos_bajos
        ],
    )
