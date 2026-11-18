# Solo entorno QA. Para ejecutar: .\qa\scripts\locust_estres.ps1
$ErrorActionPreference = 'Stop'
$raiz = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Push-Location $raiz
try {
  New-Item -ItemType Directory -Path 'qa-reportes/locust' -Force | Out-Null
  $env:ASIS_QA_STRESS_CONFIRM = 'SI'
  locust -f qa/locust/mixto_locust.py,qa/locust/stress_shape.py,qa/locust/umbrales.py --headless --csv qa-reportes/locust/estres --html qa-reportes/locust/estres.html
  if ($LASTEXITCODE -ne 0) { throw 'Locust detectó fallos o umbrales superados' }
}
finally {
  Remove-Item Env:\ASIS_QA_STRESS_CONFIRM -ErrorAction SilentlyContinue
  Pop-Location
}
