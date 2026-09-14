from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.deps import require_staff
from app.database import get_db
from app.models.base import (
    MotivoMovimientoInventario,
    TipoDetalleOrden,
    TipoFoto,
    TipoMovimientoInventario,
)
from app.models.inventario import MovimientoInventario, Repuesto
from app.models.orden import DetalleOrden, Foto, OrdenTrabajo
from app.models.vehiculo import Vehiculo
from app.schemas.orden import (
    DetalleOrdenCreate,
    OrdenTrabajoCreate,
    OrdenTrabajoOut,
    OrdenTrabajoUpdate,
)
from app.services.storage import subir_archivo

router = APIRouter(prefix="/api/ordenes", tags=["ordenes"], dependencies=[Depends(require_staff)])


def _calcular_subtotal(detalle: DetalleOrdenCreate) -> float:
    return round(detalle.cantidad * detalle.precio_unitario, 2)


def _descontar_inventario(db: Session, orden: OrdenTrabajo, detalle: DetalleOrden) -> None:
    if detalle.tipo != TipoDetalleOrden.REPUESTO or not detalle.repuesto_id:
        return
    repuesto = db.get(Repuesto, detalle.repuesto_id)
    if not repuesto:
        return
    repuesto.stock_actual -= int(detalle.cantidad)
    db.add(
        MovimientoInventario(
            repuesto_id=repuesto.id,
            tipo=TipoMovimientoInventario.SALIDA,
            motivo=MotivoMovimientoInventario.USO_EN_ORDEN,
            cantidad=int(detalle.cantidad),
            orden_id=orden.id,
        )
    )


@router.get("", response_model=list[OrdenTrabajoOut])
def listar_ordenes(
    vehiculo_id: int | None = None, estado: str | None = None, db: Session = Depends(get_db)
) -> list[OrdenTrabajo]:
    query = db.query(OrdenTrabajo)
    if vehiculo_id:
        query = query.filter(OrdenTrabajo.vehiculo_id == vehiculo_id)
    if estado:
        query = query.filter(OrdenTrabajo.estado == estado)
    return query.order_by(OrdenTrabajo.fecha_ingreso.desc()).all()


@router.get("/{orden_id}", response_model=OrdenTrabajoOut)
def obtener_orden(orden_id: int, db: Session = Depends(get_db)) -> OrdenTrabajo:
    orden = db.get(OrdenTrabajo, orden_id)
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return orden


@router.post("", response_model=OrdenTrabajoOut, status_code=201)
def crear_orden(payload: OrdenTrabajoCreate, db: Session = Depends(get_db)) -> OrdenTrabajo:
    vehiculo = db.get(Vehiculo, payload.vehiculo_id)
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    orden = OrdenTrabajo(**payload.model_dump(exclude={"detalles"}))
    db.add(orden)
    db.flush()  # para tener orden.id antes de crear detalles

    for detalle_in in payload.detalles:
        detalle = DetalleOrden(
            orden_id=orden.id,
            subtotal=_calcular_subtotal(detalle_in),
            **detalle_in.model_dump(),
        )
        db.add(detalle)
        db.flush()
        _descontar_inventario(db, orden, detalle)

    if payload.kilometraje_ingreso:
        vehiculo.kilometraje_actual = payload.kilometraje_ingreso

    db.commit()
    db.refresh(orden)
    return orden


@router.patch("/{orden_id}", response_model=OrdenTrabajoOut)
def actualizar_orden(orden_id: int, payload: OrdenTrabajoUpdate, db: Session = Depends(get_db)) -> OrdenTrabajo:
    orden = db.get(OrdenTrabajo, orden_id)
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(orden, campo, valor)
    db.commit()
    db.refresh(orden)
    return orden


@router.post("/{orden_id}/detalles", response_model=OrdenTrabajoOut)
def agregar_detalle(orden_id: int, payload: DetalleOrdenCreate, db: Session = Depends(get_db)) -> OrdenTrabajo:
    orden = db.get(OrdenTrabajo, orden_id)
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    detalle = DetalleOrden(orden_id=orden.id, subtotal=_calcular_subtotal(payload), **payload.model_dump())
    db.add(detalle)
    db.flush()
    _descontar_inventario(db, orden, detalle)

    db.commit()
    db.refresh(orden)
    return orden


@router.post("/{orden_id}/fotos", response_model=OrdenTrabajoOut)
async def subir_foto_orden(
    orden_id: int, tipo: TipoFoto, foto: UploadFile, db: Session = Depends(get_db)
) -> OrdenTrabajo:
    orden = db.get(OrdenTrabajo, orden_id)
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    contenido = await foto.read()
    url = subir_archivo(contenido, carpeta=f"ordenes/{orden_id}")
    db.add(Foto(orden_id=orden_id, tipo=tipo, url=url))
    db.commit()
    db.refresh(orden)
    return orden
