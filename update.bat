@echo off
title SP System — Actualizacion
echo ============================================
echo  SP System - Actualizacion
echo ============================================
echo.
echo [1/4] Deteniendo servicios actuales...
docker compose down

echo [2/4] Borrando imagen anterior...
docker rmi spsystem-app 2>nul || echo (No habia imagen previa)

echo [3/4] Reconstruyendo con cambios nuevos...
docker compose build --no-cache

echo [4/4] Levantando servicios...
docker compose up -d

echo.
echo ============================================
echo  Actualizacion completada!
echo  La app se reinicio con los cambios nuevos.
echo ============================================
echo.
echo Para ver logs: docker compose logs -f
echo.
pause
