@echo off
title SP System — Instalador
echo ============================================
echo  SP System - Pulperia System
echo  Instalacion y despliegue
echo ============================================
echo.

REM Verificar Docker
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker no esta instalado.
    echo Descargalo de: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

REM Verificar Docker Compose
docker compose version >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose no esta disponible.
    pause
    exit /b 1
)

REM Verificar .env
if not exist .env (
    echo [INFO] No se encontro .env. Copiando desde .env.example...
    copy .env.example .env
    echo [IMPORTANTE] Revisa el archivo .env y ajusta los valores antes de continuar.
    notepad .env
    echo.
    pause
)

REM Construir y levantar
echo [1/3] Construyendo imagen de la aplicacion...
docker compose build

echo [2/3] Levantando servicios...
docker compose up -d

echo [3/3] Verificando...
echo.
echo Esperando a que la aplicacion inicie...
:check
timeout /t 3 /nobreak >nul
curl -s http://localhost:3000 >nul 2>nul
if %errorlevel% neq 0 (
    echo Aun no responde, esperando...
    goto check
)

echo.
echo ============================================
echo  SP System esta corriendo!
echo  Abri tu navegador en: http://localhost:3000
echo  Usuario: admin
echo  Clave: admin123
echo ============================================
echo.
echo Para ver los logs: docker compose logs -f
echo Para detener:      docker compose down
echo.
pause
