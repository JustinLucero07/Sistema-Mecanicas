from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

CLAVES_DE_EJEMPLO = {"CHANGE_ME_IN_PRODUCTION", "change-me-generate-a-random-secret", ""}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    app_name: str = "MecánicaOS API"
    environment: str = "development"  # development | production

    # Base de datos
    database_url: str = "postgresql+psycopg2://mecanica:mecanica@localhost:5432/mecanica"

    # Auth
    secret_key: str = "CHANGE_ME_IN_PRODUCTION"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 10  # una jornada de taller
    login_max_intentos: int = 5
    login_bloqueo_minutos: int = 15

    # Almacenamiento de fotos (S3 / MinIO). El bucket es privado: las fotos se
    # sirven con enlaces firmados que vencen.
    s3_endpoint_url: str = "http://localhost:9000"
    s3_public_endpoint_url: str | None = None  # URL que ve el navegador, si difiere
    s3_access_key: str = "mecanica"
    s3_secret_key: str = "mecanica123"
    s3_bucket: str = "mecanica-fotos"
    s3_region: str = "us-east-1"
    s3_url_expira_segundos: int = 3600
    max_subida_mb: int = 10

    # Reconocimiento de placas
    plate_model_path: str = "models/placas-ecuador.pt"
    plate_country_format: str = "EC"  # ABC-1234 / AB-1234

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # Legal
    terminos_version: str = "2026-10"

    @property
    def es_produccion(self) -> bool:
        return self.environment.lower() == "production"

    @model_validator(mode="after")
    def _seguro_en_produccion(self) -> "Settings":
        if not self.es_produccion:
            return self
        errores = []
        if self.secret_key in CLAVES_DE_EJEMPLO or len(self.secret_key) < 32:
            errores.append("SECRET_KEY debe ser aleatoria y de al menos 32 caracteres (openssl rand -hex 32)")
        if self.s3_secret_key in {"mecanica123", "minioadmin"}:
            errores.append("S3_SECRET_KEY no puede ser la de ejemplo")
        if any(o.startswith("http://") and "localhost" not in o for o in self.cors_origins):
            errores.append("CORS_ORIGINS debe usar https en producción")
        if "mecanica:mecanica@" in self.database_url:
            errores.append("DATABASE_URL usa la contraseña de ejemplo")
        if errores:
            raise ValueError("Configuración insegura para producción:\n- " + "\n- ".join(errores))
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
