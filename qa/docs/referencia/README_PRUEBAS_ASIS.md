# Kit de pruebas automatizadas para ASIS

**Versión:** 1.0 — elaborado sobre el último ZIP de ASIS compartido en esta conversación.

Este paquete **solo agrega archivos de pruebas**. No reemplaza `main.py`, `ticket.py`, `App.jsx`, `docker-compose.yml`, scripts SQL ni datos. Si GitHub tiene cambios posteriores, revisa las rutas/contratos que puedan haber cambiado.

## Cobertura que incluye

| Tipo | Backend — Python/FastAPI/PostgreSQL | FrontEnd — React/Vite |
|---|---|---|
| **Unitarias** | Hash bcrypt, JWT, permisos administrativos y filtros de tickets | `ProtectedRoute`, control del login y servicios Axios |
| **Integración** | Routers reales FastAPI + SQLModel + SQLite temporal; HTTP con `TestClient` | React + React Router + servicios simulados; navegación con Playwright contra ASIS iniciado |
| **Regresión** | Rutas críticas, contrato de respuesta, seguridad de usuario, restricciones por rol | Login, errores 401, navegación privada y persistencia del token |
| **Carga** | k6 HTTP de salud y consulta autenticada opcional de tickets | k6 HTTP de HTML y módulo de Vite |
| **Estrés** | k6 con usuarios virtuales crecientes, solo lectura | k6 con usuarios virtuales crecientes, solo lectura |
| **Rendimiento** | Percentil 95 de lecturas FastAPI aisladas; métricas de k6 reales | Playwright `load`, DOMContentLoaded y First Contentful Paint; latencias HTTP k6 |

**Distinción:** k6 mide la entrega HTTP del FrontEnd, **no** renderiza React. Las mediciones de carga y pintura real se hacen con **Playwright + Chromium**. El flujo e2e completo con usuario real se activa opcionalmente.

## 0. Instalar el kit sin reemplazar código

1. Descomprime este ZIP en una carpeta aparte.
2. Desde la **raíz del proyecto ASIS**, copia el contenido de `ASIS_QA_Kit/` **encima de la estructura de carpetas existente**. La copia debe **agregar** `Backend/tests/`, `FrontEnd/src/__tests__/`, `FrontEnd/e2e/`, `FrontEnd/vitest.config.js`, `FrontEnd/playwright.config.js` y `qa/`. Si algún archivo ya existe, revisa antes de sobrescribirlo.
3. En Pop!_OS, para automatizar la copia sin sobreescribir archivos existentes:

```bash
# Estando en la raíz de Asis-Project-; ajusta la ruta del ZIP extraído
rsync -av --ignore-existing /ruta/ASIS_QA_Kit/ ./
```

En Windows, copia esas carpetas con el Explorador de archivos o usa `robocopy` para agregar archivos. **No copies** `.env` ni credenciales desde el kit: no contiene ninguno.

## 1. Levantar ASIS (Pop!_OS o Windows)

```bash
# Pop!_OS (dentro del proyecto)
sudo docker compose up -d --build
sudo docker compose ps
python3 qa/scripts/verificar_servicios.py
```

En Windows (PowerShell):

```powershell
docker compose up -d --build
docker compose ps
python qa/scripts/verificar_servicios.py
```

Se espera: FrontEnd `http://localhost:5173`, Backend `http://localhost:8000`, Swagger `http://localhost:8000/docs`.

## 2. Pruebas unitarias, integración y regresión del Backend (sin tocar PostgreSQL)

La forma más fácil es aprovechar las dependencias ya instaladas en el contenedor Backend:

```bash
# Pop!_OS: desde la raíz del proyecto
sudo docker compose exec -T backend python -m pip install -r tests/requirements-test.txt
sudo docker compose exec -T backend python -m pytest -c pytest.ini tests -m 'not performance' -v
```

Para generar cobertura y probar también el micro-benchmark:

```bash
sudo docker compose exec -T backend python -m pytest -c pytest.ini tests -v \
  --cov=seguridad --cov=servicios.acceso_tickets --cov=enrutadores.ticket \
  --cov-report=term-missing
```

En Windows (PowerShell), omite `sudo` y escribe el comando en una sola línea:

```powershell
docker compose exec -T backend python -m pip install -r tests/requirements-test.txt
docker compose exec -T backend python -m pytest -c pytest.ini tests -v
```

