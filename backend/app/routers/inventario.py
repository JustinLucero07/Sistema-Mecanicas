from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import require_staff
from app.database import get_db
from app.models.base import MotivoMovimientoInventario, TipoMovimientoInventario
from app.models.inventario import MovimientoInventario, Proveedor, Repuesto
from app.schemas.inventario import (
    MovimientoInventarioCreate,
    ProveedorCreate,
    ProveedorOut,
    RepuestoCreate,
    RepuestoOut,
    RepuestoUpdate,
)

router = APIRouter(prefix="/api/inventario", tags=["inventario"], dependencies=[Depends(require_staff)])


@router.get("/proveedores", response_model=list[ProveedorOut])
def listar_proveedores(db: Session = Depends(get_db)) -> list[Proveedor]:
    return db.query(Proveedor).order_by(Proveedor.nombre).all()


@router.post("/proveedores", response_model=ProveedorOut, status_code=201)
def crear_proveedor(payload: ProveedorCreate, db: Session = Depends(get_db)) -> Proveedor:
    proveedor = Proveedor(**payload.model_dump())
    db.add(proveedor)
    db.commit()
    db.refresh(proveedor)
    return proveedor


@router.get("/repuestos", response_model=list[RepuestoOut])
def listar_repuestos(bajo_stock: bool = False, db: Session = Depends(get_db)) -> list[Repuesto]:
    query = db.query(Repuesto)
    if bajo_stock:
        query = query.filter(Repuesto.stock_actual <= Repuesto.stock_minimo)
    return query.order_by(Repuesto.nombre).all()


@router.post("/repuestos", response_model=RepuestoOut, status_code=201)
def crear_repuesto(payload: RepuestoCreate, db: Session = Depends(get_db)) -> Repuesto:
    repuesto = Repuesto(**payload.model_dump())
    db.add(repuesto)
    db.commit()
    db.refresh(repuesto)
    return repuesto


@router.patch("/repuestos/{repuesto_id}", response_model=RepuestoOut)
def actualizar_repuesto(repuesto_id: int, payload: RepuestoUpdate, db: Session = Depends(get_db)) -> Repuesto:
    repuesto = db.get(Repuesto, repuesto_id)
    if not repuesto:
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")
    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(repuesto, campo, valor)
    db.commit()
    db.refresh(repuesto)
    return repuesto


@router.post("/movimientos", status_code=201)
def registrar_movimiento(payload: MovimientoInventarioCreate, db: Session = Depends(get_db)) -> dict:
    repuesto = db.get(Repuesto, payload.repuesto_id)
    if not repuesto:
        raise HTTPException(status_code=404, detail="Repuesto no encontrado")

    tipo = TipoMovimientoInventario(payload.tipo)
    motivo = MotivoMovimientoInventario(payload.motivo)

    if tipo == TipoMovimientoInventario.SALIDA:
        repuesto.stock_actual -= payload.cantidad
    else:
        repuesto.stock_actual += payload.cantidad

    movimiento = MovimientoInventario(
        repuesto_id=payload.repuesto_id,
        tipo=tipo,
        motivo=motivo,
        cantidad=payload.cantidad,
        orden_id=payload.orden_id,
    )
    db.add(movimiento)
    db.commit()
    return {"ok": True, "stock_actual": repuesto.stock_actual}
