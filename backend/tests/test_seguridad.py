"""Pruebas de las protecciones de seguridad.

Crean un segundo taller ("intruso") para comprobar que nada cruza de un
taller a otro, y lo eliminan al terminar.
"""

import io
import uuid

import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import delete

from app.core.security import hash_password
from app.database import SessionLocal
from app.main import app
from app.models import Cliente, Organizacion, Usuario, Vehiculo
from app.models.auditoria import AuditLog

client = TestClient(app)
CLAVE = "ClaveSegura2026"


def _login(email: str, password: str) -> dict:
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture(scope="module")
def dos_talleres():
    """Taller A (el del seed) y un taller B con su propio cliente."""
    sufijo = uuid.uuid4().hex[:8]
    with SessionLocal() as db:
        org_b = Organizacion(nombre="Taller Intruso", slug=f"intruso-{sufijo}")
        db.add(org_b)
        db.flush()
        admin_b = Usuario(
            organizacion_id=org_b.id, nombre="Admin B", email=f"admin-b-{sufijo}@test.com",
            rol="admin_taller", password_hash=hash_password(CLAVE),
        )
        cliente_b = Cliente(organizacion_id=org_b.id, nombre="Secreto", apellidos="Del Taller B", cedula_ruc="0999999999")
        db.add_all([admin_b, cliente_b])
        db.commit()
        datos = {"org_b": org_b.id, "admin_b": admin_b.email, "cliente_b": cliente_b.id}

    yield datos

    with SessionLocal() as db:
        db.execute(delete(AuditLog).where(AuditLog.organizacion_id == datos["org_b"]))
        db.execute(delete(Vehiculo).where(Vehiculo.organizacion_id == datos["org_b"]))
        db.execute(delete(Cliente).where(Cliente.organizacion_id == datos["org_b"]))
        db.execute(delete(Usuario).where(Usuario.organizacion_id == datos["org_b"]))
        db.execute(delete(Organizacion).where(Organizacion.id == datos["org_b"]))
        db.commit()


@pytest.fixture(scope="module")
def admin_a():
    return _login("admin@taller.com", "admin123")


def test_no_se_puede_usar_un_cliente_de_otro_taller(admin_a, dos_talleres):
    res = client.post(
        "/api/vehiculos",
        headers=admin_a,
        json={"placa": f"ZZZ-{uuid.uuid4().int % 10000:04d}", "cliente_id": dos_talleres["cliente_b"]},
    )
    assert res.status_code == 400
    assert "no pertenece a tu taller" in res.json()["detail"]


def test_un_taller_no_ve_clientes_de_otro(admin_a, dos_talleres):
    res = client.get(f"/api/clientes/{dos_talleres['cliente_b']}", headers=admin_a)
    assert res.status_code == 404
    nombres = [c["nombre"] for c in client.get("/api/clientes", headers=admin_a).json()]
    assert "Secreto" not in nombres


def test_admin_de_taller_no_puede_crear_superadmin(dos_talleres):
    admin_b = _login(dos_talleres["admin_b"], CLAVE)
    res = client.post(
        "/api/usuarios",
        headers=admin_b,
        json={"nombre": "Escalada", "email": f"esc-{uuid.uuid4().hex[:6]}@test.com", "rol": "superadmin", "password": CLAVE},
    )
    assert res.status_code == 403


def test_politica_de_contrasenas(dos_talleres):
    admin_b = _login(dos_talleres["admin_b"], CLAVE)
    for debil in ["corta1", "soloLetrasLargas", "12345678901234"]:
        res = client.post(
            "/api/usuarios",
            headers=admin_b,
            json={"nombre": "X", "email": f"d-{uuid.uuid4().hex[:6]}@test.com", "rol": "mecanico", "password": debil},
        )
        assert res.status_code == 422, debil


def test_bloqueo_tras_intentos_fallidos(dos_talleres):
    email = dos_talleres["admin_b"]
    for _ in range(5):
        assert client.post("/api/auth/login", json={"email": email, "password": "mala-clave-1"}).status_code == 401
    res = client.post("/api/auth/login", json={"email": email, "password": CLAVE})
    assert res.status_code == 429
    from app.core.security import limitador_login
    limitador_login.exito(f"email:{email}")


def test_cambiar_contrasena_cierra_otras_sesiones(dos_talleres):
    sufijo = uuid.uuid4().hex[:6]
    with SessionLocal() as db:
        u = Usuario(organizacion_id=dos_talleres["org_b"], nombre="Temporal", email=f"t-{sufijo}@test.com",
                    rol="mecanico", password_hash=hash_password(CLAVE))
        db.add(u)
        db.commit()
        email = u.email
    vieja = _login(email, CLAVE)
    res = client.post("/api/auth/cambiar-contrasena", headers=vieja, json={"actual": CLAVE, "nueva": "OtraClave2026x"})
    assert res.status_code == 200
    assert client.get("/api/auth/me", headers=vieja).status_code == 401
    nueva = {"Authorization": f"Bearer {res.json()['access_token']}"}
    assert client.get("/api/auth/me", headers=nueva).status_code == 200


def test_rechaza_archivos_que_no_son_imagenes(admin_a):
    vehiculo_id = client.get("/api/vehiculos", headers=admin_a).json()[0]["id"]
    res = client.post(
        f"/api/vehiculos/{vehiculo_id}/fotos",
        headers=admin_a,
        files={"foto": ("virus.jpg", b"MZ\x90\x00 esto no es una imagen", "image/jpeg")},
        data={"tipo": "frente"},
    )
    assert res.status_code == 400


def test_imagen_se_limpia_de_metadatos():
    from app.services.storage import preparar_imagen

    original = Image.new("RGB", (4000, 3000), "red")
    exif = Image.Exif()
    exif[0x8825] = {2: (0, 18, 0)}  # bloque GPS
    buffer = io.BytesIO()
    original.save(buffer, format="JPEG", exif=exif)
    limpia = Image.open(io.BytesIO(preparar_imagen(buffer.getvalue())))
    assert max(limpia.size) <= 2000
    assert 0x8825 not in limpia.getexif()


def test_los_cambios_quedan_en_auditoria(admin_a):
    cliente = client.post("/api/clientes", headers=admin_a, json={"nombre": "Auditado"}).json()
    client.patch(f"/api/clientes/{cliente['id']}", headers=admin_a, json={"telefono": "0991112233"})
    logs = client.get(f"/api/auditoria?entidad=clientes&entidad_id={cliente['id']}", headers=admin_a).json()
    acciones = [log["accion"] for log in logs]
    assert "crear" in acciones and "actualizar" in acciones
    cambio = next(log for log in logs if log["accion"] == "actualizar")
    assert cambio["cambios"]["telefono"]["despues"] == "0991112233"
    assert cambio["usuario_nombre"]

    anonimo = client.post(f"/api/clientes/{cliente['id']}/anonimizar", headers=admin_a).json()
    assert anonimo["telefono"] is None and anonimo["nombre"].startswith("Cliente anonimizado")


def test_cabeceras_de_seguridad():
    res = client.get("/api/health")
    assert res.headers["X-Content-Type-Options"] == "nosniff"
    assert res.headers["X-Frame-Options"] == "DENY"
