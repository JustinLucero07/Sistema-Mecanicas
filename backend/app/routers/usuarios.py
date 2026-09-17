from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_tenant_id, require_admin
from app.core.security import hash_password
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioOut, UsuarioUpdate

router = APIRouter(prefix="/api/usuarios", tags=["usuarios"], dependencies=[Depends(require_admin)])


@router.get("", response_model=list[UsuarioOut])
def listar_usuarios(
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> list[Usuario]:
    return (
        db.query(Usuario)
        .filter(Usuario.organizacion_id == org_id)
        .order_by(Usuario.nombre)
        .all()
    )


@router.post("", response_model=UsuarioOut, status_code=201)
def crear_usuario(
    payload: UsuarioCreate,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> Usuario:
    if db.query(Usuario).filter(Usuario.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Ya existe un usuario con ese email")

    usuario = Usuario(
        organizacion_id=org_id,
        nombre=payload.nombre,
        email=payload.email,
        rol=payload.rol,
        telefono=payload.telefono,
        cliente_id=payload.cliente_id,
        password_hash=hash_password(payload.password),
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.patch("/{usuario_id}", response_model=UsuarioOut)
def actualizar_usuario(
    usuario_id: int,
    payload: UsuarioUpdate,
    org_id: int = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> Usuario:
    usuario = (
        db.query(Usuario)
        .filter(Usuario.id == usuario_id, Usuario.organizacion_id == org_id)
        .first()
    )
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    datos = payload.model_dump(exclude_unset=True)
    if "password" in datos:
        usuario.password_hash = hash_password(datos.pop("password"))
    for campo, valor in datos.items():
        setattr(usuario, campo, valor)

    db.commit()
    db.refresh(usuario)
    return usuario
