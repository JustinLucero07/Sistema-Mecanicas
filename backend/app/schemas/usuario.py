from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.core.security import validar_contrasena
from app.models.base import RolUsuario


class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr
    rol: RolUsuario
    telefono: str | None = None
    cargo: str | None = None
    especialidad: str | None = None
    cliente_id: int | None = None


class UsuarioCreate(UsuarioBase):
    password: str

    @field_validator("password")
    @classmethod
    def _politica(cls, v: str) -> str:
        return validar_contrasena(v)

    @field_validator("email")
    @classmethod
    def _minusculas(cls, v: str) -> str:
        return v.strip().lower()


class UsuarioUpdate(BaseModel):
    nombre: str | None = None
    telefono: str | None = None
    cargo: str | None = None
    especialidad: str | None = None
    rol: RolUsuario | None = None
    activo: bool | None = None
    password: str | None = None

    @field_validator("password")
    @classmethod
    def _politica(cls, v: str | None) -> str | None:
        return None if v is None else validar_contrasena(v)


class UsuarioOut(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    activo: bool
    organizacion_id: int | None = None
    creado_en: datetime | None = None
