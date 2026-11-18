# Ejecutar desde PowerShell: .\qa\scripts\locust_carga.ps1
$ErrorActionPreference = 'Stop'
$raiz = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Push-Location $raiz
try {
  New-Item -ItemType Directory -Path 'qa-reportes/locust' -Force | Out-Null
  locust -f qa/locust/mixto_locust.py,qa/locust/umbrales.py --headless --users 8 --spawn-rate 2 --run-time 45s --csv qa-reportes/locust/carga --html qa-reportes/locust/carga.html
  if ($LASTEXITCODE -ne 0) { throw 'Locust detectó fallos o umbrales superados' }
}
finally { Pop-Location }
