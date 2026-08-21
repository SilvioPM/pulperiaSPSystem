# Instala la CA interna de Caddy (generada con "tls internal") en el almacén
# de certificados raíz de Windows para que el navegador NO muestre advertencia
# al entrar por HTTPS (https://<IP-de-esta-PC>).
#
# Uso:  powershell -ExecutionPolicy Bypass -File scripts\confiar-certificado.ps1
# Requiere: el stack levantado (docker compose up -d). Si falta permiso de
# administrador, se relanza solo con UAC.

$ErrorActionPreference = 'Stop'

# Trabajar siempre desde la raíz del proyecto (la ventana elevada arranca en System32)
Set-Location -LiteralPath (Split-Path -Parent (Split-Path -Parent $PSCommandPath))

# --- Auto-elevación (una sola vez) ---
$esAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $esAdmin) {
    Start-Process powershell -Verb RunAs -ArgumentList @(
        '-ExecutionPolicy', 'Bypass', '-NoExit',
        '-File', "`"$PSCommandPath`""
    ) -WorkingDirectory (Split-Path -Parent $PSCommandPath)
    exit
}

$caddyId = docker compose ps -q caddy 2>$null
if (-not $caddyId) {
    Write-Host "ERROR: No se encontro el contenedor de Caddy. Ejecuta primero: docker compose up -d" -ForegroundColor Red
    exit 1
}

$tmp = Join-Path $env:TEMP 'spsystem-caddy-root.crt'
docker cp "${caddyId}:/data/caddy/pki/authorities/local/root.crt" $tmp
if (-not (Test-Path $tmp)) {
    Write-Host "ERROR: No se pudo extraer el certificado raiz. Verifica que Caddy este corriendo." -ForegroundColor Red
    exit 1
}

& certutil -addstore -f Root $tmp | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: certutil no pudo instalar el certificado." -ForegroundColor Red
    exit 1
}

# Copia también a una carpeta compartible para las demás PCs de la red
$copiaRed = Join-Path $PWD 'respaldos\spsystem-ca.crt'
try { Copy-Item $tmp $copiaRed -Force } catch {}

Remove-Item $tmp -Force

Write-Host ""
Write-Host "OK: Certificado CA de SPSystem instalado en Windows." -ForegroundColor Green
Write-Host "Reinicia el navegador (cierra TODAS las ventanas) y entra a:"
Write-Host "    https://<IP-de-esta-PC>"
if (Test-Path $copiaRed) {
    Write-Host ""
    Write-Host "Para las OTRAS PCs de la red: pasales el archivo '$copiaRed'"
    Write-Host "y ejecuten como administrador:  certutil -addstore -f Root spsystem-ca.crt"
}
Write-Host ""