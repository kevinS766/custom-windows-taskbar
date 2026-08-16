const { ipcRenderer } = require('electron');

// DOM Elements
const taskbarContainer = document.getElementById('taskbar-container');
const runningAppsContainer = document.getElementById('running-apps');
const activePill = document.getElementById('active-pill');
const searchTrigger = document.getElementById('search-trigger');
const launcherOverlay = document.getElementById('launcher-overlay');
const launcherInput = document.getElementById('launcher-input');
const launcherResults = document.getElementById('launcher-results');
const launcherClose = document.getElementById('launcher-close');
const lockToggleBtn = document.getElementById('lock-toggle-btn');
const lockIcon = document.getElementById('lock-icon');
const clockTime = document.getElementById('clock-time');
const clockDate = document.getElementById('clock-date');

let isLauncherOpen = false;
let isEditMode = false;
let currentWindows = [];
let currentTaskbarItems = [];
let installedApps = [];
let workspaces = [];
let filteredResults = [];
let selectedIndex = 0;
let draggedItemIndex = null;

// Optimistic Focus Lock
let optimisticFocusHwnd = null;
let optimisticFocusTime = 0;
const OPTIMISTIC_FOCUS_TIMEOUT = 1200; // ms

// High Resolution Vibrant Vector Logos for standard fallbacks
const FallbackIcons = {
  brave: `<svg viewBox="0 0 512 512" width="100%" height="100%"><path fill="#FB542B" d="M375.2 264.4c-4.2-2.5-9.3-3.6-14.3-3.1-6.1.6-11.7 3.6-15.6 8.3-22.3 26.6-47.5 48.9-74.9 66.2-7.1 4.5-16.1 4.5-23.2 0-27.4-17.3-52.6-39.6-74.9-66.2-3.9-4.7-9.5-7.7-15.6-8.3-5-.5-10.1.6-14.3 3.1l-61.9 36.6c-5.8 3.4-9.3 9.6-9.3 16.3 0 5.4 2.3 10.5 6.4 14.1l151.7 131.6c4.6 4 10.6 6.2 16.7 6.2s12.1-2.2 16.7-6.2L410.7 335.4c4.1-3.6 6.4-8.7 6.4-14.1 0-6.7-3.5-12.9-9.3-16.3l-32.6-40.6z"/><path fill="#FF7834" d="M256 0L86.4 86.8c-7.2 3.7-11.8 11-12 19.1l-3.2 78.4c-.4 10.4 4.8 20.3 13.7 25.9l80.2 50.4c6.3 4 14.1 4.7 21 2 7-2.8 12.1-8.5 13.9-15.8l10.9-44.5c2.4-9.9 11.3-16.8 21.5-16.8h47.2c10.2 0 19.1 6.9 21.5 16.8l10.9 44.5c1.8 7.3 6.9 13 13.9 15.8 6.9 2.7 14.7 2 21-2l80.2-50.4c8.9-5.6 14.1-15.5 13.7-25.9l-3.2-78.4c-.2-8.1-4.8-15.4-12-19.1L256 0z"/><path fill="#E63811" d="M256 160l-36.4 52.8c-3.1 4.5-1.9 10.6 2.6 13.7l33.8 23.3 33.8-23.3c4.5-3.1 5.7-9.2 2.6-13.7L256 160z"/></svg>`,
  discord: `<svg viewBox="0 0 127.14 96.36" width="100%" height="100%"><path fill="#5865F2" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/></svg>`,
  terminal: `<svg viewBox="0 0 256 256" width="100%" height="100%"><rect width="256" height="256" rx="48" fill="#1E1E1E"/><path d="M56 74l64 54-64 54" stroke="#4EC9B0" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="140" y1="182" x2="204" y2="182" stroke="#DCDCAA" stroke-width="26" stroke-linecap="round"/></svg>`,
  explorer: `<svg viewBox="0 0 256 256" width="100%" height="100%"><path d="M24 64h72l24 24h112a16 16 0 0 1 16 16v96a16 16 0 0 1-16 16H24a16 16 0 0 1-16-16V80a16 16 0 0 1 16-16z" fill="#0078D4"/><path d="M8 104h240v96a16 16 0 0 1-16 16H24a16 16 0 0 1-16-16v-96z" fill="#FFB900"/><path d="M8 128h240v72a16 16 0 0 1-16 16H24a16 16 0 0 1-16-16v-72z" fill="#FFC83B"/></svg>`,
  notepad: `<svg viewBox="0 0 256 256" width="100%" height="100%"><rect x="36" y="24" width="184" height="208" rx="20" fill="#0078D4"/><rect x="52" y="40" width="152" height="176" rx="12" fill="#FFFFFF"/><line x1="72" y1="72" x2="184" y2="72" stroke="#0078D4" stroke-width="12" stroke-linecap="round"/><line x1="72" y1="104" x2="184" y2="104" stroke="#94A3B8" stroke-width="10" stroke-linecap="round"/><line x1="72" y1="136" x2="184" y2="136" stroke="#94A3B8" stroke-width="10" stroke-linecap="round"/><line x1="72" y1="168" x2="140" y2="168" stroke="#94A3B8" stroke-width="10" stroke-linecap="round"/></svg>`,
  calc: `<svg viewBox="0 0 256 256" width="100%" height="100%"><rect width="256" height="256" rx="40" fill="#0078D4"/><text x="128" y="165" font-size="120" font-family="sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">±</text></svg>`,
  settings: `<svg viewBox="0 0 256 256" width="100%" height="100%"><rect width="256" height="256" rx="40" fill="#2D3748"/><path d="M128 80a48 48 0 1 0 0 96 48 48 0 0 0 0-96z" fill="#E2E8F0"/><path d="M128 40a12 12 0 0 1 12 12v12a12 12 0 0 1-24 0V52a12 12 0 0 1 12-12zm0 144a12 12 0 0 1 12 12v12a12 12 0 0 1-24 0v-12a12 12 0 0 1 12-12zm88-64a12 12 0 0 1-12 12h-12a12 12 0 0 1 0-24h12a12 12 0 0 1 12 12zm-144 0a12 12 0 0 1-12 12H48a12 12 0 0 1 0-24h12a12 12 0 0 1 12 12z" fill="#E2E8F0"/></svg>`,
  code: `<svg viewBox="0 0 256 256" width="100%" height="100%"><rect width="256" height="256" rx="40" fill="#007ACC"/><path d="M190 28l-70 65-45-35-25 15v110l25 15 45-35 70 65 20-10V38l-20-10zm-20 135l-45-35 45-35v70z" fill="#FFFFFF"/></svg>`,
  workspace: `<svg viewBox="0 0 256 256" width="100%" height="100%"><rect width="256" height="256" rx="40" fill="#2563EB"/><path d="M64 80h128v112H64z" fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><path d="M96 80V56a16 16 0 0 1 16-16h32a16 16 0 0 1 16 16v24" fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round"/><line x1="64" y1="130" x2="192" y2="130" stroke="#ffffff" stroke-width="14"/></svg>`,
  generic: `<svg viewBox="0 0 256 256" width="100%" height="100%"><rect width="256" height="256" rx="40" fill="#3B82F6"/><path d="M80 80h96v96H80z" fill="#FFFFFF"/></svg>`
};

