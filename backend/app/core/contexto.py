"""Datos de la petición en curso, accesibles desde los eventos de la base de datos.

FastAPI corre cada dependencia síncrona en un hilo con su propia copia del
contexto: un `ContextVar.set()` hecho dentro de una dependencia no llega al
endpoint. Por eso el middleware crea un diccionario por petición (el mismo
objeto lo ven todos los hilos) y las dependencias lo rellenan.
"""

from contextvars import ContextVar

_peticion: ContextVar[dict | None] = ContextVar("peticion", default=None)


def iniciar_peticion(ip: str | None) -> None:
    _peticion.set({"ip": ip, "usuario_id": None, "organizacion_id": None})


def fijar_usuario(usuario_id: int, organizacion_id: int | None) -> None:
    datos = _peticion.get()
    if datos is not None:
        datos["usuario_id"] = usuario_id
        datos["organizacion_id"] = organizacion_id


def _valor(clave: str):
    datos = _peticion.get()
    return datos.get(clave) if datos else None


def usuario_actual_id() -> int | None:
    return _valor("usuario_id")


def organizacion_actual_id() -> int | None:
    return _valor("organizacion_id")


def ip_actual() -> str | None:
    return _valor("ip")
