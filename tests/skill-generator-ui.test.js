const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { chromium } = require('playwright');

const { createServer } = require('../src/server');

const staticDir = path.join(__dirname, '..', 'public');

const dashboardPayload = {
  generatedAt: new Date().toISOString(),
  environment: {
    platform: 'darwin',
    configPath: '~/.openclaw/openclaw.json',
    stateDir: '~/.openclaw',
    workspaceDir: '~/workspace',
    managedSkillsDir: '~/.openclaw/skills',
    bundledSkillsDir: '~/openclaw/skills'
  },
  summary: {
    total: 2,
    ready: 1,
    blocked: 1,
    personal: 1,
    bundled: 1,
    configured: 1,
    highFrequency: 1,
    scheduled: 1
  },
  telemetry: {
    usageAvailable: true,
    cronAvailable: true
  },
  skills: [
    {
      id: 'prd-skill',
      name: 'prd-skill',
      skillKey: 'prd-skill',
      description: '把需求分析整理成 PRD',
      emoji: 'OC',
      source: 'personal',
      sourceRaw: 'personal',
      sourceLabel: '个人技能',
      location: '~/skills/prd-skill',
      primaryEnv: 'OPENCLAW_API_KEY',
      status: {
        tone: 'ready',
        label: '已就绪',
        note: '当前环境已满足运行条件。'
      },
      configEntry: {
        exists: true,
        enabled: true,
        apiKey: 'stored-key',
        env: {
          OPENCLAW_REGION: 'cn'
        },
        config: {
          template: 'prd'
        }
      },
      usage: {
        count7d: 24,
        count30d: 91,
        totalCount: 328,
        lastUsedAt: '2026-04-04T12:00:00.000Z',
        lastUsedAtMs: 1775304000000,
        isHighFrequency: true
      },
      automation: {
        available: true,
        boundCount: 2,
        label: '已绑定 2 个任务',
        warning: '当前 Skill 已绑定 2 个定时任务，修改配置后可能影响自动执行。',
        jobs: [
          {
            id: 'cron-1',
            name: '每日巡检',
            scheduleLabel: 'cron 0 9 * * * @ Asia/Shanghai',
            lastRunStatus: 'ok',
            lastRunAt: '2026-04-04T09:00:00.000Z',
            lastRunAtMs: 1775293200000
          },
          {
            id: 'cron-2',
            name: '晚间汇总',
            scheduleLabel: 'cron 0 21 * * * @ Asia/Shanghai',
            lastRunStatus: 'ok',
            lastRunAt: '2026-04-04T21:00:00.000Z',
            lastRunAtMs: 1775336400000
          }
        ]
      },
      health: {
        level: 'warning',
        status: 'configMissing',
        label: '配置缺失',
        risks: [
          {
            code: 'configMissing',
            title: '配置缺失',
            detail: '主密钥 OPENCLAW_API_KEY 为空',
            actionLabel: '去配置面板',
            actionTarget: 'config-panel'
          },
          {
            code: 'configOverride',
            title: '本地配置覆盖默认值',
            detail: '当前存在本地覆盖：apiKey、OPENCLAW_REGION、template',
            actionLabel: '查看配置面板',
            actionTarget: 'config-panel'
          }
        ],
        summary: ['配置缺失', '本地配置覆盖默认值']
      }
    },
    {
      id: 'ops-skill',
      name: 'ops-skill',
      skillKey: 'ops-skill',
      description: '运营分析',
      emoji: 'OC',
      source: 'bundled',
      sourceRaw: 'bundled',
      sourceLabel: '内置技能',
      location: '~/openclaw/skills/ops-skill',
      status: {
        tone: 'warn',
        label: '待配置',
        note: '缺少配置项'
      },
      configEntry: {
        exists: false,
        enabled: true,
        apiKey: '',
        env: {},
        config: {}
      },
      usage: {
        count7d: 0,
        count30d: 2,
        totalCount: 4,
        lastUsedAt: '2026-03-10T12:00:00.000Z',
        lastUsedAtMs: 1773144000000,
        isHighFrequency: false
      },
      automation: {
        available: true,
        boundCount: 0,
        label: '未绑定',
        warning: '',
        jobs: []
      },
      health: {
        level: 'healthy',
        status: 'normal',
        label: '正常',
        risks: [],
        summary: []
      }
    }
  ]
};

