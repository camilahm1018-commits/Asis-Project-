# Ejecutar: powershell.exe -NoProfile -File .\qa\scripts\pytest_ampliado.ps1
$ErrorActionPreference = 'Stop'
$raiz = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Push-Location $raiz
try {
  docker compose ps --services | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Docker no responde' }
  docker compose exec -T backend python -m pip install -r tests/requirements-test.txt
  if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias' }
  docker compose exec -T backend python -m pytest -c pytest.ini tests -m 'not live' -v --junitxml=/app/tests/resultado-pytest.xml --cov=seguridad --cov=servicios.acceso_tickets --cov=enrutadores.ticket --cov=enrutadores.asig_tec --cov-report=term-missing --cov-report=xml:/app/tests/coverage.xml
  if ($LASTEXITCODE -ne 0) { throw 'Pytest detectó fallos. Revisa el reporte.' }
  Write-Host 'Reportes en Backend/tests/resultado-pytest.xml y coverage.xml'
}
finally { Pop-Location }
