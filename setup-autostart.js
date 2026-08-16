const fs = require('fs');
const path = require('path');

const startupDir = path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
const vbsPath = path.join(startupDir, 'CustomTaskbar.vbs');

const electronExe = path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe');
const mainJs = path.join(__dirname, 'main.js');
const ps1Hide = path.join(__dirname, 'quitar-barra-windows.ps1');

const vbsContent = `Set WshShell = CreateObject("WScript.Shell")\r\nWshShell.Run "powershell -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File """ & "${ps1Hide}" & """", 0, True\r\nWshShell.Run """${electronExe}"" ""${mainJs}""", 0, False\r\n`;

try {
  fs.writeFileSync(vbsPath, vbsContent, 'utf-8');
  console.log('[OK] Auto-start VBS created at:', vbsPath);
} catch (e) {
  console.error('Error creating auto-start script:', e.message);
}
