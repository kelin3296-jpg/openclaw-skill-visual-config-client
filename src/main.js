const path = require('node:path');

const { app, BrowserWindow, clipboard, ipcMain, shell } = require('electron');

const {
  automateBrowserPromptSend,
  buildOpenClawControlUrl
} = require('./lib/openclaw-control');
const { startLocalServer } = require('./server');

let mainWindow = null;
let controlWindow = null;
let serverHandle = null;
let serverStartPromise = null;
let serverRestartPromise = null;
const trackedServerSockets = new Set();
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

function createControlWindow() {
  if (controlWindow && !controlWindow.isDestroyed()) {
    return controlWindow;
  }

  controlWindow = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 1100,
    minHeight: 760,
    show: false,
    title: 'OpenClaw 控制台',
    backgroundColor: '#151515',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: false
    }
  });

  controlWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  controlWindow.on('closed', () => {
    controlWindow = null;
  });

  return controlWindow;
}

function trackServerSockets(server) {
  if (server.__openclawTrackedSockets) return;
  server.__openclawTrackedSockets = true;
  server.on('connection', (socket) => {
    trackedServerSockets.add(socket);
    socket.on('close', () => {
      trackedServerSockets.delete(socket);
    });
  });
}

function destroyTrackedServerSockets() {
  trackedServerSockets.forEach((socket) => {
    try {
      socket.destroy();
    } catch {
      // Ignore socket teardown errors during force restart.
    }
  });
  trackedServerSockets.clear();
}

function ensureServer(options = {}) {
  if (serverHandle?.server?.listening) return Promise.resolve(serverHandle);
  if (serverStartPromise) return serverStartPromise;

  const preferredPort = Number(options.port ?? serverHandle?.address?.port ?? 0);
  serverStartPromise = startLocalServer({ port: preferredPort, host: '127.0.0.1' })
    .then((handle) => {
      serverHandle = handle;
      trackServerSockets(handle.server);
      return handle;
    })
    .finally(() => {
      serverStartPromise = null;
    });

  return serverStartPromise;
}

async function loadWindow(win, url) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      win.webContents.removeListener('did-finish-load', handleLoad);
      win.webContents.removeListener('did-fail-load', handleFail);
    };

    const handleLoad = () => {
      cleanup();
      resolve();
    };

    const handleFail = (_, code, description) => {
      cleanup();
      reject(new Error(`OpenClaw 控制台加载失败（${code}）：${description}`));
    };

    win.webContents.once('did-finish-load', handleLoad);
    win.webContents.once('did-fail-load', handleFail);
    win.loadURL(url).catch((error) => {
      cleanup();
      reject(error);
    });
  });
}

async function injectPromptIntoControl(win, prompt) {
  const payload = JSON.stringify(String(prompt || ''));

  try {
    return await win.webContents.executeJavaScript(`
      (() => {
        const prompt = ${payload};
        let injected = false;
        let selectorHit = '';

        const selectors = [
          'textarea',
          'input[type="text"]',
          'input:not([type])',
          '[contenteditable="true"]'
        ];

        for (const selector of selectors) {
          const node = document.querySelector(selector);
          if (!node) continue;

          selectorHit = selector;
          node.focus();

          if (node.isContentEditable) {
            node.textContent = prompt;
            node.dispatchEvent(new InputEvent('input', {
              bubbles: true,
              data: prompt,
              inputType: 'insertText'
            }));
          } else {
            node.value = prompt;
            node.dispatchEvent(new Event('input', { bubbles: true }));
            node.dispatchEvent(new Event('change', { bubbles: true }));
          }

          injected = true;
          break;
        }

        return { injected, selectorHit };
      })();
    `, true);
  } catch (error) {
    return {
      injected: false,
      selectorHit: '',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function submitPromptInControl(win) {
  const result = await win.webContents.executeJavaScript(`
    (() => {
      const target = document.querySelector('textarea, input[type="text"], input:not([type]), [contenteditable="true"]');
      if (!target) {
        return { submitted: false, strategy: 'missing-composer' };
      }

      target.focus();
      const form = target.form || target.closest('form');
      if (form && typeof form.requestSubmit === 'function') {
        form.requestSubmit();
        return { submitted: true, strategy: 'form.requestSubmit' };
      }

      const payload = {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      };
      target.dispatchEvent(new KeyboardEvent('keydown', payload));
      target.dispatchEvent(new KeyboardEvent('keypress', payload));
      target.dispatchEvent(new KeyboardEvent('keyup', payload));
      return { submitted: true, strategy: 'keyboard-enter' };
    })();
  `, true);

  if (result?.submitted) {
    return result;
  }

  win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Enter' });
  win.webContents.sendInputEvent({ type: 'char', keyCode: '\r' });
  win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Enter' });
  return {
    submitted: true,
    strategy: 'native-enter'
  };
}

async function openOpenClawControl(payload = {}) {
  const finalPrompt = typeof payload === 'string' ? payload : String(payload.prompt || '');
  const referenceMaterials = Array.isArray(payload.referenceMaterials) ? payload.referenceMaterials : [];

  try {
    return await automateBrowserPromptSend(finalPrompt, { referenceMaterials });
  } catch {
    const win = createControlWindow();
    const { url } = buildOpenClawControlUrl();

    await loadWindow(win, url);
    const injection = await injectPromptIntoControl(win, finalPrompt);
    const submission = injection.injected
      ? await submitPromptInControl(win)
      : { submitted: false, strategy: 'missing-composer' };
    win.show();
    win.focus();

    return {
      opened: true,
      submitted: Boolean(submission.submitted),
      submissionStrategy: submission.strategy || '',
      url,
      injected: Boolean(injection.injected),
      selectorHit: injection.selectorHit || ''
    };
  }
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
    await mainWindow.webContents.executeJavaScript(`
      ({
        tabs: Boolean(document.querySelector('[data-view-tab="generator"]')),
        sendButton: Boolean(document.querySelector('[data-action="send-openclaw"]'))
      });
    `, true);
    setTimeout(() => {
      app.quit();
    }, 1200);
    return;
  }

  mainWindow.show();
}

async function stopServer(options = {}) {
  if (!serverHandle?.server) return;

  const { force = false } = options;
  const currentHandle = serverHandle;
  serverHandle = null;

  if (force) {
    currentHandle.server.closeIdleConnections?.();
    currentHandle.server.closeAllConnections?.();
    destroyTrackedServerSockets();
  }

  await new Promise((resolve) => {
    currentHandle.server.close(() => resolve());
  });
}

async function recoverLocalService() {
  if (serverRestartPromise) return serverRestartPromise;

  serverRestartPromise = (async () => {
    const preferredPort = Number(serverHandle?.address?.port || 0);
    await stopServer({ force: true });
    const handle = await ensureServer({ port: preferredPort });
    return {
      ok: true,
      url: handle.url,
      port: handle.address.port,
      recoveredAt: new Date().toISOString()
    };
  })().finally(() => {
    serverRestartPromise = null;
  });

  return serverRestartPromise;
}

ipcMain.handle('desktop:copy-text', async (_, text) => {
  clipboard.writeText(String(text || ''));
  return {
    ok: true,
    mode: 'desktop'
  };
});

ipcMain.handle('desktop:open-openclaw-control', async (_, payload = {}) => {
  return openOpenClawControl(payload || {});
});

ipcMain.handle('desktop:recover-local-service', async () => {
  return recoverLocalService();
});

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
