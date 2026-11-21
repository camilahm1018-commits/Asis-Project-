#!/usr/bin/env bash
# Ejecutar desde cualquier directorio. Requiere ASIS iniciado con Docker.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
if ! docker compose ps --services >/dev/null 2>&1; then
  echo 'No se puede acceder a Docker. En Pop!_OS prueba: sudo bash qa/scripts/pytest_ampliado.sh' >&2
  exit 1
fi
# Tests montados dentro de /app por docker-compose.yml; no toca SQL real.
docker compose exec -T backend python -m pip install -r tests/requirements-test.txt
mkdir -p qa-reportes
# Se excluyen pruebas contra el servicio real por defecto (live).
docker compose exec -T backend python -m pytest -c pytest.ini tests \
  -m 'not live' -v --junitxml=/app/tests/resultado-pytest.xml \
  --cov=seguridad --cov=servicios.acceso_tickets \
  --cov=enrutadores.ticket --cov=enrutadores.asig_tec \
  --cov-report=term-missing --cov-report=xml:/app/tests/coverage.xml
printf '\nReportes guardados en Backend/tests/resultado-pytest.xml y Backend/tests/coverage.xml\n'