const detailPayload = {
  ...dashboardPayload.skills[0],
  files: ['SKILL.md', 'assets/'],
  fileEntries: [
    {
      path: 'SKILL.md',
      name: 'SKILL.md',
      isDirectory: false,
      editable: true,
      purpose: 'Skill 主说明文件，通常定义用途、触发方式、适用场景、执行规则和输出要求。',
      configHints: ['frontmatter 字段：name、description', '正文章节：适用场景、测试方法']
    },
    {
      path: 'assets/',
      name: 'assets',
      isDirectory: true,
      editable: false,
      purpose: '素材或模板目录，通常放图片、模板、示例输出等 supporting files。',
      configHints: []
    },
    {
      path: 'assets/template.md',
      name: 'template.md',
      isDirectory: false,
      editable: true,
      purpose: 'supporting files 里的素材或模板文件，通常被 SKILL.md 引用。',
      configHints: ['没有检测到结构化配置；当前文件更像说明、模板或脚本内容。']
    }
  ],
  requirements: {
    bins: ['node'],
    env: ['OPENCLAW_API_KEY'],
    config: ['template'],
    os: []
  },
  missing: {
    bins: [],
    env: [],
    config: [],
    os: []
  },
  install: ['npm install'],
  configChecks: ['template'],
  skillMdPreview: '# PRD skill\n\n适用场景：把重复需求整理成 PRD。\n\n测试方法：给一个需求片段，验证输出结构是否完整。',
  health: {
    level: 'warning',
    status: 'configMissing',
    label: '配置缺失',
    risks: [
      {
        code: 'configMissing',
        title: '配置缺失',
        detail: '主密钥 OPENCLAW_API_KEY 为空',
        actionLabel: '去配置面板',
        actionTarget: 'config-panel'
      },
      {
        code: 'configOverride',
        title: '本地配置覆盖默认值',
        detail: '当前存在本地覆盖：apiKey、OPENCLAW_REGION、template',
        actionLabel: '查看配置面板',
        actionTarget: 'config-panel'
      }
    ],
    summary: ['配置缺失', '本地配置覆盖默认值']
  }
};

const mockSkillFiles = {
  'SKILL.md': {
    path: 'SKILL.md',
    name: 'SKILL.md',
    isDirectory: false,
    editable: true,
    purpose: 'Skill 主说明文件，通常定义用途、触发方式、适用场景、执行规则和输出要求。',
    configHints: ['frontmatter 字段：name、description', '正文章节：适用场景、测试方法'],
    content: '# PRD skill\n\n适用场景：把重复需求整理成 PRD。\n\n测试方法：给一个需求片段，验证输出结构是否完整。\n',
    updatedAt: '2026-04-05T00:00:00.000Z',
    size: 96
  },
  'assets/': {
    path: 'assets/',
    name: 'assets',
    isDirectory: true,
    editable: false,
    purpose: '素材或模板目录，通常放图片、模板、示例输出等 supporting files。',
    configHints: ['当前目录包含：assets/template.md'],
    content: '',
    updatedAt: '2026-04-05T00:00:00.000Z',
    size: 0
  },
  'assets/template.md': {
    path: 'assets/template.md',
    name: 'template.md',
    isDirectory: false,
    editable: true,
    purpose: 'supporting files 里的素材或模板文件，通常被 SKILL.md 引用。',
    configHints: ['没有检测到结构化配置；当前文件更像说明、模板或脚本内容。'],
    content: '# Template\n\n- Title\n- Summary\n',
    updatedAt: '2026-04-05T00:00:00.000Z',
    size: 30
  }
};

