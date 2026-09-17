"""Crea la organización inicial, sucursal, roles y datos de prueba del SaaS.

Uso: python seed.py
"""

from datetime import datetime, timezone
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.core.security import hash_password  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.models.base import (  # noqa: E402
    EstadoInspeccionItem,
    EstadoOrden,
    MotivoMovimientoInventario,
    PrioridadOrden,
    RolUsuario,
    TipoDetalleOrden,
    TipoMovimientoInventario,
)
from app.models.cliente import Cliente  # noqa: E402
from app.models.inspeccion import ChecklistRecepcion, DetalleInspeccion, Inspeccion  # noqa: E402
from app.models.inventario import MovimientoInventario, Proveedor, Repuesto  # noqa: E402
from app.models.orden import DetalleOrden, OrdenTrabajo  # noqa: E402
from app.models.tenant import Organizacion, Sucursal  # noqa: E402
from app.models.usuario import Usuario  # noqa: E402
from app.models.vehiculo import Vehiculo  # noqa: E402

ADMIN_EMAIL = os.getenv("SEED_ADMIN_EMAIL", "admin@taller.com")
ADMIN_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "admin123")


def main() -> None:
    db = SessionLocal()
    try:
        # 1. Organización inicial (Tenant)
        org = db.query(Organizacion).filter(Organizacion.slug == "taller-central").first()
        if not org:
            org = Organizacion(
                nombre="Taller Mecánico Central",
                slug="taller-central",
                ruc_identificacion="1790011223001",
                telefono="0991234567",
                email="contacto@tallercentral.com",
                direccion="Av. 10 de Agosto y Orellana",
                plan="PRO",
            )
            db.add(org)
            db.flush()
            print(f"Organización creada: {org.nombre} (ID: {org.id})")

        # 2. Sucursal matriz
        sucursal = db.query(Sucursal).filter(Sucursal.organizacion_id == org.id).first()
        if not sucursal:
            sucursal = Sucursal(
                organizacion_id=org.id,
                nombre="Sede Matriz Norte",
                codigo="MAT-01",
                telefono="022345678",
                direccion="Av. 10 de Agosto y Orellana",
                es_matriz=True,
            )
            db.add(sucursal)
            db.flush()
            print(f"Sucursal creada: {sucursal.nombre}")

        # 3. Usuarios base
        admin = db.query(Usuario).filter(Usuario.email == ADMIN_EMAIL).first()
        if not admin:
            admin = Usuario(
                organizacion_id=org.id,
                sucursal_id=sucursal.id,
                nombre="Administrador General",
                email=ADMIN_EMAIL,
                rol=RolUsuario.ADMIN,
                cargo="Gerente General",
                password_hash=hash_password(ADMIN_PASSWORD),
            )
            db.add(admin)
            print(f"Usuario admin creado: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        else:
            admin.organizacion_id = org.id
            admin.sucursal_id = sucursal.id

        mecanico = db.query(Usuario).filter(Usuario.email == "carlos@taller.com").first()
        if not mecanico:
            mecanico = Usuario(
                organizacion_id=org.id,
                sucursal_id=sucursal.id,
                nombre="Carlos Rodríguez",
                email="carlos@taller.com",
                rol=RolUsuario.MECANICO,
                cargo="Mecánico Jefe",
                especialidad="Motor y Diagnóstico",
                password_hash=hash_password("mecanico123"),
            )
            db.add(mecanico)
            print("Usuario mecánico creado: carlos@taller.com / mecanico123")

        cajero = db.query(Usuario).filter(Usuario.email == "caja@taller.com").first()
        if not cajero:
            cajero = Usuario(
                organizacion_id=org.id,
                sucursal_id=sucursal.id,
                nombre="María López",
                email="caja@taller.com",
                rol=RolUsuario.CAJERO,
                cargo="Cajera / Recepción",
                password_hash=hash_password("caja123"),
            )
            db.add(cajero)
            print("Usuario cajero creado: caja@taller.com / caja123")

        db.flush()

        # 4. Proveedor de repuestos de prueba
        proveedor = db.query(Proveedor).filter(Proveedor.organizacion_id == org.id).first()
        if not proveedor:
            proveedor = Proveedor(
                organizacion_id=org.id,
                nombre="Distribuidora Automotriz Andina",
                ruc="1798765432001",
                contacto="Roberto Gómez",
                telefono="0987654321",
                email="ventas@andinaauto.com",
            )
            db.add(proveedor)
            db.flush()

        # 5. Catálogo de Repuestos iniciales
        repuestos_base = [
            ("Filtro de Aceite Sintético", "FIL-AC-01", "Filtros", "Mann Filter", 5.50, 12.00, 30, 5),
            ("Pastillas de Freno Delanteras", "FREN-DEL-02", "Frenos", "Bosch", 18.00, 38.00, 15, 3),
            ("Aceite Sintético 5W-30 (Galón)", "LUB-5W30-01", "Lubricantes", "Mobil 1", 18.50, 35.00, 20, 4),
            ("Bujía de Iridio", "BUJ-IRI-04", "Encendido", "NGK", 6.00, 14.00, 40, 8),
            ("Líquido de Frenos DOT 4", "LIQ-DOT4-01", "Fluidos", "Prestone", 4.00, 9.50, 25, 5),
        ]
        repuestos_creados = []
        for nombre, cod, cat, marca, costo, venta, stock, min_st in repuestos_base:
            rep = db.query(Repuesto).filter(Repuesto.codigo == cod, Repuesto.organizacion_id == org.id).first()
            if not rep:
                rep = Repuesto(
                    organizacion_id=org.id,
                    nombre=nombre,
                    codigo=cod,
                    sku=f"SKU-{cod}",
                    categoria=cat,
                    marca=marca,
                    costo_compra=costo,
                    precio_venta=venta,
                    stock_actual=stock,
                    stock_minimo=min_st,
                    proveedor_id=proveedor.id,
                )
                db.add(rep)
                db.flush()
                repuestos_creados.append(rep)

        # 6. Cliente y Vehículos de prueba
        cliente = db.query(Cliente).filter(Cliente.cedula_ruc == "1712345678", Cliente.organizacion_id == org.id).first()
        if not cliente:
            cliente = Cliente(
                organizacion_id=org.id,
                nombre="Juan",
                apellidos="Pérez Morales",
                cedula_ruc="1712345678",
                telefono="0998877665",
                whatsapp="0998877665",
                email="juan.perez@ejemplo.com",
                ciudad="Quito",
                direccion="Sector La Floresta",
                notas="Cliente preferencial, flota personal.",
            )
            db.add(cliente)
            db.flush()
            print(f"Cliente de prueba creado: {cliente.nombre_completo}")

        # Vehículo principal (ABC-1234)
        vehiculo = db.query(Vehiculo).filter(Vehiculo.placa == "ABC-1234", Vehiculo.organizacion_id == org.id).first()
        if not vehiculo:
            vehiculo = Vehiculo(
                organizacion_id=org.id,
                cliente_id=cliente.id,
                placa="ABC-1234",
                vin_chasis="935AB28J5K7001928",
                marca="Toyota",
                modelo="Corolla",
                anio=2018,
                color="Gris Plata",
                tipo="sedan",
                combustible="gasolina",
                cilindraje="1.8L",
                transmision="automatica",
                kilometraje_actual=120500,
                kilometraje_anterior=115900,
                proximo_mantenimiento_km=125500,
                estado="en_taller",
            )
            db.add(vehiculo)
            db.flush()
            print(f"Vehículo creado: {vehiculo.marca} {vehiculo.modelo} - Placa: {vehiculo.placa}")

        # 7. Crear una orden histórica terminada y una orden activa actual
        orden_activa = db.query(OrdenTrabajo).filter(OrdenTrabajo.vehiculo_id == vehiculo.id).first()
        if not orden_activa:
            orden_activa = OrdenTrabajo(
                organizacion_id=org.id,
                sucursal_id=sucursal.id,
                vehiculo_id=vehiculo.id,
                cliente_id=cliente.id,
                mecanico_id=mecanico.id if mecanico else None,
                numero_orden="OT-2026-0001",
                fecha_ingreso=datetime.now(timezone.utc),
                kilometraje_ingreso=120500,
                motivo_ingreso="Mantenimiento preventivo 120.000 km y revisión de frenos",
                trabajos_solicitados="Cambio de aceite, filtro de aire y revisión de pastillas",
                diagnostico="Filtro saturado. Pastillas delanteras con 20% de vida útil restante.",
                estado=EstadoOrden.EN_REPARACION,
                prioridad=PrioridadOrden.NORMAL,
                subtotal=73.00,
                total=73.00,
                monto_pagado=30.00,
            )
            db.add(orden_activa)
            db.flush()

            # Checklist de recepción
            checklist = ChecklistRecepcion(
                orden_id=orden_activa.id,
                nivel_combustible=65,
                radio=True,
                herramientas=True,
                gato_palanca=True,
                llanta_emergencia=True,
                observaciones_recepcion="Vehículo ingresa con pequeño rayón en guardafangos delantero derecho.",
            )
            db.add(checklist)

            # Ítems de la orden
            item1 = DetalleOrden(
                orden_id=orden_activa.id,
                tipo=TipoDetalleOrden.MANO_OBRA,
                descripcion="Mano de obra cambio de fluidos y chequeo 360",
                cantidad=1,
                precio_unitario=25.00,
                subtotal=25.00,
            )
            item2 = DetalleOrden(
                orden_id=orden_activa.id,
                tipo=TipoDetalleOrden.REPUESTO,
                descripcion="Filtro de Aceite Sintético",
                cantidad=1,
                precio_unitario=12.00,
                subtotal=12.00,
                repuesto_id=repuestos_creados[0].id if repuestos_creados else None,
            )
            item3 = DetalleOrden(
                orden_id=orden_activa.id,
                tipo=TipoDetalleOrden.REPUESTO,
                descripcion="Aceite Sintético 5W-30 (Galón)",
                cantidad=1,
                precio_unitario=36.00,
                subtotal=36.00,
                repuesto_id=repuestos_creados[2].id if len(repuestos_creados) > 2 else None,
            )
            db.add_all([item1, item2, item3])

            # Inspección multipunto
            inspeccion = Inspeccion(
                orden_id=orden_activa.id,
                inspector_id=mecanico.id if mecanico else None,
                observaciones="Condición general buena. Sistema de frenos requiere reemplazo de pastillas en 3.000 km.",
            )
            db.add(inspeccion)
            db.flush()

            det1 = DetalleInspeccion(
                inspeccion_id=inspeccion.id,
                sistema="Frenos",
                estado=EstadoInspeccionItem.REVISAR,
                observacion="Pastillas delanteras desgastadas al 80%",
            )
            det2 = DetalleInspeccion(
                inspeccion_id=inspeccion.id,
                sistema="Motor",
                estado=EstadoInspeccionItem.BUENO,
                observacion="Sin fugas de aceite visibles",
            )
            det3 = DetalleInspeccion(
                inspeccion_id=inspeccion.id,
                sistema="Suspensión",
                estado=EstadoInspeccionItem.BUENO,
                observacion="Bujes y amortiguadores en buen estado",
            )
            db.add_all([det1, det2, det3])

            print(f"Orden de trabajo de prueba creada: {orden_activa.numero_orden}")

        db.commit()
        print("\n=== BASE DE DATOS INICIALIZADA EXITOSAMENTE CON DATOS SAAS DE PRUEBA ===")
        print(f"Login Web / Móvil:")
        print(f"  Admin:    {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        print(f"  Mecánico: carlos@taller.com / mecanico123")
        print(f"  Cajero:   caja@taller.com / caja123")
        print(f"Vehículo listo para escanear placa: ABC-1234 (Toyota Corolla 2018)")
    finally:
        db.close()


if __name__ == "__main__":
    main()
