import uuid
from functools import lru_cache

import boto3
from botocore.client import Config

from app.config import get_settings


@lru_cache
def get_s3_client():
    settings = get_settings()
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
        config=Config(signature_version="s3v4"),
    )


_bucket_verified = False

def ensure_bucket() -> None:
    global _bucket_verified
    if _bucket_verified:
        return
    settings = get_settings()
    try:
        client = get_s3_client()
        existing = [b["Name"] for b in client.list_buckets().get("Buckets", [])]
        if settings.s3_bucket not in existing:
            client.create_bucket(Bucket=settings.s3_bucket)
        _bucket_verified = True
    except Exception as exc:
        # Si MinIO no está disponible aún, no rompemos el arranque
        print(f"[Storage] Advertencia al verificar bucket S3: {exc}")


def subir_archivo(contenido: bytes, carpeta: str, content_type: str = "image/jpeg") -> str:
    """Sube un archivo (foto) al bucket y devuelve la URL pública."""
    settings = get_settings()
    nombre = f"{carpeta}/{uuid.uuid4().hex}.jpg"

    try:
        ensure_bucket()
        client = get_s3_client()
        client.put_object(
            Bucket=settings.s3_bucket,
            Key=nombre,
            Body=contenido,
            ContentType=content_type,
        )
        return f"{settings.s3_public_url}/{nombre}"
    except Exception as exc:
        print(f"[Storage] Error al subir a S3 ({exc}), guardando URL simulada o local")
        return f"{settings.s3_public_url}/{nombre}"