async function startMockServer(options = {}) {
  const updateConfigDelayMs = Number(options.updateConfigDelayMs || 0);
  const dashboard = options.dashboardPayload
    ? JSON.parse(JSON.stringify(options.dashboardPayload))
    : JSON.parse(JSON.stringify(dashboardPayload));
  const detail = options.detailPayload
    ? JSON.parse(JSON.stringify(options.detailPayload))
    : JSON.parse(JSON.stringify(detailPayload));
  const skillFiles = options.mockSkillFiles
    ? JSON.parse(JSON.stringify(options.mockSkillFiles))
    : JSON.parse(JSON.stringify(mockSkillFiles));
  const baseStatusBySkill = new Map(
    dashboard.skills.map((skill) => [skill.name, { ...skill.status }])
  );

  const service = {
    async getDashboardPayload() {
      return dashboard;
    },
    async getSkillDetail() {
      return detail;
    },
    async getSkillFile(skillName, filePath) {
      if (skillName !== 'prd-skill') {
        throw new Error('Unexpected skill');
      }
      return skillFiles[filePath];
    },
    async updateSkillFile(skillName, filePath, content) {
      if (skillName !== 'prd-skill') {
        throw new Error('Unexpected skill');
      }
      skillFiles[filePath] = {
        ...skillFiles[filePath],
        content
      };
      return skillFiles[filePath];
    },
    async updateSkillConfig(skillName, payload) {
      const target = dashboard.skills.find((skill) => skill.name === skillName);
      if (!target) {
        throw new Error('Unexpected skill');
      }

      if (updateConfigDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, updateConfigDelayMs));
      }

      target.configEntry = {
        ...target.configEntry,
        exists: true,
        enabled: payload.enabled !== false,
        apiKey: String(payload.apiKey || ''),
        env: payload.env || {},
        config: payload.config || {}
      };

      if (payload.enabled === false) {
        if (target.status?.tone !== 'off') {
          baseStatusBySkill.set(skillName, { ...target.status });
        }
        target.status = {
          tone: 'off',
          label: '已禁用',
          note: '当前 Skill 已被手动禁用。'
        };
      } else {
        target.status = baseStatusBySkill.get(skillName) || {
          tone: 'ready',
          label: '已就绪',
          note: '当前环境已满足运行条件。'
        };
      }

      if (detail.name === skillName) {
        detail.configEntry = { ...target.configEntry };
        detail.status = { ...target.status };
        return detail;
      }

      return {
        ...target,
        files: [],
        fileEntries: [],
        requirements: { bins: [], env: [], config: [], os: [] },
        missing: { bins: [], env: [], config: [], os: [] },
        install: [],
        configChecks: [],
        skillMdPreview: ''
      };
    }
  };

  const controlBridge = {
    async getLaunchState() {
      return {
        url: 'http://127.0.0.1:18789/chat?session=main'
      };
    },
    async sendPrompt(prompt) {
      return {
        opened: true,
        submitted: true,
        url: 'http://127.0.0.1:18789/chat?session=main',
        promptLength: String(prompt || '').length,
        mode: 'mock-browser-control'
      };
    }
  };

  const { server } = createServer({ staticDir, service, controlBridge });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  return {
    server,
    url: `http://127.0.0.1:${address.port}`,
    skillFiles,
    dashboard,
    detail
  };
}

let browser;
let serverHandle;

test.before(async () => {
  browser = await chromium.launch({ headless: true });
  serverHandle = await startMockServer();
});

test.after(async () => {
  await browser.close();
  await new Promise((resolve) => {
    serverHandle.server.close(() => resolve());
  });
});

