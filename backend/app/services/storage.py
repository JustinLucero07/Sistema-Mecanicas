"""Fotos y documentos en S3/MinIO.

- El bucket es privado. La base guarda la clave del objeto y la API entrega
  enlaces firmados que vencen, así una URL filtrada deja de servir sola.
- Cada imagen se valida, se reorienta y se vuelve a codificar en JPEG: eso
  descarta archivos que no son imágenes y borra los metadatos EXIF (incluida
  la ubicación GPS que guardan los celulares).
"""

import io
import logging
import uuid
from functools import lru_cache

import boto3
from botocore.client import Config
from botocore.exceptions import BotoCoreError, ClientError
from PIL import Image, ImageOps, UnidentifiedImageError

from app.config import get_settings

log = logging.getLogger(__name__)

LADO_MAXIMO_PX = 2000
PREFIJO_CLAVE = "s3://"


class ArchivoInvalido(Exception):
    """El archivo no es una imagen válida o es demasiado grande."""


class AlmacenamientoNoDisponible(Exception):
    """No se pudo guardar el archivo; no se debe registrar nada en la base."""


def _cliente(endpoint: str):
    settings = get_settings()
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )


@lru_cache
def get_s3_client():
    return _cliente(get_settings().s3_endpoint_url)


@lru_cache
def _cliente_firmas():
    # Las firmas incluyen el host: deben generarse con la URL que usa el navegador.
    settings = get_settings()
    return _cliente(settings.s3_public_endpoint_url or settings.s3_endpoint_url)


_bucket_verificado = False


def ensure_bucket() -> None:
    global _bucket_verificado
    if _bucket_verificado:
        return
    settings = get_settings()
    client = get_s3_client()
    try:
        client.head_bucket(Bucket=settings.s3_bucket)
    except ClientError:
        client.create_bucket(Bucket=settings.s3_bucket)
    _bucket_verificado = True


def preparar_imagen(contenido: bytes) -> bytes:
    settings = get_settings()
    if len(contenido) > settings.max_subida_mb * 1024 * 1024:
        raise ArchivoInvalido(f"La foto supera {settings.max_subida_mb} MB")
    try:
        imagen = Image.open(io.BytesIO(contenido))
        imagen.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise ArchivoInvalido("El archivo no es una imagen válida (usa JPG, PNG o WEBP)") from exc
    if imagen.format not in {"JPEG", "PNG", "WEBP", "MPO"}:
        raise ArchivoInvalido("Formato no admitido: usa JPG, PNG o WEBP")

    imagen = ImageOps.exif_transpose(imagen).convert("RGB")
    imagen.thumbnail((LADO_MAXIMO_PX, LADO_MAXIMO_PX))
    salida = io.BytesIO()
    imagen.save(salida, format="JPEG", quality=85, optimize=True)
    return salida.getvalue()


def subir_archivo(contenido: bytes, carpeta: str) -> str:
    """Valida y sube una foto. Devuelve la referencia a guardar en la base."""
    settings = get_settings()
    jpeg = preparar_imagen(contenido)
    clave = f"{carpeta}/{uuid.uuid4().hex}.jpg"
    try:
        ensure_bucket()
        get_s3_client().put_object(Bucket=settings.s3_bucket, Key=clave, Body=jpeg, ContentType="image/jpeg")
    except (BotoCoreError, ClientError) as exc:
        log.exception("No se pudo subir %s al almacenamiento", clave)
        raise AlmacenamientoNoDisponible("No se pudo guardar la foto. Inténtalo de nuevo en unos minutos.") from exc
    return f"{PREFIJO_CLAVE}{clave}"


def _clave_desde_referencia(referencia: str) -> str | None:
    settings = get_settings()
    if referencia.startswith(PREFIJO_CLAVE):
        return referencia[len(PREFIJO_CLAVE):]
    # Registros antiguos guardaban la URL completa .../<bucket>/<clave>.
    marcador = f"/{settings.s3_bucket}/"
    if marcador in referencia:
        return referencia.split(marcador, 1)[1]
    return None


def url_firmada(referencia: str | None) -> str | None:
    """Convierte la referencia guardada en un enlace temporal para el navegador."""
    if not referencia:
        return referencia
    clave = _clave_desde_referencia(referencia)
    if clave is None:
        return referencia
    settings = get_settings()
    try:
        return _cliente_firmas().generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.s3_bucket, "Key": clave},
            ExpiresIn=settings.s3_url_expira_segundos,
        )
    except (BotoCoreError, ClientError):
        log.exception("No se pudo firmar la URL de %s", clave)
        return None
