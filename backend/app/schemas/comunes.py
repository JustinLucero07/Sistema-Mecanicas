from typing import Annotated

from pydantic import PlainSerializer

from app.services.storage import url_firmada

# Campo de archivo: en la base se guarda la referencia interna y la API
# devuelve un enlace firmado que vence.
UrlArchivo = Annotated[str | None, PlainSerializer(url_firmada, return_type=str | None)]
