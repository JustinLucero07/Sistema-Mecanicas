from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.deps import get_current_user
from app.core.integridad import registrar_evento
from app.core.security import (
    create_access_token,
    hash_password,
    limitador_login,
    validar_contrasena,
    verify_password,
)
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.usuario import UsuarioOut

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


def _emitir_token(usuario: Usuario) -> TokenResponse:
    token = create_access_token(
        subject=str(usuario.id),
        rol=usuario.rol.value,
        organizacion_id=usuario.organizacion_id,
        sucursal_id=usuario.sucursal_id,
        version=usuario.sesion_version or 0,
    )
    return TokenResponse(
        access_token=token,
        rol=usuario.rol,
        nombre=usuario.nombre,
        usuario_id=usuario.id,
        organizacion_id=usuario.organizacion_id,
        sucursal_id=usuario.sucursal_id,
        requiere_aceptar_terminos=usuario.terminos_version != settings.terminos_version,
        terminos_version=settings.terminos_version,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    email = payload.email.strip().lower()
    clave = f"email:{email}"

    espera = limitador_login.segundos_bloqueado(clave)
    if espera:
        minutos = max(1, round(espera / 60))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Demasiados intentos fallidos. Vuelve a intentar en {minutos} min.",
            headers={"Retry-After": str(espera)},
        )

    usuario = db.query(Usuario).filter(func.lower(Usuario.email) == email).first()
    if not verify_password(payload.password, usuario.password_hash if usuario else None):
        limitador_login.fallo(clave)
        registrar_evento(db, "login_fallido", "usuarios", usuario.id if usuario else None, {"email": email},
                         organizacion_id=usuario.organizacion_id if usuario else None, usuario_id=None)
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Correo o contraseña incorrectos")

    # Solo después de validar la contraseña se revela el estado de la cuenta.
    if not usuario.activo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tu usuario está desactivado. Habla con el administrador del taller.")
    if usuario.organizacion is not None and not usuario.organizacion.activo:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="La cuenta del taller está suspendida.")

    limitador_login.exito(clave)
    registrar_evento(db, "login", "usuarios", usuario.id, organizacion_id=usuario.organizacion_id, usuario_id=usuario.id)
    db.commit()
    return _emitir_token(usuario)


@router.get("/me", response_model=UsuarioOut)
def me(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    return current_user


class CambioContrasena(BaseModel):
    actual: str
    nueva: str

    @field_validator("nueva")
    @classmethod
    def _politica(cls, v: str) -> str:
        return validar_contrasena(v)


@router.post("/cambiar-contrasena", response_model=TokenResponse)
def cambiar_contrasena(
    payload: CambioContrasena,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TokenResponse:
    if not verify_password(payload.actual, usuario.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual no es correcta")
    if payload.actual == payload.nueva:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe ser distinta de la actual")
    usuario.password_hash = hash_password(payload.nueva)
    # Cierra todas las demás sesiones abiertas con la contraseña anterior.
    usuario.sesion_version = (usuario.sesion_version or 0) + 1
    db.commit()
    db.refresh(usuario)
    return _emitir_token(usuario)


@router.post("/aceptar-terminos", status_code=204)
def aceptar_terminos(usuario: Usuario = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    usuario.terminos_version = settings.terminos_version
    usuario.terminos_aceptados_en = datetime.now(timezone.utc)
    db.commit()
