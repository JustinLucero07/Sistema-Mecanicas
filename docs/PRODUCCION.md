# Puesta en producción de MecánicaOS

Guía para instalar MecánicaOS en un servidor propio (VPS), dar de alta a cada taller que compre el servicio y publicar la app móvil.

## 1. Lo que necesitas

| Qué | Recomendado para empezar |
| --- | --- |
| VPS Linux | 2 vCPU, 4 GB RAM, 80 GB SSD, Ubuntu 24.04 LTS |
| Dominio | Uno propio, por ejemplo `tudominio.com` |
| Respaldo fuera del servidor | Un bucket en Backblaze B2, Wasabi o similar |
| Cuenta de Google Play | Pago único de 25 USD |
| Cuenta de Apple Developer | 99 USD al año (solo si publicas en iPhone) |

## 2. DNS

Crea tres registros tipo **A** que apunten a la IP de la VPS:

- `app.tudominio.com` → la web
- `api.tudominio.com` → la API
- `archivos.tudominio.com` → las fotos

## 3. Instalar en la VPS

```bash
# En la VPS, como un usuario con permisos de Docker
curl -fsSL https://get.docker.com | sh
git clone https://github.com/JustinLucero07/Sistema-Mecanicas.git
cd Sistema-Mecanicas/deploy

cp .env.example .env
cp rclone.conf.example rclone.conf
nano .env          # completa todos los valores (ver abajo)
nano rclone.conf   # destino de los respaldos fuera del servidor

docker compose -f docker-compose.prod.yml up -d --build
```

Para generar cada secreto del `.env` (`SECRET_KEY`, `POSTGRES_PASSWORD`, `MINIO_CLAVE`):

```bash
openssl rand -hex 32
```

La API **se niega a arrancar** si `SECRET_KEY` o las contraseñas son las de ejemplo. Es intencional.

Caddy obtiene los certificados HTTPS solo. Pasados unos segundos, `https://app.tudominio.com` debe mostrar el login.

Abre solo los puertos 22, 80 y 443 en el firewall:

```bash
sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable
```

## 4. Dar de alta un taller (cada cliente nuevo)

```bash
cd Sistema-Mecanicas/deploy
docker compose -f docker-compose.prod.yml exec api python crear_taller.py \
  --nombre "Taller López" --ruc 1790011223001 --plan BASIC \
  --admin-nombre "Pedro López" --admin-email pedro@tallerlopez.com
```

La contraseña se pide por teclado y debe tener al menos 10 caracteres, con letras y números. El administrador del taller entra, acepta los términos y desde **Equipo** crea los usuarios de sus mecánicos y recepcionistas.

`seed.py` (datos y contraseñas de demostración) **no existe en la imagen de producción** y se niega a correr si `ENVIRONMENT=production`.

## 5. App móvil

```bash
cd mobile
# Android: crea tu clave de firma una sola vez y guárdala en un lugar seguro.
keytool -genkey -v -keystore ~/mecanicaos.jks -keyalg RSA -keysize 2048 -validity 10000 -alias mecanicaos
cat > android/key.properties <<EOF
storePassword=...
keyPassword=...
keyAlias=mecanicaos
storeFile=/home/TU_USUARIO/mecanicaos.jks
EOF

flutter build appbundle --release \
  --dart-define=API_URL=https://api.tudominio.com \
  --dart-define=WEB_URL=https://app.tudominio.com
```

Sube `build/app/outputs/bundle/release/app-release.aab` a Google Play Console. Si pierdes la clave `.jks`, no podrás publicar actualizaciones: guarda una copia fuera de la computadora.

En iPhone: `flutter build ipa --release` con los mismos `--dart-define`, desde una Mac con Xcode.

Una versión de publicación sin `API_URL` no arranca, a propósito: así nunca sale una app apuntando a `localhost`.

## 6. Respaldos

El servicio `respaldos` corre todos los días a las 03:00, hora de Ecuador:

- Base de datos: conserva 7 copias diarias, 4 semanales y 6 mensuales. Cada copia se verifica antes de guardarla.
- Fotos: copia incremental del almacenamiento.
- Si configuras `OFFSITE_REMOTE`, todo se copia además fuera del servidor. **Sin esto, si se pierde la VPS se pierde todo.**

Respaldo manual:

```bash
docker compose -f docker-compose.prod.yml exec respaldos respaldar.sh
```

Restaurar (pide escribir `RESTAURAR` para confirmar):

```bash
docker compose -f docker-compose.prod.yml stop api
docker compose -f docker-compose.prod.yml exec respaldos ls /respaldos/diario
docker compose -f docker-compose.prod.yml exec respaldos restaurar.sh /respaldos/diario/mecanica_AAAA-MM-DD_HHMM.dump
docker compose -f docker-compose.prod.yml start api
```

Prueba una restauración al menos una vez al mes. Un respaldo que nunca se restauró no está comprobado.

## 7. Actualizar a una versión nueva

```bash
cd Sistema-Mecanicas && git pull
cd deploy && docker compose -f docker-compose.prod.yml exec respaldos respaldar.sh
docker compose -f docker-compose.prod.yml up -d --build
```

Las migraciones de base de datos se aplican solas al arrancar la API.

## 8. Monitoreo

- `https://api.tudominio.com/api/health` responde `{"status":"ok","database":"ok"}`. Regístralo en un monitor gratuito (UptimeRobot, Uptime Kuma) para recibir un aviso si se cae.
- Logs: `docker compose -f docker-compose.prod.yml logs -f api`
- La pantalla **Actividad** de cada taller muestra quién hizo cada cambio, inicios de sesión e intentos fallidos.

## 9. Lista antes de vender

- [ ] Un abogado revisó los términos y la política de privacidad, completaste los datos de tu empresa en `.env` y pusiste `LEGAL_REVISADO=1`.
- [ ] `OFFSITE_REMOTE` configurado y una restauración de prueba hecha.
- [ ] Monitor de `/api/health` activo.
- [ ] Clave de firma de Android respaldada fuera de la computadora.
- [ ] Facturación de tu propio servicio resuelta (el sistema no cobra la suscripción a los talleres).
- [ ] Si vas a leer placas por foto: modelo YOLO entrenado y `Dockerfile.ml` en lugar de `Dockerfile`.
