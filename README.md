# Sistema Mecánica

Sistema de gestión para taller mecánico: vehículos, historial de mantenimiento,
reconocimiento de placas (YOLO + OCR) y control financiero completo
(ingresos, egresos, caja diaria, cuentas por cobrar/pagar, reportes).

## Estructura

```
backend/   API (FastAPI + PostgreSQL) — la única fuente de verdad, la consumen web y móvil
web/       App web PWA (Next.js) — para el dueño/administración
mobile/    App móvil (Flutter) — para los mecánicos en el taller
```

## Backend

```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # y ajusta DATABASE_URL/S3_* si es necesario

# con la base de datos levantada (ver docker-compose.yml en la raíz):
alembic upgrade head
python seed.py          # crea admin@taller.com / admin123

uvicorn app.main:app --reload
```

Reconocimiento de placas (YOLO + OCR): son dependencias pesadas, se instalan
aparte con `pip install -r requirements-ml.txt`. Falta entrenar/descargar un
modelo YOLO de detección de placas y apuntar `PLATE_MODEL_PATH` a él — sin
eso, el endpoint `/api/vehiculos/escanear-placa` responde 503 con instrucciones.

## Infraestructura local (Postgres + MinIO)

```bash
docker compose up -d db minio
```

## Web

```bash
cd web
npm install
npm run dev   # http://localhost:3000
```

## Móvil (Flutter)

```bash
cd mobile
flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:8000   # emulador Android
```

En un dispositivo físico, cambia `API_URL` por la IP de tu backend en la red local
(o la URL de la VPS en producción).

## Despliegue en VPS

- `docker-compose.yml` levanta Postgres, MinIO y la API. Para producción, usa
  `backend/Dockerfile.ml` en vez de `Dockerfile` para incluir YOLO/OCR, y pon
  un reverse proxy (Caddy/Nginx) delante con HTTPS.
- La web (`web/`) se compila con `npm run build` y se sirve como cualquier
  app Next.js (Vercel, o `next start` detrás del mismo proxy).
- La app móvil se compila con `flutter build apk` / `flutter build ios`
  apuntando `API_URL` al dominio de la VPS.
