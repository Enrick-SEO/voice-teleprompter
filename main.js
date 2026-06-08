const {
  app,
  BrowserWindow,
  screen,
  session,
  systemPreferences,
  globalShortcut,
  ipcMain,
} = require('electron');
const path = require('path');

let win; // fenêtre principale (téléprompteur)
let pill = null; // mini-fenêtre « Débloquer » (visible quand verrouillé)
let isLocked = false;
let contentProtected = true; // invisible à la capture d'écran (par défaut OUI)

function createWindow() {
  win = new BrowserWindow({
    width: 760,
    height: 560,
    minWidth: 360,
    minHeight: 220,
    frame: false, // pas de barre de titre : fenêtre flottante
    transparent: true, // fond transparent pour voir derrière
    hasShadow: false,
    alwaysOnTop: true, // toujours au-dessus des autres apps
    resizable: true,
    backgroundColor: '#00000000',
    title: 'Voice Teleprompter',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Empêche Chromium de ralentir le défilement quand une autre app
      // est au premier plan (essentiel pour lire en filmant/partageant l'écran)
      backgroundThrottling: false,
    },
  });

  // Flotte même au-dessus des apps en plein écran / sur tous les bureaux
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Invisible pour les outils de capture/enregistrement (Loom, Zoom, QuickTime…),
  // tout en restant visible à l'écran pour l'utilisateur.
  win.setContentProtection(contentProtected);

  win.loadFile('index.html');

  win.on('closed', () => {
    destroyPill();
    win = null;
    app.quit();
  });
}

// ---------- Mini-fenêtre « Débloquer » ----------
function createPill() {
  if (pill && !pill.isDestroyed()) return;
  const wa = screen.getPrimaryDisplay().workArea;
  const W = 150;
  const H = 48;
  pill = new BrowserWindow({
    width: W,
    height: H,
    x: wa.x + wa.width - W - 24, // coin haut-droit par défaut
    y: wa.y + 24,
    frame: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // accepte le clic même quand l'app n'est pas au premier plan
      acceptFirstMouse: true,
    },
  });
  pill.setAlwaysOnTop(true, 'screen-saver');
  pill.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  pill.setContentProtection(contentProtected); // invisible à la capture aussi
  pill.loadFile('pill.html');
}

function showPill() {
  if (!win || win.isDestroyed()) return;
  createPill();
  pill.showInactive(); // s'affiche sans voler le focus à l'app en cours
  pill.moveTop();
}

function hidePill() {
  if (pill && !pill.isDestroyed()) pill.hide();
}

function destroyPill() {
  if (pill && !pill.isDestroyed()) pill.destroy();
  pill = null;
}

// ---------- Verrouillage (clic-à-travers) ----------
function applyLock(locked) {
  isLocked = !!locked;
  if (win && !win.isDestroyed()) {
    win.setIgnoreMouseEvents(isLocked, { forward: true });
    win.webContents.send('locked-changed', isLocked);
  }
  if (isLocked) showPill();
  else hidePill();
}

app.whenReady().then(async () => {
  // Demande l'accès au micro sur macOS (pour la détection de voix)
  if (process.platform === 'darwin') {
    try {
      await systemPreferences.askForMediaAccess('microphone');
    } catch (e) {}
  }

  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => {
    cb(true);
  });

  createWindow();

  // Raccourci global : bascule le verrou (toujours dispo en secours)
  globalShortcut.register('CommandOrControl+Shift+L', () => applyLock(!isLocked));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Verrou demandé par la fenêtre principale (bouton 🔓)
ipcMain.on('request-lock', (e, locked) => applyLock(locked));

// Déverrouillage demandé par la pastille (clic)
ipcMain.on('pill-unlock', () => applyLock(false));

// Déplacement de la pastille (glisser)
ipcMain.on('pill-move', (e, d) => {
  if (pill && !pill.isDestroyed() && d) {
    const [x, y] = pill.getPosition();
    pill.setPosition(Math.round(x + (d.dx || 0)), Math.round(y + (d.dy || 0)));
  }
});

ipcMain.on('set-always-on-top', (e, value) => {
  if (win && !win.isDestroyed()) {
    if (value) win.setAlwaysOnTop(true, 'screen-saver');
    else win.setAlwaysOnTop(false);
  }
});

// Clic-à-travers « hybride » piloté par le renderer (selon la position du curseur).
// Ignoré quand la fenêtre est verrouillée (le verrou force déjà l'ignore total).
ipcMain.on('set-ignore-mouse', (e, opts) => {
  if (win && !win.isDestroyed() && !isLocked) {
    win.setIgnoreMouseEvents(!!(opts && opts.ignore), { forward: !!(opts && opts.forward) });
  }
});

// Invisibilité à l'enregistrement d'écran (Loom, Zoom, QuickTime…)
ipcMain.on('set-content-protection', (e, on) => {
  contentProtected = !!on;
  if (win && !win.isDestroyed()) win.setContentProtection(contentProtected);
  if (pill && !pill.isDestroyed()) pill.setContentProtection(contentProtected);
});

ipcMain.on('quit-app', () => app.quit());

app.on('window-all-closed', () => {
  app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
