const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const DEFAULT_GATEWAY_HOST = '127.0.0.1';
const DEFAULT_GATEWAY_PORT = 18789;
const DEFAULT_SESSION_KEY = 'main';

function resolveOpenClawConfigPath() {
  if (process.env.OPENCLAW_CONFIG_PATH) {
    return path.resolve(process.env.OPENCLAW_CONFIG_PATH);
  }

  return path.join(os.homedir(), '.openclaw', 'openclaw.json');
}

function readOpenClawConfig() {
  const configPath = resolveOpenClawConfigPath();
  try {
    return {
      configPath,
      config: JSON.parse(fs.readFileSync(configPath, 'utf8'))
    };
  } catch {
    return {
      configPath,
      config: {}
    };
  }
}

function getGatewaySettings() {
  const { configPath, config } = readOpenClawConfig();
  const gateway = config.gateway || {};
  const auth = gateway.auth || {};
  const host = DEFAULT_GATEWAY_HOST;
  const port = Number(gateway.port || DEFAULT_GATEWAY_PORT);
  const controlOrigin = `http://${host}:${port}`;
  const gatewayUrl = `ws://${host}:${port}`;

  return {
    configPath,
    host,
    port,
    controlOrigin,
    gatewayUrl,
    token: typeof auth.token === 'string' ? auth.token.trim() : '',
    password: typeof auth.password === 'string' ? auth.password.trim() : '',
    sessionKey: DEFAULT_SESSION_KEY
  };
}

function buildOpenClawControlUrl(options = {}) {
  const settings = getGatewaySettings();
  const route = options.route === 'root' ? '/' : '/chat';
  const sessionKey = String(options.sessionKey || settings.sessionKey || DEFAULT_SESSION_KEY).trim() || DEFAULT_SESSION_KEY;
  const url = new URL(route, `${settings.controlOrigin}/`);

  url.searchParams.set('gatewayUrl', settings.gatewayUrl);
  if (settings.token) {
    url.searchParams.set('token', settings.token);
  }
  if (settings.password) {
    url.searchParams.set('password', settings.password);
  }
  url.searchParams.set('session', sessionKey);

  return {
    url: url.toString(),
    route,
    sessionKey,
    settings
  };
}

let playwrightLaunchPromise = null;
let playwrightBrowser = null;
let playwrightPage = null;
let automationFlavor = '';
let automationChromeProcess = null;
let automationChromeUserDataDir = '';
let automationArtifactPaths = [];

