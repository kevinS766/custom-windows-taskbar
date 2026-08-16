@echo off
title Desactivar Inicio Automatico de Custom Taskbar
echo Desactivando inicio automatico...
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\CustomTaskbar.vbs" >nul 2>&1
echo [OK] Inicio automatico desactivado.
pause
