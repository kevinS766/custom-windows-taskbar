@echo off
title Iniciar Barra de Tareas Personalizada
echo Cerrando instancias previas...
taskkill /F /IM electron.exe >nul 2>&1
echo Ocultando barra de Windows...
powershell -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "%~dp0quitar-barra-windows.ps1" >nul 2>&1
echo Iniciando Custom Taskbar...
start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0main.js"
echo [OK] Custom Taskbar iniciada.
exit
