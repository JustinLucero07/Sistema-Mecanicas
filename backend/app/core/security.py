import re
import threading
import time
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.config import get_settings

settings = get_settings()
RONDAS_BCRYPT = 12
# bcrypt solo considera los primeros 72 bytes; la política no permite más.
MAX_BYTES_CONTRASENA = 72

CONTRASENAS_COMUNES = {
    "123456789012", "contraseña123", "password1234", "qwertyuiop12", "admin1234567",
    "taller123456", "mecanica1234", "1234567890ab", "abc123456789", "contrasena123",
}


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(RONDAS_BCRYPT)).decode("ascii")


# Hash de una contraseña que nadie tiene: se verifica cuando el correo no
# existe para que la respuesta tarde lo mismo y no revele qué correos hay.
_HASH_SEÑUELO = hash_password("señuelo-que-nunca-coincide")


def verify_password(plain_password: str, password_hash: str | None) -> bool:
    candidata = plain_password.encode("utf-8")[:MAX_BYTES_CONTRASENA]
    if not password_hash:
        bcrypt.checkpw(candidata, _HASH_SEÑUELO.encode("ascii"))
        return False
    try:
        return bcrypt.checkpw(candidata, password_hash.encode("ascii"))
    except ValueError:
        return False


def validar_contrasena(password: str) -> str:
    """Política mínima: 10 caracteres, letras y números, no una contraseña obvia."""
    if len(password) < 10:
        raise ValueError("La contraseña debe tener al menos 10 caracteres")
    if len(password.encode("utf-8")) > MAX_BYTES_CONTRASENA:
        raise ValueError("La contraseña no puede superar 72 caracteres")
    if not re.search(r"[A-Za-zÁÉÍÓÚáéíóúÑñ]", password) or not re.search(r"\d", password):
        raise ValueError("La contraseña debe combinar letras y números")
    if password.lower() in CONTRASENAS_COMUNES:
        raise ValueError("Esa contraseña es demasiado común")
    return password


def create_access_token(
    subject: str,
    rol: str,
    organizacion_id: int | None = None,
    sucursal_id: int | None = None,
    version: int = 0,
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(subject),
        "rol": rol,
        "org_id": organizacion_id,
        "sucursal_id": sucursal_id,
        "ver": version,
        "exp": expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm], options={"require": ["exp", "sub"]})
    except jwt.PyJWTError:
        return None


class LimitadorLogin:
    """Bloquea temporalmente un correo o una IP tras varios intentos fallidos.

    Vive en memoria: sirve para un solo proceso. Con varias réplicas de la API
    hay que moverlo a Redis.
    """

    def __init__(self) -> None:
        self._fallos: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def _vigentes(self, clave: str, ahora: float) -> list[float]:
        ventana = settings.login_bloqueo_minutos * 60
        intentos = [t for t in self._fallos.get(clave, []) if ahora - t < ventana]
        self._fallos[clave] = intentos
        return intentos

    def segundos_bloqueado(self, *claves: str) -> int:
        ahora = time.monotonic()
        with self._lock:
            peor = 0
            for clave in claves:
                intentos = self._vigentes(clave, ahora)
                if len(intentos) >= settings.login_max_intentos:
                    restante = settings.login_bloqueo_minutos * 60 - (ahora - intentos[0])
                    peor = max(peor, int(restante) + 1)
            return peor

    def fallo(self, *claves: str) -> None:
        ahora = time.monotonic()
        with self._lock:
            for clave in claves:
                self._vigentes(clave, ahora).append(ahora)

    def exito(self, *claves: str) -> None:
        with self._lock:
            for clave in claves:
                self._fallos.pop(clave, None)


limitador_login = LimitadorLogin()
