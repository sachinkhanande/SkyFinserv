const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isDesktop: true,
  appVersion: '1.0.0',
  selectDirectory: (currentPath) => ipcRenderer.invoke('dialog:selectDirectory', currentPath),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  writeExportFile: (options) => ipcRenderer.invoke('file:writeExport', options),
  openPath: (targetPath) => ipcRenderer.invoke('shell:openPath', targetPath),
  getDefaultPaths: () => ipcRenderer.invoke('app:getDefaultPaths'),
});
