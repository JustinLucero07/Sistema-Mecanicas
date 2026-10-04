#!/usr/bin/env bash
# Respaldo de la base de datos y de las fotos.
#   Diarios: 7 · Semanales (domingo): 4 · Mensuales (día 1): 6
# Si OFFSITE_REMOTE está configurado, todo se copia también fuera del servidor.
set -euo pipefail
# Los respaldos contienen datos personales: solo los lee el dueño.
umask 077
DESTINO=/respaldos
fecha=$(date +%Y-%m-%d_%H%M)
mkdir -p "$DESTINO"/{diario,semanal,mensual,fotos}

archivo="$DESTINO/diario/mecanica_${fecha}.dump"
pg_dump --format=custom --compress=9 --file="$archivo.tmp"
# Un respaldo que no se puede leer no es un respaldo: se verifica antes de guardarlo.
pg_restore --list "$archivo.tmp" >/dev/null
mv "$archivo.tmp" "$archivo"
echo "Base de datos respaldada: $archivo ($(du -h "$archivo" | cut -f1))"

if [ "$(date +%u)" = "7" ]; then cp "$archivo" "$DESTINO/semanal/"; fi
if [ "$(date +%d)" = "01" ]; then cp "$archivo" "$DESTINO/mensual/"; fi

# Conserva los N más recientes de una carpeta (puede estar vacía).
rotar() {
  local carpeta=$1 conservar=$2 archivos
  shopt -s nullglob
  archivos=("$carpeta"/*.dump)
  shopt -u nullglob
  if [ "${#archivos[@]}" -gt "$conservar" ]; then
    ls -1t "${archivos[@]}" | tail -n +$((conservar + 1)) | xargs -r rm -f --
  fi
}
rotar "$DESTINO/diario" 7
rotar "$DESTINO/semanal" 4
rotar "$DESTINO/mensual" 6

# Fotos: copia incremental del bucket (no existe hasta subir la primera foto).
if rclone lsd minio: 2>/dev/null | grep -q " mecanica-fotos$"; then
  rclone sync minio:mecanica-fotos "$DESTINO/fotos" --quiet
  echo "Fotos sincronizadas"
else
  echo "Aún no hay fotos que respaldar"
fi

if [ -n "${OFFSITE_REMOTE:-}" ]; then
  rclone sync "$DESTINO" "$OFFSITE_REMOTE" --quiet
  echo "Copia fuera del servidor: $OFFSITE_REMOTE"
else
  echo "AVISO: OFFSITE_REMOTE vacío; los respaldos solo están en este servidor."
fi
