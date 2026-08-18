# instalar.ps1 - Instalacion NUEVA de SPSystem (genera secretos unicos)
# Uso:      powershell -ExecutionPolicy Bypass -File instalar.ps1
# Uso con puerto distinto: powershell -ExecutionPolicy Bypass -File instalar.ps1 -Puerto 3001
#
# IMPORTANTE:
#   - Este script es SOLO para instalaciones nuevas.
#   - Para ACTUALIZAR un sistema ya instalado NO lo use; use: git pull + docker compose build app + docker compose up -d
#   - Anote y guarde el APP_LICENSE_SECRET generado: es necesario para emitir la licencia de este cliente.
#   - El .env generado NO debe borrarse ni subirse a GitHub.

param([int]$Puerto = 3000)

$ErrorActionPreference = 'Stop'

function Nuevo-Secreto {
  $bytes = New-Object byte[] 32
  ([System.Security.Cryptography.RandomNumberGenerator]::Create()).GetBytes($bytes)
  return -join ($bytes | ForEach-Object { $_.ToString('x2') })
}

Write-Host ""
Write-Host "===== SPSystem - Instalacion NUEVA =====" -ForegroundColor Green

if (Test-Path ".env") {
  Write-Host "Ya existe un .env en esta carpeta. No se regeneran secretos (se conservan los actuales)." -ForegroundColor Yellow
} else {
  $jwt = Nuevo-Secreto
  $lic = Nuevo-Secreto

  $envContent = @"
# Generado por instalar.ps1 - NO lo borre ni lo suba a GitHub
PUERTO=$Puerto
JWT_SECRET=$jwt
APP_LICENSE_SECRET=$lic
DATABASE_URL=postgresql://spsystem:spsystem123@localhost:5432/spsystem
RUTA_RESPALDOS=C:\respaldos-spsystem
"@

  Set-Content -Path ".env" -Value $envContent -Encoding UTF8

  Write-Host ""
  Write-Host "Secretos unicos generados para ESTA instalacion:" -ForegroundColor Green
  Write-Host "  JWT_SECRET        : $jwt"
  Write-Host "  APP_LICENSE_SECRET: $lic" -ForegroundColor Cyan
  Write-Host ""
  Write-Host ">>> GUARDE el APP_LICENSE_SECRET en su registro de clientes." -ForegroundColor Yellow
  Write-Host ">>> Sin el, NO podra emitir la licencia de este cliente." -ForegroundColor Yellow
  Write-Host ""
}

Write-Host "Construyendo y levantando contenedores..." -ForegroundColor Cyan
docker compose up -d --build
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: docker compose fallo. Revise los logs con: docker compose logs app" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Esperando que la aplicacion arranque..." -ForegroundColor Cyan
$ok = $false
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 2
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:$Puerto" -UseBasicParsing -TimeoutSec 3
    if ($r.StatusCode -eq 200) { $ok = $true; break }
  } catch {}
}

if ($ok) {
  Write-Host ""
  Write-Host "SPSystem LISTO en http://localhost:$Puerto" -ForegroundColor Green
  Write-Host "Siguiente paso: entre al sistema, abra el modulo Licencia y envie el Machine-ID al proveedor para emitir la licencia." -ForegroundColor Cyan
} else {
  Write-Host ""
  Write-Host "La app no respondio despues de 2 minutos. Revise: docker compose logs app" -ForegroundColor Yellow
}