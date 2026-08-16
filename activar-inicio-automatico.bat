@echo off
title Activar Inicio Automatico de Custom Taskbar
echo Configurando inicio automatico con Windows...
node "%~dp0setup-autostart.js"
echo [OK] Custom Taskbar se iniciara automaticamente cada vez que inicies sesion en Windows.
pause
