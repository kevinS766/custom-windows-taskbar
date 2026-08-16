const fs = require('fs');
const path = require('path');

const startupDir = path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
const vbsPath = path.join(startupDir, 'CustomTaskbar.vbs');

const electronExe = path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe');
const mainJs = path.join(__dirname, 'main.js');

const vbsContent = `Set WshShell = CreateObject("WScript.Shell")\r\nWshShell.Run """${electronExe}"" ""${mainJs}""", 0, False\r\n`;

try {
  fs.writeFileSync(vbsPath, vbsContent, 'utf-8');
  console.log('[OK] Auto-start VBS created at:', vbsPath);
} catch (e) {
  console.error('Error creating auto-start script:', e.message);
}
