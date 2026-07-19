@echo off
title SP System — Instalar Agente de Impresion
echo ============================================
echo  SP System - Instalacion del Agente de Impresion
echo ============================================
echo.

REM Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Descargalo de: https://nodejs.org/
    pause
    exit /b 1
)

REM Ir a la carpeta del agente
cd /d "%~dp0"

REM Instalar dependencias
echo [1/3] Instalando dependencias...
call npm install --no-audit --no-fund
if %errorlevel% neq 0 (
    echo [ERROR] No se pudieron instalar las dependencias.
    pause
    exit /b 1
)

REM Crear acceso directo en inicio de Windows
echo [2/3] Agregando al inicio de Windows...
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set SCRIPT_PATH=%~dp0start-agent.vbs

echo Set WshShell = CreateObject("WScript.Shell") > "%SCRIPT_PATH%"
echo Set Shortcut = WshShell.CreateShortcut("%STARTUP_DIR%\SP System Print Agent.lnk") >> "%SCRIPT_PATH%"
echo Shortcut.TargetPath = "wscript.exe" >> "%SCRIPT_PATH%"
echo Shortcut.Arguments = "//nologo " ^& chr(34) ^& "%~dp0run-agent.vbs" ^& chr(34) >> "%SCRIPT_PATH%"
echo Shortcut.WorkingDirectory = "%~dp0" >> "%SCRIPT_PATH%"
echo Shortcut.WindowStyle = 7 >> "%SCRIPT_PATH%"
echo Shortcut.Save >> "%SCRIPT_PATH%"

echo Set WshShell = CreateObject("WScript.Shell") > "%~dp0run-agent.vbs"
echo WshShell.Run "cmd /c start /b node """ ^& chr(34) ^& "%~dp0server.js" ^& chr(34) ^& """", 0, False >> "%~dp0run-agent.vbs"

cscript //nologo "%SCRIPT_PATH%" >nul 2>nul

REM Iniciar agente ahora
echo [3/3] Iniciando agente...
start /b node "%~dp0server.js"

echo.
echo ============================================
echo  Instalacion completada!
echo  El agente se inicia automaticamente
echo  al encender la computadora.
echo ============================================
echo.
echo Para probar: http://localhost:5123/status
echo.
pause