// 1. Clock Updates
function updateClock() {
  const now = new Date();
  clockTime.textContent = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  clockDate.textContent = now.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}
setInterval(updateClock, 1000);
updateClock();

// Helper to get app icon HTML for taskbar
function getIconHtml(processName, iconBase64) {
  if (iconBase64 && iconBase64.length > 50) {
    return `<img class="app-img-icon" src="${iconBase64}" alt="${processName || ''}" />`;
  }

  const pLower = (processName || '').toLowerCase();
  if (pLower.includes('brave')) return `<div class="app-svg-icon">${FallbackIcons.brave}</div>`;
  if (pLower.includes('discord')) return `<div class="app-svg-icon">${FallbackIcons.discord}</div>`;
  if (pLower.includes('terminal') || pLower.includes('powershell') || pLower.includes('cmd') || pLower.includes('mintty') || pLower.includes('bash')) return `<div class="app-svg-icon">${FallbackIcons.terminal}</div>`;
  if (pLower.includes('explorer') || pLower.includes('omni')) return `<div class="app-svg-icon">${FallbackIcons.explorer}</div>`;
  if (pLower.includes('notepad')) return `<div class="app-svg-icon">${FallbackIcons.notepad}</div>`;
  if (pLower.includes('calc')) return `<div class="app-svg-icon">${FallbackIcons.calc}</div>`;
  if (pLower.includes('code') || pLower.includes('antigravity')) return `<div class="app-svg-icon">${FallbackIcons.code}</div>`;

  return `<div class="app-svg-icon">${FallbackIcons.generic}</div>`;
}

