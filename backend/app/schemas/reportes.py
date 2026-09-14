from pydantic import BaseModel


class ResumenMensual(BaseModel):
    anio: int
    mes: int
    ingresos_total: float
    egresos_total: float
    balance_neto: float
    variacion_ingresos_pct: float | None = None
    variacion_egresos_pct: float | None = None
    variacion_balance_pct: float | None = None


class PuntoTendencia(BaseModel):
    anio: int
    mes: int
    ingresos_total: float
    egresos_total: float
    balance_neto: float


class EgresoPorCategoria(BaseModel):
    categoria: str
    total: float
    porcentaje: float


class IngresoPorMetodoPago(BaseModel):
    metodo_pago: str
    total: float
    porcentaje: float


class ReporteMecanico(BaseModel):
    mecanico_id: int
    nombre: str
    ordenes_completadas: int
    ingresos_generados: float
    comisiones_pendientes: float
    comisiones_pagadas: float


class ReporteCliente(BaseModel):
    cliente_id: int
    nombre: str
    total_gastado: float
    numero_visitas: int
    ultima_visita: str | None = None


class RepuestoBajoStock(BaseModel):
    repuesto_id: int
    nombre: str
    stock_actual: int
    stock_minimo: int


class DashboardFinanciero(BaseModel):
    resumen_mes_actual: ResumenMensual
    tendencia_12_meses: list[PuntoTendencia]
    egresos_por_categoria: list[EgresoPorCategoria]
    cuentas_por_cobrar_total: float
    cuentas_por_pagar_total: float
    repuestos_bajo_stock: list[RepuestoBajoStock]
