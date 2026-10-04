#!/usr/bin/env bash
# Ejecuta respaldar.sh todos los días a la hora HORA_RESPALDO (zona de Ecuador).
set -euo pipefail
HORA="${HORA_RESPALDO:-03}"
echo "Respaldos programados a las ${HORA}:00 (${TZ})"
while true; do
  ahora=$(date +%s)
  objetivo=$(date -d "$(date +%Y-%m-%d) ${HORA}:00:00" +%s 2>/dev/null || date -D "%Y-%m-%d %H:%M:%S" -d "$(date +%Y-%m-%d) ${HORA}:00:00" +%s)
  [ "$objetivo" -le "$ahora" ] && objetivo=$((objetivo + 86400))
  sleep $((objetivo - ahora))
  respaldar.sh || echo "ERROR: el respaldo falló $(date)" >&2
done
