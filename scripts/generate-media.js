const fs = require('node:fs');
const path = require('node:path');

const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const MEDIA_DIR = path.join(ROOT, 'docs', 'media');
const APP_URL = 'http://127.0.0.1:4318';

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function waitForLibrary(page) {
  await page.click('[data-view-tab="library"]');
  await page.waitForSelector('.skill-card', { timeout: 20_000 });
}

async function waitForGenerator(page) {
  await page.click('[data-view-tab="generator"]');
  await page.waitForSelector('.generator-shell', { timeout: 20_000 });
}

async function captureAppScreenshots(page) {
  await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.setViewportSize({ width: 1600, height: 1100 });

  await waitForGenerator(page);
  await page.selectOption('#generator-template-select', 'prd');
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(MEDIA_DIR, 'readme-generator.png')
  });

  await waitForLibrary(page);
  await page.screenshot({
    path: path.join(MEDIA_DIR, 'readme-library.png')
  });

  const firstCard = page.locator('.skill-card').first();
  await firstCard.click();
  await page.waitForSelector('#workbench-modal:not([hidden])', { timeout: 20_000 });
  await page.screenshot({
    path: path.join(MEDIA_DIR, 'readme-workbench.png')
  });
  await page.click('#workbench-modal-close-btn');
  await page.waitForFunction(() => Boolean(document.querySelector('#workbench-modal')?.hidden), { timeout: 20_000 });

  await page.click('[data-view-tab="generator"]');
  await page.selectOption('#generator-template-select', 'prd');
  await page.waitForTimeout(600);
  await page.click('[data-action="next-generator-step"]');
  await page.click('[data-action="next-generator-step"]');
  await page.click('#generator-preview-btn');
  await page.waitForSelector('#generator-preview-modal:not([hidden])', { timeout: 20_000 });
  await page.screenshot({
    path: path.join(MEDIA_DIR, 'readme-prompt-preview.png')
  });
}

function imageDataUrl(filePath) {
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function renderSocialAssets(browser) {
  const generatorShot = imageDataUrl(path.join(MEDIA_DIR, 'readme-generator.png'));
  const libraryShot = imageDataUrl(path.join(MEDIA_DIR, 'readme-library.png'));

  const page = await browser.newPage({ viewport: { width: 1280, height: 640 } });
  const html = `
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <style>
        :root {
          --bg-1: #060915;
          --bg-2: #0d1630;
          --coral: #ff6a63;
          --coral-soft: #ff948d;
          --cyan: #61e2d7;
          --text: #f5f7ff;
          --muted: rgba(245,247,255,0.75);
          --panel: rgba(12, 18, 37, 0.78);
          --stroke: rgba(255,255,255,0.08);
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: var(--text);
          background:
            radial-gradient(circle at 15% 20%, rgba(255,106,99,0.25), transparent 28%),
            radial-gradient(circle at 85% 18%, rgba(97,226,215,0.22), transparent 24%),
            linear-gradient(135deg, var(--bg-1), var(--bg-2));
          width: 1280px;
          height: 640px;
          overflow: hidden;
        }
        .frame {
          position: relative;
          width: 100%;
          height: 100%;
          padding: 54px 58px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 28px;
        }
        .logo {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: linear-gradient(180deg, #ff7d73, #ff5248);
          box-shadow: 0 0 30px rgba(255,106,99,0.4);
        }
        .brand-name {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }
        .brand-name span {
          background: linear-gradient(90deg, var(--coral), #f3c8be, var(--cyan));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        h1 {
          margin: 0;
          width: 48%;
          font-size: 54px;
          line-height: 1.06;
          letter-spacing: -0.03em;
        }
        p {
          margin: 18px 0 0;
          width: 47%;
          color: var(--muted);
          font-size: 22px;
          line-height: 1.45;
        }
        .chips {
          display: flex;
          gap: 12px;
          margin-top: 22px;
        }
        .chip {
          padding: 10px 14px;
          border: 1px solid var(--stroke);
          border-radius: 999px;
          background: rgba(255,255,255,0.05);
          color: var(--text);
          font-size: 15px;
        }
        .shot {
          position: absolute;
          right: 54px;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid var(--stroke);
          box-shadow: 0 30px 80px rgba(0,0,0,0.45);
          background: var(--panel);
        }
        .shot img {
          display: block;
          width: 100%;
          height: auto;
        }
        .shot-primary {
          top: 78px;
          width: 560px;
          transform: rotate(-2.8deg);
        }
        .shot-secondary {
          top: 318px;
          right: 420px;
          width: 390px;
          transform: rotate(3deg);
        }
      </style>
    </head>
    <body>
      <div class="frame">
        <div class="brand">
          <div class="logo"></div>
          <div class="brand-name"><span>ClawForge</span></div>
        </div>
        <h1>Visual workspace for browsing, configuring, and generating OpenClaw Skills</h1>
        <p>Use real local Skill data, file-aware workbenches, and a guided prompt generator to operate OpenClaw faster.</p>
        <div class="chips">
          <div class="chip">Electron</div>
          <div class="chip">Browser Mode</div>
          <div class="chip">OpenClaw Control</div>
        </div>
        <div class="shot shot-primary"><img src="${generatorShot}" alt="generator" /></div>
        <div class="shot shot-secondary"><img src="${libraryShot}" alt="library" /></div>
      </div>
    </body>
  </html>`;

  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({
    path: path.join(MEDIA_DIR, 'social-preview.png')
  });

  await page.setViewportSize({ width: 1600, height: 900 });
  await page.screenshot({
    path: path.join(MEDIA_DIR, 'repo-cover.png')
  });

  await page.close();
}

async function main() {
  ensureDir(MEDIA_DIR);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
    await captureAppScreenshots(page);
    await page.close();
    await renderSocialAssets(browser);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
