# ASIS: kit ampliado de testing (pytest + Locust + Vitest + Playwright + k6)

**No altera el código de producción.** Es una versión expandida del kit anterior. Mantiene los tests existentes y añade nuevos archivos a `Backend/tests`, `FrontEnd/src/__tests__`, `FrontEnd/e2e` y `qa/locust`. Adaptado a la copia de ASIS compartida antes; tu repositorio GitHub puede haber cambiado posteriormente.

## Alcance y qué se ejecuta realmente

| Tipo | Backend | FrontEnd |
| --- | --- | --- |
| Unitarias | pytest: roles, JWT, validación técnico, esquemas | Vitest: rutas protegidas, Axios, login por 5 roles |
| Integración | pytest + FastAPI TestClient + SQLite **temporal** | Testing Library y Playwright con login simulado |
| Regresión | pytest: autorización de rutas, contrato y errores | Playwright: login y rutas privadas (kit base + ampliación) |
| Carga | Locust/k6: salud, OpenAPI, tickets opcionales con JWT QA | Locust/k6: HTML de Vite, login SPA y módulos JS |
| Estrés | Locust con rampa gradual hasta 20 usuarios virtuales en total | Locust mide servidor HTTP; no renderiza React en el servidor |
| Rendimiento | p50/p95 de SELECT aislado, Locust/k6 p95 reales | Playwright: DOMContentLoaded/FCP y muestras navegadas |

**Ojo:** SQLite no prueba los permisos SQL de PostgreSQL, las políticas de fila, ni los bloqueos concurrentes `FOR UPDATE`. Los scripts HTTP de carga y estrés usan solo `GET`. Locust no ejecuta JavaScript ni renderiza páginas: para ello se usa Playwright.

## Instalación sin sobrescribir tu proyecto

1. Descomprime `ASIS_Kit_Pruebas_Ampliado.zip` en otra carpeta.
2. Copia el contenido de `ASIS_QA_Kit_Ampliado/` a la raíz de `Asis-Project-`. No sobrescribas tus archivos de aplicación. El kit ampliado incluye los archivos anteriores: si ya habías instalado el primer kit, copia preferiblemente **solo los archivos nuevos** o usa `--ignore-existing`.
3. No se incluyen archivos `.env`, base de datos, contraseñas ni tokens. Añade las exclusiones de `qa/AGREGAR_AL_GITIGNORE_AMPLIADO.txt` a tu `.gitignore`.
4. Si el repositorio GitHub cambió rutas/servicios, revisa los casos antes de ejecutar. Los tests ayudan a descubrir desviaciones, no sustituyen una revisión.

### Pop!_OS

Desde el directorio de ASIS, con Docker funcionando:

```bash
sudo docker compose up -d --build
sudo bash qa/scripts/pytest_ampliado.sh
```

Para ejecutar solo una categoría:

```bash
sudo docker compose exec -T backend python -m pytest -c pytest.ini tests/unit -v
sudo docker compose exec -T backend python -m pytest -c pytest.ini tests/integration -v
sudo docker compose exec -T backend python -m pytest -c pytest.ini tests/regression -v
sudo docker compose exec -T backend python -m pytest -c pytest.ini tests/performance -v
```

Los tests que escriben datos usan SQLite en memoria, no la base ASIS real. `Backend/tests/resultado-pytest.xml` y `coverage.xml` quedan montados en tu directorio local por Docker. **No publiques los reportes si contienen datos privados.**

### Windows PowerShell

Abre PowerShell en la raíz de ASIS, con Docker Desktop iniciado:

```powershell
docker compose up -d --build
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\qa\scripts\pytest_ampliado.ps1
```

No hace falta ejecutar `sudo`. Los `.ps1` no requieren Bash.

## FrontEnd: Vitest y Playwright

Ejecuta sobre el **sistema anfitrión**, preferiblemente Node.js 20/22 (el contenedor de desarrollo puede traer otra versión). Los paquetes de prueba son dependencias **de desarrollo**:

```bash
cd FrontEnd
npm install --save-dev 'vitest@^2.1.9' 'jsdom@^24.1.3' '@testing-library/react@^16.0.0' '@testing-library/jest-dom@^6.0.0' '@testing-library/user-event@^14.0.0' 'axios-mock-adapter@^2.1.0' '@playwright/test@^1.56.0' '@vitest/coverage-v8@^2.1.9'
npx vitest run --config vitest.config.js --coverage
npx playwright install chromium
npx playwright test --config playwright.config.js
cd ..
```

