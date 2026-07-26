param(
  [string[]]$ComputerName
)

$ErrorActionPreference = 'Stop'
$logFile = "deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$hostname = $env:COMPUTERNAME

function Log {
  param([string]$msg)
  $line = "[$(Get-Date -Format 'HH:mm:ss')] [$hostname] $msg"
  Write-Host $line
  Add-Content -Path $logFile -Value $line
}

# ── 1. Detener y limpiar Docker ──
Log "Deteniendo contenedores..."
docker compose down -v 2>&1 | Out-Null
Log "Eliminando contenedores antiguos..."
docker container prune -f 2>&1 | Out-Null
Log "Eliminando imágenes sin usar..."
docker image prune -af 2>&1 | Out-Null
Log "Eliminando volúmenes huérfanos..."
docker volume prune -f 2>&1 | Out-Null

# ── 2. Pull de imágenes base ──
$images = @("postgres:16-alpine", "node:20-bookworm-slim")
foreach ($img in $images) {
  Log "Descargando $img ..."
  docker pull $img 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Log "ERROR: No se pudo descargar $img. Verificá conexión a Internet o red corporativa."
    exit 1
  }
}

# ── 3. Git pull ──
Log "Actualizando código desde git..."
git pull 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Log "ERROR: git pull falló. Verificá que no hay cambios locales sin commit."
  exit 1
}

# ── 4. Verificar .env ──
if (-not (Test-Path ".env")) {
  Log "Creando .env desde .env.example ..."
  Copy-Item ".env.example" ".env"
  Log "IMPORTANTE: Editá .env para ajustar RUTA_RESPALDOS y JWT_SECRET si es necesario."
}

# ── 5. Build y levantar ──
Log "Construyendo imágenes y levantando servicios..."
docker compose up -d --build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Log "ERROR: docker compose up -d --build falló."
  exit 1
}

# ── 6. Esperar a que la app responda ──
Log "Esperando que la aplicación se inicie..."
$ready = $false
for ($i = 1; $i -le 60; $i++) {
  Start-Sleep -Seconds 2
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3
    if ($r.StatusCode -eq 200) {
      $ready = $true
      break
    }
  } catch {}
}
if ($ready) {
  Log "APLICACIÓN LISTA en http://localhost:3000"
} else {
  Log "ADVERTENCIA: La app no respondió después de 2 minutos. Revisá los logs con: docker compose logs -f app"
}

# ── 7. Mostrar logs ──
Log "Últimas líneas de logs:"
docker compose logs --tail=30 app 2>&1 | ForEach-Object { Write-Host $_ }

Log "DEPLOY COMPLETADO en $hostname"
