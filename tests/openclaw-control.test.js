const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  detectInstalledChromeExecutable,
  expandUserPath,
  resolveAttachmentCandidates,
  resetAutomationStateForTests,
  resolvePlaywrightLaunchOptions
} = require('../src/lib/openclaw-control');

test('detectInstalledChromeExecutable prefers installed Google Chrome on macOS', () => {
  const executable = detectInstalledChromeExecutable({
    platform: 'darwin',
    home: '/Users/demo',
    existsSync(filePath) {
      return filePath === '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    }
  });

  assert.equal(executable, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
});

test('detectInstalledChromeExecutable respects explicit browser path override', () => {
  const executable = detectInstalledChromeExecutable({
    platform: 'darwin',
    env: {
      OPENCLAW_AUTOMATION_BROWSER_PATH: '/custom/chrome'
    },
    existsSync(filePath) {
      return filePath === '/custom/chrome';
    }
  });

  assert.equal(executable, '/custom/chrome');
});

test('resolvePlaywrightLaunchOptions falls back to playwright chromium when no installed chrome is found', () => {
  const resolved = resolvePlaywrightLaunchOptions({
    platform: 'linux',
    existsSync() {
      return false;
    }
  });

  assert.equal(resolved.browserFlavor, 'playwright-chromium');
  assert.equal(Boolean(resolved.launchOptions.executablePath), false);
  assert.equal(resolved.launchOptions.headless, false);
});

test('resolvePlaywrightLaunchOptions uses installed chrome executable when available', () => {
  const chromePath = path.join('C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe');
  const resolved = resolvePlaywrightLaunchOptions({
    platform: 'win32',
    env: {
      PROGRAMFILES: 'C:\\Program Files'
    },
    existsSync(filePath) {
      return filePath === chromePath;
    }
  });

  assert.equal(resolved.browserFlavor, 'installed-chrome');
  assert.equal(resolved.launchOptions.executablePath, chromePath);
  assert.equal(resolved.launchOptions.headless, false);
});

test('expandUserPath expands tilde-prefixed paths', () => {
  const expanded = expandUserPath('~/demo/file.txt');
  assert.match(expanded, /demo[\\/]+file\.txt$/);
  assert.ok(expanded.startsWith(process.env.HOME || process.env.USERPROFILE));
});

test('resolveAttachmentCandidates keeps compatible local files and skips incompatible ones', async () => {
  const fixtureDir = path.join(__dirname, '.tmp-openclaw-control');
  const imagePath = path.join(fixtureDir, 'preview.png');
  const docPath = path.join(fixtureDir, 'notes.pdf');

  await fs.promises.mkdir(fixtureDir, { recursive: true });
  await fs.promises.writeFile(imagePath, 'png-fixture');
  await fs.promises.writeFile(docPath, 'pdf-fixture');

  const attachments = resolveAttachmentCandidates([
    { kind: 'image', name: 'preview.png', value: imagePath, mimeType: 'image/png' },
    { kind: 'file', name: 'notes.pdf', value: docPath, mimeType: 'application/pdf' }
  ], 'image/*');

  assert.equal(attachments.length, 1);
  assert.equal(attachments[0].filePath, imagePath);

  await fs.promises.rm(fixtureDir, { recursive: true, force: true });
  await resetAutomationStateForTests();
});
