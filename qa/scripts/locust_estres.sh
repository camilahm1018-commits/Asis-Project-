#!/usr/bin/env bash
# Solo contra entorno QA: la forma de estrés exige confirmación explícita.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
mkdir -p qa-reportes/locust
export ASIS_QA_STRESS_CONFIRM=SI
locust -f qa/locust/mixto_locust.py,qa/locust/stress_shape.py,qa/locust/umbrales.py \
  --headless --csv qa-reportes/locust/estres --html qa-reportes/locust/estres.html