function fileExists(filePath) {
  try {
    return Boolean(filePath) && fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function detectInstalledChromeExecutable(options = {}) {
  const platform = options.platform || process.platform;
  const home = options.home || os.homedir();
  const env = options.env || process.env;
  const existsSync = options.existsSync || fileExists;
  const configuredPath = String(env.OPENCLAW_AUTOMATION_BROWSER_PATH || '').trim();

  if (configuredPath && existsSync(configuredPath)) {
    return configuredPath;
  }

  const candidates = platform === 'darwin'
    ? [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        path.join(home, 'Applications', 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome')
      ]
    : platform === 'win32'
      ? [
          path.join(env.PROGRAMFILES || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
          path.join(env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
          path.join(env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'), 'Google', 'Chrome', 'Application', 'chrome.exe')
        ]
      : [
          '/usr/bin/google-chrome-stable',
          '/usr/bin/google-chrome',
          '/opt/google/chrome/chrome'
        ];

  return candidates.find((candidate) => existsSync(candidate)) || '';
}

function resolvePlaywrightLaunchOptions(options = {}) {
  const executablePath = detectInstalledChromeExecutable(options);
  const baseOptions = {
    headless: false,
    args: ['--disable-features=Translate']
  };

  if (executablePath) {
    return {
      launchOptions: {
        ...baseOptions,
        executablePath
      },
      browserFlavor: 'installed-chrome'
    };
  }

  return {
    launchOptions: baseOptions,
    browserFlavor: 'playwright-chromium'
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeRemove(targetPath) {
  if (!targetPath) return;
  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
  } catch {
    // Ignore cleanup failures for temporary automation files.
  }
}

function expandUserPath(filePath) {
  const value = String(filePath || '').trim();
  if (!value) return '';
  if (value === '~') return os.homedir();
  if (value.startsWith(`~${path.sep}`)) {
    return path.join(os.homedir(), value.slice(2));
  }
  return value;
}

function getMimeExtension(mimeType) {
  const normalized = String(mimeType || '').toLowerCase();
  if (normalized === 'image/png') return '.png';
  if (normalized === 'image/jpeg') return '.jpg';
  if (normalized === 'image/webp') return '.webp';
  if (normalized === 'image/gif') return '.gif';
  if (normalized === 'application/pdf') return '.pdf';
  if (normalized === 'text/plain') return '.txt';
  if (normalized === 'text/markdown') return '.md';
  if (normalized.includes('json')) return '.json';
  return '';
}

function sanitizeFileName(fileName, fallback = 'reference-file') {
  const normalized = path.basename(String(fileName || '').trim() || fallback).replace(/[^\w.-]+/g, '-');
  return normalized || fallback;
}

function ensureAutomationArtifactDir() {
  if (automationChromeUserDataDir && fileExists(automationChromeUserDataDir)) {
    const artifactDir = path.join(automationChromeUserDataDir, 'attachments');
    if (!fileExists(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
    return artifactDir;
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openclaw-attachments-'));
  automationArtifactPaths.push(tempDir);
  return tempDir;
}

function writeMaterialContentToTempFile(material) {
  const encodedContent = String(material?.encodedContent || '').trim();
  if (!encodedContent) return '';

  const artifactDir = ensureAutomationArtifactDir();
  const fallbackName = `attachment-${Date.now()}`;
  const rawName = sanitizeFileName(material?.name || material?.value || fallbackName, fallbackName);
  const ext = path.extname(rawName) || getMimeExtension(material?.mimeType);
  const fileName = ext ? rawName : `${rawName}${ext || ''}`;
  const targetPath = path.join(artifactDir, fileName);
  const buffer = Buffer.from(encodedContent, 'base64');
  fs.writeFileSync(targetPath, buffer);
  if (!automationArtifactPaths.includes(targetPath)) {
    automationArtifactPaths.push(targetPath);
  }
  return targetPath;
}

function resolveMaterialLocalPath(material) {
  const explicitPath = expandUserPath(material?.originalPath || material?.value);
  if (explicitPath && fileExists(explicitPath) && fs.statSync(explicitPath).isFile()) {
    return explicitPath;
  }

  return writeMaterialContentToTempFile(material);
}

function isMaterialCompatibleWithAccept(material, acceptValue = '') {
  const accept = String(acceptValue || '').trim().toLowerCase();
  if (!accept) return true;

  const mimeType = String(material?.mimeType || '').toLowerCase();
  const name = String(material?.name || material?.value || '').toLowerCase();
  const accepts = accept.split(',').map((item) => item.trim()).filter(Boolean);

  return accepts.some((rule) => {
    if (rule.endsWith('/*')) {
      const prefix = rule.slice(0, -1);
      return mimeType.startsWith(prefix);
    }
    if (rule.startsWith('.')) {
      return name.endsWith(rule);
    }
    return mimeType === rule;
  });
}

function resolveAttachmentCandidates(referenceMaterials = [], acceptValue = '') {
  return (Array.isArray(referenceMaterials) ? referenceMaterials : [])
    .map((material) => ({
      material,
      filePath: resolveMaterialLocalPath(material)
    }))
    .filter((entry) => entry.filePath)
    .filter((entry) => isMaterialCompatibleWithAccept(entry.material, acceptValue));
}

function killChromeProcess(processRef) {
  if (!processRef?.pid) return;
  try {
    if (process.platform !== 'win32') {
      process.kill(-processRef.pid, 'SIGTERM');
    } else {
      processRef.kill('SIGTERM');
    }
  } catch {
    try {
      process.kill(processRef.pid, 'SIGTERM');
    } catch {
      // Ignore teardown failures when the process is already gone.
    }
  }
}

async function waitForChromeCdpEndpoint(port, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const payload = await new Promise((resolve) => {
      const request = http.get({
        host: DEFAULT_GATEWAY_HOST,
        port,
        path: '/json/version',
        timeout: 1_000
      }, (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(null);
          }
        });
      });

      request.on('timeout', () => {
        request.destroy();
        resolve(null);
      });
      request.on('error', () => {
        resolve(null);
      });
    });

    if (payload?.webSocketDebuggerUrl) {
      return payload;
    }

    await sleep(250);
  }

  throw new Error('等待正版 Google Chrome 调试端口超时');
}

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, DEFAULT_GATEWAY_HOST, () => {
      const address = server.address();
      server.close((closeError) => {
        if (closeError) {
          reject(closeError);
          return;
        }
        resolve(address.port);
      });
    });
  });
}

async function launchInstalledChromeSession() {
  const executablePath = detectInstalledChromeExecutable();
  if (!executablePath) return null;

  const port = await findFreePort();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openclaw-chrome-'));
  const chromeArgs = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-default-apps',
    '--disable-features=Translate',
    '--new-window',
    'about:blank'
  ];
  const child = spawn(executablePath, chromeArgs, {
    stdio: 'ignore',
    detached: process.platform !== 'win32'
  });

  child.on('exit', () => {
    if (automationChromeProcess === child) {
      automationChromeProcess = null;
      automationChromeUserDataDir = '';
      automationFlavor = '';
      playwrightBrowser = null;
      playwrightPage = null;
    }
  });

  const { chromium } = require('playwright');
  await waitForChromeCdpEndpoint(port);
  const browser = await chromium.connectOverCDP(`http://${DEFAULT_GATEWAY_HOST}:${port}`);
  const context = browser.contexts()[0] || await browser.newContext({
    viewport: { width: 1440, height: 960 }
  });
  const page = context.pages().find((candidate) => !candidate.isClosed()) || await context.newPage();

  browser.on('disconnected', () => {
    if (playwrightBrowser === browser) {
      playwrightBrowser = null;
      playwrightPage = null;
    }
  });

  automationChromeProcess = child;
  automationChromeUserDataDir = userDataDir;
  automationFlavor = 'installed-chrome-cdp';
  playwrightBrowser = browser;
  playwrightPage = page;

  return page;
}

async function disposeAutomationSession(options = {}) {
  const browser = playwrightBrowser;
  const chromeProcess = automationChromeProcess;
  const browserFlavor = automationFlavor;
  const chromeUserDataDir = automationChromeUserDataDir;
  const artifactPaths = [...automationArtifactPaths];
  playwrightBrowser = null;
  playwrightPage = null;
  playwrightLaunchPromise = null;
  automationFlavor = '';
  automationChromeProcess = null;
  automationChromeUserDataDir = '';
  automationArtifactPaths = [];

  if (browser) {
    try {
      await browser.close();
    } catch {
      // Ignore teardown failures when the browser has already exited.
    }
  }

  if (browserFlavor === 'installed-chrome-cdp' && options.keepBrowser !== true) {
    killChromeProcess(chromeProcess);
    safeRemove(chromeUserDataDir);
    artifactPaths.forEach((artifactPath) => {
      if (artifactPath !== chromeUserDataDir) {
        safeRemove(artifactPath);
      }
    });
  }
}

async function ensureAutomationPage(options = {}) {
  if (options.fresh) {
    await disposeAutomationSession();
  }

  if (playwrightPage && !playwrightPage.isClosed()) {
    return playwrightPage;
  }

  if (playwrightLaunchPromise) {
    return playwrightLaunchPromise;
  }

  playwrightLaunchPromise = (async () => {
    try {
      const installedPage = await launchInstalledChromeSession();
      if (installedPage) {
        return installedPage;
      }
    } catch (error) {
      await disposeAutomationSession();
    }
    const { chromium } = require('playwright');
    const resolvedLaunch = resolvePlaywrightLaunchOptions({
      existsSync() {
        return false;
      }
    });
    playwrightBrowser = await chromium.launch(resolvedLaunch.launchOptions);
    const context = await playwrightBrowser.newContext({
      viewport: { width: 1440, height: 960 }
    });
    playwrightPage = await context.newPage();
    automationFlavor = resolvedLaunch.browserFlavor;

    playwrightBrowser.on('disconnected', () => {
      playwrightBrowser = null;
      playwrightPage = null;
      automationFlavor = '';
    });

    return playwrightPage;
  })().finally(() => {
    playwrightLaunchPromise = null;
  });

  return playwrightLaunchPromise;
}

async function attachReferenceMaterials(page, referenceMaterials = []) {
  const materials = Array.isArray(referenceMaterials) ? referenceMaterials : [];
  if (!materials.length) {
    return {
      attached: 0,
      total: 0,
      skipped: 0
    };
  }

  const fileInput = page.locator('input[type=file]').first();
  if (await fileInput.count() < 1) {
    return {
      attached: 0,
      total: materials.length,
      skipped: materials.length
    };
  }

  const acceptValue = await fileInput.getAttribute('accept');
  const candidates = resolveAttachmentCandidates(materials, acceptValue);
  if (!candidates.length) {
    return {
      attached: 0,
      total: materials.length,
      skipped: materials.length
    };
  }

  await fileInput.setInputFiles(candidates.map((entry) => entry.filePath));
  return {
    attached: candidates.length,
    total: materials.length,
    skipped: Math.max(0, materials.length - candidates.length)
  };
}

async function waitForComposer(page, timeout = 20_000) {
  await page.waitForFunction(() => Boolean(
    document.querySelector('textarea')
    || document.querySelector('[contenteditable="true"]')
    || document.querySelector('input[type="text"]')
  ), {
    timeout
  });
}

async function fillComposer(page, prompt) {
  const strategies = [
    {
      selector: 'textarea',
      async apply(locator) {
        await locator.click();
        await locator.fill(prompt);
      }
    },
    {
      selector: '[contenteditable="true"]',
      async apply(locator) {
        await locator.click();
        await locator.evaluate((node, value) => {
          node.textContent = value;
          node.dispatchEvent(new InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' }));
          node.dispatchEvent(new Event('change', { bubbles: true }));
        }, prompt);
      }
    },
    {
      selector: 'input[type="text"]',
      async apply(locator) {
        await locator.click();
        await locator.fill(prompt);
      }
    }
  ];

  for (const strategy of strategies) {
    const locator = page.locator(strategy.selector).first();
    if (await locator.count() < 1) continue;
    await strategy.apply(locator);
    return {
      locator,
      selectorHit: strategy.selector
    };
  }

  throw new Error('未找到可输入 Prompt 的编辑器');
}

async function submitComposer(page, locator) {
  try {
    await locator.press('Enter');
    await page.waitForTimeout(250);
    return {
      submitted: true,
      strategy: 'enter-key'
    };
  } catch {
    const sendButton = page.getByRole('button', { name: /send|发送/i }).first();
    if (await sendButton.count() > 0) {
      await sendButton.click();
      await page.waitForTimeout(250);
      return {
        submitted: true,
        strategy: 'send-button'
      };
    }
  }

  return {
    submitted: false,
    strategy: 'not-submitted'
  };
}

async function automateBrowserPromptSend(prompt, options = {}) {
  const { url } = buildOpenClawControlUrl(options);
  const finalPrompt = String(prompt || '').trim();
  const referenceMaterials = Array.isArray(options.referenceMaterials) ? options.referenceMaterials : [];
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const page = await ensureAutomationPage({ fresh: attempt > 0 });

    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 20_000
      });
      await page.bringToFront();
      await waitForComposer(page);
      const attachmentResult = await attachReferenceMaterials(page, referenceMaterials);
      const composer = await fillComposer(page, finalPrompt);
      const submission = await submitComposer(page, composer.locator);

      return {
        opened: true,
        submitted: Boolean(submission.submitted),
        url,
        selectorHit: composer.selectorHit,
        mode: 'browser-automation',
        browserFlavor: automationFlavor || 'unknown',
        attachedFiles: attachmentResult.attached,
        skippedFiles: attachmentResult.skipped
      };
    } catch (error) {
      lastError = error;
      await disposeAutomationSession();
    }
  }

  throw lastError || new Error('OpenClaw 控制台自动发送失败');
}

function resetAutomationStateForTests() {
  return disposeAutomationSession();
}

module.exports = {
  buildOpenClawControlUrl,
  detectInstalledChromeExecutable,
  expandUserPath,
  getGatewaySettings,
  automateBrowserPromptSend,
  resolveAttachmentCandidates,
  resolvePlaywrightLaunchOptions,
  resetAutomationStateForTests
};
