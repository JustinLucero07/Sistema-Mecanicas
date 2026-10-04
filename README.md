# MecánicaOS — Sistema Integral de Gestión para Talleres Mecánicos (SaaS)

Plataforma SaaS profesional, moderna y escalable para la gestión operativa y financiera de talleres mecánicos y centros de servicio automotriz.

---

## 🚀 Características Principales (Fase 1 MVP)

- **Arquitectura SaaS Multi-Tenant Nativa**: Aislamiento estricto de datos por organización (`organization_id`) y soporte para múltiples sucursales (`sucursales`).
- **Ficha Clínica del Vehículo & Línea de Tiempo (Timeline)**: Registro inmutable de intervenciones mecánicas, kilometraje, diagnósticos, repuestos reemplazados, mecánicos asignados y costos.
- **Identificación por placa**: la app envía la foto al servidor, que detecta la placa (YOLO) y la lee (OCR). La placa leída siempre se muestra para confirmarla o corregirla antes de buscar. **Pendiente:** el modelo YOLO aún no está entrenado ni instalado (`PLATE_MODEL_PATH`); hasta entonces la lectura por foto responde 503 y la placa se escribe a mano. No hay reconocimiento en el teléfono.
- **Órdenes de Trabajo (Workflow)**: Estados de reparación (Recepción, Diagnóstico, Esperando aprobación, Esperando repuestos, En reparación, Control de calidad, Listo para entregar, Entregado, Cancelado), desglose de mano de obra y repuestos, y control de saldos. La firma digital tiene campo en la base de datos pero aún no tiene pantalla.
- **Recepción 360° & Checklist Visual**: Nivel de combustible, accesorios (gato, herramientas, llanta de emergencia) y notas de daños visibles.
- **Inventario y Kardex Automatizado**: Repuestos con SKU, código de barras, stock mínimo, precio y deducción automática de existencias al utilizarse en órdenes de trabajo.
- **Finanzas y Caja Diaria**: Ingresos, abonos parciales, egresos por categorías, cuadre de caja diaria y balances de rentabilidad mensual.
- **Apps Web y Móvil**:
  - **Web PWA (Next.js 16 + React 19 + Tailwind CSS)**: Dashboard administrativo para dueños, gerentes y recepción.
  - **Móvil (Flutter 3.44 + Dart 3.12)**: App táctil para mecánicos de patio con botones grandes y cámara.

---

## 🔒 Seguridad y datos personales

- Contraseñas con bcrypt; política mínima (10 caracteres, letras y números); bloqueo temporal tras 5 intentos fallidos.
- Cambiar la contraseña o desactivar a un usuario cierra todas sus sesiones.
- Aislamiento entre talleres verificado en **cada escritura** de la base de datos, no solo en cada endpoint.
- Bitácora de auditoría automática (pantalla **Actividad**): quién creó, cambió o eliminó cada dato, cuándo y desde qué IP.
- Fotos en almacenamiento privado con enlaces firmados que vencen; se validan y se les quita la ubicación GPS.
- Términos y política de privacidad (LOPDP Ecuador) con aceptación obligatoria y versionada; exportación y anonimización de datos de clientes.
- La API no arranca en producción con claves de ejemplo.

Guía completa de despliegue, respaldos y lista antes de vender: [docs/PRODUCCION.md](docs/PRODUCCION.md).

---

## 📂 Estructura del Proyecto

```
Sistema-Mecanicas/
├── backend/            # API REST Modular (FastAPI + SQLAlchemy 2.0 + Alembic)
│   ├── alembic/        # Migraciones de base de datos PostgreSQL
│   ├── app/
│   │   ├── core/       # Seguridad JWT multi-tenant, dependencias y RBAC
│   │   ├── models/     # 16 entidades de base de datos multi-tenant
│   │   ├── routers/    # Endpoints v1 (auth, clientes, vehiculos, ordenes, inventario, financiero, reportes)
│   │   ├── schemas/    # Schemas de validación Pydantic v2
│   │   └── services/   # Lógica desacoplada (almacenamiento S3/MinIO, visión OCR)
│   ├── tests/          # Suite de pruebas automatizadas con pytest
│   └── seed.py         # Inicializador de tenant, roles, sucursales y demo
├── web/                # Aplicación Web Administrativa (Next.js 16 PWA)
│   └── src/
│       ├── app/        # App Router (Dashboard, Clientes, Vehículos, Timeline, Finanzas)
│       └── lib/        # API Client, Auth Context, Types
├── mobile/             # Aplicación Móvil para Mecánicos (Flutter)
│   └── lib/            # Escaneo de placa, Ficha de vehículo, Mis Trabajos
└── docker-compose.yml  # Servicios de base de datos (PostgreSQL 16) y almacenamiento S3 (MinIO)
```

---

## 🛠️ Puesta en Marcha Local

### 1. Iniciar Infraestructura (PostgreSQL + MinIO)

```bash
docker compose up -d db minio
```
- PostgreSQL corre en el puerto `5435` (mapeado a `5432` interno).
- MinIO corre en `http://localhost:9000` (Consola: `http://localhost:9001`, usuario `mecanica` / `mecanica123`).

### 2. Backend (FastAPI)

```bash
cd backend
# Requiere Python 3.12 (con 3.14 no compilan las dependencias).
# Si el sistema no lo trae: uv venv --python 3.12 .venv
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt

# Ejecutar migraciones de base de datos
.venv/bin/alembic upgrade head

# Poblar con organización, sucursal, repuestos y vehículo de prueba
.venv/bin/python seed.py

# Ejecutar servidor de desarrollo
.venv/bin/uvicorn app.main:app --reload --port 8001
```

#### Ejecutar Pruebas Automatizadas
```bash
cd backend
.venv/bin/pytest -q          # API, seguridad y esquema de base de datos
```

### 3. Frontend Web (Next.js)

```bash
cd web
npm install
npm run dev   # Disponible en http://localhost:3000
```

### 4. App Móvil (Flutter)

```bash
cd mobile
flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:8001   # Emulador Android
# O en dispositivo físico: --dart-define=API_URL=http://TU_IP_LOCAL:8001
```

---

## 🔑 Credenciales de Prueba (solo desarrollo)

| Rol | Correo | Contraseña | Organización |
| :--- | :--- | :--- | :--- |
| **Administrador / Dueño** | `admin@taller.com` | `admin123` | Taller Mecánico Central |
| **Mecánico Jefe** | `carlos@taller.com` | `mecanico123` | Taller Mecánico Central |
| **Cajera / Recepción** | `caja@taller.com` | `caja123` | Taller Mecánico Central |

- **Vehículo de Prueba para Escaneo**: Placa **`ABC-1234`** (Toyota Corolla 2018 gris, con orden en reparación y checklist registrado).
