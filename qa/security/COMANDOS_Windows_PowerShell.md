# Comandos rápidos - Windows / PowerShell

En la carpeta raíz de ASIS, después de haber instalado el QA Kit ampliado:

```powershell
# Asegúrate de que los archivos estén en Backend/tests/security y FrontEnd/e2e
# Pruebas aisladas, con SQLite temporal (no usan PostgreSQL):
docker compose exec -T backend python -m pytest -c pytest.ini tests/security -v

# Auditar código sin ejecutar la aplicación:
py -3 qa/security/auditoria_estatica.py --proyecto . --salida qa-reportes/auditoria-seguridad.json

# Revisión HTTP del entorno local:
py -3 qa/security/cabeceras_http.py

# Pruebas live (opt-in; host local solamente) dentro de contenedor:
docker compose exec -T -e ASIS_SEC_BASE_URL=http://127.0.0.1:8000 -e ASIS_SEC_ALLOW_LOCAL=YES backend python -m pytest -c pytest.ini tests/security/test_sqli_live_local.py -v

# FrontEnd con Chromium, después de instalar @playwright/test y los navegadores:
cd FrontEnd
npx playwright test e2e/seguridad_asis.spec.js --config playwright.config.js
```

**Nota:** el Backend debe disponer de pytest/httpx (`python -m pip install -r tests/requirements-test.txt`).
La ruta `127.0.0.1:8000` dentro del contenedor apunta al propio servicio Backend.
No ejecutes pruebas live en un servidor público ni con datos sensibles.
