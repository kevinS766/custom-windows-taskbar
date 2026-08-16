@echo off
title Quitar Barra de Tareas de Windows
echo Ejecutando script para ocultar la barra de tareas de Windows...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0quitar-barra-windows.ps1"

echo.
pause
