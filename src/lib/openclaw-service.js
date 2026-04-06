const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');

const DEFAULT_CACHE_MS = 6000;
const DAY_MS = 24 * 60 * 60 * 1000;
const HIGH_FREQUENCY_RECENT_THRESHOLD = 3;
const HIGH_FREQUENCY_TOTAL_THRESHOLD = 8;
const MAX_SKILL_FILE_DEPTH = 2;
const MAX_SKILL_FILE_ENTRIES = 40;
const BINARY_FILE_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.icns',
  '.pdf', '.zip', '.gz', '.tar', '.tgz', '.7z', '.rar',
  '.woff', '.woff2', '.ttf', '.otf', '.mp3', '.wav', '.mp4', '.mov', '.avi'
]);
const EDITABLE_TEXT_EXTENSIONS = new Set([
  '.md', '.txt', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.env',
  '.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx', '.py', '.sh', '.bash',
  '.zsh', '.csv', '.xml', '.html', '.css', '.sql'
]);

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

function normalizeRelativeSkillPath(relativePath) {
  return String(relativePath || '').split(path.sep).join('/');
}

function isEditableTextFile(filePath) {
  const baseName = path.basename(String(filePath || ''));
  const extension = path.extname(baseName).toLowerCase();

  if (baseName === 'SKILL.md' || baseName === 'metadata.openclaw') return true;
  if (BINARY_FILE_EXTENSIONS.has(extension)) return false;
  if (EDITABLE_TEXT_EXTENSIONS.has(extension)) return true;
  return extension === '' && !baseName.endsWith('/');
}

function describeSkillFile(relativePath, isDirectory = false) {
  const normalized = normalizeRelativeSkillPath(relativePath);
  const cleanPath = normalized.replace(/\/$/, '');
  const baseName = path.basename(cleanPath);
  const topLevel = cleanPath.split('/')[0] || '';
  const extension = path.extname(baseName).toLowerCase();

  if (isDirectory) {
    if (topLevel === 'assets') return '素材或模板目录，通常放图片、模板、示例输出等 supporting files。';
    if (topLevel === 'examples') return '示例目录，通常放输入样例、输出样例或演示数据。';
    if (topLevel === 'scripts') return '辅助脚本目录，通常放预处理、后处理或校验脚本。';
    if (topLevel === 'docs' || topLevel === 'references') return '补充文档目录，通常放说明、术语表或背景材料。';
    return 'Skill 目录结构中的子目录，通常用于承载 supporting files。';
  }

  if (baseName === 'SKILL.md') {
    return 'Skill 主说明文件，通常定义用途、触发方式、适用场景、执行规则和输出要求。';
  }
  if (baseName === 'metadata.openclaw') {
    return 'Skill 元数据文件，通常声明依赖、主环境变量、安装提示或配置检查。';
  }
  if (baseName === 'README.md') {
    return '补充说明文档，通常介绍维护方式、例外规则或使用备注。';
  }
  if (topLevel === 'assets') {
    return 'supporting files 里的素材或模板文件，通常被 SKILL.md 引用。';
  }
  if (topLevel === 'examples') {
    return '示例文件，通常用于演示输入输出格式，帮助 Skill 稳定执行。';
  }
  if (topLevel === 'scripts') {
    return '辅助脚本文件，通常在执行前后做预处理、转换或检查。';
  }
  if (['.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.env'].includes(extension)) {
    return '结构化配置文件，通常保存字段、模板、映射或环境变量配置。';
  }
  if (['.md', '.txt'].includes(extension)) {
    return '说明或模板文本文件，通常承载规则说明、模板片段或补充上下文。';
  }
  if (['.js', '.mjs', '.cjs', '.ts', '.py', '.sh', '.bash', '.zsh'].includes(extension)) {
    return '可执行脚本文件，通常用于辅助 Skill 完成调用、解析或格式转换。';
  }
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.pptx'].includes(extension)) {
    return '素材文件，通常作为 supporting files 提供给 Skill 参考，不直接编辑。';
  }

  return '这个文件属于 Skill 结构的一部分，可结合文件内容判断具体用途。';
}

