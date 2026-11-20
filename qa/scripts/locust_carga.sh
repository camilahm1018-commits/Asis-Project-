#!/usr/bin/env bash
# Requiere locust instalado en el Python del sistema/venv.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
mkdir -p qa-reportes/locust
locust -f qa/locust/mixto_locust.py,qa/locust/umbrales.py \
  --headless --users 8 --spawn-rate 2 --run-time 45s \
  --csv qa-reportes/locust/carga --html qa-reportes/locust/carga.html
