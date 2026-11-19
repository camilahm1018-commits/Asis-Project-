# ASIS — Paquete adicional de pruebas de seguridad

**Objetivo:** evaluar SQL Injection, JWT, autorización por rol, exposición de errores, XSS reflejado en errores del FrontEnd, posibles prácticas inseguras y cabeceras HTTP.

**Importante:** este ZIP es un complemento al *ASIS Kit de Pruebas Ampliado* que ya recibiste; **no sustituye Backend ni FrontEnd**, ni contiene `.env`, ni toca `docker-compose.yml` ni los datos de PostgreSQL.

## Qué contiene

- `Backend/tests/security/test_sqli_login_aislado.py`: pruebas de SQL Injection en el login real, contra SQLite en memoria.
- `Backend/tests/security/test_sqli_rutas_aislado.py`: IDs maliciosos y control de acceso a tickets en la base temporal.
- `Backend/tests/security/test_jwt_negativo_aislado.py`: JWT falsos, expirados o de recuperación.
- `Backend/tests/security/test_sqli_live_local.py`: verificaciones HTTP locales, activación explícita y sin operaciones destructivas.
- `FrontEnd/e2e/seguridad_asis.spec.js`: rutas privadas y error XSS simulado sin escribir en BD.
- `qa/security/auditoria_estatica.py`: analiza código e informa **posibles** riesgos sin revelar valores sensibles.
- `qa/security/cabeceras_http.py`: informa cabeceras HTTP a revisar en localhost.
- `qa/security/COMANDOS_Windows_PowerShell.md` y `COMANDOS_Linux.md`: ejecución en cada sistema.

## Instalación (sin sobrescribir código de ASIS)

1. Instala primero el kit ampliado anterior, que incluye `Backend/tests/conftest.py`, `Backend/pytest.ini`, `FrontEnd/playwright.config.js` y dependencias de pruebas.
2. Descomprime el ZIP de seguridad fuera del proyecto y **copia solo** las carpetas `Backend/tests/security`, `FrontEnd/e2e/seguridad_asis.spec.js` y `qa/security` sobre el proyecto de ASIS. Estas rutas agregan archivos nuevos.
3. Usa el archivo de comandos de tu sistema operativo.

## Ejecución aislada (recomendada primero)

Con el Backend de ASIS y pytest disponibles en el mismo entorno:

```bash
cd Backend
python -m pytest -c pytest.ini tests/security/test_sqli_login_aislado.py tests/security/test_sqli_rutas_aislado.py tests/security/test_jwt_negativo_aislado.py -v
```

**Las pruebas aisladas** reutilizan el fixture de SQLite del kit anterior. No crean usuarios reales ni envían correos y no necesitan tener PostgreSQL iniciado.

## Ejecución live (solo entorno local de QA)

Esta suite hace solicitudes de login con identidades inexistentes y consultas sin token, en un número pequeño de casos.
Usa el mismo código del Backend publicado, pero sí envía tráfico HTTP al servidor local.

```bash
ASIS_SEC_BASE_URL=http://127.0.0.1:8000 ASIS_SEC_ALLOW_LOCAL=YES python -m pytest -c Backend/pytest.ini Backend/tests/security/test_sqli_live_local.py -v
```

En Windows/PowerShell, usa el comando de `qa/security/COMANDOS_Windows_PowerShell.md`. Si vas a ejecutar la suite en el contenedor, debe estar instalado pytest y httpx.

## Escaneo estático y dependencias

```bash
python qa/security/auditoria_estatica.py --proyecto . --salida qa-reportes/auditoria-seguridad.json
python qa/security/cabeceras_http.py
bandit -r Backend -x Backend/tests
pip-audit -r Backend/requirements.txt
cd FrontEnd && npm audit --omit=dev
```

Bandit, pip-audit y npm audit analizan riesgos conocidos; no demuestran por sí solos que la app no tiene vulnerabilidades. La auditoría estática usa coincidencias heurísticas y requiere revisión manual.

## Interpretación de resultados

- `PASSED`: la prueba concreta respondió como se esperaba; no es garantía de ausencia de SQL Injection en todas las rutas.
- `FAILED`: una condición no se cumplió; revisar el error antes de concluir que existe una vulnerabilidad.
- `SKIPPED`: se omitió porque faltaba un prerrequisito o las pruebas HTTP no fueron autorizadas explícitamente.
- Posibles hallazgos por `auditoria_estatica.py`: confirmar manualmente antes de clasificar vulnerabilidad.

## Seguridad y alcance

- Realiza las pruebas solo en una copia local o un entorno que controles.
- Haz un respaldo antes de cualquier prueba futura que escriba datos; este kit no necesita hacerlo.
- No incluyas tokens, contraseñas, hashes de contraseñas ni claves JWT en reportes que compartas.
- SQL Injection en parámetros no demuestra automáticamente que se pueda extraer una base de datos: interpreta pruebas y evidencia caso por caso.
- Para evaluar inyecciones más profundas en formularios y rutas autenticadas, usa una base de datos desechable, cuentas de QA y revisiones adicionales.

**Compatibilidad:** basado en los archivos del último ZIP de ASIS disponible en la conversación. Si la versión actual de GitHub cambió de rutas, habrá que actualizar las pruebas.
