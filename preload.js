const { contextBridge, ipcRenderer } = require('electron');

// Pont sécurisé entre les pages (fenêtre principale + pastille) et le process Electron
contextBridge.exposeInMainWorld('teleAPI', {
  // fenêtre principale
  requestLock: (locked) => ipcRenderer.send('request-lock', locked),
  onLockedChanged: (cb) => ipcRenderer.on('locked-changed', (e, locked) => cb(locked)),
  setAlwaysOnTop: (value) => ipcRenderer.send('set-always-on-top', value),
  quit: () => ipcRenderer.send('quit-app'),
  // pastille « Débloquer »
  pillUnlock: () => ipcRenderer.send('pill-unlock'),
  pillMove: (dx, dy) => ipcRenderer.send('pill-move', { dx, dy }),
});