**Seguridad:** estas pruebas construyen una base **SQLite en memoria**, simulan usuarios/perfiles y sobrescriben dependencias solo de una instancia FastAPI de pruebas. No ejecutan el `lifespan` que crea usuarios iniciales y no envían correos reales. Fallos indican un problema real o un contrato desactualizado: no los ocultes.

## 3. Pruebas unitarias, integración de componentes y regresión de React

Ejecuta estas pruebas en el **sistema anfitrión**, con Node.js **20 o 22** recomendado (no dentro de la imagen Node 18 de Vite).

```bash
cd FrontEnd
npm install --save-dev 'vitest@^2.1.9' 'jsdom@^24.1.3' \
 '@testing-library/react@^16.0.0' '@testing-library/jest-dom@^6.0.0' \
 '@testing-library/user-event@^14.0.0' 'axios-mock-adapter@^2.1.0' \
 '@playwright/test@^1.56.0' '@vitest/coverage-v8@^2.1.9'
npx vitest run --config vitest.config.js
# Con cobertura:
npx vitest run --config vitest.config.js --coverage
cd ..
```

En **Windows PowerShell** la instalación en una sola línea:

```powershell
cd FrontEnd
npm install --save-dev 'vitest@^2.1.9' 'jsdom@^24.1.3' '@testing-library/react@^16.0.0' '@testing-library/jest-dom@^6.0.0' '@testing-library/user-event@^14.0.0' 'axios-mock-adapter@^2.1.0' '@playwright/test@^1.56.0' '@vitest/coverage-v8@^2.1.9' 
npx vitest run --config vitest.config.js
cd ..
```

`npm install` actualizará `package.json` y `package-lock.json` para registrar solo dependencias de desarrollo: es esperado. No hay necesidad de tocar componentes de producción.

## 4. Pruebas de regresión, integración y rendimiento en navegador

Con ASIS iniciado, vuelve a `FrontEnd`:

```bash
cd FrontEnd
npx playwright install chromium
npx playwright test --config playwright.config.js
npx playwright show-report ../qa-reportes/playwright
```

En Linux, si Chromium pide librerías: `npx playwright install --with-deps chromium` (requiere permisos para instalar dependencias del sistema).

**Opcional**, probar inicio de sesión completo usando solo una cuenta QA (NO tu administrador real):

```bash
# Bash: input de contraseña sin imprimir en terminal
read -p 'Correo QA: ' ASIS_QA_EMAIL; export ASIS_QA_EMAIL
read -s -p 'Clave QA: ' ASIS_QA_PASSWORD; echo; export ASIS_QA_PASSWORD
cd FrontEnd
npx playwright test --config playwright.config.js -g 'login completo'
```

En PowerShell: `$env:ASIS_QA_EMAIL='qa@example.test'` y `$env:ASIS_QA_PASSWORD=Read-Host 'Clave QA'` (solo para la sesión actual). No escribas contraseñas en archivos versionados.

El presupuesto predeterminado de navegador es `load < 10000 ms`, `FCP < 6000 ms`; se ajusta con `ASIS_QA_MAX_LOAD_MS` y `ASIS_QA_MAX_FCP_MS`. Son **valores de partida**, no SLA oficial de ASIS.

## 5. Carga y estrés con k6 (servicios reales, SOLO LECTURA)

Instala k6 según la documentación oficial: <https://grafana.com/docs/k6/latest/set-up/install-k6/>. En Windows: `winget install k6 --source winget`.

Desde la raíz del proyecto:

```bash
# Carga moderada (30 segundos, 5 iteraciones por segundo)
k6 run qa/k6/backend_carga.js
k6 run qa/k6/frontend_carga.js

# Carga simultánea FrontEnd + Backend
k6 run qa/k6/sistema_mixto.js

# Estrés gradual, USAR SOLO EN TU PC O AMBIENTE QA
k6 run qa/k6/backend_estres.js
k6 run qa/k6/frontend_estres.js
```

**Importante:** los k6 de Backend, por defecto, llaman solo a `GET /` sin token. Para medir también `GET /tickets/` con autenticación se requiere configurar `ASIS_QA_TOKEN` con un JWT de una cuenta de pruebas que haya iniciado sesión. No coloques JWT en GitHub. Ejemplo bash:

