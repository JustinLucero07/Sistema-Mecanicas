from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_tenant_id, get_current_user, require_staff
from app.database import get_db
from app.models.base import (
    EstadoCuenta,
    EstadoOrden,
    MetodoPago,
    MotivoMovimientoInventario,
    TipoDetalleOrden,
    TipoFoto,
    TipoMovimientoInventario,
)
from app.models.financiero import CuentaPorCobrar, Ingreso
from app.models.inspeccion import ChecklistRecepcion, DetalleInspeccion, Inspeccion
from app.models.inventario import MovimientoInventario, Repuesto
from app.models.orden import DetalleOrden, Foto, OrdenTrabajo
from app.models.usuario import Usuario
from app.models.vehiculo import Vehiculo
from app.schemas.financiero import PagoOrdenRequest
from app.schemas.inspeccion import ChecklistRecepcionCreate, InspeccionCreate, InspeccionOut
from app.schemas.orden import (
    DetalleOrdenCreate,
    OrdenTrabajoCreate,
    OrdenTrabajoOut,
    OrdenTrabajoUpdate,
)
from app.services.storage import subir_archivo

router = APIRouter(prefix="/api/ordenes", tags=["ordenes"], dependencies=[Depends(require_staff)])


def _calcular_subtotal(detalle: DetalleOrdenCreate) -> float:
    return round(float(detalle.cantidad) * float(detalle.precio_unitario), 2)


def _descontar_inventario(db: Session, orden: OrdenTrabajo, detalle: DetalleOrden, org_id: int) -> None:
    if detalle.tipo != TipoDetalleOrden.REPUESTO or not detalle.repuesto_id:
        return
    repuesto = (
        db.query(Repuesto)
        .filter(Repuesto.id == detalle.repuesto_id, Repuesto.organizacion_id == org_id)
        .first()
    )
    if not repuesto:
        return

    stock_ant = repuesto.stock_actual
    repuesto.stock_actual -= int(detalle.cantidad)
    mov = MovimientoInventario(
        organizacion_id=org_id,
        repuesto_id=repuesto.id,
        tipo=TipoMovimientoInventario.SALIDA,
        motivo=MotivoMovimientoInventario.USO_EN_ORDEN,
        cantidad=int(detalle.cantidad),
        stock_anterior=stock_ant,
        stock_nuevo=repuesto.stock_actual,
        orden_id=orden.id,
        observacion=f"Uso en Orden #{orden.numero_orden or orden.id}",
    )
    db.add(mov)


def _reintegrar_inventario(db: Session, orden: OrdenTrabajo, detalle: DetalleOrden, org_id: int) -> None:
    if detalle.tipo != TipoDetalleOrden.REPUESTO or not detalle.repuesto_id:
        return
    repuesto = (
        db.query(Repuesto)
        .filter(Repuesto.id == detalle.repuesto_id, Repuesto.organizacion_id == org_id)
        .first()
    )
    if not repuesto:
        return

    stock_ant = repuesto.stock_actual
    repuesto.stock_actual += int(detalle.cantidad)
    mov = MovimientoInventario(
        organizacion_id=org_id,
        repuesto_id=repuesto.id,
        tipo=TipoMovimientoInventario.ENTRADA,
        motivo=MotivoMovimientoInventario.DEVOLUCION,
        cantidad=int(detalle.cantidad),
        stock_anterior=stock_ant,
        stock_nuevo=repuesto.stock_actual,
        orden_id=orden.id,
        observacion=f"Removido de Orden #{orden.numero_orden or orden.id}",
    )
    db.add(mov)


