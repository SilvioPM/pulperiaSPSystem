# preparar-existente.ps1 - UNA SOLA VEZ en cada sistema que ya esta en produccion
# Uso: powershell -ExecutionPolicy Bypass -File preparar-existente.ps1
#
# Crea el .env con los secretos que ese sistema YA esta usando hoy,
# para que los git pull futuros (que traen docker-compose.yml nuevo) no rompan nada.
# Si ya existe .env, no toca nada.
#
# Despues de correrlo, los updates siguen siendo: git pull + docker compose build app + docker compose up -d

param([int]$Puerto = 3000)

$ErrorActionPreference = 'Stop'

if (Test-Path ".env") {
  Write-Host ""
  Write-Host "Ya existe un .env: no se toca nada." -ForegroundColor Green
  Write-Host "Verifique que contenga JWT_SECRET y APP_LICENSE_SECRET." -ForegroundColor Cyan
} else {
  $envContent = @"
# Creado por preparar-existente.ps1 con los valores que el sistema usa HOY (compatibilidad).
# NO lo borre: los updates futuros dependen de que estos secretos se conserven.
PUERTO=$Puerto
JWT_SECRET=686bdbca4b9522bbf637ff0ae8bdaa784e24cf965ea55592e8a28f6e596c88f3
APP_LICENSE_SECRET=spsystem-2024-secret-key-produccion
DATABASE_URL=postgresql://spsystem:spsystem123@localhost:5432/spsystem
RUTA_RESPALDOS=C:\respaldos-spsystem
"@

  Set-Content -Path ".env" -Value $envContent -Encoding UTF8

  Write-Host ""
  Write-Host ".env creado con los secretos que el sistema usa hoy. NO lo borre." -ForegroundColor Green
  Write-Host "Puede continuar actualizando normalmente: git pull + docker compose build app + docker compose up -d" -ForegroundColor Cyan
}