```bash
read -s -p 'Token JWT de prueba: ' ASIS_QA_TOKEN; echo; export ASIS_QA_TOKEN
k6 run qa/k6/backend_carga.js
unset ASIS_QA_TOKEN
```

`ASIS_QA_API_URL` y `ASIS_QA_UI_URL` configuran los servidores de destino. Los scripts **bloquean** servidores distintos de `localhost`/`127.0.0.1` salvo autorización explícita `ASIS_QA_PERMITIR_REMOTO=SI`. No ejecutarlos contra servidores públicos ni la base productiva.

Para ver resultados en JSON:

```bash
mkdir -p qa-reportes
k6 run --summary-export qa-reportes/backend-carga.json qa/k6/backend_carga.js
```

**Cómo interpretar:** `http_req_duration` (incluido p95), `http_req_failed`, `checks`, `http_reqs`, `vus`, `dropped_iterations`. Las pruebas HTTP del FrontEnd no miden el tiempo de React renderizando los componentes: para eso está Playwright.

## 6. Comprobar permisos reales de PostgreSQL (solo lectura)

Con Docker funcionando, desde la carpeta del proyecto:

Como la carpeta `qa/` no se monta en `/app` de Docker, envía el script por entrada estándar, sin alterar el contenedor:

```bash
# Pop!_OS
sudo docker compose exec -T backend python - < qa/scripts/verificar_postgresql.py
# Windows PowerShell (ruta de archivo con python local o WSL):
Get-Content -Raw qa/scripts/verificar_postgresql.py | docker compose exec -T backend python -
```

Esta auditoría solo consulta `pg_roles`, `has_column_privilege` y `has_table_privilege`.

## 7. Condiciones de seguridad y límites

- **Nunca** usar `docker compose down -v`, `DROP DATABASE`, ni poblar usuarios falsos en PostgreSQL real.
- Los tests HTTP sobre los servicios vivos son **GET** y uno de login opcional. No modifican tickets, usuarios ni inventario.
- Las pruebas unitarias del Backend usan SQLite, por lo que **no sustituyen** las comprobaciones del motor PostgreSQL, sus privilegios, transacciones ni bloqueos concurrentes; la auditoría SQL real es de solo lectura.
- La carga/estrés del FrontEnd mide HTML/JS entregados por Vite, mientras Playwright mide el navegador. No hay pruebas distribuidas de miles de navegadores en este kit.
- Los percentiles y límites de rendimiento son preliminares: calibra con una línea base estable en tu equipo.
- No subir `.env`, tokens, `qa-reportes/`, `test-results/`, `playwright-report/` ni capturas con datos personales al repositorio. Consulta `qa/AGREGAR_AL_GITIGNORE.txt` y añade esas exclusiones a tu `.gitignore` existente.
- **No se ejecutaron suites dependientes de Docker/PostgreSQL/Chromium en el entorno que generó el kit.** Es necesario ejecutarlas en Pop!_OS/Windows y atender los posibles fallos.

## 8. Estructura

```
Backend/
  pytest.ini
  tests/
    requirements-test.txt
    conftest.py
    unit/         test_seguridad.py, test_acceso_tickets.py
    integration/  test_tickets_http.py
    regression/   test_contratos.py, test_base_roles.py
    performance/  test_latencia_api.py
FrontEnd/
  vitest.config.js
  playwright.config.js
  src/__tests__/  setup.js, ProtectedRoute.test.jsx, Login.test.jsx, api.test.js
  e2e/            regresion.spec.js, rendimiento.spec.js
qa/
  k6/             comun.js, backend_carga.js, frontend_carga.js,
                  backend_estres.js, frontend_estres.js, sistema_mixto.js
  scripts/        verificar_servicios.py, verificar_postgresql.py,
                  probar_backend.sh, probar_frontend.sh
```

## Documentación de los frameworks

- FastAPI TestClient y overrides: <https://fastapi.tiangolo.com/tutorial/testing/> y <https://fastapi.tiangolo.com/advanced/testing-dependencies/>
- Vitest v2 (compatible con Vite 5): <https://v2.vitest.dev/guide/>
- Playwright: <https://playwright.dev/docs/test-configuration>
- k6: <https://grafana.com/docs/k6/latest/using-k6/scenarios/>
