from pydantic import BaseModel, EmailStr

from app.models.base import RolUsuario


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: RolUsuario
    nombre: str
    usuario_id: int
    organizacion_id: int | None = None
    sucursal_id: int | None = None
