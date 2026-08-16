const { app, BrowserWindow, globalShortcut, ipcMain, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const si = require('systeminformation');
const { GlobalKeyboardListener } = require('node-global-key-listener');

app.setPath('userData', path.join(app.getPath('temp'), 'custom-taskbar-data'));
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

let taskbarWindows = []; // Array of { win, displayId, posX, posY, barWidth, totalWindowHeight, taskbarTopY }
let vKeyListener;
let mouseCheckInterval = null;
let windowTrackerInterval = null;
let pollWindows = null;
let isKeyboardActive = false;
const trackerPath = path.join(__dirname, 'window-tracker.exe');
const appsConfigPath = path.join(__dirname, 'apps.json');
const iconCache = {};
let customAppsCache = [];

// Configure native auto-start at Windows login
try {
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: false
  });
} catch (e) {}

async function getIconForPath(filePath) {
  if (!filePath) return null;
  if (iconCache[filePath]) return iconCache[filePath];
  try {
    if (!fs.existsSync(filePath)) return null;
    const icon = await app.getFileIcon(filePath, { size: 'normal' });
    const dataUrl = icon.toDataURL();
    iconCache[filePath] = dataUrl;
    return dataUrl;
  } catch (e) {
    return null;
  }
}

// Load custom user applications from apps.json
async function loadCustomApps() {
  let apps = [];
  try {
    if (fs.existsSync(appsConfigPath)) {
      const raw = fs.readFileSync(appsConfigPath, 'utf-8');
      apps = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading apps.json:', e.message);
  }

  // Pre-extract icons in parallel
  const iconPromises = apps.map(async (appItem) => {
    if (appItem.path && fs.existsSync(appItem.path)) {
      try {
        const icon = await getIconForPath(appItem.path);
        if (icon) appItem.iconBase64 = icon;
      } catch (e) {}
    }
  });

  await Promise.all(iconPromises);
  customAppsCache = apps;
  return apps;
}

// Auto-reload when apps.json is edited and saved by user
function setupAppsConfigFileWatcher() {
  try {
    fs.watch(appsConfigPath, async () => {
      setTimeout(async () => {
        await loadCustomApps();
        broadcastToAll('apps-reloaded', customAppsCache);
      }, 500);
    });
  } catch (e) {}
}

// Broadcast IPC message to all taskbar windows across all monitors
function broadcastToAll(channel, ...args) {
  taskbarWindows.forEach(entry => {
    if (entry.win && !entry.win.isDestroyed()) {
      entry.win.webContents.send(channel, ...args);
    }
  });
}

// Create taskbar instances on ALL connected displays
function createTaskbarWindows() {
  // Close existing windows cleanly if display setup changed
  taskbarWindows.forEach(entry => {
    try {
      if (entry.win && !entry.win.isDestroyed()) {
        entry.win.close();
      }
    } catch (e) {}
  });
  taskbarWindows = [];

  const displays = screen.getAllDisplays();

  displays.forEach((display, index) => {
    const barWidth = Math.min(1240, display.bounds.width - 40);
    const totalWindowHeight = 480;
    const taskbarH = 60;

    const posX = display.bounds.x + Math.floor((display.bounds.width - barWidth) / 2);
    const posY = display.bounds.y + display.bounds.height - totalWindowHeight;
    const taskbarTopY = posY + totalWindowHeight - taskbarH;

    const win = new BrowserWindow({
      width: barWidth,
      height: totalWindowHeight,
      x: posX,
      y: posY,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      hasShadow: false,
      focusable: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    win.setAlwaysOnTop(true, 'screen-saver');
    win.setSkipTaskbar(true);

    // Mouse clicks pass through to background apps
    win.setIgnoreMouseEvents(true, { forward: true });

    win.loadFile(path.join(__dirname, 'index.html'));

    taskbarWindows.push({
      win,
      displayId: display.id,
      posX,
      posY,
      barWidth,
      totalWindowHeight,
      taskbarTopY
    });
  });
}

function setupMouseProximityDetector() {
  if (mouseCheckInterval) clearInterval(mouseCheckInterval);

  mouseCheckInterval = setInterval(() => {
    if (isKeyboardActive || taskbarWindows.length === 0) return;

    const point = screen.getCursorScreenPoint();

    taskbarWindows.forEach(entry => {
      if (!entry.win || entry.win.isDestroyed()) return;

      // Check if mouse is hovering in the bottom 60px taskbar area of this monitor
      const isMouseOver = (
        point.x >= entry.posX - 10 &&
        point.x <= entry.posX + entry.barWidth + 10 &&
        point.y >= entry.taskbarTopY - 12 &&
        point.y <= entry.posY + entry.totalWindowHeight + 10
      );

      entry.win.webContents.send('mouse-proximity', isMouseOver);
    });
  }, 40);
}

function setupWindowTracker() {
  pollWindows = () => {
    if (taskbarWindows.length === 0) return;
    exec(`"${trackerPath}"`, { maxBuffer: 1024 * 1024 * 5 }, async (err, stdout) => {
      if (err || !stdout) return;
      try {
        const windows = JSON.parse(stdout.trim());
        
        for (const w of windows) {
          if (w.exePath && (!w.iconBase64 || w.iconBase64.length < 50)) {
            const icon = await getIconForPath(w.exePath);
            if (icon) w.iconBase64 = icon;
          }
        }

        broadcastToAll('windows-updated', windows);
      } catch (e) {}
    });
  };

  if (windowTrackerInterval) clearInterval(windowTrackerInterval);
  windowTrackerInterval = setInterval(pollWindows, 750);
  setTimeout(pollWindows, 300);
}

function setupLowLevelKeyboardListener() {
  if (vKeyListener) vKeyListener.kill();
  vKeyListener = new GlobalKeyboardListener();

  vKeyListener.addListener((e, down) => {
    if (e.state !== 'DOWN') return;

    const isWinPressed = down['LEFT META'] || down['RIGHT META'] || down['META'];
    const isAltPressed = down['LEFT ALT'] || down['RIGHT ALT'] || down['ALT'];

    if (isWinPressed || isAltPressed) {
      const keyName = e.name ? e.name.toUpperCase() : '';
      
      let appIndex = null;
      if (keyName === '1' || keyName === 'NUMPAD 1') appIndex = 1;
      else if (keyName === '2' || keyName === 'NUMPAD 2') appIndex = 2;
      else if (keyName === '3' || keyName === 'NUMPAD 3') appIndex = 3;
      else if (keyName === '4' || keyName === 'NUMPAD 4') appIndex = 4;
      else if (keyName === '5' || keyName === 'NUMPAD 5') appIndex = 5;
      else if (keyName === '6' || keyName === 'NUMPAD 6') appIndex = 6;
      else if (keyName === '7' || keyName === 'NUMPAD 7') appIndex = 7;
      else if (keyName === '8' || keyName === 'NUMPAD 8') appIndex = 8;
      else if (keyName === '9' || keyName === 'NUMPAD 9') appIndex = 9;

      if (appIndex !== null) {
        broadcastToAll('trigger-action', { actionId: 'app-launch', data: appIndex });
      }
    }
  });
}

function getActiveDisplayWindow() {
  const cursorPoint = screen.getCursorScreenPoint();
  const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);
  const matched = taskbarWindows.find(entry => entry.displayId === currentDisplay.id);
  if (matched && matched.win && !matched.win.isDestroyed()) {
    return matched.win;
  }
  return taskbarWindows[0]?.win || null;
}

function setupStandardShortcuts() {
  globalShortcut.unregisterAll();

  // Alt+Space -> Toggle Command Launcher on the screen where the cursor is
  try {
    globalShortcut.register('Alt+Space', () => {
      const targetWin = getActiveDisplayWindow();
      if (targetWin && !targetWin.isDestroyed()) {
        isKeyboardActive = true;
        targetWin.show();
        targetWin.focus();
        targetWin.webContents.send('trigger-action', { actionId: 'toggle-search' });
      }
    });
  } catch (e) {}

  // Alt+Shift+T -> Focus Taskbar for Arrow Navigation on the screen where the cursor is
  try {
    globalShortcut.register('Alt+Shift+T', () => {
      const targetWin = getActiveDisplayWindow();
      if (targetWin && !targetWin.isDestroyed()) {
        isKeyboardActive = true;
        targetWin.show();
        targetWin.focus();
        targetWin.webContents.send('trigger-action', { actionId: 'focus-bar' });
      }
    });
  } catch (e) {}
}

function setupDisplayEventListeners() {
  const handleDisplayChange = () => {
    setTimeout(() => {
      createTaskbarWindows();
      if (pollWindows) pollWindows();
    }, 500);
  };

  screen.on('display-added', handleDisplayChange);
  screen.on('display-removed', handleDisplayChange);
  screen.on('display-metrics-changed', handleDisplayChange);
}

ipcMain.handle('get-app-icon', async (event, exePath) => {
  return await getIconForPath(exePath);
});

ipcMain.handle('get-installed-apps', async () => {
  if (customAppsCache.length === 0) {
    return await loadCustomApps();
  }
  return customAppsCache;
});

ipcMain.handle('focus-window', async (event, hWnd) => {
  if (!hWnd) return;
  exec(`"${trackerPath}" focus ${hWnd}`, () => {
    if (pollWindows) {
      setTimeout(pollWindows, 50);
      setTimeout(pollWindows, 180);
    }
  });
});

ipcMain.handle('execute-app', async (event, payload) => {
  if (!payload) return;

  let filePath = '';
  let processName = '';
  let cmd = '';

  if (typeof payload === 'string') {
    cmd = payload;
  } else if (typeof payload === 'object') {
    filePath = payload.path || '';
    processName = payload.processName || '';
    cmd = payload.cmd || payload.path || '';
  }

  // 1. If it's a file path (.lnk, .exe, etc.), launch with shell or exec
  if (filePath) {
    if (filePath.toLowerCase().endsWith('.lnk') || filePath.toLowerCase().endsWith('.url')) {
      shell.openPath(filePath);
      return;
    }
    if (filePath.toLowerCase().endsWith('.exe')) {
      exec(`start "" "${filePath}"`, (err) => {
        if (err) shell.openPath(filePath);
      });
      return;
    }
  }

  // 2. If it's a running process, focus it via tracker
  if (processName) {
    exec(`"${trackerPath}" focus-process "${processName}" "${cmd || ''}"`);
    return;
  }

  // 3. Fallback execution
  if (cmd) {
    if (cmd.startsWith('http://') || cmd.startsWith('https://') || cmd.startsWith('ms-settings:')) {
      shell.openExternal(cmd);
    } else {
      exec(`start "" "${cmd}"`, (err) => {
        if (err) exec(cmd);
      });
    }
  }
});

ipcMain.on('set-keyboard-active', (event, active) => {
  isKeyboardActive = active;
});

ipcMain.handle('get-system-stats', async () => {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    return {
      cpuLoad: Math.round(cpu.currentLoad),
      ramUsage: Math.round((mem.active / mem.total) * 100)
    };
  } catch (e) {
    return { cpuLoad: 0, ramUsage: 0 };
  }
});

app.whenReady().then(() => {
  createTaskbarWindows();
  setupMouseProximityDetector();
  setupWindowTracker();
  setupLowLevelKeyboardListener();
  setupStandardShortcuts();
  loadCustomApps();
  setupAppsConfigFileWatcher();
  setupDisplayEventListeners();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (vKeyListener) vKeyListener.kill();
  if (windowTrackerInterval) clearInterval(windowTrackerInterval);
  if (mouseCheckInterval) clearInterval(mouseCheckInterval);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
