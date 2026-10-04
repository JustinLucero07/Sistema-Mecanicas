#!/usr/bin/env bash
# Restaura la base de datos desde un respaldo.
#   docker compose -f docker-compose.prod.yml exec respaldos restaurar.sh /respaldos/diario/mecanica_AAAA-MM-DD_HHMM.dump
# Detén la API antes:  docker compose -f docker-compose.prod.yml stop api
set -euo pipefail
archivo="${1:?Indica el archivo .dump a restaurar}"
pg_restore --list "$archivo" >/dev/null
read -r -p "Esto reemplaza TODOS los datos actuales por los de $archivo. Escribe RESTAURAR para continuar: " ok
[ "$ok" = "RESTAURAR" ] || { echo "Cancelado"; exit 1; }
pg_restore --clean --if-exists --no-owner --dbname="$PGDATABASE" "$archivo"
echo "Restauración completa. Vuelve a iniciar la API: docker compose -f docker-compose.prod.yml start api"
# Las fotos se restauran con: rclone sync /respaldos/fotos minio:mecanica-fotos
