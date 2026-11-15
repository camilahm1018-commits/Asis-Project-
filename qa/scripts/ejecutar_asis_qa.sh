#!/usr/bin/env bash
# Menú multiplataforma (Linux): bash qa/scripts/ejecutar_asis_qa.sh <suite>
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
SUITE="${1:-}"
usage() {
  cat <<'HELP'
ASIS QA: unit | integration | regression | performance | security | backend
         security-live | frontend-unit | frontend-e2e | frontend-security | audit | headers
Requiere Docker para suites Backend y Node instalado para FrontEnd.
Las pruebas live requieren una elección explícita; solo localhost.
HELP
}
if [[ -z "$SUITE" || "$SUITE" == 'help' || "$SUITE" == '--help' ]]; then usage; exit 0; fi
# El script acepta que el usuario lo invoque con sudo si usa Docker con sudo.
run_pytest() {
  docker compose exec -T backend python -m pytest -c pytest.ini "$@" -v
}
case "$SUITE" in
  unit|integration|regression|performance)
    run_pytest "tests/$SUITE" ;;
  security)
    run_pytest tests/security -m 'not live' ;;
  backend)
    run_pytest tests -m 'not live' ;;
  security-live)
    echo 'Se enviarán solicitudes HTTP de prueba SOLO a http://127.0.0.1:8000.'
    docker compose exec -T       -e ASIS_SEC_BASE_URL=http://127.0.0.1:8000       -e ASIS_SEC_ALLOW_LOCAL=YES       backend python -m pytest -c pytest.ini tests/security/test_sqli_live_local.py -v ;;
  frontend-unit)
    (cd FrontEnd && npx --no-install vitest run --config vitest.config.js --coverage) ;;
  frontend-e2e)
    (cd FrontEnd && npx --no-install playwright test --config playwright.config.js) ;;
  frontend-security)
    (cd FrontEnd && npx --no-install playwright test e2e/seguridad_asis.spec.js --config playwright.config.js) ;;
  audit)
    mkdir -p qa-reportes
    python3 qa/security/auditoria_estatica.py --proyecto . --salida qa-reportes/auditoria-seguridad.json ;;
  headers)
    python3 qa/security/cabeceras_http.py ;;
  *) usage; echo "Suite desconocida: $SUITE" >&2; exit 2 ;;
esac