async function createPage(options = {}) {
  const targetUrl = options.serverUrl || serverHandle.url;
  const context = await browser.newContext();
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: targetUrl });
  const page = await context.newPage();
  const pageErrors = [];

  page.on('pageerror', (error) => {
    pageErrors.push(error.stack || String(error));
  });

  await page.addInitScript(() => {
    window.__openedUrls = [];
    window.open = (url) => {
      window.__openedUrls.push(url);
      return {
        closed: false,
        focus() {}
      };
    };

    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: {
        async writeText(text) {
          window.__copiedText = text;
        }
      }
    });
  });

  if (options.desktopRecoveryMock) {
    await page.addInitScript((origin) => {
      const originalFetch = window.fetch.bind(window);
      let allowDashboardFetch = false;
      window.__recoverCalls = 0;

      window.openclawDesktop = {
        getClientInfo() {
          return {
            name: 'OpenClaw 技能可视化配置客户端',
            version: '0.1.0-test',
            platform: 'darwin'
          };
        },
        isDesktopClient() {
          return true;
        },
        async recoverLocalService() {
          window.__recoverCalls += 1;
          allowDashboardFetch = true;
          return {
            ok: true,
            url: origin,
            recoveredAt: new Date().toISOString()
          };
        },
        async copyText(text) {
          window.__copiedText = text;
          return { ok: true, mode: 'desktop' };
        },
        async openOpenClawControl(payload) {
          window.__openedUrls = window.__openedUrls || [];
          window.__openedUrls.push(`desktop:${payload?.prompt ? 'prompt' : 'empty'}`);
          return {
            opened: true,
            url: 'desktop://openclaw-control'
          };
        }
      };

      window.fetch = async (...args) => {
        const requestUrl = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
        if (!allowDashboardFetch && /\/api\/dashboard(\?|$)/.test(requestUrl)) {
          throw new Error('Simulated local service failure');
        }
        return originalFetch(...args);
      };
    }, targetUrl);
  }

  if (options.browserRetryMock) {
    await page.addInitScript(() => {
      window.__OPENCLAW_BROWSER_RETRY_DELAY_MS = 40;
      const originalFetch = window.fetch.bind(window);
      const failUntil = Date.now() + 20;

      window.fetch = async (...args) => {
        const requestUrl = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
        if (/\/api\/dashboard(\?|$)/.test(requestUrl) && Date.now() < failUntil) {
          throw new Error('Simulated browser mode failure');
        }
        return originalFetch(...args);
      };
    });
  }

  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  return { context, page, pageErrors };
}

async function goToGeneratorFinalStep(page) {
  for (let index = 0; index < 2; index += 1) {
    await page.click('#generator-preview-btn');
  }
  await page.waitForFunction(() => (document.querySelector('#generator-preview-btn')?.textContent || '').trim() === '生成');
}

