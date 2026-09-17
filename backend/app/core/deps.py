from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.base import RolUsuario
from app.models.usuario import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar la credencial de acceso",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.get(Usuario, int(user_id))
    if user is None or not user.activo:
        raise credentials_exception
    return user


def get_current_tenant_id(current_user: Usuario = Depends(get_current_user)) -> int:
    """Devuelve el ID de la organización/tenant del usuario autenticado."""
    if current_user.organizacion_id is not None:
        return current_user.organizacion_id
    if current_user.rol in (RolUsuario.SUPERADMIN, RolUsuario.ADMIN, RolUsuario.ADMIN_TALLER):
        # Admin / Superadmin puede operar con tenant por defecto (1) si no está explícito
        return 1
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="El usuario no pertenece a ninguna organización activa",
    )


def require_roles(*roles: RolUsuario) -> Callable:
    def checker(current_user: Usuario = Depends(get_current_user)) -> Usuario:
        # SUPERADMIN tiene acceso a todas las acciones de administración
        if current_user.rol == RolUsuario.SUPERADMIN:
            return current_user
        if current_user.rol not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos suficientes para realizar esta acción",
            )
        return current_user

    return checker


# Atajos de roles para endpoints
ADMIN_ROLES = (RolUsuario.SUPERADMIN, RolUsuario.ADMIN_TALLER, RolUsuario.ADMIN)
STAFF_ROLES = (
    RolUsuario.SUPERADMIN,
    RolUsuario.ADMIN_TALLER,
    RolUsuario.ADMIN,
    RolUsuario.GERENTE,
    RolUsuario.RECEPCIONISTA,
    RolUsuario.MECANICO,
    RolUsuario.INVENTARIO,
    RolUsuario.CONTABILIDAD,
    RolUsuario.CAJERO,
)
FINANZAS_ROLES = (
    RolUsuario.SUPERADMIN,
    RolUsuario.ADMIN_TALLER,
    RolUsuario.ADMIN,
    RolUsuario.GERENTE,
    RolUsuario.CONTABILIDAD,
    RolUsuario.CAJERO,
)
INVENTARIO_ROLES = (
    RolUsuario.SUPERADMIN,
    RolUsuario.ADMIN_TALLER,
    RolUsuario.ADMIN,
    RolUsuario.GERENTE,
    RolUsuario.INVENTARIO,
)
MECANICO_ROLES = (
    RolUsuario.SUPERADMIN,
    RolUsuario.ADMIN_TALLER,
    RolUsuario.ADMIN,
    RolUsuario.GERENTE,
    RolUsuario.MECANICO,
)

require_admin = require_roles(*ADMIN_ROLES)
require_staff = require_roles(*STAFF_ROLES)
require_finanzas = require_roles(*FINANZAS_ROLES)
require_inventario = require_roles(*INVENTARIO_ROLES)
require_mecanico = require_roles(*MECANICO_ROLES)