// 2. Sliding Active Pill Indicator
function updateActivePill() {
  const focusedBtn = runningAppsContainer.querySelector('.nav-item.is-focused');
  if (focusedBtn) {
    const left = focusedBtn.offsetLeft;
    const width = focusedBtn.offsetWidth;
    activePill.style.transform = `translateX(${left}px)`;
    activePill.style.width = `${width}px`;
    activePill.classList.add('visible');
  } else {
    activePill.classList.remove('visible');
  }
}

// 3. Stable Dynamic Taskbar Ordering & Drag-and-Drop Slot Rearrangement
let trackedWindows = [];

function updateTrackedWindows(incomingWindows = []) {
  // Apply optimistic focus lock if active
  if (optimisticFocusHwnd && (Date.now() - optimisticFocusTime < OPTIMISTIC_FOCUS_TIMEOUT)) {
    if (optimisticFocusHwnd === -1) {
      // Intentionally minimized
      incomingWindows.forEach(w => { w.isFocused = false; });
    } else {
      const targetExists = incomingWindows.some(w => w.hWnd === optimisticFocusHwnd);
      if (targetExists) {
        incomingWindows.forEach(w => {
          w.isFocused = (w.hWnd === optimisticFocusHwnd);
        });
      } else {
        optimisticFocusHwnd = null;
      }
    }
  } else {
    optimisticFocusHwnd = null;
  }

  const incomingMap = new Map();
  incomingWindows.forEach(w => incomingMap.set(w.hWnd, w));

  // 1. Keep existing open windows in their exact user-defined stable position
  const nextTracked = [];
  trackedWindows.forEach(oldWin => {
    if (incomingMap.has(oldWin.hWnd)) {
      const updated = incomingMap.get(oldWin.hWnd);
      nextTracked.push(updated);
      incomingMap.delete(oldWin.hWnd);
    }
  });

  // 2. Append newly opened windows to the end
  incomingMap.forEach(newWin => {
    nextTracked.push(newWin);
  });

  trackedWindows = nextTracked;
  return trackedWindows;
}

