import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_auth_login_admin():
    res = client.post(
        "/api/auth/login",
        json={"email": "admin@taller.com", "password": "admin123"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["rol"] == "admin"
    assert data["organizacion_id"] is not None


def test_auth_login_mecanico():
    res = client.post(
        "/api/auth/login",
        json={"email": "carlos@taller.com", "password": "mecanico123"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["rol"] == "mecanico"
    assert data["nombre"] == "Carlos Rodríguez"


def test_buscar_vehiculo_por_placa():
    # Login as admin
    login_res = client.post(
        "/api/auth/login",
        json={"email": "admin@taller.com", "password": "admin123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Búsqueda con guion
    res = client.get("/api/vehiculos/placa/ABC-1234", headers=headers)
    assert res.status_code == 200
    vehiculo = res.json()
    assert vehiculo["placa"] == "ABC-1234"
    assert vehiculo["marca"] == "Toyota"
    assert vehiculo["modelo"] == "Corolla"

    # Búsqueda sin guion (normalización tolerante)
    res_raw = client.get("/api/vehiculos/placa/ABC1234", headers=headers)
    assert res_raw.status_code == 200
    assert res_raw.json()["placa"] == "ABC-1234"


def test_timeline_vehiculo():
    login_res = client.post(
        "/api/auth/login",
        json={"email": "admin@taller.com", "password": "admin123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    vehiculo_res = client.get("/api/vehiculos/placa/ABC-1234", headers=headers)
    vehiculo_id = vehiculo_res.json()["id"]

    res = client.get(f"/api/vehiculos/{vehiculo_id}/timeline", headers=headers)
    assert res.status_code == 200
    timeline = res.json()
    assert len(timeline) >= 1
    evento = timeline[0]
    assert "OT-" in evento["numero_orden"]
    assert evento["kilometraje"] is not None
    assert len(evento["repuestos_utilizados"]) >= 1


def test_flujo_orden_trabajo_y_pago():
    login_res = client.post(
        "/api/auth/login",
        json={"email": "admin@taller.com", "password": "admin123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Obtener vehículo y repuestos
    vehiculo = client.get("/api/vehiculos/placa/ABC-1234", headers=headers).json()
    repuestos = client.get("/api/inventario/repuestos", headers=headers).json()
    repuesto_test = repuestos[0]
    stock_inicial = repuesto_test["stock_actual"]

    # 2. Crear nueva orden de trabajo con checklist de recepción
    nueva_orden = {
        "vehiculo_id": vehiculo["id"],
        "motivo_ingreso": "Revisión de 130.000 km y cambio de aceite",
        "kilometraje_ingreso": 130000,
        "detalles": [
            {
                "tipo": "mano_obra",
                "descripcion": "Servicio de afinamiento de motor",
                "cantidad": 1,
                "precio_unitario": 40.0,
            },
            {
                "tipo": "repuesto",
                "descripcion": repuesto_test["nombre"],
                "cantidad": 2,
                "precio_unitario": repuesto_test["precio_venta"],
                "repuesto_id": repuesto_test["id"],
            },
        ],
        "checklist": {
            "nivel_combustible": 75,
            "radio": True,
            "herramientas": True,
            "gato_palanca": True,
            "llanta_emergencia": True,
            "observaciones_recepcion": "Sin daños exteriores",
        },
    }

    res_crear = client.post("/api/ordenes", json=nueva_orden, headers=headers)
    assert res_crear.status_code == 201
    orden_creada = res_crear.json()
    orden_id = orden_creada["id"]
    assert orden_creada["subtotal"] > 40.0
    assert orden_creada["checklist_recepcion"] is not None

    # 3. Verificar que el inventario se descontó automáticamente
    repuestos_despues = client.get("/api/inventario/repuestos", headers=headers).json()
    repuesto_actualizado = next(r for r in repuestos_despues if r["id"] == repuesto_test["id"])
    assert repuesto_actualizado["stock_actual"] == stock_inicial - 2

    # 4. Registrar pago/abono
    res_pago = client.post(
        f"/api/ordenes/{orden_id}/pagar",
        json={
            "monto": 30.0,
            "metodo_pago": "transferencia",
            "numero_referencia": "TRF-987654",
        },
        headers=headers,
    )
    assert res_pago.status_code == 200
    orden_pagada = res_pago.json()
    assert orden_pagada["monto_pagado"] == 30.0
    assert orden_pagada["saldo_pendiente"] == round(orden_creada["total"] - 30.0, 2)


def test_dashboard_reportes():
    login_res = client.post(
        "/api/auth/login",
        json={"email": "admin@taller.com", "password": "admin123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/reportes/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "resumen_mes_actual" in data
    assert "cuentas_por_cobrar_total" in data
    assert "repuestos_bajo_stock" in data
