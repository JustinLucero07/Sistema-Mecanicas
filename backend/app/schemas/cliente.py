from pydantic import BaseModel, ConfigDict


class ClienteBase(BaseModel):
    nombre: str
    apellidos: str | None = None
    cedula_ruc: str | None = None
    telefono: str | None = None
    whatsapp: str | None = None
    email: str | None = None
    ciudad: str | None = None
    direccion: str | None = None
    notas: str | None = None


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    nombre: str | None = None
    apellidos: str | None = None
    cedula_ruc: str | None = None
    telefono: str | None = None
    whatsapp: str | None = None
    email: str | None = None
    ciudad: str | None = None
    direccion: str | None = None
    notas: str | None = None


class ClienteOut(ClienteBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nombre_completo: str | None = None