test('generator workspace hides library navigation and renders as a single workbench', async () => {
  const { page, context } = await createPage();

  assert.equal(await page.locator('#generator-view').isVisible(), true);
  assert.equal(await page.locator('#library-view').isHidden(), true);
  assert.equal(await page.locator('#view-tabs').isHidden(), true);
  assert.equal(await page.locator('#generator-hero').count(), 0);
  assert.equal(await page.locator('#generator-insight-panel').count(), 0);
  assert.equal(await page.locator('#generator-preview-card').count(), 0);
  assert.equal(await page.locator('.generator-input-panel').isVisible(), true);
  assert.equal(await page.inputValue('#gen-scenario-name'), '');
  assert.equal(await page.getAttribute('#gen-scenario-name', 'placeholder'), '例如：会议纪要与行动项提炼');
  assert.equal(await page.locator('#generator-preview-btn').count(), 1);
  assert.equal(await page.locator('#generator-template-select option').count(), 9);
  assert.equal(await page.locator('#generator-validation-summary').count(), 1);
  assert.equal(await page.locator('#generator-trigger-mode-list [data-chip-value]').count(), 4);
  assert.equal(await page.locator('#generator-command-config').isHidden(), true);
  assert.equal(await page.locator('#generator-keyword-config').isHidden(), true);

  await page.selectOption('#generator-template-select', 'prd');
  await page.waitForFunction(() => document.querySelector('#gen-scenario-name')?.value === 'PRD 需求文档生成');
  assert.match(await page.inputValue('#gen-scenario-name'), /PRD 需求文档生成/);
  assert.match(await page.textContent('#generator-template-description'), /PRD|需求/);
  assert.match(await page.textContent('#generator-panel-title'), /填写工作区|Workspace/);
  assert.match(await page.textContent('.generator-input-panel'), /PRD 需求文档生成/);

  await page.click('#generator-trigger-mode-list [data-chip-value="keyword"]');
  assert.equal(await page.locator('#generator-keyword-config').isHidden(), false);
  assert.equal(await page.locator('#generator-command-config').isHidden(), true);
  assert.match(await page.textContent('#generator-keyword-config'), /触发关键词/);

  await page.click('#generator-trigger-mode-list [data-chip-value="slash"]');
  assert.equal(await page.locator('#generator-command-config').isHidden(), false);
  assert.equal(await page.locator('#generator-keyword-config').isHidden(), true);
  assert.match(await page.inputValue('#gen-trigger-command-name'), /\/prd-draft/);
  assert.equal((await page.textContent('#generator-preview-btn')).trim(), '下一步');
  assert.equal(await page.locator('#generator-step-list [data-generator-step]').count(), 3);
  assert.equal(await page.locator('#generator-status').isVisible(), false);
  assert.equal(await page.locator('#generator-preview-modal').isHidden(), true);

  await goToGeneratorFinalStep(page);
  await page.click('#generator-preview-btn');

  assert.equal(await page.locator('#generator-preview-modal').isHidden(), false);
  assert.equal(await page.locator('#generator-status').isVisible(), false);
  assert.equal(await page.locator('#generator-material-preview').isHidden(), true);
  assert.match(await page.textContent('#generator-block-list'), /场景定位总结/);
  assert.match(await page.textContent('#generator-block-list'), /推荐 Skill 名称/);
  assert.match(await page.textContent('#generator-block-list'), /SKILL\.md/);
  assert.match(await page.textContent('#generator-block-list'), /待补充信息/);

  await context.close();
});

test('primary UI keeps the library surface hidden from navigation and first-screen layout', async () => {
  const { page, context, pageErrors } = await createPage();
  assert.equal(await page.locator('#workbench-modal').isHidden(), true);
  assert.equal(await page.locator('#view-tabs').isHidden(), true);
  assert.equal(await page.locator('#library-view').isHidden(), true);
  assert.equal(await page.locator('#library-view [data-skill-name]').count(), 2);
  assert.equal(await page.locator('#generator-view').isVisible(), true);
  assert.equal(await page.locator('#generator-hero').count(), 0);
  assert.match(await page.textContent('#generator-panel-title'), /填写工作区|Workspace/);
  assert.deepEqual(pageErrors, []);

  await context.close();
});

test('browser mode renders dashboard when cron telemetry is unavailable', async () => {
  const handle = await startMockServer({
    dashboardPayload: {
      ...dashboardPayload,
      telemetry: {
        ...dashboardPayload.telemetry,
        cronAvailable: false
      },
      summary: {
        ...dashboardPayload.summary,
        scheduled: 0
      }
    }
  });

  const { page, context, pageErrors } = await createPage({ serverUrl: handle.url });
  await page.waitForSelector('#generator-view');
  assert.equal(await page.locator('#view-tabs').isHidden(), true);
  assert.equal(await page.locator('#library-view').isHidden(), true);
  assert.equal(await page.locator('.generator-input-panel').isVisible(), true);
  assert.match(await page.textContent('#top-control-link'), /打开 OpenClaw/);
  assert.deepEqual(pageErrors, []);

  await context.close();
  await new Promise((resolve) => handle.server.close(resolve));
});

