param(
  [string[]]$ComputerName
)

# ADVERTENCIA: Este script es SOLO para instalaciones NUEVAS.
# Para ACTUALIZAR un sistema ya instalado use:
#   git pull + docker compose build app + docker compose up -d
# (nunca borre volumenes: contienen la base de datos)

$ErrorActionPreference = 'Stop'
$logFile = "deploy-20260725-202508.log"
$hostname = $env:COMPUTERNAME

function Log {
  param([string]$msg)
  $line = "[20:25:08] [] $msg"
  Write-Host $line
  Add-Content -Path $logFile -Value $line
}

# -- 1. Detener y limpiar Docker (sin borrar volumenes) --
Log "Deteniendo contenedores..."
docker compose down 2>&1 | Out-Null
Log "Eliminando contenedores antiguos..."
docker container prune -f 2>&1 | Out-Null
Log "Eliminando imagenes sin usar..."
docker image prune -f 2>&1 | Out-Null

# -- 2. Pull de imagenes base --
$images = @("postgres:16-alpine", "node:20-bookworm-slim")
foreach ($img in $images) {
  Log "Descargando $img ..."
  docker pull $img 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Log "ERROR: No se pudo descargar $img. Verifique conexion a Internet o red corporativa."
    exit 1
  }
}

# -- 3. Git pull --
Log "Actualizando codigo desde git..."
git pull 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Log "ERROR: git pull fallo. Verifique que no hay cambios locales sin commit."
  exit 1
}

# -- 4. Verificar .env --
if (-not (Test-Path ".env")) {
  Log "Creando .env desde .env.example ..."
  Copy-Item ".env.example" ".env"
  Log "IMPORTANTE: Edite .env para ajustar RUTA_RESPALDOS y JWT_SECRET si es necesario."
}

# -- 5. Build y levantar --
Log "Construyendo imagenes y levantando servicios..."
docker compose up -d --build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Log "ERROR: docker compose up -d --build fallo."
  exit 1
}

# -- 6. Esperar a que la app responda (ahora por HTTPS vía Caddy) --
Log "Esperando que la aplicacion se inicie..."
$ready = $false
for ($i = 1; $i -le 60; $i++) {
  Start-Sleep -Seconds 2
  try {
    $r = Invoke-WebRequest -Uri "https://localhost" -UseBasicParsing -TimeoutSec 3 -SkipCertificateCheck
    if ($r.StatusCode -eq 200) {
      $ready = $true
      break
    }
  } catch {
    try {
      $r = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 3 -MaximumRedirection 5
      if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
  }
}
if ($ready) {
  Log "APLICACION LISTA en https://localhost (instale la CA con scripts\confiar-certificado.ps1 para evitar la advertencia del navegador)"
} else {
  Log "ADVERTENCIA: La app no respondio despues de 2 minutos. Revise los logs con: docker compose logs -f app"
}

# -- 7. Mostrar logs --
Log "Ultimas lineas de logs:"
docker compose logs --tail=30 app 2>&1 | ForEach-Object { Write-Host $_ }

Log "DEPLOY COMPLETADO en $hostname"
