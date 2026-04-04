const path = require('node:path');

const { app, BrowserWindow, shell } = require('electron');

const { startLocalServer } = require('./server');

let mainWindow = null;
let serverHandle = null;
const smokeMode = process.argv.includes('--smoke');

function createWindowOptions() {
  const isMac = process.platform === 'darwin';
  return {
    width: 1520,
    height: 960,
    minWidth: 1280,
    minHeight: 800,
    show: false,
    backgroundColor: '#f5f1e8',
    autoHideMenuBar: true,
    title: 'OpenClaw 技能可视化配置客户端',
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  };
}

async function ensureServer() {
  if (serverHandle) return serverHandle;
  serverHandle = await startLocalServer({ port: 0, host: '127.0.0.1' });
  return serverHandle;
}

async function createMainWindow() {
  const { url } = await ensureServer();
  mainWindow = new BrowserWindow(createWindowOptions());

  mainWindow.webContents.setWindowOpenHandler(({ url: externalUrl }) => {
    void shell.openExternal(externalUrl);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  await mainWindow.loadURL(url);

  if (smokeMode) {
    setTimeout(() => {
      app.quit();
    }, 1200);
    return;
  }

  mainWindow.show();
}

async function stopServer() {
  if (!serverHandle?.server) return;
  await new Promise((resolve) => {
    serverHandle.server.close(() => resolve());
  });
  serverHandle = null;
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  void stopServer();
});

app.whenReady()
  .then(async () => {
    await createMainWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        void createMainWindow();
      }
    });
  })
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    await stopServer();
    app.exit(1);
  });
