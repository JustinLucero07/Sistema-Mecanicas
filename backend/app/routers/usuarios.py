from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_tenant_id, require_admin
from app.core.security import hash_password
from app.database import get_db
from app.models.base import RolUsuario
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioOut, UsuarioUpdate

router = APIRouter(prefix="/api/usuarios", tags=["usuarios"])


def _verificar_rol_asignable(actor: Usuario, rol: RolUsuario) -> None:
    # Un administrador de taller no puede crear cuentas con más poder que la suya.
    if rol == RolUsuario.SUPERADMIN and actor.rol != RolUsuario.SUPERADMIN:
        raise HTTPException(status_code=403, detail="No puedes asignar el rol de superadministrador")


@router.get("", response_model=list[UsuarioOut])
def listar_usuarios(
    org_id: int = Depends(get_current_tenant_id),
    _: Usuario = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[Usuario]:
    return db.query(Usuario).filter(Usuario.organizacion_id == org_id).order_by(Usuario.nombre).all()


@router.post("", response_model=UsuarioOut, status_code=201)
def crear_usuario(
    payload: UsuarioCreate,
    org_id: int = Depends(get_current_tenant_id),
    actor: Usuario = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Usuario:
    _verificar_rol_asignable(actor, payload.rol)
    if db.query(Usuario).filter(func.lower(Usuario.email) == payload.email).first():
        raise HTTPException(status_code=400, detail="Ya existe un usuario con ese correo")

    usuario = Usuario(
        organizacion_id=org_id,
        sucursal_id=actor.sucursal_id,
        nombre=payload.nombre.strip(),
        email=payload.email,
        rol=payload.rol,
        telefono=payload.telefono,
        cargo=payload.cargo,
        especialidad=payload.especialidad,
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
    actor: Usuario = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Usuario:
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id, Usuario.organizacion_id == org_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    datos = payload.model_dump(exclude_unset=True)
    if usuario.id == actor.id and (datos.get("activo") is False or ("rol" in datos and datos["rol"] != actor.rol)):
        raise HTTPException(status_code=400, detail="No puedes desactivarte ni cambiar tu propio rol")
    if "rol" in datos and datos["rol"] is not None:
        _verificar_rol_asignable(actor, datos["rol"])

    cierra_sesiones = False
    if datos.get("password"):
        usuario.password_hash = hash_password(datos.pop("password"))
        cierra_sesiones = True
    datos.pop("password", None)
    if datos.get("activo") is False and usuario.activo:
        cierra_sesiones = True
    for campo, valor in datos.items():
        setattr(usuario, campo, valor)
    if cierra_sesiones:
        usuario.sesion_version = (usuario.sesion_version or 0) + 1

    db.commit()
    db.refresh(usuario)
    return usuario
