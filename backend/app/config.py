from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    app_name: str = "Sistema Mecánica API"
    environment: str = "development"

    # Base de datos
    database_url: str = "postgresql+psycopg2://mecanica:mecanica@localhost:5432/mecanica"

    # Auth
    secret_key: str = "CHANGE_ME_IN_PRODUCTION"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 12  # 12 horas

    # Almacenamiento de fotos (S3 / MinIO)
    s3_endpoint_url: str = "http://localhost:9000"
    s3_access_key: str = "mecanica"
    s3_secret_key: str = "mecanica123"
    s3_bucket: str = "mecanica-fotos"
    s3_region: str = "us-east-1"
    s3_public_url: str = "http://localhost:9000/mecanica-fotos"

    # Reconocimiento de placas
    plate_model_path: str = "models/placas-ecuador.pt"
    plate_country_format: str = "EC"  # ABC-1234 / AB-1234

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