function readStructuredConfigKeys(filePath, text) {
  const baseName = path.basename(String(filePath || ''));
  const extension = path.extname(baseName).toLowerCase();
  const trimmed = String(text || '').trim();
  const keys = [];

  if (!trimmed) return keys;

  if (baseName === 'SKILL.md') {
    const frontmatter = parseSkillFrontmatter(trimmed);
    if (frontmatter) {
      keys.push(`frontmatter 字段：${Object.keys(frontmatter).join('、')}`);
    }

    const headingMatches = [...trimmed.matchAll(/^#{1,3}\s+(.+)$/gm)].map((match) => match[1].trim()).slice(0, 6);
    if (headingMatches.length) {
      keys.push(`正文章节：${headingMatches.join('、')}`);
    }
    return keys;
  }

  if (extension === '.json' || baseName === 'metadata.openclaw') {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const topKeys = Object.keys(parsed).slice(0, 10);
        if (topKeys.length) {
          keys.push(`顶层配置：${topKeys.join('、')}`);
          return keys;
        }
      }
    } catch {
      // Fall through to line-based parsing for non-JSON metadata.
    }
  }

  if (['.yaml', '.yml', '.toml', '.ini', '.cfg', '.env', '.openclaw'].includes(extension) || baseName === 'metadata.openclaw') {
    const topLevelKeys = [...new Set(
      trimmed
        .split(/\r?\n/)
        .map((line) => line.match(/^([A-Za-z0-9_.-]+)\s*[:=]/)?.[1])
        .filter(Boolean)
    )].slice(0, 10);
    if (topLevelKeys.length) {
      keys.push(`可见配置项：${topLevelKeys.join('、')}`);
    }
  }

  return keys;
}

function listSkillEntries(baseDir, options = {}) {
  if (!baseDir || !fs.existsSync(baseDir)) return [];

  const maxDepth = options.maxDepth ?? MAX_SKILL_FILE_DEPTH;
  const bucket = [];

  function walk(currentDir, depth = 0, prefix = '') {
    if (bucket.length >= MAX_SKILL_FILE_ENTRIES) return;

    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
      .filter((entry) => !entry.name.startsWith('.'))
      .sort((left, right) => {
        if (left.name === 'SKILL.md') return -1;
        if (right.name === 'SKILL.md') return 1;
        if (left.isDirectory() !== right.isDirectory()) return left.isDirectory() ? -1 : 1;
        return left.name.localeCompare(right.name, 'zh-CN');
      });

    entries.forEach((entry) => {
      if (bucket.length >= MAX_SKILL_FILE_ENTRIES) return;
      const relativePath = normalizeRelativeSkillPath(path.join(prefix, entry.name));
      const fullPath = path.join(currentDir, entry.name);
      const directory = entry.isDirectory();
      const normalizedPath = directory ? `${relativePath}/` : relativePath;

      bucket.push({
        path: normalizedPath,
        name: entry.name,
        isDirectory: directory,
        editable: directory ? false : isEditableTextFile(fullPath),
        purpose: describeSkillFile(normalizedPath, directory),
        configHints: directory
          ? []
          : (() => {
              if (!isEditableTextFile(fullPath)) return [];
              try {
                return readStructuredConfigKeys(fullPath, readSkillTextFile(fullPath));
              } catch {
                return [];
              }
            })()
      });

      if (directory && depth + 1 < maxDepth) {
        walk(fullPath, depth + 1, relativePath);
      }
    });
  }

  walk(baseDir, 0, '');
  return bucket;
}

function resolveSkillFileTarget(baseDir, relativePath) {
  const normalized = normalizeRelativeSkillPath(relativePath).replace(/\/$/, '');
  if (!normalized) {
    throw new Error('Missing skill file path');
  }

  const resolved = path.resolve(baseDir, normalized);
  if (!isPathInsideRoot(resolved, baseDir)) {
    throw new Error('Skill file path escapes the skill root');
  }

  return {
    relativePath: normalized,
    absolutePath: resolved
  };
}

function readSkillTextFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
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

function normalizeTimestampMs(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000;
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;

    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric > 1e12 ? numeric : numeric * 1000;
    }
  }

  return 0;
}

function walkFiles(rootDir, matcher, bucket = []) {
  if (!rootDir || !fs.existsSync(rootDir)) return bucket;

  fs.readdirSync(rootDir, { withFileTypes: true }).forEach((entry) => {
    const nextPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(nextPath, matcher, bucket);
      return;
    }

    if (matcher(nextPath, entry)) {
      bucket.push(nextPath);
    }
  });

  return bucket;
}

