from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.base import RolUsuario


class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr
    rol: RolUsuario
    telefono: str | None = None
    cliente_id: int | None = None


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioUpdate(BaseModel):
    nombre: str | None = None
    telefono: str | None = None
    activo: bool | None = None
    password: str | None = None


class UsuarioOut(UsuarioBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    activo: bool