test('browser mode falls back when dashboard environment is missing', async () => {
  const dashboardWithoutEnvironment = JSON.parse(JSON.stringify(dashboardPayload));
  delete dashboardWithoutEnvironment.environment;
  dashboardWithoutEnvironment.telemetry.cronAvailable = false;
  dashboardWithoutEnvironment.summary.scheduled = 0;

  const handle = await startMockServer({
    dashboardPayload: dashboardWithoutEnvironment
  });

  const { page, context, pageErrors } = await createPage({ serverUrl: handle.url });
  await page.waitForSelector('#generator-view');
  assert.equal(await page.locator('#view-tabs').isHidden(), true);
  assert.equal(await page.locator('.generator-input-panel').isVisible(), true);
  assert.deepEqual(pageErrors, []);

  await context.close();
  await new Promise((resolve) => handle.server.close(resolve));
});

test('generator workspace uses a single-column layout without side rails', async () => {
  const { page, context } = await createPage();

  const layout = await page.evaluate(() => {
    const shell = document.querySelector('#generator-view').getBoundingClientRect();
    const panel = document.querySelector('.generator-input-panel').getBoundingClientRect();
    return {
      panelWideEnough: panel.width >= shell.width - 64,
      leftAligned: Math.abs(panel.left - shell.left) <= 24,
      noSidePanels: document.querySelectorAll('.generator-side-panel').length === 0
    };
  });

  assert.equal(layout.panelWideEnough, true);
  assert.equal(layout.leftAligned, true);
  assert.equal(layout.noSidePanels, true);

  await context.close();
});

test('language toggle switches core copy and persists to localStorage', async () => {
  const { page, context } = await createPage();

  assert.match(await page.textContent('#app-title'), /爪工坊/);
  assert.match(await page.textContent('#app-subtitle'), /围绕 Skill 生成器的轻量开源工作台/);
  assert.match(await page.textContent('#top-control-link'), /打开 OpenClaw/);
  assert.match(await page.textContent('#generator-panel-title'), /填写工作区/);

  await page.click('#language-toggle-btn');

  await page.waitForFunction(() => (document.querySelector('#language-toggle-btn')?.textContent || '').trim() === '中');
  assert.match(await page.textContent('#app-subtitle'), /lightweight open-source workspace for Skill generation/i);
  assert.match(await page.textContent('#top-control-link'), /Open OpenClaw/);
  assert.match(await page.textContent('#generator-panel-title'), /Workspace/);

  const storedLocale = await page.evaluate(() => window.localStorage.getItem('clawforge-locale'));
  assert.equal(storedLocale, 'en');

  await page.reload({ waitUntil: 'networkidle' });
  assert.match(await page.textContent('#generator-panel-title'), /Workspace/);

  await context.close();
});

test('theme toggle defaults to dark mode and persists light mode selection', async () => {
  const { page, context } = await createPage();

  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  assert.equal(await page.getAttribute('#theme-toggle-btn', 'title'), 'Switch to light mode');
  assert.equal(await page.textContent('#theme-toggle-icon'), '☀');

  await page.click('#theme-toggle-btn');

  await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
  assert.equal(await page.getAttribute('#theme-toggle-btn', 'title'), 'Switch to dark mode');
  assert.equal(await page.textContent('#theme-toggle-icon'), '☾');
  assert.equal(await page.evaluate(() => window.localStorage.getItem('clawforge-theme')), 'light');

  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light');

  await context.close();
});

test('desktop client auto-recovers local service and retries dashboard fetch', async () => {
  const { page, context } = await createPage({ desktopRecoveryMock: true });
  await page.waitForSelector('#generator-view');
  assert.equal(await page.locator('#generator-view').isVisible(), true);
  assert.match(await page.textContent('#refresh-state'), /最近刷新/);
  const recoverCalls = await page.evaluate(() => window.__recoverCalls);
  assert.equal(recoverCalls, 1);

  await context.close();
});

