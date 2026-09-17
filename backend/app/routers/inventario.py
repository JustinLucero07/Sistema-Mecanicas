from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_tenant_id, get_current_user, require_inventario, require_staff
from app.database import get_db
from app.models.base import MotivoMovimientoInventario, TipoMovimientoInventario
from app.models.inventario import MovimientoInventario, Proveedor, Repuesto
from app.models.usuario import Usuario
from app.schemas.inventario import (
    MovimientoInventarioCreate,
    MovimientoInventarioOut,
    ProveedorCreate,
    ProveedorOut,
    RepuestoCreate,
    RepuestoOut,
    RepuestoUpdate,
)

router = APIRouter(prefix="/api/inventario", tags=["inventario"], dependencies=[Depends(require_staff)])


@router.get("/proveedores", response_model=list[ProveedorOut])
def listar_proveedores(
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> list[Proveedor]:
    return (
        db.query(Proveedor)
        .filter(Proveedor.organizacion_id == org_id)
        .order_by(Proveedor.nombre)
        .all()
    )


@router.post("/proveedores", response_model=ProveedorOut, status_code=201)
def crear_proveedor(
    payload: ProveedorCreate,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> Proveedor:
    proveedor = Proveedor(**payload.model_dump(), organizacion_id=org_id)
    db.add(proveedor)
    db.commit()
    db.refresh(proveedor)
    return proveedor


@router.get("/repuestos", response_model=list[RepuestoOut])
def listar_repuestos(
    bajo_stock: bool = False,
    q: str | None = None,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> list[Repuesto]:
    query = db.query(Repuesto).filter(Repuesto.organizacion_id == org_id)
    if bajo_stock:
        query = query.filter(Repuesto.stock_actual <= Repuesto.stock_minimo)
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                Repuesto.nombre.ilike(like),
                Repuesto.codigo.ilike(like),
                Repuesto.sku.ilike(like),
                Repuesto.barcode.ilike(like),
                Repuesto.categoria.ilike(like),
                Repuesto.marca.ilike(like),
            )
        )
    return query.order_by(Repuesto.nombre).all()


@router.post("/repuestos", response_model=RepuestoOut, status_code=201)
def crear_repuesto(
    payload: RepuestoCreate,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> Repuesto:
    repuesto = Repuesto(**payload.model_dump(), organizacion_id=org_id)
    db.add(repuesto)
    db.commit()
    db.refresh(repuesto)
    return repuesto


@router.patch("/repuestos/{repuesto_id}", response_model=RepuestoOut)
def actualizar_repuesto(
    repuesto_id: int,
    payload: RepuestoUpdate,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> Repuesto:
    repuesto = (
        db.query(Repuesto)
        .filter(Repuesto.id == repuesto_id, Repuesto.organizacion_id == org_id)
        .first()
    )
    if not repuesto:
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")

    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(repuesto, campo, valor)

    db.commit()
    db.refresh(repuesto)
    return repuesto


@router.get("/movimientos", response_model=list[MovimientoInventarioOut])
def listar_movimientos(
    repuesto_id: int | None = None,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> list[MovimientoInventario]:
    query = db.query(MovimientoInventario).filter(MovimientoInventario.organizacion_id == org_id)
    if repuesto_id:
        query = query.filter(MovimientoInventario.repuesto_id == repuesto_id)
    return query.order_by(MovimientoInventario.fecha.desc()).limit(100).all()


@router.post("/movimientos", status_code=201)
def registrar_movimiento(
    payload: MovimientoInventarioCreate,
    org_id: int = Depends(get_current_tenant_id),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    repuesto = (
        db.query(Repuesto)
        .filter(Repuesto.id == payload.repuesto_id, Repuesto.organizacion_id == org_id)
        .first()
    )
    if not repuesto:
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")

    stock_ant = repuesto.stock_actual
    if payload.tipo == TipoMovimientoInventario.SALIDA:
        repuesto.stock_actual -= payload.cantidad
    else:
        repuesto.stock_actual += payload.cantidad

    movimiento = MovimientoInventario(
        organizacion_id=org_id,
        repuesto_id=payload.repuesto_id,
        tipo=payload.tipo,
        motivo=payload.motivo,
        cantidad=payload.cantidad,
        stock_anterior=stock_ant,
        stock_nuevo=repuesto.stock_actual,
        orden_id=payload.orden_id,
        usuario_id=current_user.id,
        observacion=payload.observacion,
    )
    db.add(movimiento)
    db.commit()
    return {"ok": True, "stock_actual": repuesto.stock_actual}
