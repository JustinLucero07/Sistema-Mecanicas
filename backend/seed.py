"""Crea el usuario administrador inicial si no existe.

Uso: python seed.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.core.security import hash_password  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.models.base import RolUsuario  # noqa: E402
from app.models.usuario import Usuario  # noqa: E402

ADMIN_EMAIL = os.getenv("SEED_ADMIN_EMAIL", "admin@taller.com")
ADMIN_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "admin123")


def main() -> None:
    db = SessionLocal()
    try:
        if db.query(Usuario).filter(Usuario.email == ADMIN_EMAIL).first():
            print(f"El usuario admin ({ADMIN_EMAIL}) ya existe.")
            return

        admin = Usuario(
            nombre="Administrador",
            email=ADMIN_EMAIL,
            rol=RolUsuario.ADMIN,
            password_hash=hash_password(ADMIN_PASSWORD),
        )
        db.add(admin)
        db.commit()
        print(f"Usuario admin creado: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        print("Cambia la contraseña después de tu primer login.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