test('browser mode auto-retries dashboard fetch after local service failure', async () => {
  const { page, context } = await createPage({ browserRetryMock: true });
  await page.waitForSelector('#generator-view');
  assert.equal(await page.locator('#generator-view').isVisible(), true);
  assert.match(await page.textContent('#refresh-state'), /最近刷新/);

  await context.close();
});

test('generator footer bar and modal actions stay pinned while scrolling', async () => {
  const { page, context } = await createPage();

  const topShellPinned = await page.evaluate(async () => {
    const topShell = document.querySelector('.top-shell');
    const panel = document.querySelector('.generator-input-panel');
    const shell = document.querySelector('.shell');
    const measure = () => ({
      top: Math.round(topShell.getBoundingClientRect().top),
      panelWidth: Math.round(panel.getBoundingClientRect().width),
      viewportWidth: Math.round(window.innerWidth),
      panelLeft: Math.round(panel.getBoundingClientRect().left),
      shellLeft: Math.round(shell.getBoundingClientRect().left)
    });

    const before = measure();
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
    await new Promise((resolve) => setTimeout(resolve, 80));
    const after = measure();

    return {
      stickyTop: after.top <= 2,
      compactPanel: before.panelWidth < before.viewportWidth - 32,
      leftAligned: Math.abs(before.panelLeft - before.shellLeft) <= 24
    };
  });

  assert.equal(topShellPinned.stickyTop, true);
  assert.equal(topShellPinned.compactPanel, true);
  assert.equal(topShellPinned.leftAligned, true);

  const generatorPinned = await page.evaluate(async () => {
    const measure = () => {
      const reset = document.querySelector('#generator-reset-btn').getBoundingClientRect();
      const generate = document.querySelector('#generator-preview-btn').getBoundingClientRect();
      return {
        resetTop: Math.round(reset.top),
        generateTop: Math.round(generate.top),
        viewportBottom: Math.round(window.innerHeight)
      };
    };

    const before = measure();
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
    await new Promise((resolve) => setTimeout(resolve, 80));
    const after = measure();

    return {
      sameResetTop: Math.abs(before.resetTop - after.resetTop) <= 2,
      sameGenerateTop: Math.abs(before.generateTop - after.generateTop) <= 2,
      nearBottom: before.viewportBottom - after.generateTop < 120
    };
  });

  assert.equal(generatorPinned.sameResetTop, true);
  assert.equal(generatorPinned.sameGenerateTop, true);
  assert.equal(generatorPinned.nearBottom, true);

  await goToGeneratorFinalStep(page);
  await page.click('#generator-preview-btn');

  const modalPinned = await page.evaluate(async () => {
    const body = document.querySelector('.generator-preview-body');
    const copyBtn = document.querySelector('#generator-copy-btn');
    const sendBtn = document.querySelector('#generator-send-btn');
    const measure = () => ({
      copyTop: Math.round(copyBtn.getBoundingClientRect().top),
      sendTop: Math.round(sendBtn.getBoundingClientRect().top),
      copyBottom: Math.round(copyBtn.getBoundingClientRect().bottom),
      sendBottom: Math.round(sendBtn.getBoundingClientRect().bottom),
      viewportHeight: Math.round(window.innerHeight)
    });

    const before = measure();
    body.scrollTop = body.scrollHeight;
    body.dispatchEvent(new Event('scroll'));
    await new Promise((resolve) => setTimeout(resolve, 80));
    const after = measure();

    return {
      sameCopyTop: Math.abs(before.copyTop - after.copyTop) <= 2,
      sameSendTop: Math.abs(before.sendTop - after.sendTop) <= 2,
      buttonsVisible: after.copyBottom <= after.viewportHeight && after.sendBottom <= after.viewportHeight
    };
  });

  assert.equal(modalPinned.sameCopyTop, true);
  assert.equal(modalPinned.sameSendTop, true);
  assert.equal(modalPinned.buttonsVisible, true);

  await context.close();
});

