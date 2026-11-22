# Menú Windows: powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\qa\scripts\ejecutar_asis_qa.ps1 -Suite unit
param(
    [ValidateSet('unit','integration','regression','performance','security','backend',
                 'security-live','frontend-unit','frontend-e2e','frontend-security','audit','headers')]
    [string]$Suite = 'unit'
)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Push-Location $root
try {
    switch ($Suite) {
        'unit'        { docker compose exec -T backend python -m pytest -c pytest.ini tests/unit -v }
        'integration' { docker compose exec -T backend python -m pytest -c pytest.ini tests/integration -v }
        'regression'  { docker compose exec -T backend python -m pytest -c pytest.ini tests/regression -v }
        'performance' { docker compose exec -T backend python -m pytest -c pytest.ini tests/performance -v }
        'security'    { docker compose exec -T backend python -m pytest -c pytest.ini tests/security -m 'not live' -v }
        'backend'     { docker compose exec -T backend python -m pytest -c pytest.ini tests -m 'not live' -v }
        'security-live' {
            Write-Host 'Probando exclusivamente http://127.0.0.1:8000. Usa solo una instancia de QA.'
            docker compose exec -T -e ASIS_SEC_BASE_URL=http://127.0.0.1:8000 -e ASIS_SEC_ALLOW_LOCAL=YES backend python -m pytest -c pytest.ini tests/security/test_sqli_live_local.py -v
        }
        'frontend-unit' {
            Push-Location FrontEnd
            try { npx --no-install vitest run --config vitest.config.js --coverage }
            finally { Pop-Location }
        }
        'frontend-e2e' {
            Push-Location FrontEnd
            try { npx --no-install playwright test --config playwright.config.js }
            finally { Pop-Location }
        }
        'frontend-security' {
            Push-Location FrontEnd
            try { npx --no-install playwright test e2e/seguridad_asis.spec.js --config playwright.config.js }
            finally { Pop-Location }
        }
        'audit' {
            New-Item -ItemType Directory -Path 'qa-reportes' -Force | Out-Null
            py -3 qa/security/auditoria_estatica.py --proyecto . --salida qa-reportes/auditoria-seguridad.json
        }
        'headers' { py -3 qa/security/cabeceras_http.py }
    }
    if ($LASTEXITCODE -ne 0) { throw "La suite $Suite terminó con código $LASTEXITCODE. Revisa los errores de la terminal." }
    Write-Host "Suite '$Suite' finalizada correctamente."
}
finally { Pop-Location }