En **Windows** ejecuta la línea de `npm install` sin comillas simples si tu PowerShell/terminal las trata de forma distinta; PowerShell moderno admite las comillas indicadas. Playwright necesita que ASIS esté iniciado en `localhost:5173`. Los casos `login_simulado_qa.spec.js` usan credenciales y respuestas ficticias para no cambiar PostgreSQL.

## Locust: carga y estrés HTTP mixto, ambos servicios

Instala Locust en un entorno Python **separado** (no en el contenedor de producción del Backend):

```bash
python3 -m venv .venv-qa
source .venv-qa/bin/activate
pip install -r qa/locust/requirements-locust.txt
bash qa/scripts/locust_carga.sh
```

En Windows:

```powershell
py -m venv .venv-qa
.\.venv-qa\Scripts\Activate.ps1
pip install -r qa\locust\requirements-locust.txt
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\qa\scripts\locust_carga.ps1
```

Si PowerShell bloquea la activación, llama directamente a `.\.venv-qa\Scripts\locust.exe` usando los argumentos de `locust_carga.ps1` (sin cambiar globalmente las políticas). Otra opción es ejecutar `python -m locust` desde el Python del venv.

- Por defecto: `Backend=http://127.0.0.1:8000`, `FrontEnd=http://127.0.0.1:5173`.
- Carga: 8 usuarios virtuales combinados durante 45 segundos. Reportes CSV + HTML en `qa-reportes/locust/`.
- Estrés: `bash qa/scripts/locust_estres.sh` (Linux) o `qa/scripts/locust_estres.ps1` (Windows), rampa de 2→5→10→20 usuarios, luego baja a 0; dura ~4,5 minutos.
- Los resultados fallan si más de **3%** de solicitudes fallan o el p95 supera **2000 ms** (umbrales iniciales, ajustables: `ASIS_QA_MAX_FAIL_RATIO`, `ASIS_QA_MAX_P95_MS`).
- Para medir tickets en el Backend, configura `ASIS_QA_TOKEN` con JWT **de cuenta de pruebas** en la sesión de la terminal. No lo escribas en archivos versionados.
- Servidores fuera de localhost se bloquean; solo se autorizan con `ASIS_QA_PERMITIR_REMOTO=SI` **en un entorno propio de pruebas**.
- **No ejecutar Locust/k6 sobre servidores de producción.** Las cargas aunque sean GET consumen recursos reales.

K6 del kit original sigue estando disponible en `qa/k6/`. Ejecutarlo permite comparar las métricas de Locust con otro generador de carga independiente.

## Pruebas HTTP reales del Backend (opt-in, solo GET)

Para comprobar conexión real a FastAPI sin tocar registros de PostgreSQL:

```bash
# Pop!_OS: desde el proyecto
sudo docker compose exec -T -e ASIS_QA_LIVE=SI backend python -m pytest -c pytest.ini tests/live -v
```

El test de tickets autenticados se omite si falta `ASIS_QA_TOKEN`. En PowerShell puedes pasar la variable a `docker compose exec -e ASIS_QA_LIVE=SI ...`. No insertes usuarios de prueba mediante estas pruebas en una base real.

## Informes

- `Backend/tests/resultado-pytest.xml`: resultado de casos pytest, apto para integraciones CI.
- `Backend/tests/coverage.xml`: cobertura Python sobre los módulos medidos.
- `../qa-reportes/frontend-coverage/`: informe HTML Vitest.
- `../qa-reportes/playwright/`: reporte Playwright (capturas solo ante fallo).
- `qa-reportes/locust/carga.html` y `qa-reportes/locust/estres.html`: estadística Locust; los CSV permiten comparar historiales.
- `k6 --summary-export qa-reportes/k6-resumen.json ...`: resumen k6 del kit anterior.

## Restricciones y comprobación

- Ninguno de los nuevos archivos reemplaza código de producción. Los archivos originales del kit se conservan, excepto que `Backend/pytest.ini` agrega el marcador `live` para evitar avisos de pytest.
- Se validó la sintaxis Python/JS de los nuevos scripts. **No se ejecutaron pruebas integradas de Docker, PostgreSQL, Node/Chromium ni las cargas HTTP en este entorno.** Puedes encontrar fallos reales o incompatibilidades si el código actual de ASIS cambió desde el ZIP compartido.
- No uses `docker compose down -v`, nunca publiques archivos `.env` y conserva tu respaldo de la base.
