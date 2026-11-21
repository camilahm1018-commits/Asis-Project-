#!/usr/bin/env bash
# Uso: bash qa/scripts/probar_backend.sh (desde la raíz del proyecto).
set -euo pipefail
sudo docker compose exec -T backend python -m pip install -q -r tests/requirements-test.txt
sudo docker compose exec -T backend python -m pytest -c pytest.ini tests -m 'not performance' \
  --cov=seguridad --cov=servicios.acceso_tickets --cov=enrutadores.ticket \
  --cov-report=term-missing
