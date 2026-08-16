@echo off
title Poner Barra de Tareas de Windows
echo Ejecutando script para restaurar la barra de tareas de Windows...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0poner-barra-windows.ps1"

echo.
pause
