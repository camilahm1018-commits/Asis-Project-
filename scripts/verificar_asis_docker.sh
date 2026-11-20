#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Ejecutar como: sudo bash scripts/verificar_asis_docker.sh
: "${DOCKER_COMPOSE:=docker compose}"
$DOCKER_COMPOSE config -q
$DOCKER_COMPOSE ps
$DOCKER_COMPOSE exec -T backend python -m compileall -q enrutadores servicios Modelos
$DOCKER_COMPOSE exec -T db psql -U postgres -d asisdb -v ON_ERROR_STOP=1 -c \
  "SELECT rolname FROM pg_roles WHERE rolname LIKE 'asis_app_%' ORDER BY rolname;"
$DOCKER_COMPOSE exec -T db psql -U postgres -d asisdb -v ON_ERROR_STOP=1 -c \
  "SELECT has_column_privilege('asis_app_tecnico','public.usuarios','contrasena_u','SELECT') AS puede_leer_hash, has_table_privilege('asis_app_tecnico','public.tickets','DELETE') AS puede_eliminar_ticket;"
$DOCKER_COMPOSE exec -T backend python -c \
  "from sqlalchemy import text; from conexion_db import motor_auth, motor_admin, motor_tecnico, motor_instructor, motor_mesa, motor_cuentadante; motores=[motor_auth,motor_admin,motor_tecnico,motor_instructor,motor_mesa,motor_cuentadante]; [print(m.connect().execute(text('SELECT current_user')).scalar()) for m in motores]"
code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/tickets/)
if [ "$code" != "401" ]; then
  echo "ERROR: /tickets/ sin token devolvió HTTP $code (se esperaba 401)" >&2
  exit 1
fi
curl -fsS http://localhost:8000/ >/dev/null
printf 'OK: estructura de contenedores, bases, motores, y rechazo 401 sin token.\n'
printf 'PENDIENTE: pruebas funcionales con JWT de cada rol y navegador React.\n'
