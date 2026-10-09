const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('karinAPI', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close')
});