from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_tenant_id, require_staff
from app.database import get_db
from app.models.cliente import Cliente
from app.schemas.cliente import ClienteCreate, ClienteOut, ClienteUpdate

router = APIRouter(prefix="/api/clientes", tags=["clientes"], dependencies=[Depends(require_staff)])


@router.get("", response_model=list[ClienteOut])
def listar_clientes(
    q: str | None = None,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> list[Cliente]:
    query = db.query(Cliente).filter(Cliente.organizacion_id == org_id)
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                Cliente.nombre.ilike(like),
                Cliente.apellidos.ilike(like),
                Cliente.cedula_ruc.ilike(like),
                Cliente.telefono.ilike(like),
                Cliente.email.ilike(like),
            )
        )
    return query.order_by(Cliente.nombre).all()


@router.get("/{cliente_id}", response_model=ClienteOut)
def obtener_cliente(
    cliente_id: int,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> Cliente:
    cliente = (
        db.query(Cliente)
        .filter(Cliente.id == cliente_id, Cliente.organizacion_id == org_id)
        .first()
    )
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.post("", response_model=ClienteOut, status_code=201)
def crear_cliente(
    payload: ClienteCreate,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> Cliente:
    cliente = Cliente(**payload.model_dump(), organizacion_id=org_id)
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente


@router.patch("/{cliente_id}", response_model=ClienteOut)
def actualizar_cliente(
    cliente_id: int,
    payload: ClienteUpdate,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> Cliente:
    cliente = (
        db.query(Cliente)
        .filter(Cliente.id == cliente_id, Cliente.organizacion_id == org_id)
        .first()
    )
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(cliente, campo, valor)
    db.commit()
    db.refresh(cliente)
    return cliente
