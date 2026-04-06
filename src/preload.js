const { contextBridge, ipcRenderer } = require('electron');

const packageJson = require('../package.json');

contextBridge.exposeInMainWorld('openclawDesktop', {
  getClientInfo() {
    return {
      name: packageJson.productName || packageJson.name,
      version: packageJson.version,
      platform: process.platform
    };
  },
  isDesktopClient() {
    return true;
  },
  copyText(text) {
    return ipcRenderer.invoke('desktop:copy-text', text);
  },
  openOpenClawControl(payload) {
    return ipcRenderer.invoke('desktop:open-openclaw-control', payload || {});
  },
  recoverLocalService() {
    return ipcRenderer.invoke('desktop:recover-local-service');
  }
});
