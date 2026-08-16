@echo off
title Detener Barra de Tareas Personalizada
echo Cerrando Custom Taskbar...
taskkill /F /IM electron.exe >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Custom Taskbar cerrada con exito.
) else (
    echo [INFO] No habia ninguna instancia de Custom Taskbar ejecutandose.
)
timeout /t 2 >nul
exit
