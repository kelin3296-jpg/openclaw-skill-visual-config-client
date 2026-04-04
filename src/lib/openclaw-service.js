const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');

const DEFAULT_CACHE_MS = 6000;

function shortPath(filePath, home = os.homedir()) {
  if (!filePath) return '';
  return filePath.replace(home, '~');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    if (fallback !== undefined) return clone(fallback);
    throw new Error(`JSON file not found: ${filePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function extractJsonPayload(mixedOutput) {
  const lines = String(mixedOutput || '').split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const candidate = lines.slice(index).join('\n').trim();
    if (!candidate) continue;
    if (!candidate.startsWith('{') && !candidate.startsWith('[')) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // OpenClaw can print bracketed warnings before the JSON payload.
    }
  }

  throw new Error('No JSON payload found');
}

function resolveOpenClawExecutable(options = {}) {
  const home = options.home || os.homedir();
  const env = options.env || process.env;
  const platform = options.platform || process.platform;
  const existsSync = options.existsSync || fs.existsSync;

  if (env.OPENCLAW_BIN) return env.OPENCLAW_BIN;

  const appData = env.APPDATA || path.join(home, 'AppData', 'Roaming');
  const candidates = platform === 'win32'
    ? [
        path.join(appData, 'npm', 'openclaw.cmd'),
        path.join(appData, 'npm', 'openclaw'),
        'openclaw.cmd',
        'openclaw'
      ]
    : [
        path.join(home, '.npm-global', 'bin', 'openclaw'),
        path.join(home, '.local', 'bin', 'openclaw'),
        'openclaw'
      ];

  return candidates.find((candidate) => {
    if (!candidate.includes(path.sep)) return false;
    return existsSync(candidate);
  }) || candidates[candidates.length - 1];
}

function inferBundledSkillsDir(openclawBin, options = {}) {
  const home = options.home || os.homedir();
  const env = options.env || process.env;
  const platform = options.platform || process.platform;
  const existsSync = options.existsSync || fs.existsSync;
  const realpathSync = options.realpathSync || fs.realpathSync;
  const appData = env.APPDATA || path.join(home, 'AppData', 'Roaming');
  const candidates = [];

  if (openclawBin && (openclawBin.includes(path.sep) || openclawBin.includes('/'))) {
    try {
      const resolvedBin = realpathSync(openclawBin);
      const binDir = path.dirname(resolvedBin);
      candidates.push(
        path.join(binDir, 'skills'),
        path.join(binDir, '..', 'skills'),
        path.join(binDir, '..', 'node_modules', 'openclaw', 'skills'),
        path.join(binDir, '..', '..', 'lib', 'node_modules', 'openclaw', 'skills')
      );
    } catch {
      // Fall back to common install locations below.
    }
  }

  if (platform === 'win32') {
    candidates.push(
      path.join(appData, 'npm', 'node_modules', 'openclaw', 'skills'),
      path.join(home, 'Desktop', 'openclaw-runtime', 'node_modules', 'openclaw', 'skills')
    );
  } else {
    candidates.push(
      path.join(home, '.npm-global', 'lib', 'node_modules', 'openclaw', 'skills'),
      path.join(home, '.local', 'lib', 'node_modules', 'openclaw', 'skills'),
      path.join(home, 'Desktop', 'openclaw-runtime', 'node_modules', 'openclaw', 'skills')
    );
  }

  return candidates.find((candidate) => existsSync(candidate)) || candidates[candidates.length - 1];
}

function normalizeSource(rawSource, bundled) {
  if (rawSource?.includes('personal')) {
    return {
      id: 'personal',
      label: '个人技能',
      note: '来自你本机挂载的个人技能目录，优先级高，也最适合长期维护。'
    };
  }

  if (rawSource?.includes('workspace')) {
    return {
      id: 'workspace',
      label: '工作区技能',
      note: '来自当前工作区的技能目录，适合项目级定制。'
    };
  }

  if (bundled || rawSource === 'openclaw-bundled') {
    return {
      id: 'bundled',
      label: '内置技能',
      note: '随 OpenClaw 一起提供的技能，默认可见，但会被更高优先级目录覆盖。'
    };
  }

  return {
    id: 'other',
    label: '其他来源',
    note: '来自额外目录或当前未明确归类的技能来源。'
  };
}

function listSkillFiles(baseDir) {
  if (!baseDir || !fs.existsSync(baseDir)) return [];

  return fs.readdirSync(baseDir, { withFileTypes: true })
    .map((entry) => ({
      name: entry.isDirectory() ? `${entry.name}/` : entry.name,
      isDirectory: entry.isDirectory()
    }))
    .sort((left, right) => {
      if (left.name === 'SKILL.md') return -1;
      if (right.name === 'SKILL.md') return 1;
      if (left.isDirectory !== right.isDirectory) return left.isDirectory ? -1 : 1;
      return left.name.localeCompare(right.name, 'zh-CN');
    })
    .map((entry) => entry.name)
    .slice(0, 16);
}

function readSkillPreview(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return '当前没有读取到本地 SKILL.md 内容。';
  }

  const text = fs.readFileSync(filePath, 'utf8');
  return text.split('\n').slice(0, 40).join('\n');
}

function prunePlainObject(value) {
  const result = {};
  Object.entries(value || {}).forEach(([key, entry]) => {
    if (entry === '' || entry === null || entry === undefined) return;
    result[key] = entry;
  });
  return result;
}

function getConfigEntry(config, skillKey, primaryEnv) {
  const raw = config?.skills?.entries?.[skillKey];
  const env = raw && typeof raw.env === 'object' && raw.env ? raw.env : {};
  const manualConfig = raw && typeof raw.config === 'object' && raw.config ? raw.config : {};

  return {
    exists: Boolean(raw),
    enabled: raw?.enabled !== false,
    apiKey: primaryEnv ? String(raw?.apiKey || '') : '',
    env,
    config: manualConfig
  };
}

function buildStatus(skill) {
  if (skill.disabled || skill.configEntry.enabled === false) {
    return {
      tone: 'off',
      label: '已禁用',
      note: '当前技能在手动配置层被关闭。'
    };
  }

  const missing = [
    ...(skill.missing?.bins || []).map((item) => `缺少命令行工具 ${item}`),
    ...(skill.missing?.env || []).map((item) => `缺少环境变量 ${item}`),
    ...(skill.missing?.config || []).map((item) => `缺少配置项 ${item}`),
    ...(skill.missing?.os || []).map((item) => `系统限制 ${item}`)
  ];

  if (missing.length) {
    return {
      tone: 'warn',
      label: '待配置',
      note: missing.join('，'),
      missing
    };
  }

  return {
    tone: 'ready',
    label: '已就绪',
    note: '当前环境已满足这个技能的运行条件。',
    missing: []
  };
}

function summarizeCounts(skills) {
  return {
    total: skills.length,
    ready: skills.filter((skill) => skill.eligible && !skill.disabled).length,
    blocked: skills.filter((skill) => !skill.eligible || skill.disabled).length,
    personal: skills.filter((skill) => skill.source === 'personal').length,
    bundled: skills.filter((skill) => skill.source === 'bundled').length,
    configured: skills.filter((skill) => skill.configEntry.exists).length
  };
}

function resolveSkillDir(skillName, sourceInfo, managedSkillsDir, bundledSkillsDir) {
  const managedPath = path.join(managedSkillsDir, skillName);
  if (fs.existsSync(managedPath)) {
    try {
      return fs.realpathSync(managedPath);
    } catch {
      return managedPath;
    }
  }

  if (sourceInfo.id === 'bundled') {
    const bundledPath = path.join(bundledSkillsDir, skillName);
    if (fs.existsSync(bundledPath)) return bundledPath;
  }

  return '';
}

function createOpenClawService(options = {}) {
  const home = options.home || os.homedir();
  const env = options.env || process.env;
  const platform = options.platform || process.platform;
  const stateDir = options.stateDir || env.OPENCLAW_STATE_DIR || path.join(home, '.openclaw');
  const configPath = options.configPath || env.OPENCLAW_CONFIG_PATH || path.join(stateDir, 'openclaw.json');
  const managedSkillsDir = options.managedSkillsDir || path.join(stateDir, 'skills');
  const openclawBin = options.openclawBin || resolveOpenClawExecutable({ home, env, platform });
  const bundledSkillsDir = options.bundledSkillsDir || inferBundledSkillsDir(openclawBin, { home, env, platform });
  const cacheMs = options.cacheMs ?? DEFAULT_CACHE_MS;
  const runOpenClaw = options.runOpenClaw || ((args, { timeout = 30000 } = {}) => new Promise((resolve, reject) => {
    execFile(openclawBin, args, {
      timeout,
      maxBuffer: 12 * 1024 * 1024,
      env
    }, (error, stdout, stderr) => {
      const output = [stdout, stderr].filter(Boolean).join('\n').trim();
      if (error) {
        reject(new Error(output || error.message));
        return;
      }
      resolve(output);
    });
  }));

  let dashboardCache = { at: 0, payload: null };
  const detailCache = new Map();

  async function runOpenClawJson(args, commandOptions) {
    return extractJsonPayload(await runOpenClaw(args, commandOptions));
  }

  function enrichSkillSummary(listItem, config) {
    const sourceInfo = normalizeSource(listItem.source, listItem.bundled);
    const baseDir = resolveSkillDir(listItem.name, sourceInfo, managedSkillsDir, bundledSkillsDir);
    const skillKey = listItem.skillKey || listItem.name;
    const configEntry = getConfigEntry(config, skillKey, listItem.primaryEnv || '');
    const summary = {
      id: listItem.name,
      name: listItem.name,
      skillKey,
      displayName: listItem.name,
      description: listItem.description || '暂无描述',
      emoji: listItem.emoji || 'OC',
      source: sourceInfo.id,
      sourceRaw: listItem.source || 'unknown',
      sourceLabel: sourceInfo.label,
      sourceNote: sourceInfo.note,
      bundled: Boolean(listItem.bundled),
      eligible: Boolean(listItem.eligible),
      disabled: Boolean(listItem.disabled),
      blockedByAllowlist: Boolean(listItem.blockedByAllowlist),
      homepage: listItem.homepage || '',
      primaryEnv: listItem.primaryEnv || '',
      location: shortPath(baseDir || path.join(managedSkillsDir, listItem.name), home),
      skillMdPath: shortPath(baseDir ? path.join(baseDir, 'SKILL.md') : '', home),
      missing: {
        bins: listItem.missing?.bins || [],
        anyBins: listItem.missing?.anyBins || [],
        env: listItem.missing?.env || [],
        config: listItem.missing?.config || [],
        os: listItem.missing?.os || []
      },
      configEntry
    };

    summary.status = buildStatus(summary);
    return summary;
  }

  async function buildDashboardPayload() {
    const config = readJson(configPath, {});
    const listPayload = await runOpenClawJson(['skills', 'list', '--json'], { timeout: 30000 });
    const skills = (listPayload.skills || [])
      .map((skill) => enrichSkillSummary(skill, config))
      .sort((left, right) => {
        if (left.source !== right.source) {
          const order = ['personal', 'workspace', 'bundled', 'other'];
          return order.indexOf(left.source) - order.indexOf(right.source);
        }
        if (left.eligible !== right.eligible) return left.eligible ? -1 : 1;
        return left.name.localeCompare(right.name, 'zh-CN');
      });

    return {
      generatedAt: new Date().toISOString(),
      environment: {
        platform,
        openclawBin: shortPath(openclawBin, home),
        configPath: shortPath(configPath, home),
        stateDir: shortPath(stateDir, home),
        workspaceDir: shortPath(config?.agents?.defaults?.workspace || path.join(stateDir, 'workspace'), home),
        managedSkillsDir: shortPath(managedSkillsDir, home),
        bundledSkillsDir: shortPath(bundledSkillsDir, home)
      },
      summary: summarizeCounts(skills),
      skills
    };
  }

  async function getDashboardPayload(force = false) {
    const now = Date.now();
    if (!force && dashboardCache.payload && now - dashboardCache.at < cacheMs) {
      return dashboardCache.payload;
    }

    const payload = await buildDashboardPayload();
    dashboardCache = { at: now, payload };
    return payload;
  }

  async function buildSkillDetail(skillName) {
    const dashboard = await getDashboardPayload();
    const summary = dashboard.skills.find((skill) => skill.id === skillName);
    if (!summary) {
      throw new Error(`Skill not found: ${skillName}`);
    }

    const info = await runOpenClawJson(['skills', 'info', skillName, '--json'], { timeout: 30000 });
    const config = readJson(configPath, {});
    const baseDir = info.baseDir || resolveSkillDir(summary.name, normalizeSource(info.source, info.bundled), managedSkillsDir, bundledSkillsDir);
    const skillMdPath = info.filePath || (baseDir ? path.join(baseDir, 'SKILL.md') : '');
    const configEntry = getConfigEntry(config, info.skillKey || summary.skillKey, info.primaryEnv || summary.primaryEnv);

    const detail = {
      ...summary,
      skillKey: info.skillKey || summary.skillKey,
      always: Boolean(info.always),
      location: shortPath(baseDir || summary.location, home),
      skillMdPath: shortPath(skillMdPath || summary.skillMdPath, home),
      files: listSkillFiles(baseDir),
      requirements: info.requirements || {
        bins: [],
        anyBins: [],
        env: [],
        config: [],
        os: []
      },
      missing: info.missing || summary.missing,
      install: info.install || [],
      configChecks: info.configChecks || [],
      skillMdPreview: readSkillPreview(skillMdPath),
      configEntry
    };

    detail.status = buildStatus(detail);
    return detail;
  }

  async function getSkillDetail(skillName, force = false) {
    const cached = detailCache.get(skillName);
    const now = Date.now();
    if (!force && cached && now - cached.at < cacheMs) {
      return cached.payload;
    }

    const payload = await buildSkillDetail(skillName);
    detailCache.set(skillName, { at: now, payload });
    return payload;
  }

  async function updateSkillConfig(skillName, payload) {
    const detail = await getSkillDetail(skillName, true);
    const config = readJson(configPath, {});

    config.skills ??= {};
    config.skills.entries ??= {};

    const existing = config.skills.entries[detail.skillKey] && typeof config.skills.entries[detail.skillKey] === 'object'
      ? config.skills.entries[detail.skillKey]
      : {};

    const nextEntry = {
      ...existing,
      enabled: payload.enabled !== false
    };

    if (detail.primaryEnv) {
      nextEntry.apiKey = String(payload.apiKey || '');
    }

    const nextEnv = prunePlainObject(payload.env);
    const nextConfig = prunePlainObject(payload.config);

    if (Object.keys(nextEnv).length) {
      nextEntry.env = nextEnv;
    } else {
      delete nextEntry.env;
    }

    if (Object.keys(nextConfig).length) {
      nextEntry.config = nextConfig;
    } else {
      delete nextEntry.config;
    }

    config.skills.entries[detail.skillKey] = nextEntry;
    writeJson(configPath, config);

    dashboardCache = { at: 0, payload: null };
    detailCache.delete(skillName);

    return getSkillDetail(skillName, true);
  }

  function clearCaches() {
    dashboardCache = { at: 0, payload: null };
    detailCache.clear();
  }

  return {
    settings: {
      platform,
      home,
      stateDir,
      configPath,
      managedSkillsDir,
      bundledSkillsDir,
      openclawBin,
      cacheMs
    },
    clearCaches,
    getDashboardPayload,
    getSkillDetail,
    updateSkillConfig
  };
}

module.exports = {
  DEFAULT_CACHE_MS,
  buildStatus,
  createOpenClawService,
  extractJsonPayload,
  inferBundledSkillsDir,
  normalizeSource,
  resolveOpenClawExecutable,
  shortPath
};
