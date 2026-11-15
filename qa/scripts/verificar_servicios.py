#!/usr/bin/env python3
"""Verificación HTTP NO destructiva (backend + frontend reales en localhost)."""
import os
import sys
from urllib.request import urlopen
from urllib.error import HTTPError, URLError

api = os.environ.get('ASIS_QA_API_URL', 'http://127.0.0.1:8000').rstrip('/')
ui = os.environ.get('ASIS_QA_UI_URL', 'http://127.0.0.1:5173').rstrip('/')
checks = [(api + '/', 200), (api + '/openapi.json', 200),
          (api + '/tickets/', 401), (ui + '/', 200)]

errores = []
for url, esperado in checks:
    try:
        with urlopen(url, timeout=10) as r:
            actual = r.status
    except HTTPError as e:
        actual = e.code
    except URLError as e:
        errores.append(f'FALLO {url}: {e.reason}')
        continue
    print(f'{"OK" if actual == esperado else "FALLO"}: {url} -> {actual} (esperado {esperado})')
    if actual != esperado:
        errores.append(f'{url}: {actual} != {esperado}')

if errores:
    sys.exit('\n'.join(errores))
print('Correcto: servicios disponibles y rutas privadas requieren token.')