function parseMaybeJson(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return {};

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function expandHomePath(filePath, home = os.homedir()) {
  const value = String(filePath || '').trim();
  if (!value) return '';
  if (value === '~') return home;
  if (value.startsWith(`~${path.sep}`) || value.startsWith('~/') || value.startsWith('~\\')) {
    return path.join(home, value.slice(2));
  }
  return value;
}

function parseSkillFrontmatter(markdown) {
  const match = /^\uFEFF?---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(String(markdown || ''));
  if (!match) return null;

  const metadata = {};
  match[1].split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const fieldMatch = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(trimmed);
    if (!fieldMatch) return;

    let value = fieldMatch[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1).trim();
    }

    metadata[fieldMatch[1]] = value;
  });

  return metadata;
}

function readSkillMetadata(filePath, options = {}) {
  const resolvedPath = expandHomePath(filePath, options.home);
  if (!resolvedPath || path.basename(resolvedPath) !== 'SKILL.md' || !fs.existsSync(resolvedPath)) {
    return null;
  }

  const cache = options.cache;
  const cacheKey = path.resolve(resolvedPath);
  if (cache?.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  let metadata = null;

  try {
    const frontmatter = parseSkillFrontmatter(fs.readFileSync(resolvedPath, 'utf8'));
    const name = String(frontmatter?.name || '').trim();
    const description = String(frontmatter?.description || '').trim();
    if (name && description) {
      metadata = { name, description };
    }
  } catch {
    metadata = null;
  }

  if (cache) {
    cache.set(cacheKey, metadata);
  }

  return metadata;
}

function isPathInsideRoot(targetPath, rootPath) {
  if (!targetPath || !rootPath) return false;

  const resolvedTarget = path.resolve(expandHomePath(targetPath));
  const resolvedRoot = path.resolve(expandHomePath(rootPath));
  const relative = path.relative(resolvedRoot, resolvedTarget);

  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function matchesKnownSkillRoot(filePath, validSkillRoots = []) {
  if (!validSkillRoots.length) return true;

  return validSkillRoots.some((rootPath) => {
    if (!rootPath) return false;
    if (!isPathInsideRoot(filePath, rootPath)) return false;

    const relative = path.relative(path.resolve(rootPath), path.resolve(filePath));
    const parts = relative.split(path.sep).filter(Boolean);
    return (parts.length === 1 && parts[0] === 'SKILL.md')
      || (parts.length === 2 && parts[1] === 'SKILL.md');
  });
}

function extractSkillNameFromSkillPath(filePath, options = {}) {
  const normalized = expandHomePath(filePath, options.home);
  if (path.basename(normalized) !== 'SKILL.md') return '';
  if (!matchesKnownSkillRoot(normalized, options.validSkillRoots || [])) return '';

  const metadata = readSkillMetadata(normalized, {
    cache: options.metadataCache,
    home: options.home
  });
  return metadata?.name || '';
}

function extractSkillNamesFromSessionEntry(entry, options = {}) {
  const items = Array.isArray(entry?.message?.content) ? entry.message.content : [];
  const matches = [];

  items.forEach((item) => {
    if (item?.type !== 'toolCall') return;
    if (!['read', 'open'].includes(item.name)) return;

    const args = parseMaybeJson(item.arguments);
    const skillName = extractSkillNameFromSkillPath(args.path || args.filePath || '', options);
    if (skillName) matches.push(skillName);
  });

  return [...new Set(matches)];
}

function buildEmptyUsageEntry() {
  return {
    count7d: 0,
    count30d: 0,
    totalCount: 0,
    lastUsedAt: '',
    lastUsedAtMs: 0,
    available: false
  };
}

function isHighFrequencyUsage(usage) {
  return (usage.count7d || 0) >= HIGH_FREQUENCY_RECENT_THRESHOLD
    || ((usage.count7d || 0) === 0 && (usage.totalCount || 0) >= HIGH_FREQUENCY_TOTAL_THRESHOLD);
}

function formatUsageLabel(usage) {
  if ((usage.count7d || 0) > 0) return `近 7 天 ${usage.count7d} 次`;
  if ((usage.totalCount || 0) > 0) return `总计 ${usage.totalCount} 次`;
  return '暂无调用';
}

function normalizeSkillRootList(validSkillRoots = []) {
  return [...new Set(validSkillRoots
    .filter(Boolean)
    .map((rootPath) => path.resolve(expandHomePath(String(rootPath)))) )];
}

function collectSkillUsageStats(agentsDir, options = {}) {
  const now = options.now ?? Date.now();
  const metadataCache = options.metadataCache || new Map();
  const validSkillRoots = normalizeSkillRootList(options.validSkillRoots || []);
  const usage = new Map();
  const sessionFiles = walkFiles(agentsDir, (filePath) => filePath.endsWith('.jsonl'));

  sessionFiles.forEach((filePath) => {
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
    lines.forEach((line) => {
      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        return;
      }

      const timestampMs = normalizeTimestampMs(entry.timestamp || entry?.message?.timestamp);
      const skillNames = extractSkillNamesFromSessionEntry(entry, {
        home: options.home,
        metadataCache,
        validSkillRoots
      });
      skillNames.forEach((skillName) => {
        const current = usage.get(skillName) || buildEmptyUsageEntry();
        current.available = true;
        current.totalCount += 1;
        if (timestampMs >= now - 7 * DAY_MS) current.count7d += 1;
        if (timestampMs >= now - 30 * DAY_MS) current.count30d += 1;
        if (timestampMs > current.lastUsedAtMs) {
          current.lastUsedAtMs = timestampMs;
          current.lastUsedAt = timestampMs ? new Date(timestampMs).toISOString() : '';
        }
        usage.set(skillName, current);
      });
    });
  });

  return {
    available: sessionFiles.length > 0,
    sessionFiles,
    bySkill: usage
  };
}

function describeCronSchedule(job) {
  const schedule = job?.schedule || {};
  if (schedule.kind === 'cron') {
    return schedule.tz ? `cron ${schedule.expr} @ ${schedule.tz}` : `cron ${schedule.expr || ''}`.trim();
  }
  if (schedule.kind === 'every') {
    return schedule.every ? `每 ${schedule.every}` : `固定间隔`;
  }
  if (schedule.kind === 'at') {
    return schedule.at ? `单次 ${schedule.at}` : '单次任务';
  }
  return job?.cronExpr ? `cron ${job.cronExpr}` : '调度方式未知';
}

function readCronRunSummary(cronDir, jobId) {
  const runsPath = path.join(cronDir, 'runs', `${jobId}.jsonl`);
  if (!fs.existsSync(runsPath)) {
    return {
      lastRunStatus: '',
      lastRunAt: '',
      lastRunAtMs: 0
    };
  }

  const lines = fs.readFileSync(runsPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const lastLine = lines[lines.length - 1];
  if (!lastLine) {
    return {
      lastRunStatus: '',
      lastRunAt: '',
      lastRunAtMs: 0
    };
  }

  try {
    const payload = JSON.parse(lastLine);
    const lastRunAtMs = normalizeTimestampMs(payload.ts || payload.timestamp || payload.endedAt || payload.startedAt);
    return {
      lastRunStatus: String(payload.status || payload.outcome || payload.runStatus || ''),
      lastRunAt: lastRunAtMs ? new Date(lastRunAtMs).toISOString() : '',
      lastRunAtMs
    };
  } catch {
    return {
      lastRunStatus: '',
      lastRunAt: '',
      lastRunAtMs: 0
    };
  }
}

function normalizeCronJob(rawJob, cronDir) {
  const runSummary = readCronRunSummary(cronDir, rawJob.id || rawJob.jobId || '');
  const payload = rawJob.payload || {};

  return {
    id: rawJob.id || rawJob.jobId || '',
    name: rawJob.name || '未命名任务',
    description: rawJob.description || '',
    enabled: rawJob.enabled !== false,
    scheduleLabel: describeCronSchedule(rawJob),
    nextRunAt: rawJob.nextRunAt || '',
    nextRunAtMs: normalizeTimestampMs(rawJob.nextRunAtMs || rawJob.nextRunAt),
    payloadText: payload.message || payload.systemEvent || rawJob.message || rawJob.systemEvent || '',
    sessionKey: rawJob.sessionKey || payload.sessionKey || '',
    agentId: rawJob.agentId || payload.agentId || '',
    lastRunStatus: rawJob.lastRunStatus || runSummary.lastRunStatus,
    lastRunAt: rawJob.lastRunAt || runSummary.lastRunAt,
    lastRunAtMs: normalizeTimestampMs(rawJob.lastRunAtMs || rawJob.lastRunAt) || runSummary.lastRunAtMs
  };
}

function readCronJobsState(stateDir) {
  const cronDir = path.join(stateDir, 'cron');
  const jobsPath = path.join(cronDir, 'jobs.json');
  if (!fs.existsSync(jobsPath)) {
    return {
      available: false,
      jobs: [],
      jobsPath: shortPath(jobsPath)
    };
  }

  const payload = readJson(jobsPath, { jobs: [] });
  const rawJobs = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.jobs)
      ? payload.jobs
      : [];

  return {
    available: true,
    jobsPath: shortPath(jobsPath),
    jobs: rawJobs.map((job) => normalizeCronJob(job, cronDir))
  };
}

function matchCronJobToSkill(skill, job) {
  const haystack = [
    job.name,
    job.description,
    job.payloadText,
    job.sessionKey,
    job.agentId
  ].join(' ').toLowerCase();

  const tokens = [...new Set([
    skill.name,
    skill.skillKey,
    String(skill.name || '').replaceAll('-', '_'),
    String(skill.skillKey || '').replaceAll('-', '_')
  ].filter(Boolean).map((value) => String(value).toLowerCase()))];

  return tokens.some((token) => haystack.includes(token));
}

function buildAutomationSummary(skill, cronState) {
  const jobs = cronState.jobs.filter((job) => matchCronJobToSkill(skill, job));
  return {
    available: cronState.available,
    jobsPath: cronState.jobsPath,
    boundCount: jobs.length,
    jobs,
    label: !cronState.available
      ? '暂未读到任务数据'
      : jobs.length
        ? `已绑定 ${jobs.length} 个任务`
        : '未绑定',
    warning: cronState.available && jobs.length
      ? `当前 Skill 已绑定 ${jobs.length} 个定时任务，修改配置后可能影响自动执行。`
      : ''
  };
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

function buildHealthRisk(code, title, detail, actionLabel, actionTarget) {
  return {
    code,
    title,
    detail,
    actionLabel,
    actionTarget
  };
}

function summarizeHealthLabel(status, locale = 'zh') {
  const labels = locale === 'en'
    ? {
        normal: 'Normal',
        configMissing: 'Config missing',
        fileError: 'File error',
        incomplete: 'Incomplete',
        sendFailed: 'Recent send failed',
        cronAbnormal: 'Cron abnormal'
      }
    : {
        normal: '正常',
        configMissing: '配置缺失',
        fileError: '文件异常',
        incomplete: '识别不完整',
        sendFailed: '最近发送失败',
        cronAbnormal: 'cron 绑定异常'
      };
  return labels[status] || labels.normal;
}

function buildSkillHealth(skill, options = {}) {
  const home = options.home || os.homedir();
  const risks = [];
  const skillMdPath = expandHomePath(skill.skillMdPath || '', home);
  const fileEntries = Array.isArray(skill.fileEntries) ? skill.fileEntries : [];
  const configEntry = skill.configEntry || {};
  const configKeys = Object.keys(configEntry.config || {});
  const envKeys = Object.keys(configEntry.env || {});
  const missingEnv = skill.missing?.env || [];
  const missingConfig = skill.missing?.config || [];
  const missingBins = skill.missing?.bins || [];
  const missingOs = skill.missing?.os || [];

  if (missingEnv.length || missingConfig.length || (skill.primaryEnv && configEntry.exists && !configEntry.apiKey)) {
    risks.push(buildHealthRisk(
      'configMissing',
      '配置缺失',
      [
        missingEnv.length ? `缺少环境变量：${missingEnv.join('、')}` : '',
        missingConfig.length ? `缺少配置项：${missingConfig.join('、')}` : '',
        skill.primaryEnv && configEntry.exists && !configEntry.apiKey ? `主密钥 ${skill.primaryEnv} 为空` : ''
      ].filter(Boolean).join('；'),
      '去配置面板',
      'config-panel'
    ));
  }

  if (missingBins.length || missingOs.length) {
    risks.push(buildHealthRisk(
      'fileError',
      '运行依赖异常',
      [
        missingBins.length ? `缺少命令行工具：${missingBins.join('、')}` : '',
        missingOs.length ? `系统限制：${missingOs.join('、')}` : ''
      ].filter(Boolean).join('；'),
      '检查依赖',
      'requirements'
    ));
  }

  if (!skillMdPath || !fs.existsSync(skillMdPath)) {
    risks.push(buildHealthRisk(
      'fileError',
      'SKILL.md 缺失',
      '没有检测到可读取的 SKILL.md 主文件。',
      '检查目录结构',
      'structure'
    ));
  } else {
    try {
      const frontmatter = parseSkillFrontmatter(fs.readFileSync(skillMdPath, 'utf8'));
      const missingFrontmatter = ['name', 'description'].filter((key) => !String(frontmatter?.[key] || '').trim());
      if (missingFrontmatter.length) {
        risks.push(buildHealthRisk(
          'incomplete',
          'SKILL.md 识别不完整',
          `frontmatter 缺少：${missingFrontmatter.join('、')}`,
          '编辑 SKILL.md',
          'SKILL.md'
        ));
      }
    } catch {
      risks.push(buildHealthRisk(
        'fileError',
        'SKILL.md 不可读',
        '读取 SKILL.md 时发生异常。',
        '检查文件内容',
        'SKILL.md'
      ));
    }
  }

  if (fileEntries.length && !fileEntries.some((entry) => entry.path === 'SKILL.md')) {
    risks.push(buildHealthRisk(
      'fileError',
      '目录结构异常',
      '当前 Skill 目录没有把 SKILL.md 暴露为主入口。',
      '检查目录结构',
      'structure'
    ));
  }

  if (configEntry.exists && (configEntry.apiKey || envKeys.length || configKeys.length)) {
    risks.push(buildHealthRisk(
      'configOverride',
      '本地配置覆盖默认值',
      `当前存在本地覆盖：${[configEntry.apiKey ? 'apiKey' : '', ...envKeys, ...configKeys].filter(Boolean).slice(0, 6).join('、')}`,
      '查看配置面板',
      'config-panel'
    ));
  }

  if (!fileEntries.some((entry) => /^assets\/|^examples\/|^references\/|^docs\//.test(entry.path)) && configKeys.some((key) => /template|example|glossary/i.test(key))) {
    risks.push(buildHealthRisk(
      'supportingFilesMissing',
      'supporting files 可能缺失',
      '当前配置暗示需要模板或示例文件，但目录里没有明显 supporting files。',
      '查看目录结构',
      'structure'
    ));
  }

  if ((skill.automation?.boundCount || 0) > 0) {
    const abnormalJobs = (skill.automation.jobs || []).filter((job) => {
      const value = String(job.lastRunStatus || '').toLowerCase();
      return value && !['ok', 'success', 'succeeded'].includes(value);
    });
    if (!skill.automation.available || abnormalJobs.length) {
      risks.push(buildHealthRisk(
        'cronAbnormal',
        'cron 绑定异常',
        abnormalJobs.length
          ? `最近运行异常：${abnormalJobs.map((job) => job.name || job.id).join('、')}`
          : '当前已绑定 cron，但没有成功读取完整任务状态。',
        '检查任务绑定',
        'cron'
      ));
    }
  }

  const preferred = ['fileError', 'configMissing', 'incomplete', 'cronAbnormal', 'sendFailed'];
  const primary = preferred.find((code) => risks.some((risk) => risk.code === code)) || 'normal';
  const level = primary === 'normal' ? 'healthy' : (primary === 'fileError' || primary === 'sendFailed' ? 'error' : 'warning');

  return {
    level,
    status: primary,
    label: summarizeHealthLabel(primary),
    risks,
    summary: risks.slice(0, 2).map((risk) => risk.title)
  };
}

function summarizeCounts(skills) {
  return {
    total: skills.length,
    ready: skills.filter((skill) => skill.eligible && !skill.disabled).length,
    blocked: skills.filter((skill) => !skill.eligible || skill.disabled).length,
    personal: skills.filter((skill) => skill.source === 'personal').length,
    bundled: skills.filter((skill) => skill.source === 'bundled').length,
    configured: skills.filter((skill) => skill.configEntry.exists).length,
    highFrequency: skills.filter((skill) => skill.usage?.isHighFrequency).length,
    scheduled: skills.filter((skill) => (skill.automation?.boundCount || 0) > 0).length
  };
}

function resolveSkillDir(skillName, sourceInfo, managedSkillsDir, bundledSkillsDir) {
  const tryResolveSkillDir = (rootDir) => {
    if (!rootDir || !fs.existsSync(rootDir)) return '';

    const directPath = path.join(rootDir, skillName);
    if (readSkillMetadata(path.join(directPath, 'SKILL.md'))) {
      try {
        return fs.realpathSync(directPath);
      } catch {
        return directPath;
      }
    }

    const dirents = fs.readdirSync(rootDir, { withFileTypes: true });
    for (const entry of dirents) {
      if (!entry.isDirectory()) continue;
      const candidate = path.join(rootDir, entry.name);
      const metadata = readSkillMetadata(path.join(candidate, 'SKILL.md'));
      if (!metadata) continue;
      if (entry.name === skillName || metadata.name === skillName) {
        try {
          return fs.realpathSync(candidate);
        } catch {
          return candidate;
        }
      }
    }

    return '';
  };

  if (sourceInfo.id === 'bundled') {
    return tryResolveSkillDir(bundledSkillsDir);
  }

  return tryResolveSkillDir(managedSkillsDir) || (sourceInfo.id === 'bundled' ? '' : tryResolveSkillDir(bundledSkillsDir));
}

function resolveExtraSkillDirs(config, workspaceDir) {
  const rawExtraDirs = config?.skills?.load?.extraDirs || config?.skills?.load?.extra_dirs || [];
  const values = Array.isArray(rawExtraDirs) ? rawExtraDirs : [rawExtraDirs];

  return values
    .filter((entry) => typeof entry === 'string' && entry.trim())
    .map((entry) => {
      const trimmed = entry.trim();
      return path.isAbsolute(trimmed) ? trimmed : path.resolve(workspaceDir, trimmed);
    });
}

function buildKnownSkillRoots({ home, stateDir, managedSkillsDir, bundledSkillsDir, config }) {
  const workspaceDir = config?.agents?.defaults?.workspace || path.join(stateDir, 'workspace');
  return {
    workspaceDir,
    roots: normalizeSkillRootList([
      path.join(workspaceDir, 'skills'),
      path.join(workspaceDir, '.agents', 'skills'),
      path.join(home, '.agents', 'skills'),
      managedSkillsDir,
      bundledSkillsDir,
      ...resolveExtraSkillDirs(config, workspaceDir)
    ])
  };
}

function createOpenClawService(options = {}) {
  const home = options.home || os.homedir();
  const env = options.env || process.env;
  const platform = options.platform || process.platform;
  const stateDir = options.stateDir || env.OPENCLAW_STATE_DIR || path.join(home, '.openclaw');
  const configPath = options.configPath || env.OPENCLAW_CONFIG_PATH || path.join(stateDir, 'openclaw.json');
  const managedSkillsDir = options.managedSkillsDir || path.join(stateDir, 'skills');
  const agentsDir = options.agentsDir || path.join(stateDir, 'agents');
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

  function enrichSkillSummary(listItem, config, usageState, cronState) {
    const sourceInfo = normalizeSource(listItem.source, listItem.bundled);
    const baseDir = resolveSkillDir(listItem.name, sourceInfo, managedSkillsDir, bundledSkillsDir);
    const skillKey = listItem.skillKey || listItem.name;
    const configEntry = getConfigEntry(config, skillKey, listItem.primaryEnv || '');
    const usageBase = usageState.bySkill.get(listItem.name) || usageState.bySkill.get(skillKey) || buildEmptyUsageEntry();
    const usage = {
      ...usageBase,
      isHighFrequency: isHighFrequencyUsage(usageBase),
      cardLabel: formatUsageLabel(usageBase)
    };
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
      configEntry,
      usage,
      automation: buildAutomationSummary({ name: listItem.name, skillKey }, cronState)
    };

    summary.status = buildStatus(summary);
    summary.health = buildSkillHealth(summary, { home });
    return summary;
  }

  async function buildDashboardPayload() {
    const config = readJson(configPath, {});
    const listPayload = await runOpenClawJson(['skills', 'list', '--json'], { timeout: 30000 });
    const skillRoots = buildKnownSkillRoots({
      home,
      stateDir,
      managedSkillsDir,
      bundledSkillsDir,
      config
    });
    const usageState = collectSkillUsageStats(agentsDir, {
      validSkillRoots: skillRoots.roots
    });
    const cronState = readCronJobsState(stateDir);
    const skills = (listPayload.skills || [])
      .map((skill) => enrichSkillSummary(skill, config, usageState, cronState))
      .sort((left, right) => {
        if ((right.usage?.count7d || 0) !== (left.usage?.count7d || 0)) {
          return (right.usage?.count7d || 0) - (left.usage?.count7d || 0);
        }
        if ((right.usage?.totalCount || 0) !== (left.usage?.totalCount || 0)) {
          return (right.usage?.totalCount || 0) - (left.usage?.totalCount || 0);
        }
        if ((right.automation?.boundCount || 0) !== (left.automation?.boundCount || 0)) {
          return (right.automation?.boundCount || 0) - (left.automation?.boundCount || 0);
        }
        if ((right.usage?.lastUsedAtMs || 0) !== (left.usage?.lastUsedAtMs || 0)) {
          return (right.usage?.lastUsedAtMs || 0) - (left.usage?.lastUsedAtMs || 0);
        }
        if (left.status?.tone !== right.status?.tone) {
          const order = ['warn', 'ready', 'off'];
          return order.indexOf(left.status?.tone) - order.indexOf(right.status?.tone);
        }
        return left.name.localeCompare(right.name, 'zh-CN');
      });

    return {
      generatedAt: new Date().toISOString(),
      environment: {
        platform,
        openclawBin: shortPath(openclawBin, home),
        configPath: shortPath(configPath, home),
        stateDir: shortPath(stateDir, home),
        workspaceDir: shortPath(skillRoots.workspaceDir, home),
        agentsDir: shortPath(agentsDir, home),
        managedSkillsDir: shortPath(managedSkillsDir, home),
        bundledSkillsDir: shortPath(bundledSkillsDir, home)
      },
      telemetry: {
        usageAvailable: usageState.available,
        cronAvailable: cronState.available
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
      fileEntries: listSkillEntries(baseDir),
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
      configEntry,
      usage: summary.usage,
      automation: summary.automation
    };

    detail.status = buildStatus(detail);
    detail.health = buildSkillHealth(detail, { home });
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

  async function getSkillFile(skillName, relativePath) {
    const detail = await getSkillDetail(skillName, true);
    const baseDir = expandHomePath(detail.location, home);
    const { relativePath: normalizedPath, absolutePath } = resolveSkillFileTarget(baseDir, relativePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Skill file not found: ${relativePath}`);
    }

    const stat = fs.statSync(absolutePath);
    const isDirectory = stat.isDirectory();
    const pathLabel = isDirectory ? `${normalizedPath}/` : normalizedPath;

    if (isDirectory) {
      const childEntries = listSkillEntries(absolutePath, { maxDepth: 1 }).map((entry) => ({
        ...entry,
        path: normalizeRelativeSkillPath(path.join(normalizedPath, entry.path)).replace(/\/\//g, '/')
      }));

      return {
        path: pathLabel,
        name: path.basename(normalizedPath),
        isDirectory: true,
        editable: false,
        purpose: describeSkillFile(pathLabel, true),
        configHints: childEntries.length
          ? [`当前目录包含：${childEntries.slice(0, 8).map((entry) => entry.path).join('、')}`]
          : ['当前目录下还没有读取到子文件。'],
        content: '',
        updatedAt: new Date(stat.mtimeMs).toISOString(),
        size: 0
      };
    }

    const editable = isEditableTextFile(absolutePath);
    const content = editable ? readSkillTextFile(absolutePath) : '';
    const configHints = editable
      ? readStructuredConfigKeys(absolutePath, content)
      : ['当前文件更适合作为素材或二进制文件使用，不建议直接在这里编辑。'];

    return {
      path: pathLabel,
      name: path.basename(normalizedPath),
      isDirectory: false,
      editable,
      purpose: describeSkillFile(pathLabel, false),
      configHints: configHints.length ? configHints : ['没有检测到结构化配置；当前文件更像说明、模板或脚本内容。'],
      content,
      updatedAt: new Date(stat.mtimeMs).toISOString(),
      size: stat.size
    };
  }

  async function updateSkillFile(skillName, relativePath, content) {
    const detail = await getSkillDetail(skillName, true);
    const baseDir = expandHomePath(detail.location, home);
    const { absolutePath } = resolveSkillFileTarget(baseDir, relativePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Skill file not found: ${relativePath}`);
    }
    if (fs.statSync(absolutePath).isDirectory()) {
      throw new Error('Directories cannot be edited directly');
    }
    if (!isEditableTextFile(absolutePath)) {
      throw new Error('This skill file is not editable in the workbench');
    }

    fs.writeFileSync(absolutePath, String(content || ''), 'utf8');
    clearCaches();
    return getSkillFile(skillName, relativePath);
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
      agentsDir,
      configPath,
      managedSkillsDir,
      bundledSkillsDir,
      openclawBin,
      cacheMs
    },
    clearCaches,
    getDashboardPayload,
    getSkillFile,
    getSkillDetail,
    updateSkillFile,
    updateSkillConfig
  };
}

module.exports = {
  DEFAULT_CACHE_MS,
  buildSkillHealth,
  buildStatus,
  collectSkillUsageStats,
  createOpenClawService,
  extractJsonPayload,
  inferBundledSkillsDir,
  isHighFrequencyUsage,
  matchCronJobToSkill,
  readCronJobsState,
  normalizeSource,
  resolveOpenClawExecutable,
  shortPath
};
