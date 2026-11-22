# Comandos rápidos - Linux (Pop!_OS)

En la carpeta raíz de ASIS, después de haber instalado el QA Kit ampliado:

```bash
sudo docker compose exec -T backend python -m pytest -c pytest.ini tests/security -v

python3 qa/security/auditoria_estatica.py --proyecto . --salida qa-reportes/auditoria-seguridad.json
python3 qa/security/cabeceras_http.py

# Pruebas live locales y opt-in:
sudo docker compose exec -T -e ASIS_SEC_BASE_URL=http://127.0.0.1:8000 -e ASIS_SEC_ALLOW_LOCAL=YES backend python -m pytest -c pytest.ini tests/security/test_sqli_live_local.py -v

# FrontEnd:
cd FrontEnd
npx playwright test e2e/seguridad_asis.spec.js --config playwright.config.js
```

Para usar Bandit y pip-audit, instálalos en un entorno virtual de análisis, no es necesario modificar Docker:

```bash
python3 -m venv .venv-seguridad
source .venv-seguridad/bin/activate
pip install bandit pip-audit
bandit -r Backend -x Backend/tests -f txt
pip-audit -r Backend/requirements.txt
cd FrontEnd && npm audit --omit=dev
```