@router.get("", response_model=list[OrdenTrabajoOut])
def listar_ordenes(
    vehiculo_id: int | None = None,
    cliente_id: int | None = None,
    mecanico_id: int | None = None,
    estado: str | None = None,
    q: str | None = None,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> list[OrdenTrabajo]:
    query = db.query(OrdenTrabajo).filter(OrdenTrabajo.organizacion_id == org_id)

    if vehiculo_id:
        query = query.filter(OrdenTrabajo.vehiculo_id == vehiculo_id)
    if cliente_id:
        query = query.filter(OrdenTrabajo.cliente_id == cliente_id)
    if mecanico_id:
        query = query.filter(OrdenTrabajo.mecanico_id == mecanico_id)
    if estado:
        query = query.filter(OrdenTrabajo.estado == estado)
    if q:
        query = query.join(OrdenTrabajo.vehiculo).filter(
            or_(
                OrdenTrabajo.numero_orden.ilike(f"%{q}%"),
                Vehiculo.placa.ilike(f"%{q}%"),
                OrdenTrabajo.motivo_ingreso.ilike(f"%{q}%"),
            )
        )

    return query.order_by(OrdenTrabajo.fecha_ingreso.desc()).all()


@router.get("/{orden_id}", response_model=OrdenTrabajoOut)
def obtener_orden(
    orden_id: int,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> OrdenTrabajo:
    orden = (
        db.query(OrdenTrabajo)
        .filter(OrdenTrabajo.id == orden_id, OrdenTrabajo.organizacion_id == org_id)
        .first()
    )
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return orden


@router.post("", response_model=OrdenTrabajoOut, status_code=201)
def crear_orden(
    payload: OrdenTrabajoCreate,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> OrdenTrabajo:
    vehiculo = (
        db.query(Vehiculo)
        .filter(Vehiculo.id == payload.vehiculo_id, Vehiculo.organizacion_id == org_id)
        .first()
    )
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    cliente_id = payload.cliente_id or vehiculo.cliente_id

    # Generar correlativo de orden si no viene
    count = db.query(OrdenTrabajo).filter(OrdenTrabajo.organizacion_id == org_id).count()
    numero_orden = payload.numero_orden or f"OT-{datetime.now().year}-{count + 1:04d}"

    orden_data = payload.model_dump(exclude={"detalles", "checklist"})
    orden_data["organizacion_id"] = org_id
    orden_data["cliente_id"] = cliente_id
    orden_data["numero_orden"] = numero_orden
    if not orden_data.get("fecha_ingreso"):
        orden_data["fecha_ingreso"] = datetime.now(timezone.utc)

    orden = OrdenTrabajo(**orden_data)
    db.add(orden)
    db.flush()

    # Checklist visual de recepción
    if payload.checklist:
        checklist = ChecklistRecepcion(
            orden_id=orden.id,
            **payload.checklist.model_dump(),
        )
        db.add(checklist)

    # Detalles de repuestos y mano de obra
    for detalle_in in payload.detalles:
        detalle = DetalleOrden(
            orden_id=orden.id,
            subtotal=_calcular_subtotal(detalle_in),
            **detalle_in.model_dump(),
        )
        db.add(detalle)
        db.flush()
        _descontar_inventario(db, orden, detalle, org_id)

    # Actualizar kilometraje del vehículo si se ingresó
    if payload.kilometraje_ingreso:
        if vehiculo.kilometraje_actual and payload.kilometraje_ingreso > vehiculo.kilometraje_actual:
            vehiculo.kilometraje_anterior = vehiculo.kilometraje_actual
        vehiculo.kilometraje_actual = payload.kilometraje_ingreso

    vehiculo.estado = "en_taller"
    orden.recalcular_totales()

    db.commit()
    db.refresh(orden)
    return orden


@router.patch("/{orden_id}", response_model=OrdenTrabajoOut)
def actualizar_orden(
    orden_id: int,
    payload: OrdenTrabajoUpdate,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> OrdenTrabajo:
    orden = (
        db.query(OrdenTrabajo)
        .filter(OrdenTrabajo.id == orden_id, OrdenTrabajo.organizacion_id == org_id)
        .first()
    )
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(orden, campo, valor)

    if payload.estado == EstadoOrden.ENTREGADO:
        if not orden.fecha_entrega_real:
            orden.fecha_entrega_real = datetime.now(timezone.utc)
        if orden.vehiculo:
            orden.vehiculo.estado = "activo"

    orden.recalcular_totales()
    db.commit()
    db.refresh(orden)
    return orden


@router.post("/{orden_id}/detalles", response_model=OrdenTrabajoOut)
def agregar_detalle(
    orden_id: int,
    payload: DetalleOrdenCreate,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> OrdenTrabajo:
    orden = (
        db.query(OrdenTrabajo)
        .filter(OrdenTrabajo.id == orden_id, OrdenTrabajo.organizacion_id == org_id)
        .first()
    )
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    detalle = DetalleOrden(
        orden_id=orden.id,
        subtotal=_calcular_subtotal(payload),
        **payload.model_dump(),
    )
    db.add(detalle)
    db.flush()

    _descontar_inventario(db, orden, detalle, org_id)
    orden.recalcular_totales()

    db.commit()
    db.refresh(orden)
    return orden


@router.delete("/{orden_id}/detalles/{detalle_id}", response_model=OrdenTrabajoOut)
def eliminar_detalle(
    orden_id: int,
    detalle_id: int,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> OrdenTrabajo:
    orden = (
        db.query(OrdenTrabajo)
        .filter(OrdenTrabajo.id == orden_id, OrdenTrabajo.organizacion_id == org_id)
        .first()
    )
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    detalle = (
        db.query(DetalleOrden)
        .filter(DetalleOrden.id == detalle_id, DetalleOrden.orden_id == orden_id)
        .first()
    )
    if not detalle:
        raise HTTPException(status_code=404, detail="Detalle no encontrado")

    _reintegrar_inventario(db, orden, detalle, org_id)
    db.delete(detalle)
    db.flush()

    orden.recalcular_totales()
    db.commit()
    db.refresh(orden)
    return orden


@router.post("/{orden_id}/fotos", response_model=OrdenTrabajoOut)
async def subir_foto_orden(
    orden_id: int,
    foto: UploadFile,
    tipo: TipoFoto = Form(TipoFoto.ANTES),
    descripcion: str | None = Form(None),
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> OrdenTrabajo:
    orden = (
        db.query(OrdenTrabajo)
        .filter(OrdenTrabajo.id == orden_id, OrdenTrabajo.organizacion_id == org_id)
        .first()
    )
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    contenido = await foto.read()
    url = subir_archivo(contenido, carpeta=f"ordenes/{orden_id}")
    db.add(Foto(orden_id=orden_id, tipo=tipo, url=url, descripcion=descripcion))
    db.commit()
    db.refresh(orden)
    return orden


@router.post("/{orden_id}/pagar", response_model=OrdenTrabajoOut)
def registrar_pago_orden(
    orden_id: int,
    payload: PagoOrdenRequest,
    org_id: int = Depends(get_current_tenant_id),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrdenTrabajo:
    """Registra un cobro parcial o total de la orden y actualiza el saldo."""
    orden = (
        db.query(OrdenTrabajo)
        .filter(OrdenTrabajo.id == orden_id, OrdenTrabajo.organizacion_id == org_id)
        .first()
    )
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    ingreso = Ingreso(
        organizacion_id=org_id,
        orden_id=orden.id,
        cliente_id=orden.cliente_id,
        concepto=payload.concepto or f"Abono a Orden #{orden.numero_orden or orden.id}",
        monto=payload.monto,
        metodo_pago=payload.metodo_pago,
        numero_referencia=payload.numero_referencia,
        usuario_registro_id=current_user.id,
    )
    db.add(ingreso)

    orden.monto_pagado = float(orden.monto_pagado or 0) + float(payload.monto)

    # Si aún queda saldo, se genera/actualiza cuenta por cobrar
    saldo = orden.saldo_pendiente
    cxc = db.query(CuentaPorCobrar).filter(CuentaPorCobrar.orden_id == orden.id).first()
    if saldo > 0:
        if not cxc and orden.cliente_id:
            cxc = CuentaPorCobrar(
                organizacion_id=org_id,
                cliente_id=orden.cliente_id,
                orden_id=orden.id,
                monto_total=orden.total,
                monto_pagado=orden.monto_pagado,
                estado=EstadoCuenta.PARCIAL,
            )
            db.add(cxc)
        elif cxc:
            cxc.monto_pagado = orden.monto_pagado
            cxc.estado = EstadoCuenta.PARCIAL
    elif cxc:
        cxc.monto_pagado = orden.total
        cxc.estado = EstadoCuenta.PAGADO

    db.commit()
    db.refresh(orden)
    return orden


@router.post("/{orden_id}/inspeccion", response_model=InspeccionOut)
def guardar_inspeccion(
    orden_id: int,
    payload: InspeccionCreate,
    org_id: int = Depends(get_current_tenant_id),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Inspeccion:
    """Guarda la inspección técnica multipunto del vehículo."""
    orden = (
        db.query(OrdenTrabajo)
        .filter(OrdenTrabajo.id == orden_id, OrdenTrabajo.organizacion_id == org_id)
        .first()
    )
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    inspeccion = Inspeccion(
        orden_id=orden.id,
        inspector_id=current_user.id,
        observaciones=payload.observaciones,
    )
    db.add(inspeccion)
    db.flush()

    for item_in in payload.detalles:
        detalle = DetalleInspeccion(
            inspeccion_id=inspeccion.id,
            **item_in.model_dump(),
        )
        db.add(detalle)

    db.commit()
    db.refresh(inspeccion)
    return inspeccion


@router.post("/{orden_id}/checklist", response_model=OrdenTrabajoOut)
def guardar_checklist(
    orden_id: int,
    payload: ChecklistRecepcionCreate,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> OrdenTrabajo:
    """Registra o actualiza el checklist visual 360° de recepción."""
    orden = (
        db.query(OrdenTrabajo)
        .filter(OrdenTrabajo.id == orden_id, OrdenTrabajo.organizacion_id == org_id)
        .first()
    )
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    checklist = db.query(ChecklistRecepcion).filter(ChecklistRecepcion.orden_id == orden_id).first()
    if checklist:
        for campo, valor in payload.model_dump().items():
            setattr(checklist, campo, valor)
    else:
        checklist = ChecklistRecepcion(orden_id=orden.id, **payload.model_dump())
        db.add(checklist)

    db.commit()
    db.refresh(orden)
    return orden
