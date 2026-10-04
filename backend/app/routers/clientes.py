from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_tenant_id, require_admin, require_staff
from app.core.integridad import registrar_evento
from app.database import get_db
from app.models.cliente import Cliente
from app.models.usuario import Usuario
from app.schemas.cliente import ClienteCreate, ClienteOut, ClienteUpdate
from app.schemas.orden import OrdenTrabajoOut
from app.schemas.vehiculo import VehiculoOut

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


# ------------------------------------------------- Derechos del titular (LOPDP)
@router.get("/{cliente_id}/exportar")
def exportar_datos_cliente(
    cliente_id: int,
    org_id: int = Depends(get_current_tenant_id),
    _: Usuario = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict:
    """Todos los datos del cliente en un solo documento (derecho de acceso y portabilidad)."""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id, Cliente.organizacion_id == org_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    datos = {
        "cliente": ClienteOut.model_validate(cliente).model_dump(mode="json"),
        "vehiculos": [VehiculoOut.model_validate(v).model_dump(mode="json", exclude={"cliente"}) for v in cliente.vehiculos],
        "ordenes": [
            OrdenTrabajoOut.model_validate(o).model_dump(mode="json", exclude={"vehiculo", "cliente", "mecanico"})
            for o in cliente.ordenes
        ],
        "generado_en": datetime.now(timezone.utc).isoformat(),
    }
    registrar_evento(db, "exportar_datos", "clientes", cliente.id)
    db.commit()
    return datos


@router.post("/{cliente_id}/anonimizar", response_model=ClienteOut)
def anonimizar_cliente(
    cliente_id: int,
    org_id: int = Depends(get_current_tenant_id),
    _: Usuario = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Cliente:
    """Derecho de eliminación: borra los datos personales pero conserva
    órdenes y pagos, que el taller debe guardar por obligaciones tributarias."""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id, Cliente.organizacion_id == org_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    if cliente.anonimizado_en:
        raise HTTPException(status_code=400, detail="Este cliente ya fue anonimizado")
    cliente.nombre = f"Cliente anonimizado #{cliente.id}"
    for campo in ("apellidos", "cedula_ruc", "telefono", "whatsapp", "email", "ciudad", "direccion", "notas"):
        setattr(cliente, campo, None)
    cliente.acepta_comunicaciones = False
    cliente.anonimizado_en = datetime.now(timezone.utc)
    db.commit()
    db.refresh(cliente)
    return cliente