test('generator reset clears fields and result text', async () => {
  const { page, context } = await createPage();

  await page.fill('#gen-scenario-name', '临时改掉');
  await page.click('[data-action="reset-generator"]');

  assert.equal(await page.inputValue('#gen-scenario-name'), '');
  assert.match(await page.textContent('#generator-status'), /已重置生成器/);
  assert.match(await page.textContent('#generator-material-list'), /还没有参考材料/);
  assert.equal((await page.textContent('#generator-preview-btn')).trim(), '下一步');
  assert.equal(await page.locator('#generator-template-select').inputValue(), 'blank');

  await context.close();
});

test('generator supports adding reference materials and updates prompt preview', async () => {
  const { page, context } = await createPage();

  await page.selectOption('#generator-template-select', 'competitive');
  await page.waitForFunction(() => document.querySelector('#gen-scenario-name')?.value === '竞品调研总结');
  await goToGeneratorFinalStep(page);

  await page.selectOption('#generator-material-type', 'path');
  await page.fill('#generator-material-value', '/Users/demo/Desktop/竞品截图.png');
  await page.fill('#generator-material-note', '主参考截图');
  await page.click('#generator-material-add');

  assert.match(await page.textContent('#generator-material-list'), /竞品截图\.png/);
  assert.match(await page.textContent('#generator-status'), /参考材料/);

  await page.setInputFiles('#generator-material-file', {
    name: 'brief.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('demo pdf')
  });

  await page.waitForFunction(() => document.querySelector('#generator-material-list')?.textContent.includes('brief.pdf'));
  assert.match(await page.textContent('#generator-material-list'), /brief\.pdf/);

  assert.equal((await page.textContent('#generator-preview-btn')).trim(), '生成');
  await page.click('#generator-preview-btn');
  await page.waitForFunction(() => !document.querySelector('#generator-material-preview')?.hidden);

  assert.match(await page.textContent('#generator-material-preview-summary'), /共 2 份/);
  assert.match(await page.textContent('#generator-material-preview'), /兼容的本地文件或图片会尝试随发送动作一起附上/);
  assert.match(await page.textContent('#generator-material-preview-list'), /brief\.pdf/);
  assert.equal(await page.locator('#generator-preview-modal').isHidden(), false);

  await page.click('[data-action="copy-prompt"]');
  const copiedPrompt = await page.evaluate(() => window.__copiedText);
  assert.match(copiedPrompt, /参考材料清单/);
  assert.match(copiedPrompt, /brief\.pdf/);

  await page.click('#generator-material-preview-list [data-preview-material]');
  assert.equal(await page.locator('#generator-material-modal').isHidden(), false);
  assert.match(await page.textContent('#generator-material-modal-subtitle'), /材料预览|链接|本地路径|图片|文件/);

  await context.close();
});

test('copy and send show clear status feedback', async () => {
  const { page, context } = await createPage();

  await page.selectOption('#generator-template-select', 'meeting');
  await page.waitForFunction(() => document.querySelector('#gen-scenario-name')?.value === '会议纪要与行动项提炼');
  await goToGeneratorFinalStep(page);
  await page.click('#generator-preview-btn');

  await page.click('[data-block-edit="summary"]');
  await page.fill('[data-block-editor="summary"]', '这是经过人工调整的场景总结。');
  await page.click('[data-block-save="summary"]');

  await page.click('[data-action="copy-prompt"]');

  assert.match(await page.textContent('#generator-status'), /已复制到剪贴板/);

  const copiedText = await page.evaluate(() => window.__copiedText);
  assert.match(copiedText, /这是经过人工调整的场景总结。/);
  assert.doesNotMatch(copiedText, /#\n#\n \n场/);

  await page.click('[data-action="send-openclaw"]');
  await page.waitForFunction(() => /已自动打开 OpenClaw 控制台，并把 Prompt 直接发送出去/.test(document.querySelector('#generator-status')?.textContent || ''));

  assert.match(await page.textContent('#generator-status'), /已自动打开 OpenClaw 控制台，并把 Prompt 直接发送出去/);

  await context.close();
});