function renderTaskbar(windows = null) {
  const stableWindows = windows ? updateTrackedWindows(windows) : trackedWindows;
  currentWindows = stableWindows;
  currentTaskbarItems = [];
  runningAppsContainer.innerHTML = '';

  stableWindows.forEach((win, index) => {
    const slot = index + 1; // 1 to 9...
    const isSlotShortcut = slot <= 9;

    const btn = document.createElement('button');
    btn.className = `nav-item app-icon ${win.isFocused ? 'is-focused' : ''} is-running`;
    btn.setAttribute('tabindex', slot);
    btn.setAttribute('data-bind', isSlotShortcut ? slot : '');
    btn.setAttribute('data-hwnd', win.hWnd);
    btn.setAttribute('data-index', index);
    btn.setAttribute('data-tooltip', isSlotShortcut ? `${win.title || win.processName} [Win+${slot}]` : (win.title || win.processName));

    if (isEditMode) {
      btn.setAttribute('draggable', 'true');
    }

    const iconHtml = getIconHtml(win.processName, win.iconBase64);
    btn.innerHTML = `
      ${iconHtml}
      ${isSlotShortcut ? `<span class="key-badge">${slot}</span>` : ''}
      <span class="active-dot"></span>
    `;

    // Click handler (Toggle Focus or Minimize)
    btn.addEventListener('click', (e) => {
      if (isEditMode) return;
      toggleAppFocusOrMinimize(win.hWnd);
    });

    // Drag & Drop handlers for Rearranging in Edit Mode
    btn.addEventListener('dragstart', (e) => {
      if (!isEditMode) return;
      draggedItemIndex = index;
      btn.classList.add('is-dragging');
      e.dataTransfer.setData('text/plain', index);
      e.dataTransfer.effectAllowed = 'move';
    });

    btn.addEventListener('dragover', (e) => {
      if (!isEditMode || draggedItemIndex === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      btn.classList.add('drag-over');
    });

    btn.addEventListener('dragleave', () => {
      btn.classList.remove('drag-over');
    });

    btn.addEventListener('drop', (e) => {
      if (!isEditMode || draggedItemIndex === null) return;
      e.preventDefault();
      btn.classList.remove('drag-over');
      const targetIndex = index;

      if (draggedItemIndex !== targetIndex) {
        // Swap or move item in trackedWindows
        const item = trackedWindows.splice(draggedItemIndex, 1)[0];
        trackedWindows.splice(targetIndex, 0, item);
        renderTaskbar(); // Rerender immediately with new positions
      }
      draggedItemIndex = null;
    });

    btn.addEventListener('dragend', () => {
      btn.classList.remove('is-dragging');
      document.querySelectorAll('.app-icon').forEach(el => el.classList.remove('drag-over'));
      draggedItemIndex = null;
    });

    runningAppsContainer.appendChild(btn);

    currentTaskbarItems.push({
      slot: isSlotShortcut ? slot : null,
      name: win.title || win.processName,
      processName: win.processName,
      hWnd: win.hWnd,
      isFocused: win.isFocused
    });
  });

  // Update sliding pill position smoothly
  requestAnimationFrame(updateActivePill);
}

// 4. Instant Optimistic Focus and Toggle Minimize on Win+1..9 / Super+1..N
function toggleAppFocusOrMinimize(targetHwnd) {
  const currentActive = trackedWindows.find(w => w.hWnd === targetHwnd);
  const isAlreadyFocused = currentActive && currentActive.isFocused;

  if (isAlreadyFocused) {
    // Minimize the active app!
    optimisticFocusHwnd = -1; // Lock as minimized
    optimisticFocusTime = Date.now();

    trackedWindows.forEach(w => { w.isFocused = false; });
    const buttons = runningAppsContainer.querySelectorAll('.nav-item.app-icon');
    buttons.forEach(btn => {
      btn.classList.remove('is-focused');
    });
    updateActivePill();
    ipcRenderer.invoke('focus-window', targetHwnd);
  } else {
    // Focus & bring app to front!
    setOptimisticFocus(targetHwnd);
    ipcRenderer.invoke('focus-window', targetHwnd);
  }
}

function setOptimisticFocus(targetHwnd) {
  optimisticFocusHwnd = targetHwnd;
  optimisticFocusTime = Date.now();

  trackedWindows.forEach(w => {
    w.isFocused = (w.hWnd === targetHwnd);
  });

  const buttons = runningAppsContainer.querySelectorAll('.nav-item.app-icon');
  buttons.forEach(btn => {
    const btnHwnd = Number(btn.getAttribute('data-hwnd'));
    if (btnHwnd === targetHwnd) {
      btn.classList.add('is-focused');
      btn.classList.add('is-animating');
      setTimeout(() => btn.classList.remove('is-animating'), 180);
    } else {
      btn.classList.remove('is-focused');
    }
  });

  updateActivePill();
}

function setOptimisticSlotFocus(targetSlot) {
  const item = currentTaskbarItems.find(it => it.slot === targetSlot);
  if (!item || !item.hWnd) return;

  toggleAppFocusOrMinimize(item.hWnd);
}

// Listen for live dynamic window updates from main process
ipcRenderer.on('windows-updated', (event, windows) => {
  renderTaskbar(windows);
});

// Smooth Proximity Dimming via CSS
ipcRenderer.on('mouse-proximity', (event, isNear) => {
  if (isEditMode) {
    taskbarContainer.classList.remove('is-dimmed');
    return;
  }
  if (isNear) {
    taskbarContainer.classList.add('is-dimmed');
  } else {
    taskbarContainer.classList.remove('is-dimmed');
  }
});

// 5. Secure Edit Mode Toggle (Unlocks Mouse for Dragging Apps)
function toggleEditMode(forceState) {
  isEditMode = typeof forceState === 'boolean' ? forceState : !isEditMode;

  taskbarContainer.classList.toggle('edit-mode', isEditMode);
  lockToggleBtn.classList.toggle('is-unlocked', isEditMode);
  lockIcon.className = isEditMode ? 'fa-solid fa-lock-open' : 'fa-solid fa-lock';

  if (isEditMode) {
    taskbarContainer.classList.remove('is-dimmed');
    ipcRenderer.send('set-ignore-mouse-events', false); // Mouse active
  } else {
    ipcRenderer.send('set-ignore-mouse-events', true); // Mouse pass-through
  }

  renderTaskbar(); // Update draggable attributes
}

lockToggleBtn.addEventListener('click', () => toggleEditMode());

// 6. Dynamic User Custom Apps & Workspaces
async function loadConfigData() {
  try {
    installedApps = await ipcRenderer.invoke('get-installed-apps');
  } catch (e) {
    installedApps = [];
  }
  try {
    workspaces = await ipcRenderer.invoke('get-workspaces');
  } catch (e) {
    workspaces = [];
  }
}
loadConfigData();

ipcRenderer.on('apps-reloaded', (event, newApps) => {
  installedApps = newApps || [];
  if (isLauncherOpen) filterAndRenderLauncherResults(launcherInput.value);
});

ipcRenderer.on('workspaces-reloaded', (event, newWorkspaces) => {
  workspaces = newWorkspaces || [];
  if (isLauncherOpen) filterAndRenderLauncherResults(launcherInput.value);
});

function getAppItemIconHtml(app) {
  if (app.isWorkspace) {
    return FallbackIcons.workspace;
  }
  if (app.iconBase64 && app.iconBase64.length > 50) {
    return `<img src="${app.iconBase64}" alt="" />`;
  }
  const lower = (app.name || app.processName || app.cmd || app.path || '').toLowerCase();
  if (lower.includes('brave')) return FallbackIcons.brave;
  if (lower.includes('discord')) return FallbackIcons.discord;
  if (lower.includes('terminal') || lower.includes('powershell') || lower.includes('cmd') || lower.includes('bash') || lower.includes('mintty')) return FallbackIcons.terminal;
  if (lower.includes('calc') || lower.includes('calculadora')) return FallbackIcons.calc;
  if (lower.includes('notepad') || lower.includes('notas')) return FallbackIcons.notepad;
  if (lower.includes('explorer') || lower.includes('archivos') || lower.includes('omni')) return FallbackIcons.explorer;
  if (lower.includes('setting') || lower.includes('configuraci') || lower.includes('control')) return FallbackIcons.settings;
  if (lower.includes('code') || lower.includes('visual studio') || lower.includes('antigravity') || lower.includes('premiere')) return FallbackIcons.code;
  return FallbackIcons.generic;
}

function filterAndRenderLauncherResults(query = '') {
  const q = query.trim().toLowerCase();
  launcherResults.innerHTML = '';

  let matchingWorkspaces = [];
  let matchingApps = [];

  if (!q) {
    matchingWorkspaces = workspaces.map(ws => ({ ...ws, isWorkspace: true }));
    matchingApps = installedApps;
  } else {
    // 1. Search Workspaces
    matchingWorkspaces = workspaces.filter(ws => {
      const name = (ws.name || '').toLowerCase();
      const desc = (ws.desc || '').toLowerCase();
      const kw = Array.isArray(ws.keywords) ? ws.keywords.join(' ').toLowerCase() : '';
      return name.includes(q) || desc.includes(q) || kw.includes(q) || (ws.id && ws.id.toLowerCase().includes(q));
    }).map(ws => ({ ...ws, isWorkspace: true }));

    // 2. Search Custom Apps
    matchingApps = installedApps.filter(app => {
      const name = (app.name || '').toLowerCase();
      const desc = (app.desc || app.cmd || app.path || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }

  filteredResults = [...matchingWorkspaces, ...matchingApps];

  if (filteredResults.length === 0) {
    launcherResults.innerHTML = `
      <div class="empty-results">
        <span>Presiona <kbd>Enter</kbd> para ejecutar "<strong>${escapeHtml(query)}</strong>" directamente</span>
      </div>
    `;
    selectedIndex = 0;
    return;
  }

  selectedIndex = 0;
  filteredResults.forEach((item, idx) => {
    const itemEl = document.createElement('div');
    const isWs = item.isWorkspace;
    itemEl.className = `result-item ${isWs ? 'is-workspace' : ''} ${idx === 0 ? 'selected' : ''}`;
    itemEl.setAttribute('data-index', idx);

    const iconHtml = getAppItemIconHtml(item);
    const highlightedTitle = highlightMatch(item.name || item.cmd, q);
    const subText = item.desc || (item.path ? 'Aplicación personalizada' : 'Comando');

    itemEl.innerHTML = `
      <div class="result-icon">${iconHtml}</div>
      <div class="result-text">
        <span class="title">
          ${highlightedTitle}
          ${isWs ? `<span class="badge-workspace">WORKSPACE</span>` : ''}
        </span>
        <span class="sub">${escapeHtml(subText)}</span>
      </div>
      <kbd>Enter</kbd>
    `;

    itemEl.addEventListener('click', () => {
      launchSelectedItem(item);
    });

    launcherResults.appendChild(itemEl);
  });
}

function highlightMatch(text, query) {
  if (!query || !text) return escapeHtml(text || '');
  const escapedText = escapeHtml(text);
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return escapedText.replace(regex, '<mark>$1</mark>');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Execute selected app or activate Workspace layout
function launchSelectedItem(item) {
  if (!item) return;

  if (item.isWorkspace) {
    activateWorkspace(item);
  } else {
    ipcRenderer.invoke('execute-app', item);
  }
  toggleLauncher(false);
}

// Workspace activation: Sets fixed slot priority and launches missing apps
function activateWorkspace(ws) {
  if (!ws || !Array.isArray(ws.slots)) return;

  const sortedSlots = [...ws.slots].sort((a, b) => (a.slot || 0) - (b.slot || 0));

  // 1. Arrange currently tracked open windows according to workspace slot preferences
  const arranged = [];
  const remaining = [...trackedWindows];

  sortedSlots.forEach(slotDef => {
    const pName = (slotDef.processName || slotDef.name || '').toLowerCase();
    const matchIdx = remaining.findIndex(w => {
      const wName = (w.processName || w.title || '').toLowerCase();
      return wName.includes(pName) || pName.includes(wName);
    });

    if (matchIdx !== -1) {
      arranged.push(remaining.splice(matchIdx, 1)[0]);
    } else {
      // App is not open yet, launch it!
      ipcRenderer.invoke('execute-app', {
        path: slotDef.path,
        processName: slotDef.processName,
        cmd: slotDef.path || slotDef.processName
      });
    }
  });

  // Append any remaining windows
  trackedWindows = [...arranged, ...remaining];
  renderTaskbar();

  // Focus the primary app of the workspace
  if (arranged.length > 0) {
    setOptimisticFocus(arranged[0].hWnd);
    ipcRenderer.invoke('focus-window', arranged[0].hWnd);
  }
}

function toggleLauncher(show) {
  isLauncherOpen = typeof show === 'boolean' ? show : !isLauncherOpen;
  
  if (isLauncherOpen) {
    loadConfigData().then(() => {
      filterAndRenderLauncherResults(launcherInput.value);
    });
    launcherOverlay.classList.remove('hidden');
    ipcRenderer.send('set-keyboard-active', true);
    launcherInput.value = '';
    filterAndRenderLauncherResults('');
    setTimeout(() => launcherInput.focus(), 30);
  } else {
    launcherOverlay.classList.add('hidden');
    ipcRenderer.send('set-keyboard-active', false);
    launcherInput.blur();
    document.activeElement.blur();
  }
}

searchTrigger.addEventListener('click', () => toggleLauncher(true));
launcherClose.addEventListener('click', () => toggleLauncher(false));

// Live filtering on input
launcherInput.addEventListener('input', () => {
  filterAndRenderLauncherResults(launcherInput.value);
});

// Launcher Keyboard Navigation
launcherInput.addEventListener('keydown', (e) => {
  const resultItems = launcherResults.querySelectorAll('.result-item');
  const count = resultItems.length;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (count > 0) {
      if (resultItems[selectedIndex]) resultItems[selectedIndex].classList.remove('selected');
      selectedIndex = (selectedIndex + 1) % count;
      resultItems[selectedIndex].classList.add('selected');
      resultItems[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (count > 0) {
      if (resultItems[selectedIndex]) resultItems[selectedIndex].classList.remove('selected');
      selectedIndex = (selectedIndex - 1 + count) % count;
      resultItems[selectedIndex].classList.add('selected');
      resultItems[selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (filteredResults.length > 0 && filteredResults[selectedIndex]) {
      launchSelectedItem(filteredResults[selectedIndex]);
    } else if (launcherInput.value.trim()) {
      const val = launcherInput.value.trim();
      ipcRenderer.invoke('execute-app', { cmd: val });
      toggleLauncher(false);
    }
  } else if (e.key === 'Escape') {
    toggleLauncher(false);
  }
});

// 7. Global Shortcut Handlers from Main Process
ipcRenderer.on('trigger-action', (event, { actionId, data }) => {
  if (actionId === 'app-launch') {
    const targetSlot = data; // 1 to 9
    setOptimisticSlotFocus(targetSlot);
  } else if (actionId === 'toggle-search') {
    toggleLauncher();
  } else if (actionId === 'focus-bar') {
    taskbarContainer.focus();
    const firstApp = document.querySelector('.app-icon');
    if (firstApp) firstApp.focus();
  } else if (actionId === 'toggle-edit-mode') {
    toggleEditMode();
  }
});

// 8. Arrow & Tab Keyboard Navigation
document.addEventListener('keydown', (e) => {
  if (isLauncherOpen) return;

  if (e.key === 'Escape' && isEditMode) {
    toggleEditMode(false); // Lock edit mode on Escape
    return;
  }

  const focusable = Array.from(document.querySelectorAll('[tabindex]')).filter(el => el.tabIndex > 0);
  const current = document.activeElement;
  let currentIndex = focusable.indexOf(current);

  if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
    if (currentIndex !== -1) {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % focusable.length;
      focusable[nextIndex].focus();
    }
  } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
    if (currentIndex !== -1) {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + focusable.length) % focusable.length;
      focusable[prevIndex].focus();
    }
  } else if (e.key === 'Enter' || e.key === ' ') {
    if (current && current !== document.body && current !== taskbarContainer) {
      current.click();
    }
  } else if (e.key === 'Escape') {
    document.activeElement.blur();
    ipcRenderer.send('set-keyboard-active', false);
  }
});
