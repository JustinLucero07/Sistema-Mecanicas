"""Da de alta un taller nuevo (cliente del SaaS) con su administrador.

Uso:
    python crear_taller.py --nombre "Taller López" --ruc 1790011223001 \
        --admin-nombre "Pedro López" --admin-email pedro@tallerlopez.com [--plan BASIC]

La contraseña del administrador se pide por teclado (no queda en el
historial de la terminal) y debe cumplir la política de contraseñas.
"""

import argparse
import getpass
import os
import re
import sys
import unicodedata

sys.path.insert(0, os.path.dirname(__file__))

from app.core.security import hash_password, validar_contrasena  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.models.base import RolUsuario  # noqa: E402
from app.models.tenant import Organizacion, Sucursal  # noqa: E402
from app.models.usuario import Usuario  # noqa: E402

PLANES = ("FREE", "BASIC", "PRO", "ENTERPRISE")


def slug(texto: str) -> str:
    sin_tildes = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", sin_tildes.lower()).strip("-")


def main() -> None:
    parser = argparse.ArgumentParser(description="Alta de un taller nuevo")
    parser.add_argument("--nombre", required=True)
    parser.add_argument("--ruc")
    parser.add_argument("--telefono")
    parser.add_argument("--direccion")
    parser.add_argument("--plan", default="BASIC", choices=PLANES)
    parser.add_argument("--admin-nombre", required=True)
    parser.add_argument("--admin-email", required=True)
    args = parser.parse_args()

    email = args.admin_email.strip().lower()
    password = os.environ.get("ADMIN_PASSWORD") or getpass.getpass("Contraseña del administrador: ")
    try:
        validar_contrasena(password)
    except ValueError as exc:
        sys.exit(f"Contraseña rechazada: {exc}")

    with SessionLocal() as db:
        if db.query(Usuario).filter(Usuario.email == email).first():
            sys.exit(f"Ya existe un usuario con el correo {email}")
        base = slug(args.nombre) or "taller"
        identificador, n = base, 2
        while db.query(Organizacion).filter(Organizacion.slug == identificador).first():
            identificador, n = f"{base}-{n}", n + 1

        org = Organizacion(
            nombre=args.nombre, slug=identificador, ruc_identificacion=args.ruc,
            telefono=args.telefono, direccion=args.direccion, plan=args.plan,
        )
        db.add(org)
        db.flush()
        sucursal = Sucursal(organizacion_id=org.id, nombre="Matriz", direccion=args.direccion, es_matriz=True)
        db.add(sucursal)
        db.flush()
        db.add(Usuario(
            organizacion_id=org.id, sucursal_id=sucursal.id, nombre=args.admin_nombre, email=email,
            rol=RolUsuario.ADMIN_TALLER, password_hash=hash_password(password),
        ))
        db.commit()
        print(f"Taller creado: {org.nombre} (id {org.id}, plan {org.plan}). Administrador: {email}")


if __name__ == "__main__":
    main()
