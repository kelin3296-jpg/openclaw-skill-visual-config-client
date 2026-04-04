const { contextBridge } = require('electron');

const packageJson = require('../package.json');

contextBridge.exposeInMainWorld('openclawDesktop', {
  getClientInfo() {
    return {
      name: packageJson.productName || packageJson.name,
      version: packageJson.version,
      platform: process.platform
    };
  }
});
