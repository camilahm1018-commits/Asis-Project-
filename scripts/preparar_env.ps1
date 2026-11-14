# ASIS - Preparar archivos .env en Windows (PowerShell 5.1+)
# Ejecutar desde la raiz del proyecto:
# powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\preparar_env.ps1
# NO modifica contrasenas validas existentes, ni datos de PostgreSQL.

$ErrorActionPreference = 'Stop'

$raiz = Split-Path -Parent $PSScriptRoot
$compose = Join-Path $raiz 'docker-compose.yml'
if (-not (Test-Path -LiteralPath $compose -PathType Leaf)) {
    throw 'No encuentro docker-compose.yml. Guarda este script dentro de la carpeta scripts del proyecto ASIS.'
}

function Nueva-ClaveSegura {
    param([int]$Bytes = 24)
    $datos = New-Object byte[] $Bytes
    $generador = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $generador.GetBytes($datos)
    }
    finally {
        $generador.Dispose()
    }
    return [System.BitConverter]::ToString($datos).Replace('-', '').ToLowerInvariant()
}

$variables = @(
    'ASIS_POSTGRES_PASSWORD',
    'ASIS_DB_AUTH_PASSWORD',
    'ASIS_DB_ADMIN_PASSWORD',
    'ASIS_DB_INSTRUCTOR_PASSWORD',
    'ASIS_DB_TECNICO_PASSWORD',
    'ASIS_DB_MESA_PASSWORD',
    'ASIS_DB_CUENTADANTE_PASSWORD',
    'ASIS_JWT_SECRET',
    'ASIS_INITIAL_ADMIN_PASSWORD'
)

$rutaEnv = Join-Path $raiz '.env'
$nuevo = -not (Test-Path -LiteralPath $rutaEnv -PathType Leaf)
$lineas = New-Object 'System.Collections.Generic.List[string]'

if (-not $nuevo) {
    foreach ($linea in [System.IO.File]::ReadAllLines($rutaEnv)) {
        $lineas.Add($linea)
    }
}
else {
    $lineas.Add('# Configuracion privada de ASIS. No subir a GitHub.')
}

$cambios = $false
foreach ($nombre in $variables) {
    $indice = -1
    $repeticiones = 0
    for ($i = 0; $i -lt $lineas.Count; $i++) {
        if ($lineas[$i] -match ('^\s*' + [regex]::Escape($nombre) + '\s*=')) {
            if ($indice -eq -1) { $indice = $i }
            $repeticiones++
        }
    }
    if ($repeticiones -gt 1) {
        throw "La variable $nombre esta repetida en .env. Corrige los duplicados antes de continuar."
    }
    if ($indice -eq -1) {
        $lineas.Add("$nombre=$(Nueva-ClaveSegura)")
        $cambios = $true
    }
    else {
        $valor = ($lineas[$indice] -split '=', 2)[1].Trim().Trim('"').Trim("'")
        if (($valor -eq '') -or ($valor -match '^(REEMPLAZAR|CAMBIAR|CHANGE_ME|YOUR_|TODO)')) {
            $lineas[$indice] = "$nombre=$(Nueva-ClaveSegura)"
            $cambios = $true
        }
    }
}

$nombreCorreo = 'ASIS_INITIAL_ADMIN_EMAIL'
$correoIndice = -1
for ($i = 0; $i -lt $lineas.Count; $i++) {
    if ($lineas[$i] -match '^\s*ASIS_INITIAL_ADMIN_EMAIL\s*=') { $correoIndice = $i; break }
}
if ($correoIndice -eq -1) {
    $lineas.Add('ASIS_INITIAL_ADMIN_EMAIL=admin@sena.edu.co')
    $cambios = $true
}
elseif ((($lineas[$correoIndice] -split '=', 2)[1]).Trim() -eq '') {
    $lineas[$correoIndice] = 'ASIS_INITIAL_ADMIN_EMAIL=admin@sena.edu.co'
    $cambios = $true
}

if ($nuevo -or $cambios) {
    [System.IO.File]::WriteAllLines($rutaEnv, $lineas.ToArray(), ([System.Text.UTF8Encoding]::new($false)))
    Write-Host 'Archivo .env principal preparado.'
}
else {
    Write-Host 'El .env principal ya estaba configurado. No se modifico.'
}

foreach ($carpeta in @('Backend', 'FrontEnd')) {
    $directorio = Join-Path $raiz $carpeta
    $destino = Join-Path $directorio '.env'
    $ejemplo = Join-Path $directorio '.env.example'
    if (-not (Test-Path -LiteralPath $destino -PathType Leaf)) {
        if (-not (Test-Path -LiteralPath $ejemplo -PathType Leaf)) {
            throw "Falta $carpeta/.env.example. No se pudo crear $carpeta/.env."
        }
        Copy-Item -LiteralPath $ejemplo -Destination $destino
        Write-Host "Creado $carpeta/.env a partir del ejemplo."
    }
    else {
        Write-Host "$carpeta/.env ya existia. No se modifico."
    }
}

Write-Host ''
Write-Host 'ASIS: archivos de entorno preparados. No compartas los valores privados.'
Write-Warning 'Si esta base PostgreSQL ya tiene datos, las claves deben coincidir con las cuentas existentes; este script NO cambia contrasenas en PostgreSQL.'
Write-Host 'Comprueba con: docker compose config --quiet'
