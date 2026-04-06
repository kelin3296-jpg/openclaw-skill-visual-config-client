const generatorHelpers = window.OpenClawSkillGenerator;

const GENERATOR_TEXT_FIELD_IDS = {
  scenarioName: '#gen-scenario-name',
  useWhen: '#gen-use-when',
  userSays: '#gen-user-says',
  scenarioGoal: '#gen-scenario-goal',
  inputDescription: '#gen-inputs',
  outputDescription: '#gen-output-desc',
  outputFormat: '#gen-output-format',
  acceptanceCustom: '#gen-acceptance-custom',
  references: '#gen-references',
  optionalBackground: '#gen-optional-background'
};
const FILTERS = ['all', 'personal', 'bundled', 'configured'];
const SORT_OPTIONS = [
  { value: 'usage', labelKey: 'library.sortOptions.usage' },
  { value: 'recent', labelKey: 'library.sortOptions.recent' },
  { value: 'name', labelKey: 'library.sortOptions.name' },
  { value: 'ready', labelKey: 'library.sortOptions.ready' },
  { value: 'blocked', labelKey: 'library.sortOptions.blocked' }
];
const OPENCLAW_CONTROL_URL = 'http://127.0.0.1:18789/';
const API_FETCH_TIMEOUT_MS = 6000;
const BROWSER_RETRY_DELAY_MS = Number(window.__OPENCLAW_BROWSER_RETRY_DELAY_MS || 4000);
const LOCALE_STORAGE_KEY = 'clawforge-locale';
const THEME_STORAGE_KEY = 'clawforge-theme';
const DEFAULT_GENERATOR_PAYLOAD = generatorHelpers.blankForm();
const DEFAULT_GENERATOR_STATUS = generatorHelpers.getGeneratorReadiness(DEFAULT_GENERATOR_PAYLOAD);
const DEFAULT_GENERATOR_MESSAGE = generatorHelpers.getGeneratorReadiness(DEFAULT_GENERATOR_PAYLOAD).message;

const I18N = {
  zh: {
    app: {
      title: '爪工坊',
      subtitle: '查看、配置并生成 OpenClaw Skill',
      openOpenClaw: '打开 OpenClaw',
      toggleLanguage: 'EN',
      documentTitle: 'OpenClaw 技能可视化配置客户端'
    },
    tabs: {
      generator: 'Skill 生成器',
      library: 'Skill 库'
    },
    filters: {
      all: '全部',
      personal: '个人 Skill',
      bundled: '内置 Skill',
      configured: '已配置'
    },
    library: {
      searchPlaceholder: '搜索名称、Skill Key 或描述',
      scopeNotice: '读取范围：这里只读取 OpenClaw 当前能识别到的 Skill 清单，并按名称、Skill Key、描述做检索。不会把普通文件、路径名或任务名当成 Skill 条目。',
      sectionTitle: 'Skill 库',
      loadingTitle: '正在读取本地 Skill',
      titleWithCount: ({ count }) => `Skill 库 · ${count} 个`,
      subtitleLoaded: '先找到目标 Skill。需要看结构、文件和配置时，再点开下钻工作台。',
      subtitleFallback: '先判断这个 Skill 能不能用，再决定是否修改配置。',
      sortLabel: '排序',
      refresh: '刷新数据',
      refreshLoading: '正在刷新本地 skill 数据...',
      refreshRetrying: '正在手动重连本地数据服务...',
      refreshRecovering: '本地数据服务异常，正在自动恢复...',
      refreshRecovered: '本地数据服务已自动恢复，正在重试...',
      refreshFailedDesktop: '自动恢复失败，可手动刷新',
      refreshFailedBrowser: ({ seconds }) => `读取失败，${seconds} 秒后自动重试...`,
      lastRefresh: ({ relative }) => `最近刷新 ${relative}`,
      empty: '当前筛选条件下没有匹配的 Skill。',
      errorTitle: '无法读取本地 OpenClaw 数据',
      errorSubtitle: '请检查本地服务和 openclaw 命令。',
      errorDesktop: '接口请求失败：{message}。客户端已尝试自动恢复本地服务，你也可以点上方“刷新数据”再试一次。',
      errorBrowser: '接口请求失败：{message}',
      errorBrowserHint: '请确认本地服务仍在运行：`npm run dev:web`。页面会自动重试，你也可以立刻手动重连。',
      retryNow: '立即重连',
      sortOptions: {
        usage: '使用频率高优先',
        recent: '最近使用',
        name: '名称 A-Z',
        ready: '已就绪优先',
        blocked: '待配置优先'
      }
    },
    common: {
      browserMode: '浏览器调试模式',
      secondsAgo: '{count} 秒前',
      minutesAgo: '{count} 分钟前',
      hoursAgo: '{count} 小时前'
    },
    skill: {
      source: {
        personal: '个人技能',
        bundled: '内置技能'
      },
      status: {
        ready: '已就绪',
        blocked: '待配置',
        off: '已禁用',
        pending: '待检查'
      },
      toggleLabel: '当前状态',
      toggleOn: '已启用',
      toggleOff: '已禁用',
      toggleEnabledNotice: '正在启用这个 Skill...',
      toggleDisabledNotice: '正在禁用这个 Skill...',
      toggleEnabledDone: '操作成功，Skill 已启用。',
      toggleDisabledDone: '操作成功，Skill 已禁用。',
      toggleFailed: '切换 Skill 状态失败，已恢复到之前的状态。',
      cardConfigured: '已配置',
      cardNeedsConfig: '待补配置',
      cardBoundTask: '已绑定任务'
    },
    generator: {
      defaultMessage: '你可以从第一步开始填写场景，最后一步再点“生成”。',
      title: 'Skill 生成器',
      headline: '把一个重复场景整理成可发送给 OpenClaw 的 Skill 指令',
      subtitle: '采用三步式填写：先定义场景与触发，再补输入输出与流程，最后补约束与参考材料。',
      stepperCopy: '先用模板或空白开始，再按三个步骤逐步填写。只有到最后一步才显示“生成”。',
      buttons: {
        reset: '重置',
        previous: '上一步',
        next: '下一步',
        generate: '生成',
        close: '关闭',
        copyPrompt: '复制 Prompt',
        sendOpenClaw: '发送给 OpenClaw',
        addMaterial: '添加材料',
        chooseFile: '选择文件 / 图片',
        delete: '删除',
        previewMaterial: '预览材料',
        openInNewWindow: '在新窗口打开'
      },
      sections: {
        definition: { title: 'A. 场景与触发', desc: '先讲清楚这是什么场景、什么时候触发、最终想要什么结果。' },
        execution: { title: 'B. 输入、输出与流程', desc: '把输入类型、输出要求、验收标准和流程步骤写清楚。' },
        reference: { title: 'C. 约束与参考', desc: '把模板、参考角色、约束、参考材料和补充背景集中到最后一步。' }
      },
      fields: {
        scenarioName: { label: '场景名称', placeholder: '例如 制作 PPT', hint: '示例：`制作 PPT`。写成一个普通人一看就懂的场景名，不要写岗位名。' },
        triggerScenario: { label: '触发场景', placeholder: '例如：当我说“做个 PPT”“帮我整理成 PPT”“做成演示文稿”时触发；适用于我已经有零散材料，但想快速整理成一套可汇报内容的场景。', hint: '可以直接把触发词或常见说法写进去，再补一句“什么时候会用到它”。' },
        scenarioGoal: { label: '场景目标', placeholder: '例如：让 OpenClaw 根据我输入的材料自动补充说明，生成结构化的 PPT 初稿。', hint: '写清最终要交付什么结果，可以直接写成“根据材料补充说明并生成什么”。' },
        inputs: { label: '输入材料', placeholder: '例如：主题说明、已有文档或笔记、数据要点、受众信息、时间或页数要求', hint: '这里写你已经知道会交给 OpenClaw 的材料，不用把每份材料的细节都展开。' },
        outputs: { label: '输出结果', placeholder: '例如：结构化 PPT 大纲、每页标题与要点、补充说明、演讲备注', hint: '写结果，不要写方法。最好能一眼看出最终交付物的结构。' },
        acceptanceCriteria: { label: '验收标准', placeholder: '例如：页序清晰；每页都有标题和 3 到 5 个核心要点；开场和结尾完整；信息不足时标注待确认。', hint: '告诉生成器“怎样才算合格”，这样预览里的结果会更稳。' },
        steps: { label: '标准步骤', placeholder: '例如：先理解主题和受众，再整理内容主线，然后拆成 PPT 页结构，再补足每页标题与要点。', hint: '写 3 到 5 个关键动作就够，不必展开成完整 SOP。' },
        branches: { label: '例外情况 / 判断分支', placeholder: '例如：如果材料不完整，先列待补充信息；如果已有 PPT 模板或品牌规范，优先沿用；如果用户要求控制页数，需要主动收敛内容。', hint: '这里很关键。异常路径越清楚，最终 Skill 越不容易“自说自话”。' },
        references: { label: '参考模板 / 示例', placeholder: '例如：过往汇报 PPT、公司模板、品牌视觉规范、优秀演讲示例', hint: '如果你已经有固定模板或示例输出，这里尽量写出来。' },
        constraints: { label: '约束和禁忌', placeholder: '例如：不能编造业务数据；未确认信息必须标记为待确认；文案要简洁，能直接放进 PPT。', hint: '告诉生成器哪些内容绝对不能编造，哪些标记必须保留。' },
        optionalBackground: { label: '补充背景', placeholder: '例如：我希望把零散材料一键整理成可汇报的 PPT 初稿，减少手工列提纲和补页内容的时间。', hint: '这个字段选填。只有额外背景会明显影响产出时再补。' },
        materialLabel: '参考材料',
        materialHint: '把图片、PDF、Word、Excel、Markdown、链接或本地路径直接加进来，不用全部重写成文字。',
        materialTypePlaceholder: '输入链接、本地路径或补充说明标题',
        materialNotePlaceholder: '给这份材料加一句备注，例如：沿用模板格式 / 主参考文件',
        materialEmpty: '还没有参考材料。你可以先加链接、本地路径，或直接选择文件。'
      },
      modals: {
        promptEyebrow: 'Prompt 预览',
        promptTitle: '可发送给 OpenClaw 的 Skill Prompt',
        promptSubtitle: '这里展示最终 Prompt。确认没问题后，可以直接复制，或一键发送给 OpenClaw。',
        promptEmpty: '点击“生成”后，这里会显示可直接发送给 OpenClaw 的场景 Skill Prompt。',
        materialEyebrow: '参考材料',
        materialSubtitle: '这些材料会整理成文字摘要，和 Prompt 一起发送给 OpenClaw。',
        materialNote: '当前会把材料的名称、类型、路径或链接、备注等信息写进 Prompt 并一并发送；兼容的本地文件或图片会尝试随发送动作一起附上，其余材料会继续以文字摘要方式传递。点任意材料卡片可以先本地预览。',
        materialPreviewTitle: '材料预览',
        materialPreviewSubtitle: '这里会展示当前材料的预览、路径或链接说明。'
      }
    }
  },
  en: {
    app: {
      title: 'ClawForge',
      subtitle: 'Browse, configure, and generate OpenClaw Skills',
      openOpenClaw: 'Open OpenClaw',
      toggleLanguage: '中',
      documentTitle: 'OpenClaw Skill Visual Config Client'
    },
    tabs: {
      generator: 'Skill Generator',
      library: 'Skill Library'
    },
    filters: {
      all: 'All',
      personal: 'Personal',
      bundled: 'Bundled',
      configured: 'Configured'
    },
    library: {
      searchPlaceholder: 'Search by name, Skill key, or description',
      scopeNotice: 'Scope: this view only reads Skills recognized by OpenClaw, and searches by name, Skill key, and description. Regular files, path names, and task names are never treated as Skills.',
      sectionTitle: 'Skill Library',
      loadingTitle: 'Loading local Skills',
      titleWithCount: ({ count }) => `Skill Library · ${count}`,
      subtitleLoaded: 'Start by finding the Skill you want. Open the drill-down workbench only when you need structure, files, or config details.',
      subtitleFallback: 'First decide whether a Skill is usable, then decide whether you need to edit it.',
      sortLabel: 'Sort',
      refresh: 'Refresh',
      refreshLoading: 'Refreshing local Skill data...',
      refreshRetrying: 'Trying to reconnect to the local data service...',
      refreshRecovering: 'Local data service is unavailable, attempting recovery...',
      refreshRecovered: 'Local data service recovered. Retrying...',
      refreshFailedDesktop: 'Auto-recovery failed. You can refresh manually.',
      refreshFailedBrowser: ({ seconds }) => `Read failed. Retrying in ${seconds} seconds...`,
      lastRefresh: ({ relative }) => `Last refresh ${relative}`,
      empty: 'No Skills match the current filters.',
      errorTitle: 'Unable to read local OpenClaw data',
      errorSubtitle: 'Please check the local service and the `openclaw` command.',
      errorDesktop: 'Request failed: {message}. The client already tried to recover the local service. You can also click Refresh and try again.',
      errorBrowser: 'Request failed: {message}',
      errorBrowserHint: 'Make sure the local service is still running: `npm run dev:web`. The page will retry automatically, or you can reconnect now.',
      retryNow: 'Reconnect now',
      sortOptions: {
        usage: 'Most used first',
        recent: 'Recently used',
        name: 'Name A-Z',
        ready: 'Ready first',
        blocked: 'Needs config first'
      }
    },
    common: {
      browserMode: 'Browser debug mode',
      secondsAgo: '{count}s ago',
      minutesAgo: '{count}m ago',
      hoursAgo: '{count}h ago'
    },
    skill: {
      source: {
        personal: 'Personal',
        bundled: 'Bundled'
      },
      status: {
        ready: 'Ready',
        blocked: 'Needs config',
        off: 'Disabled',
        pending: 'Pending'
      },
      toggleLabel: 'Status',
      toggleOn: 'Enabled',
      toggleOff: 'Disabled',
      toggleEnabledNotice: 'Enabling this Skill...',
      toggleDisabledNotice: 'Disabling this Skill...',
      toggleEnabledDone: 'Done. The Skill is now enabled.',
      toggleDisabledDone: 'Done. The Skill is now disabled.',
      toggleFailed: 'Failed to change the Skill status. Reverted to the previous state.',
      cardConfigured: 'Configured',
      cardNeedsConfig: 'Needs config',
      cardBoundTask: 'Task bound'
    },
    generator: {
      defaultMessage: 'Start from step 1 and click Generate on the last step.',
      title: 'Skill Generator',
      headline: 'Turn a repeated scenario into a Skill prompt for OpenClaw',
      subtitle: 'Use a three-step flow: define the scenario and trigger, add inputs / outputs / flow, then finish with constraints and references.',
      stepperCopy: 'Start from a preset or blank form, then work through the three steps. Generate is only shown on the last step.',
      buttons: {
        reset: 'Reset',
        previous: 'Previous',
        next: 'Next',
        generate: 'Generate',
        close: 'Close',
        copyPrompt: 'Copy Prompt',
        sendOpenClaw: 'Send to OpenClaw',
        addMaterial: 'Add Material',
        chooseFile: 'Choose File / Image',
        delete: 'Delete',
        previewMaterial: 'Preview',
        openInNewWindow: 'Open in new window'
      },
      sections: {
        definition: { title: 'A. Scenario & Trigger', desc: 'Clarify what the scenario is, when it should trigger, and what final result is expected.' },
        execution: { title: 'B. Inputs, Outputs & Flow', desc: 'Define input types, output structure, acceptance checks, and execution flow.' },
        reference: { title: 'C. Constraints & References', desc: 'Collect templates, reference roles, constraints, reference materials, and extra background here.' }
      },
      fields: {
        scenarioName: { label: 'Scenario Name', placeholder: 'e.g. Build a PPT deck', hint: 'Use a plain-language scenario name that anyone can understand. Avoid role names.' },
        triggerScenario: { label: 'Trigger Scenario', placeholder: 'e.g. Trigger when I say “make a PPT”, “turn this into slides”, or “prepare a deck”; useful when I already have scattered materials and need a presentation draft quickly.', hint: 'List trigger phrases first, then add a short note about when this Skill should be used.' },
        scenarioGoal: { label: 'Scenario Goal', placeholder: 'e.g. Let OpenClaw expand on my materials and generate a structured first draft of a PPT deck.', hint: 'Be clear about the final deliverable. “Generate X based on the provided materials” is usually enough.' },
        inputs: { label: 'Input Materials', placeholder: 'e.g. topic brief, existing notes or docs, data points, audience info, page limit or time limit', hint: 'List the types of materials OpenClaw will receive. You do not need to fully unpack each file here.' },
        outputs: { label: 'Output', placeholder: 'e.g. structured deck outline, slide titles and bullets, supporting notes, speaker notes', hint: 'Describe the deliverable, not the method.' },
        acceptanceCriteria: { label: 'Acceptance Criteria', placeholder: 'e.g. clear page order; every slide has a title and 3-5 key points; opening and closing slides are included; missing information is clearly marked.', hint: 'This tells the generator what “good enough” means, which makes the result more stable.' },
        steps: { label: 'Standard Steps', placeholder: 'e.g. understand the topic and audience, organize the story, map it into slide structure, then fill in titles and key points.', hint: '3 to 5 key steps are enough. You do not need a full SOP.' },
        branches: { label: 'Exceptions / Branches', placeholder: 'e.g. if materials are incomplete, list missing info first; if a PPT template exists, reuse it; if slide count is limited, compress the content proactively.', hint: 'This matters a lot. The clearer the branch logic is, the less likely the Skill is to improvise blindly.' },
        references: { label: 'Templates / References', placeholder: 'e.g. old presentation decks, company templates, brand guidelines, strong presentation examples', hint: 'If you already have templates or example outputs, include them here.' },
        constraints: { label: 'Constraints', placeholder: 'e.g. do not invent business data; mark unconfirmed information clearly; keep copy short enough to paste directly into slides.', hint: 'Tell the generator what must not be fabricated and what must be preserved.' },
        optionalBackground: { label: 'Additional Context', placeholder: 'e.g. I want to turn scattered materials into a presentation draft in one go, so I spend less time making outlines manually.', hint: 'Optional. Use this only when the extra context would noticeably change the output.' },
        materialLabel: 'Reference Materials',
        materialHint: 'Add images, PDFs, Word files, Excel files, Markdown, links, or local paths directly instead of rewriting everything as text.',
        materialTypePlaceholder: 'Enter a link, local path, or a short material title',
        materialNotePlaceholder: 'Add a note, e.g. use this template / main reference file',
        materialEmpty: 'No reference materials yet. Add a link, local path, or choose a file first.'
      },
      modals: {
        promptEyebrow: 'Prompt Preview',
        promptTitle: 'Skill Prompt ready for OpenClaw',
        promptSubtitle: 'Review the final prompt here. Once it looks good, copy it or send it to OpenClaw in one click.',
        promptEmpty: 'After you click Generate, the final scenario Skill prompt will appear here.',
        materialEyebrow: 'Reference Materials',
        materialSubtitle: 'These materials are summarized into text and sent together with the prompt.',
        materialNote: 'Material metadata such as name, type, path or link, and notes is always embedded into the prompt. Compatible local files and images are also attached when possible; the rest is still passed as a text summary. Click any material card to preview it locally.',
        materialPreviewTitle: 'Material Preview',
        materialPreviewSubtitle: 'Preview the current material here, or inspect its path or link.'
      }
    }
  }
};

function createGeneratorForm(source = {}) {
  return generatorHelpers.cloneForm({
    ...generatorHelpers.blankForm(),
    ...source
  });
}

function cloneGeneratorReferenceMaterials(materials = []) {
  return generatorHelpers.normalizeMaterials(materials);
}

function createGeneratorState() {
  const form = createGeneratorForm(DEFAULT_GENERATOR_PAYLOAD);
  return {
    form,
    referenceMaterials: cloneGeneratorReferenceMaterials(form.referenceMaterials),
    prompt: '',
    promptBlocks: [],
    previewOpen: false,
    readiness: DEFAULT_GENERATOR_STATUS,
    validation: generatorHelpers.buildValidation(form),
    lastSendStatus: DEFAULT_GENERATOR_MESSAGE,
    lastSendTone: 'neutral',
    currentStep: 0,
    materialPreviewId: '',
    activeTemplateId: 'blank',
    touchedFields: {},
    nameSuggestions: [],
    attemptedGenerate: false
  };
}

function readInitialLocale() {
  const value = window.localStorage?.getItem(LOCALE_STORAGE_KEY);
  return value === 'en' ? 'en' : 'zh';
}

function readInitialTheme() {
  const value = window.localStorage?.getItem(THEME_STORAGE_KEY);
  return value === 'light' ? 'light' : 'dark';
}

const state = {
  locale: readInitialLocale(),
  theme: readInitialTheme(),
  view: 'generator',
  payload: null,
  filter: 'all',
  sortBy: 'usage',
  search: '',
  selectedSkillName: '',
  workbenchOpen: false,
  apiBase: '',
  loadingDashboard: false,
  loadingDetail: false,
  savingConfig: false,
  loadingFile: false,
  savingFile: false,
  selectedFilePath: '',
  fileEditorMessage: '',
  generator: createGeneratorState()
};

const detailCache = new Map();
const fileCache = new Map();
const fileDrafts = new Map();
const togglingSkills = new Set();
const previousSkillStatus = new Map();
let skillToggleNoticeTimer = null;

function localePack() {
  return I18N[state.locale] || I18N.zh;
}

function translate(path, vars = {}) {
  const value = path.split('.').reduce((current, key) => current?.[key], localePack());
  const resolved = typeof value === 'function' ? value(vars) : value;
  if (typeof resolved !== 'string') return path;
  return resolved.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

function setLocale(nextLocale) {
  state.locale = nextLocale === 'en' ? 'en' : 'zh';
  window.localStorage?.setItem(LOCALE_STORAGE_KEY, state.locale);
  document.documentElement.lang = state.locale === 'en' ? 'en' : 'zh-CN';
  document.title = translate('app.documentTitle');
}

function setTheme(nextTheme, persist = true) {
  state.theme = nextTheme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.style.colorScheme = state.theme;
  if (persist) {
    window.localStorage?.setItem(THEME_STORAGE_KEY, state.theme);
  }
}

const $ = (selector) => document.querySelector(selector);
const skillGrid = $('#skill-grid');
const emptyState = $('#empty-state');
const filterList = $('#filter-list');
const searchBox = $('#search-box');
const sortSelect = $('#sort-select');
const refreshBtn = $('#refresh-btn');
const refreshState = $('#refresh-state');
const topControlLink = $('#top-control-link');
const languageToggleBtn = $('#language-toggle-btn');
const themeToggleBtn = $('#theme-toggle-btn');
const themeToggleIcon = $('#theme-toggle-icon');
const configForm = $('#config-form');
const configNotice = $('#config-notice');
const configEnabled = $('#config-enabled');
const primaryEnvGroup = $('#primary-env-group');
const primaryEnvLabel = $('#primary-env-label');
const configApiKey = $('#config-api-key');
const configEnvJson = $('#config-env-json');
const configJson = $('#config-json');
const commonConfigGroup = $('#common-config-group');
const commonConfigFields = $('#common-config-fields');
const reloadConfigBtn = $('#reload-config-btn');
const saveConfigBtn = $('#save-config-btn');
const detailList = $('#detail-list');
const healthList = $('#health-list');
const automationWarning = $('#automation-warning');
const fileEntryList = $('#file-entry-list');
const fileMeaningBanner = $('#file-meaning-banner');
const fileEditorNotice = $('#file-editor-notice');
const fileEditorMeta = $('#file-editor-meta');
const fileEditorForm = $('#file-editor-form');
const fileEditorContent = $('#file-editor-content');
const fileEditorReadonly = $('#file-editor-readonly');
const reloadFileBtn = $('#reload-file-btn');
const saveFileBtn = $('#save-file-btn');
const configValidationBanner = $('#config-validation-banner');
const configRiskList = $('#config-risk-list');
const configDiffList = $('#config-diff-list');
const viewTabs = $('#view-tabs');
const libraryView = $('#library-view');
const generatorView = $('#generator-view');
const workbenchModal = $('#workbench-modal');
const workbenchModalCloseBtn = $('#workbench-modal-close-btn');
const generatorForm = $('#generator-form');
const generatorResetBtn = $('#generator-reset-btn');
const generatorPrevBtn = $('#generator-prev-btn');
const generatorPreviewBtn = $('#generator-preview-btn');
const generatorCopyBtn = $('#generator-copy-btn');
const generatorSendBtn = $('#generator-send-btn');
const generatorStepList = $('#generator-step-list');
const generatorStatus = $('#generator-status');
const generatorPreviewModal = $('#generator-preview-modal');
const generatorModalCloseBtn = $('#generator-modal-close-btn');
const generatorBlockList = $('#generator-block-list');
const generatorMaterialPreview = $('#generator-material-preview');
const generatorMaterialPreviewSummary = $('#generator-material-preview-summary');
const generatorMaterialPreviewList = $('#generator-material-preview-list');
const generatorTemplateSelect = $('#generator-template-select');
const generatorTemplateClearBtn = $('#generator-template-clear-btn');
const generatorTemplateDescription = $('#generator-template-description');
const generatorValidationSummary = $('#generator-validation-summary');
const generatorValidationTitle = $('#generator-validation-title');
const generatorValidationCount = $('#generator-validation-count');
const generatorValidationList = $('#generator-validation-list');
const generatorSuggestNameBtn = $('#generator-suggest-name-btn');
const generatorNameSuggestions = $('#generator-name-suggestions');
const generatorTriggerModeList = $('#generator-trigger-mode-list');
const generatorKeywordConfig = $('#generator-keyword-config');
const generatorCommandConfig = $('#generator-command-config');
const generatorModelInvocationList = $('#generator-model-invocation-list');
const generatorInputTypeList = $('#generator-input-type-list');
const generatorOutputTypeList = $('#generator-output-type-list');
const generatorAcceptanceList = $('#generator-acceptance-list');
const generatorReferenceRoleList = $('#generator-reference-role-list');
const generatorStepItems = $('#generator-step-items');
const generatorStepAdd = $('#generator-step-add');
const generatorBranchItems = $('#generator-branch-items');
const generatorBranchAdd = $('#generator-branch-add');
const generatorBackgroundCounter = $('#generator-background-counter');
const generatorMaterialType = $('#generator-material-type');
const generatorMaterialUsage = $('#generator-material-usage');
const generatorMaterialValue = $('#generator-material-value');
const generatorMaterialNote = $('#generator-material-note');
const generatorMaterialPromptModePreview = $('#generator-material-prompt-mode-preview');
const generatorMaterialAdd = $('#generator-material-add');
const generatorMaterialFile = $('#generator-material-file');
const generatorMaterialList = $('#generator-material-list');
const generatorMaterialModal = $('#generator-material-modal');
const generatorMaterialModalCloseBtn = $('#generator-material-modal-close-btn');
const generatorMaterialModalTitle = $('#generator-material-modal-title');
const generatorMaterialModalSubtitle = $('#generator-material-modal-subtitle');
const generatorMaterialModalMeta = $('#generator-material-modal-meta');
const generatorMaterialModalRender = $('#generator-material-modal-render');
const generatorMaterialModalOpen = $('#generator-material-modal-open');
const triggerKeywordInput = $('#gen-trigger-keyword-input');
const triggerKeywordAdd = $('#gen-trigger-keyword-add');
const triggerKeywordList = $('#gen-trigger-keyword-list');
const triggerExcludeInput = $('#gen-trigger-exclude-input');
const triggerExcludeAdd = $('#gen-trigger-exclude-add');
const triggerExcludeList = $('#gen-trigger-exclude-list');
const triggerKeywordRule = $('#gen-trigger-keyword-rule');
const triggerPostAction = $('#gen-trigger-post-action');
const triggerCommandName = $('#gen-trigger-command-name');
const triggerCommandAliasInput = $('#gen-trigger-command-alias-input');
const triggerCommandAliasAdd = $('#gen-trigger-command-alias-add');
const triggerCommandAliasList = $('#gen-trigger-command-alias-list');
const triggerCommandDescription = $('#gen-trigger-command-description');
const mustInput = $('#generator-must-input');
const mustAdd = $('#generator-must-add');
const mustList = $('#generator-must-list');
const mustNotInput = $('#generator-must-not-input');
const mustNotAdd = $('#generator-must-not-add');
const mustNotList = $('#generator-must-not-list');
let browserReconnectTimer = null;

function syncBodyModalState() {
  document.body.classList.toggle('modal-open', Boolean(state.generator.previewOpen || state.workbenchOpen || state.generator.materialPreviewId));
}

function setText(selector, value) {
  const element = $(selector);
  if (element) {
    element.textContent = value;
  }
}

function setPlaceholder(selector, value) {
  const element = $(selector);
  if (element) {
    element.placeholder = value;
  }
}

function sourceLabel(skill) {
  return translate(`skill.source.${skill?.source === 'personal' ? 'personal' : 'bundled'}`);
}

function statusLabel(skill) {
  const tone = skill?.status?.tone === 'ready'
    ? 'ready'
    : skill?.status?.tone === 'off'
      ? 'off'
      : skill?.status?.tone
        ? 'blocked'
        : 'pending';
  return translate(`skill.status.${tone}`);
}

function skillEnabled(skill) {
  return skill?.configEntry?.enabled !== false;
}

function materialTypeOptions() {
  return {
    link: state.locale === 'zh' ? '链接' : 'Link',
    path: state.locale === 'zh' ? '本地路径' : 'Local Path',
    note: state.locale === 'zh' ? '补充说明' : 'Note'
  };
}

function renderStaticCopy() {
  setLocale(state.locale);
  setTheme(state.theme, false);
  setText('#app-title', translate('app.title'));
  setText('#app-subtitle', translate('app.subtitle'));
  setText('#language-toggle-btn', translate('app.toggleLanguage'));
  setText('#top-control-link', translate('app.openOpenClaw'));
  if (themeToggleBtn && themeToggleIcon) {
    const nextThemeTitle = state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    themeToggleBtn.setAttribute('aria-label', nextThemeTitle);
    themeToggleBtn.setAttribute('title', nextThemeTitle);
    themeToggleIcon.textContent = state.theme === 'dark' ? '☀' : '☾';
  }
  setText('#refresh-btn', translate('library.refresh'));
  if (!state.loadingDashboard && !state.payload) {
    setText('#refresh-state', state.locale === 'en' ? 'Not loaded yet' : '尚未加载');
  }
  setText('#generator-reset-btn', translate('generator.buttons.reset'));
  setText('#generator-prev-btn', translate('generator.buttons.previous'));
  setText('#generator-copy-btn', translate('generator.buttons.copyPrompt'));
  setText('#generator-send-btn', translate('generator.buttons.sendOpenClaw'));
  setText('#generator-modal-close-btn', translate('generator.buttons.close'));
  setText('#generator-material-modal-close-btn', translate('generator.buttons.close'));
  setText('#generator-material-modal-open', translate('generator.buttons.openInNewWindow'));
  setText('#workbench-modal-close-btn', state.locale === 'zh' ? '关闭' : 'Close');
  setPlaceholder('#search-box', translate('library.searchPlaceholder'));
  setText('#generator-material-add', translate('generator.buttons.addMaterial'));
  const materialFileLabel = document.querySelector('label[for="generator-material-file"]');
  if (materialFileLabel) materialFileLabel.textContent = translate('generator.buttons.chooseFile');
  setPlaceholder('#generator-material-value', translate('generator.fields.materialTypePlaceholder'));
  setPlaceholder('#generator-material-note', translate('generator.fields.materialNotePlaceholder'));
  setText('#skill-title', state.payload ? translate('library.titleWithCount', { count: state.payload.summary.total }) : translate('library.loadingTitle'));
  setText('#skill-subtitle', state.payload ? translate('library.subtitleLoaded') : translate('library.subtitleFallback'));
  setText('#generator-material-modal-title', translate('generator.modals.materialPreviewTitle'));
  setText('#generator-material-modal-subtitle', translate('generator.modals.materialPreviewSubtitle'));
  setText('.workbench-modal-head .workbench-title', state.locale === 'en' ? 'Skill Workbench' : 'Skill 工作台');
  const workbenchCopy = document.querySelector('.workbench-modal-copy');
  if (workbenchCopy) {
    workbenchCopy.textContent = state.locale === 'en'
      ? 'Click a Skill card to drill into its structure, file meanings, and editable content here.'
      : '点击 Skill 后，通过这里下钻查看结构、文件说明和可编辑内容。';
  }
  const workbenchSections = document.querySelectorAll('#workbench-modal .workbench-section > .section-title');
  if (workbenchSections[0]) workbenchSections[0].textContent = state.locale === 'en' ? 'Structure & Files' : '结构与文件';
  if (workbenchSections[1]) workbenchSections[1].textContent = state.locale === 'en' ? 'Current File Meaning' : '当前文件说明';
  if (workbenchSections[2]) workbenchSections[2].textContent = state.locale === 'en' ? 'Edit Current File' : '手动编辑当前文件';
  setText('#reload-file-btn', state.locale === 'en' ? 'Reload' : '重新读取');
  setText('#save-file-btn', state.locale === 'en' ? 'Save File' : '保存当前文件');

  const libraryRailNotice = document.querySelector('#library-view .notice-banner');
  if (libraryRailNotice) {
    libraryRailNotice.textContent = translate('library.scopeNotice');
  }

  const librarySectionTitle = document.querySelector('#library-view .skill-header .section-title');
  if (librarySectionTitle) librarySectionTitle.textContent = translate('library.sectionTitle');

  const generatorSectionTitle = document.querySelector('#generator-view .skill-header .section-title');
  if (generatorSectionTitle) generatorSectionTitle.textContent = translate('generator.title');
  const generatorHeadline = document.querySelector('#generator-view .skill-header h2');
  if (generatorHeadline) generatorHeadline.textContent = translate('generator.headline');
  const generatorSubtitle = document.querySelector('#generator-view .skill-header .skill-subtitle');
  if (generatorSubtitle) generatorSubtitle.textContent = translate('generator.subtitle');
  const stepperCopy = document.querySelector('.generator-stepper-copy');
  if (stepperCopy) stepperCopy.textContent = translate('generator.stepperCopy');

  const groupKeys = ['definition', 'execution', 'reference'];
  groupKeys.forEach((key) => {
    const sectionTitle = document.querySelector(`[data-generator-group="${key}"] .section-title`);
    const sectionDesc = document.querySelector(`[data-generator-group="${key}"] .generator-group-desc`);
    if (sectionTitle) sectionTitle.textContent = translate(`generator.sections.${key}.title`);
    if (sectionDesc) sectionDesc.textContent = translate(`generator.sections.${key}.desc`);
  });

  const generatorFieldCopy = state.locale === 'en'
    ? {
        scenarioName: { label: 'Skill scenario name', placeholder: 'e.g. Meeting notes and action items', hint: 'Use “object + action + result”, for example: Meeting notes and action items.' },
        useWhen: { label: 'When will this Skill be used?', placeholder: 'e.g. Every time I receive a meeting transcript and need a usable memo.', hint: 'Describe the real moment when this Skill should be invoked.' },
        userSays: { label: 'What will the user usually say?', placeholder: 'e.g. Summarize this meeting\nExtract action items\nTurn this into meeting notes', hint: 'Write one common phrase per line.' },
        scenarioGoal: { label: 'Final desired outcome', placeholder: 'e.g. Output a structured memo with action items, owners, due dates, and follow-up questions.', hint: 'Describe only the final deliverable, not the process.' },
        inputDescription: { label: 'What is usually included in the input', placeholder: 'e.g. transcripts, spreadsheets, PRD docs, chat records', hint: 'Describe the recurring input mix instead of one specific file.' },
        outputDescription: { label: 'Output description', placeholder: 'e.g. memo summary, action item table, pending questions', hint: 'Be explicit about the final output.' },
        outputFormat: { label: 'Output format requirements', placeholder: 'e.g. Summary first, then a table of actions, then open questions', hint: 'Clarify the structure if it matters.' },
        acceptanceCustom: { label: 'Custom acceptance criteria', placeholder: 'Add your own criteria, e.g. if owners are missing, mark them as pending confirmation.', hint: 'Preset checklist plus your custom standards works best.' },
        references: { label: 'Templates / examples', placeholder: 'e.g. historical weekly report templates, brand guidelines, strong examples', hint: 'Use this when existing examples should shape the result.' },
        optionalBackground: { label: 'Additional background', placeholder: 'Recommended 50 to 200 chars; add only if it changes the final result.', hint: 'Keep this short and decision-relevant.' }
      }
    : {
        scenarioName: { label: 'Skill 场景名称', placeholder: '例如：会议纪要与行动项提炼', hint: '建议用“对象 + 动作 + 结果”命名，例如：会议纪要与行动项提炼。' },
        useWhen: { label: '什么时候会用到这个 Skill？', placeholder: '例如：每次拿到会议转写稿，需要自动整理成纪要时。', hint: '描述真实使用时机，不要写岗位背景。' },
        userSays: { label: '用户通常会怎么说？', placeholder: '例如：帮我整理这段会议记录\n提炼行动项\n输出纪要', hint: '一行一句常见说法，后续会参与触发策略和 Prompt 生成。' },
        scenarioGoal: { label: '最终想要的结果', placeholder: '例如：输出结构化会议纪要，包含行动项、责任人、截止时间和待确认事项。', hint: '只写最终交付物，不写过程。' },
        inputDescription: { label: '输入里通常会包含什么', placeholder: '例如：会议转写稿、Excel 表格、PRD 文档、聊天记录。', hint: '这里写输入里通常会有什么，而不是具体哪一份文件。' },
        outputDescription: { label: '输出内容说明', placeholder: '例如：结构化纪要、行动项清单、待确认事项。', hint: '把最终产出写清楚。' },
        outputFormat: { label: '输出格式要求', placeholder: '例如：先给摘要，再给行动项表格，最后列待确认信息。', hint: '如果输出结构固定，请在这里说明。' },
        acceptanceCustom: { label: '补充你的专属标准', placeholder: '例如：没有明确责任人时要标注待确认。', hint: '预置 checklist 之外的专属标准写在这里。' },
        references: { label: '参考模板 / 示例', placeholder: '例如：历史周报模板、品牌规范、优秀示例、固定字段说明。', hint: '如果已有固定模板或强参考，请尽量写出来。' },
        optionalBackground: { label: '补充背景', placeholder: '推荐 50 到 200 字；只有额外背景会明显影响产出时再补。', hint: '保持简短，只补真正会影响结果的信息。' }
      };

  Object.entries({
    scenarioName: 'gen-scenario-name',
    useWhen: 'gen-use-when',
    userSays: 'gen-user-says',
    scenarioGoal: 'gen-scenario-goal',
    inputDescription: 'gen-inputs',
    outputDescription: 'gen-output-desc',
    outputFormat: 'gen-output-format',
    acceptanceCustom: 'gen-acceptance-custom',
    references: 'gen-references',
    optionalBackground: 'gen-optional-background'
  }).forEach(([key, id]) => {
    const copy = generatorFieldCopy[key];
    const group = document.querySelector(`#${id}`)?.closest('.config-group');
    const label = group?.querySelector(`label[for="${id}"]`);
    const hint = group?.querySelector('.generator-field-hint');
    if (label && copy?.label) label.textContent = copy.label;
    if (copy?.placeholder) setPlaceholder(`#${id}`, copy.placeholder);
    if (hint && copy?.hint) hint.textContent = copy.hint;
  });

  const materialGroup = $('#generator-material-value')?.closest('.config-group');
  const materialLabel = materialGroup?.querySelector('label[for="generator-material-value"]');
  const materialHint = materialGroup?.querySelector('.generator-field-hint');
  if (materialLabel) materialLabel.textContent = translate('generator.fields.materialLabel');
  if (materialHint) materialHint.textContent = translate('generator.fields.materialHint');

  setText('#generator-template-clear-btn', state.locale === 'en' ? 'Back to blank' : '回到空白');
  setText('#generator-suggest-name-btn', state.locale === 'en' ? 'Suggest names' : '智能命名建议');
  setText('#generator-step-add', state.locale === 'en' ? 'Add step' : '新增一步');
  setText('#generator-branch-add', state.locale === 'en' ? 'Add rule' : '新增规则');

  const select = $('#generator-material-type');
  if (select) {
    const options = materialTypeOptions();
    Array.from(select.options).forEach((option) => {
      option.textContent = options[option.value] || option.textContent;
    });
  }

  if (generatorMaterialUsage) {
    const usageOptions = {
      template: state.locale === 'en' ? 'Template' : '模板',
      example: state.locale === 'en' ? 'Example' : '示例',
      background: state.locale === 'en' ? 'Background material' : '背景资料',
      forbidden: state.locale === 'en' ? 'Forbidden guidance' : '禁忌说明'
    };
    Array.from(generatorMaterialUsage.options).forEach((option) => {
      option.textContent = usageOptions[option.value] || option.textContent;
    });
  }

  const previewEyebrow = $('#generator-preview-modal .section-title');
  if (previewEyebrow) previewEyebrow.textContent = translate('generator.modals.promptEyebrow');
  const previewTitle = $('#generator-preview-modal h3');
  if (previewTitle) previewTitle.textContent = translate('generator.modals.promptTitle');
  const previewSubtitle = $('#generator-preview-modal .skill-subtitle');
  if (previewSubtitle) previewSubtitle.textContent = translate('generator.modals.promptSubtitle');
  const materialEyebrow = $('#generator-material-preview .section-title');
  if (materialEyebrow) materialEyebrow.textContent = translate('generator.modals.materialEyebrow');
  const materialSub = $('#generator-material-preview .generator-preview-copy');
  if (materialSub) materialSub.textContent = translate('generator.modals.materialSubtitle');
  const materialNote = $('#generator-material-preview .generator-material-preview-note');
  if (materialNote) materialNote.textContent = translate('generator.modals.materialNote');
  updateMaterialPromptModePreview();
}

function platformLabel(platform) {
  return platform === 'darwin'
    ? 'macOS'
    : platform === 'win32'
      ? 'Windows'
      : platform === 'linux'
        ? 'Linux'
        : platform || 'Unknown';
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function relativeTime(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const seconds = Math.max(1, Math.floor(diff / 1000));
  if (seconds < 60) return translate('common.secondsAgo', { count: seconds });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return translate('common.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  return translate('common.hoursAgo', { count: hours });
}

function hydrateClientInfo() {
  return window.openclawDesktop?.getClientInfo?.() || null;
}

function isDesktopClient() {
  return Boolean(window.openclawDesktop?.isDesktopClient?.());
}

function clearBrowserReconnectTimer() {
  if (!browserReconnectTimer) return;
  window.clearTimeout(browserReconnectTimer);
  browserReconnectTimer = null;
}

function scheduleBrowserReconnect(force = true) {
  if (isDesktopClient() || browserReconnectTimer) {
    return;
  }

  browserReconnectTimer = window.setTimeout(() => {
    browserReconnectTimer = null;
    void loadDashboard(force);
  }, Number.isFinite(BROWSER_RETRY_DELAY_MS) ? BROWSER_RETRY_DELAY_MS : 4000);
}

function renderDashboardErrorState(error) {
  const message = escapeHtml(error?.message || error);
  $('#skill-title').textContent = translate('library.errorTitle');
  $('#skill-subtitle').textContent = error?.message || translate('library.errorSubtitle');
  skillGrid.innerHTML = '';
  emptyState.hidden = false;

  if (isDesktopClient()) {
    emptyState.innerHTML = translate('library.errorDesktop', { message });
    return;
  }

  emptyState.innerHTML = `
    <div>${translate('library.errorBrowser', { message })}</div>
    <div style="margin-top:10px;">${translate('library.errorBrowserHint')}</div>
    <div class="empty-state-actions">
      <button class="small-btn" type="button" data-action="retry-dashboard">${translate('library.retryNow')}</button>
    </div>
  `;

  emptyState.querySelector('[data-action="retry-dashboard"]')?.addEventListener('click', () => {
    clearBrowserReconnectTimer();
    refreshState.textContent = translate('library.refreshRetrying');
    void loadDashboard(true);
  });
}

async function attemptDesktopServiceRecovery(lastError) {
  if (!window.openclawDesktop?.recoverLocalService) {
    return false;
  }

  refreshState.textContent = translate('library.refreshRecovering');

  try {
    const result = await window.openclawDesktop.recoverLocalService();
    if (!result?.ok) {
      return false;
    }

    if (result.url) {
      const recoveredOrigin = new URL(result.url).origin;
      state.apiBase = recoveredOrigin === window.location.origin ? '' : recoveredOrigin;
    } else {
      state.apiBase = '';
    }

    refreshState.textContent = translate('library.refreshRecovered');
    return true;
  } catch (error) {
    console.error('Auto-recovery failed:', error || lastError);
    return false;
  }
}

async function apiFetch(path, options = {}) {
  const { attemptRecovery = true, ...fetchOptions } = options;
  const bases = state.apiBase ? [state.apiBase] : ['', 'http://127.0.0.1:4318'];
  let lastError = new Error('本地数据接口未启动');

  for (const base of bases) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(`${base}${path}`, {
        ...fetchOptions,
        signal: fetchOptions.signal || controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(fetchOptions.headers || {})
        }
      });
      clearTimeout(timeout);

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }
      if (!contentType.includes('application/json')) {
        throw new Error('接口没有返回 JSON，可能当前不是通过本地数据服务打开的。');
      }

      const payload = await response.json();
      state.apiBase = base;
      return payload;
    } catch (error) {
      clearTimeout(timeout);
      if (error?.name === 'AbortError') {
        lastError = new Error('本地数据服务响应超时。请刷新一次；如果仍然失败，请重启 `npm run dev:web` 或客户端。');
      } else {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }
  }

  if (attemptRecovery) {
    const recovered = await attemptDesktopServiceRecovery(lastError);
    if (recovered) {
      return apiFetch(path, { ...fetchOptions, attemptRecovery: false });
    }
  }

  throw lastError;
}

function currentSkills() {
  if (!state.payload) return [];
  const search = state.search.trim().toLowerCase();

  return (state.payload.skills || []).filter((skill) => {
    const haystack = [
      skill.name,
      skill.skillKey,
      skill.description
    ].join(' ').toLowerCase();

    return matchesFilter(skill, state.filter) && (!search || haystack.includes(search));
  }).sort(compareSkills);
}

function chooseDefaultSkill(skills) {
  return skills[0] || null;
}

function compareSkills(left, right) {
  if (state.sortBy === 'name') {
    return left.name.localeCompare(right.name, 'zh-CN');
  }

  if (state.sortBy === 'recent') {
    if ((right.usage?.lastUsedAtMs || 0) !== (left.usage?.lastUsedAtMs || 0)) {
      return (right.usage?.lastUsedAtMs || 0) - (left.usage?.lastUsedAtMs || 0);
    }
  } else if (state.sortBy === 'ready') {
    if (left.status?.tone !== right.status?.tone) {
      return left.status?.tone === 'ready' ? -1 : 1;
    }
  } else if (state.sortBy === 'blocked') {
    if (left.status?.tone !== right.status?.tone) {
      return left.status?.tone !== 'ready' ? -1 : 1;
    }
  } else {
    if ((right.usage?.count7d || 0) !== (left.usage?.count7d || 0)) {
      return (right.usage?.count7d || 0) - (left.usage?.count7d || 0);
    }
    if ((right.usage?.totalCount || 0) !== (left.usage?.totalCount || 0)) {
      return (right.usage?.totalCount || 0) - (left.usage?.totalCount || 0);
    }
  }

  if ((right.automation?.boundCount || 0) !== (left.automation?.boundCount || 0)) {
    return (right.automation?.boundCount || 0) - (left.automation?.boundCount || 0);
  }

  if ((right.usage?.lastUsedAtMs || 0) !== (left.usage?.lastUsedAtMs || 0)) {
    return (right.usage?.lastUsedAtMs || 0) - (left.usage?.lastUsedAtMs || 0);
  }

  return left.name.localeCompare(right.name, 'zh-CN');
}

function formatUsageText(usage, long = false) {
  if (!usage) {
    return long ? '近 7 天 0 次 · 近 30 天 0 次 · 总计 0 次' : '暂无调用';
  }

  if (long) {
    return `近 7 天 ${usage.count7d || 0} 次 · 近 30 天 ${usage.count30d || 0} 次 · 总计 ${usage.totalCount || 0} 次`;
  }

  if ((usage.count7d || 0) > 0) return `近 7 天 ${usage.count7d} 次`;
  if ((usage.totalCount || 0) > 0) return `总计 ${usage.totalCount} 次`;
  return '暂无调用';
}

function formatCronBindingText(automation, long = false) {
  if (!automation?.available) {
    return long ? '当前未读到本地任务数据' : '任务数据暂不可用';
  }

  if ((automation.boundCount || 0) > 0) {
    return long ? `已绑定 ${automation.boundCount} 个定时任务` : `已绑定 ${automation.boundCount} 个任务`;
  }

  return '未绑定';
}

function matchesFilter(skill, filter) {
  if (filter === 'all') return true;
  if (filter === 'personal') return skill.source === 'personal';
  if (filter === 'bundled') return skill.source === 'bundled';
  if (filter === 'configured') return Boolean(skill.configEntry?.exists);
  return true;
}

function countSkillsByFilter(skills, filter) {
  return (skills || []).filter((skill) => matchesFilter(skill, filter)).length;
}

function buildStatusPill(status, label) {
  const className = status === 'pass'
    ? 'pass'
    : status === 'pending'
      ? 'pending'
      : status === 'warn'
        ? 'warn'
        : 'fix';
  return `<span class="inline-status ${className}">${escapeHtml(label)}</span>`;
}

function uniqueValues(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function getSkillTextBundle(skill) {
  return [
    skill?.description,
    skill?.skillMdPreview,
    skill?.homepage,
    ...(skill?.install || []),
    ...(skill?.files || []),
    ...(skill?.requirements?.bins || []),
    ...(skill?.requirements?.env || []),
    ...(skill?.requirements?.config || []),
    ...(skill?.configChecks || [])
  ].join(' ');
}

function hasPattern(text, pattern) {
  return pattern.test(String(text || ''));
}

function buildUsageSourceHint(skill) {
  const hasUsage = Boolean(skill?.usage?.totalCount);
  const hasAutomation = (skill?.automation?.boundCount || 0) > 0;

  if (hasUsage && hasAutomation) {
    return '来源线索：已看到本地手动调用记录，同时这个 Skill 已绑定自动任务。';
  }

  if (hasAutomation) {
    return '来源线索：当前已绑定自动任务，后续调用可能来自 cron 或自动流程。';
  }

  if (hasUsage) {
    return '来源线索：当前主要看到本地会话中的手动调用记录。';
  }

  return '来源线索：当前还没有足够的调用记录。';
}

function buildCriticalItems(skill) {
  if (!skill) {
    return ['当前还没有可展示的缺失项。'];
  }

  const items = [];

  if (skill.missing?.bins?.length) {
    items.push(`缺少 CLI：${skill.missing.bins.join('、')}`);
  }
  if (skill.missing?.env?.length) {
    items.push(`缺少环境变量：${skill.missing.env.join('、')}`);
  }
  if (skill.missing?.config?.length) {
    items.push(`缺少配置项：${skill.missing.config.join('、')}`);
  }
  if (skill.missing?.os?.length) {
    items.push(`系统限制：${skill.missing.os.join('、')}`);
  }

  return items.length ? items : ['当前没有关键缺失项，这个 Skill 可以直接使用。'];
}

function buildHealthModel(skill) {
  const requirements = skill?.requirements || { bins: [], anyBins: [], env: [], config: [], os: [] };
  const checks = [
    {
      label: '当前可运行',
      status: skill?.status?.tone === 'ready' ? 'pass' : skill?.status?.tone === 'off' ? 'warn' : 'fix',
      note: skill?.status?.note || '状态信息读取中'
    },
    {
      label: 'CLI 依赖',
      status: skill?.missing?.bins?.length || skill?.missing?.anyBins?.length ? 'fix' : (requirements.bins?.length || requirements.anyBins?.length ? 'pass' : 'pending'),
      note: skill?.missing?.bins?.length
        ? `缺少：${skill.missing.bins.join('、')}`
        : skill?.missing?.anyBins?.length
          ? `至少需要其一：${skill.missing.anyBins.join('、')}`
          : requirements.bins?.length || requirements.anyBins?.length
            ? `已声明：${uniqueValues([...(requirements.bins || []), ...(requirements.anyBins || [])]).join('、')}`
            : '没有声明额外 CLI'
    },
    {
      label: '环境变量',
      status: skill?.missing?.env?.length ? 'fix' : (requirements.env?.length || skill?.primaryEnv ? 'pass' : 'pending'),
      note: skill?.missing?.env?.length
        ? `缺少：${skill.missing.env.join('、')}`
        : requirements.env?.length || skill?.primaryEnv
          ? `已声明：${uniqueValues([...(requirements.env || []), skill.primaryEnv]).join('、')}`
          : '没有声明额外环境变量'
    },
    {
      label: '配置项',
      status: skill?.missing?.config?.length ? 'fix' : (requirements.config?.length || skill?.configChecks?.length ? 'pass' : 'pending'),
      note: skill?.missing?.config?.length
        ? `缺少：${skill.missing.config.join('、')}`
        : requirements.config?.length || skill?.configChecks?.length
          ? `已声明：${uniqueValues([...(requirements.config || []), ...(skill?.configChecks || [])]).join('、')}`
          : '没有声明额外配置项'
    }
  ];

  if (skill?.missing?.os?.length || requirements.os?.length) {
    checks.splice(1, 0, {
      label: '系统限制',
      status: skill?.missing?.os?.length ? 'fix' : 'pass',
      note: skill?.missing?.os?.length ? `限制：${skill.missing.os.join('、')}` : `声明系统：${requirements.os.join('、')}`
    });
  }

  return {
    runnable: skill?.status?.tone === 'ready',
    checks
  };
}

function buildRepairSuggestions(skill) {
  const suggestions = [];

  if (skill?.status?.tone === 'off') {
    suggestions.push('当前 Skill 在手动配置层已禁用。若还要继续使用，先重新启用后再保存。');
  }
  if (skill?.missing?.bins?.length) {
    suggestions.push(`先补装缺失的 CLI：${skill.missing.bins.join('、')}。`);
  }
  if (skill?.missing?.anyBins?.length) {
    suggestions.push(`需要补齐可选依赖之一：${skill.missing.anyBins.join('、')}。`);
  }
  if (skill?.missing?.env?.length) {
    suggestions.push(`把缺失环境变量补到启动环境或 entries.env 中：${skill.missing.env.join('、')}。`);
  }
  if (skill?.missing?.config?.length) {
    suggestions.push(`去“手动配置”补齐缺失字段：${skill.missing.config.join('、')}。`);
  }
  if ((skill?.automation?.boundCount || 0) > 0) {
    suggestions.push(`当前已绑定 ${skill.automation.boundCount} 个定时任务，保存前先确认不会影响自动执行。`);
  }
  if (skill?.status?.tone === 'ready') {
    suggestions.push('当前已经可以直接使用；如果要调整默认行为，可以在下方改配置后保存。');
  }

  return suggestions.length
    ? suggestions
    : ['当前没有额外修复动作，直接保存或进入 OpenClaw 使用即可。'];
}

function buildQualityChecklist(skill) {
  const textBundle = getSkillTextBundle(skill);
  const description = String(skill?.description || '').trim();
  const files = (skill?.files || []).filter((file) => file !== 'SKILL.md');
  const hasDependencies = Boolean(
    skill?.requirements?.bins?.length
    || skill?.requirements?.anyBins?.length
    || skill?.requirements?.env?.length
    || skill?.requirements?.config?.length
    || skill?.install?.length
    || skill?.configChecks?.length
  );
  const clearDescription = description.length >= 8 && !/(暂无描述|demo|test|示例)$/i.test(description);
  const hasTestingHint = /(测试|验证|test|验收)/i.test(textBundle);
  const hasBoundaryHint = /(适用|不适用|仅在|不要|避免|限制|边界|场景|when user)/i.test(textBundle);

  return [
    {
      label: '名称可读',
      status: String(skill?.name || '').trim() ? 'pass' : 'fix',
      note: String(skill?.name || '').trim() ? '当前 Skill 名称可直接识别。' : '缺少清晰名称。'
    },
    {
      label: '描述清晰',
      status: clearDescription ? 'pass' : 'fix',
      note: clearDescription ? '当前描述已经能说明这个 Skill 的用途。' : '描述过短或过泛，建议补到“看一眼就知道做什么”。'
    },
    {
      label: '依赖声明',
      status: hasDependencies ? 'pass' : 'pending',
      note: hasDependencies ? '已经声明了依赖、安装提示或配置检查。' : '暂未看到依赖声明；如果确实无依赖，也建议在文档里写清楚。'
    },
    {
      label: 'supporting files',
      status: files.length ? 'pass' : 'pending',
      note: files.length ? `已存在 supporting files：${files.join('、')}` : '当前只有 SKILL.md，若输出格式复杂建议补 supporting files。'
    },
    {
      label: '测试方法',
      status: hasTestingHint ? 'pass' : 'pending',
      note: hasTestingHint ? '文档里已经出现测试或验证提示。' : '建议补一个最小测试方法，方便后续回归。'
    },
    {
      label: '适用边界',
      status: hasBoundaryHint ? 'pass' : 'pending',
      note: hasBoundaryHint ? '文档里已经提到适用场景或限制条件。' : '建议明确适用场景、禁区和不要编造的内容。'
    }
  ];
}

function buildSecurityModel(skill) {
  const textBundle = getSkillTextBundle(skill);
  const sensitiveKeys = uniqueValues([
    skill?.primaryEnv,
    ...(skill?.requirements?.env || []),
    ...Object.keys(skill?.configEntry?.env || {}),
    ...Object.keys(skill?.configEntry?.config || {})
  ]).filter((item) => /(api[_-]?key|token|secret|password|credential|webhook|sign|signature)/i.test(item));
  const highPrivilege = /(ssh|sudo|powershell|shell|terminal|osascript|docker|kubectl|mysql|psql)/i.test(textBundle);
  const webhookRelated = /(webhook|callback|自动投递|自动发送|推送|回调)/i.test(textBundle);
  const controlIsLoopback = /^https?:\/\/(127\.0\.0\.1|localhost)/i.test(OPENCLAW_CONTROL_URL);
  const items = [];

  if (!controlIsLoopback) {
    items.push('当前控制台地址不是 loopback，本地操作可能会暴露到外部网络。');
  }
  if ((skill?.automation?.boundCount || 0) > 0) {
    items.push(`当前 Skill 已绑定 ${skill.automation.boundCount} 个定时任务，改配置前要考虑自动执行影响。`);
  }
  if (sensitiveKeys.length) {
    items.push(`当前 Skill 涉及关键鉴权字段：${sensitiveKeys.join('、')}。`);
  }
  if (highPrivilege) {
    items.push('文档或依赖里出现系统级执行线索，建议谨慎修改并先做最小验证。');
  }
  if (webhookRelated) {
    items.push('这个 Skill 可能和 webhook 或外部自动投递相关，修改后要同步核对外部服务。');
  }

  return {
    tone: items.length ? 'warn' : 'good',
    message: items.length ? '当前 Skill 有轻量风险提示，保存前建议先看一遍。' : '当前没有识别到明显高风险信号。',
    items: items.length ? items : ['当前没有识别到明显高风险信号；仍建议在保存后做一次最小验证。']
  };
}

function safeParseJsonField(label, value) {
  const text = String(value || '').trim();
  if (!text) {
    return { ok: true, value: {}, error: '' };
  }

  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`${label} 必须是 JSON 对象`);
    }
    return { ok: true, value: parsed, error: '' };
  } catch {
    return { ok: false, value: {}, error: `${label} 不是合法的 JSON 对象` };
  }
}

function valuePresent(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function buildObjectDiffEntries(label, beforeValue, afterValue) {
  const beforeObject = beforeValue || {};
  const afterObject = afterValue || {};
  const keys = uniqueValues([...Object.keys(beforeObject), ...Object.keys(afterObject)]).sort((left, right) => left.localeCompare(right, 'zh-CN'));
  const entries = [];

  keys.forEach((key) => {
    const beforeEntry = beforeObject[key];
    const afterEntry = afterObject[key];
    if (JSON.stringify(beforeEntry) === JSON.stringify(afterEntry)) return;

    if (!(key in beforeObject)) {
      entries.push(`${label}.${key}：新增`);
      return;
    }
    if (!(key in afterObject)) {
      entries.push(`${label}.${key}：删除`);
      return;
    }
    entries.push(`${label}.${key}：已修改`);
  });

  return entries;
}

function buildConfigValidation(detail) {
  if (!detail) {
    return {
      tone: 'neutral',
      message: '选择一个 Skill 后，这里会先检查 JSON 格式、关键字段变更和保存风险。',
      risks: [],
      diffs: [],
      canSave: false
    };
  }

  const envResult = safeParseJsonField('环境变量 JSON', configEnvJson.value);
  const configResult = safeParseJsonField('配置项 JSON', configJson.value);
  const risks = [];
  const diffs = [];
  const parseErrors = [envResult.error, configResult.error].filter(Boolean);
  const before = detail.configEntry || { enabled: true, apiKey: '', env: {}, config: {} };
  const after = {
    enabled: configEnabled.checked,
    apiKey: configApiKey.value.trim(),
    env: envResult.value,
    config: configResult.value
  };

  if (before.enabled !== after.enabled) {
    diffs.push(`启用状态：${before.enabled ? '启用' : '禁用'} → ${after.enabled ? '启用' : '禁用'}`);
  }
  if ((before.apiKey || '') !== (after.apiKey || '')) {
    diffs.push(`主密钥：${before.apiKey ? '已配置' : '未配置'} → ${after.apiKey ? '已配置' : '未配置'}`);
  }
  diffs.push(...buildObjectDiffEntries('env', before.env, after.env));
  diffs.push(...buildObjectDiffEntries('config', before.config, after.config));

  const requiredEnv = uniqueValues(detail.missing?.env || []).filter((key) => key !== detail.primaryEnv);
  const missingEnv = requiredEnv.filter((key) => !valuePresent(after.env[key]));
  const missingConfig = uniqueValues(detail.missing?.config || []).filter((key) => !valuePresent(after.config[key]));

  parseErrors.forEach((error) => risks.push(error));
  if (detail.primaryEnv && (detail.missing?.env || []).includes(detail.primaryEnv) && !after.apiKey) {
    risks.push(`主密钥 ${detail.primaryEnv} 为空，保存后这个 Skill 可能仍然不可用。`);
  }
  if (missingEnv.length) {
    risks.push(`缺少必填环境变量：${missingEnv.join('、')}。`);
  }
  if (missingConfig.length) {
    risks.push(`缺少必填配置项：${missingConfig.join('、')}。`);
  }
  if (!after.enabled) {
    risks.push('当前变更会把这个 Skill 设为禁用状态。');
  }
  if ((detail.automation?.boundCount || 0) > 0 && diffs.length) {
    risks.push(`当前 Skill 已绑定 ${detail.automation.boundCount} 个定时任务，保存后可能影响自动执行。`);
  }
  if (detail.usage?.isHighFrequency && diffs.length) {
    risks.push('当前是高频 Skill，建议在低风险时段修改，并保存后立即验证。');
  }
  const sensitiveDiff = [detail.primaryEnv, ...Object.keys(after.env || {}), ...Object.keys(after.config || {})]
    .filter((key) => /(api[_-]?key|token|secret|password|credential|webhook|sign|signature)/i.test(key || ''));
  if (diffs.length && sensitiveDiff.length) {
    risks.push(`当前变更涉及关键鉴权字段：${uniqueValues(sensitiveDiff).join('、')}。`);
  }

  if (parseErrors.length) {
    return {
      tone: 'danger',
      message: `保存前需要先修正 ${parseErrors.length} 处格式问题。`,
      risks,
      diffs,
      canSave: false
    };
  }

  if (diffs.length) {
    return {
      tone: risks.length ? 'warn' : 'good',
      message: risks.length ? `已检测到 ${diffs.length} 处配置变更，保存前建议先阅读风险提醒。` : `已检测到 ${diffs.length} 处配置变更，可以保存。`,
      risks,
      diffs,
      canSave: true
    };
  }

  return {
    tone: 'neutral',
    message: '当前表单和磁盘内容一致，还没有新的配置变更。',
    risks,
    diffs,
    canSave: true
  };
}

function buildSkillAdvice(skill) {
  if ((skill.automation?.boundCount || 0) > 0 && skill.status?.tone !== 'ready') {
    return '当前已绑定定时任务，建议先补齐配置，再修改执行逻辑。';
  }

  if ((skill.automation?.boundCount || 0) > 0) {
    return '当前已绑定定时任务，修改配置前先确认不会影响自动执行。';
  }

  if (skill.status?.tone !== 'ready') {
    return '缺少配置或依赖，建议先补齐再使用。';
  }

  return '已可直接使用，适合继续优化模板和使用频率。';
}

function parseConfigJsonOrEmpty() {
  const result = safeParseJsonField('配置项 JSON', configJson.value);
  return result.ok ? result.value : {};
}

function getCommonConfigKeys(detail) {
  if (!detail) return [];

  return uniqueValues([
    ...(detail.requirements?.config || []),
    ...(detail.missing?.config || []),
    ...Object.keys(detail.configEntry?.config || {})
  ]).sort((left, right) => left.localeCompare(right, 'zh-CN'));
}

function commonConfigFieldId(key) {
  return `common-config-${String(key || '').replace(/[^A-Za-z0-9_-]+/g, '-')}`;
}

function syncCommonConfigJsonFromFields() {
  if (!commonConfigFields) return;

  const current = parseConfigJsonOrEmpty();
  commonConfigFields.querySelectorAll('[data-common-config-key]').forEach((input) => {
    const key = input.dataset.commonConfigKey;
    const value = input.value.trim();
    if (value) {
      current[key] = value;
    } else {
      delete current[key];
    }
  });

  configJson.value = JSON.stringify(current, null, 2);
}

function renderCommonConfigFields(detail) {
  if (!commonConfigGroup || !commonConfigFields) return;

  const keys = getCommonConfigKeys(detail);
  if (!detail || !keys.length) {
    commonConfigGroup.hidden = true;
    commonConfigFields.innerHTML = '';
    return;
  }

  const values = parseConfigJsonOrEmpty();
  commonConfigGroup.hidden = false;
  commonConfigFields.innerHTML = keys.map((key) => `
    <div class="config-field">
      <label for="${commonConfigFieldId(key)}">${escapeHtml(key)}</label>
      <input
        class="text-input"
        id="${commonConfigFieldId(key)}"
        data-common-config-key="${escapeHtml(key)}"
        type="text"
        value="${escapeHtml(values[key] ?? '')}"
        placeholder="输入 ${escapeHtml(key)}"
      />
    </div>
  `).join('');

  commonConfigFields.querySelectorAll('[data-common-config-key]').forEach((input) => {
    input.addEventListener('input', () => {
      syncCommonConfigJsonFromFields();
      renderConfigGuard(getSelectedDetail() || getSelectedSummary());
    });
    input.addEventListener('change', () => {
      syncCommonConfigJsonFromFields();
      renderConfigGuard(getSelectedDetail() || getSelectedSummary());
    });
  });
}

function ensureSelectedSkill() {
  const skills = currentSkills();
  if (!skills.length) {
    state.selectedSkillName = '';
    return null;
  }

  const current = skills.find((skill) => skill.name === state.selectedSkillName);
  if (current) return current;

  const next = chooseDefaultSkill(skills);
  state.selectedSkillName = next?.name || '';
  return next;
}

function getSelectedSummary() {
  if (!state.payload) return null;
  return state.payload.skills.find((skill) => skill.name === state.selectedSkillName) || null;
}

function getSelectedDetail() {
  return detailCache.get(state.selectedSkillName) || null;
}

function fileCacheKey(skillName, filePath) {
  return `${skillName}::${filePath}`;
}

function chooseDefaultFilePath(detail) {
  const entries = detail?.fileEntries || [];
  return entries.find((entry) => entry.path === 'SKILL.md')?.path
    || entries.find((entry) => !entry.isDirectory)?.path
    || entries[0]?.path
    || '';
}

function getSelectedFileEntry(detail) {
  if (!detail?.fileEntries?.length) return null;
  return detail.fileEntries.find((entry) => entry.path === state.selectedFilePath) || null;
}

function getSelectedFileDetail() {
  if (!state.selectedSkillName || !state.selectedFilePath) return null;
  return fileCache.get(fileCacheKey(state.selectedSkillName, state.selectedFilePath)) || null;
}

function summarizeFileEntryConfig(entry) {
  if (!entry) return '点击后查看这个文件里能识别到的配置项。';
  if (entry.isDirectory) return '目录本身不直接编辑，点进去看里面的文件和模板。';
  if (entry.configHints?.length) return entry.configHints[0];
  if (entry.editable) return '可直接打开查看文件内容，并按需手动修改。';
  return '当前更适合作为素材或只读文件查看。';
}

async function loadSkillFile(skillName, filePath, force = false) {
  if (!skillName || !filePath) return null;
  const cacheKey = fileCacheKey(skillName, filePath);
  if (!force && fileCache.has(cacheKey)) {
    return fileCache.get(cacheKey);
  }

  state.loadingFile = true;
  renderWorkbench();

  try {
    const detail = await apiFetch(`/api/skills/${encodeURIComponent(skillName)}/file?path=${encodeURIComponent(filePath)}`, { attemptRecovery: true });
    fileCache.set(cacheKey, detail);
    return detail;
  } finally {
    state.loadingFile = false;
    renderWorkbench();
  }
}

async function ensureSelectedFile(force = false) {
  const detail = getSelectedDetail();
  if (!detail?.fileEntries?.length) return null;

  const selectedExists = detail.fileEntries.some((entry) => entry.path === state.selectedFilePath);
  if (!selectedExists) {
    state.selectedFilePath = chooseDefaultFilePath(detail);
  }

  if (!state.selectedFilePath) return null;
  return loadSkillFile(state.selectedSkillName, state.selectedFilePath, force);
}

async function reloadSelectedFile(force = true) {
  if (!state.selectedSkillName || !state.selectedFilePath) return;
  if (force) {
    fileDrafts.delete(fileCacheKey(state.selectedSkillName, state.selectedFilePath));
  }
  await loadSkillFile(state.selectedSkillName, state.selectedFilePath, force);
}

async function saveSelectedFile() {
  if (!state.selectedSkillName || !state.selectedFilePath) return;
  const cacheKey = fileCacheKey(state.selectedSkillName, state.selectedFilePath);
  const nextContent = fileEditorContent.value;

  state.savingFile = true;
  state.fileEditorMessage = `正在保存 <code>${escapeHtml(state.selectedFilePath)}</code>...`;
  renderWorkbench();

  try {
    const payload = await apiFetch(`/api/skills/${encodeURIComponent(state.selectedSkillName)}/file`, {
      method: 'POST',
      body: JSON.stringify({
        path: state.selectedFilePath,
        content: nextContent
      })
    });

    fileCache.set(cacheKey, payload);
    fileDrafts.delete(cacheKey);
    detailCache.delete(state.selectedSkillName);
    await loadSkillDetail(state.selectedSkillName, true);
    state.fileEditorMessage = `已保存 <code>${escapeHtml(state.selectedFilePath)}</code>。当前改动已经写回本地 Skill 文件。`;
  } catch (error) {
    state.fileEditorMessage = `保存失败：${escapeHtml(error.message || error)}`;
  } finally {
    state.savingFile = false;
    renderWorkbench();
  }
}

function buildTagClass(skill) {
  if (skill.source === 'personal') return 'personal';
  if (skill.status?.tone === 'ready') return 'ready';
  if (skill.source === 'bundled') return 'bundled';
  return 'blocked';
}

function renderViewTabs() {
  viewTabs.innerHTML = `
    <button class="view-tab ${state.view === 'generator' ? 'active' : ''}" data-view-tab="generator" type="button">${translate('tabs.generator')}</button>
    <button class="view-tab ${state.view === 'library' ? 'active' : ''}" data-view-tab="library" type="button">${translate('tabs.library')}</button>
  `;

  viewTabs.querySelectorAll('[data-view-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      state.view = button.dataset.viewTab;
      renderAll();
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  });
}

function renderViewPanels() {
  libraryView.hidden = state.view !== 'library';
  generatorView.hidden = state.view !== 'generator';
  if (state.view !== 'library') {
    state.workbenchOpen = false;
  }
  if (state.view !== 'generator') {
    state.generator.previewOpen = false;
    state.generator.materialPreviewId = '';
  }
  if (workbenchModal) {
    workbenchModal.hidden = !(state.view === 'library' && state.workbenchOpen);
  }
  syncBodyModalState();
}

function renderFilterList() {
  if (!state.payload) return;
  const counts = Object.fromEntries(FILTERS.map((filter) => [filter, countSkillsByFilter(state.payload.skills, filter)]));

  filterList.innerHTML = FILTERS.map((filter) => `
    <button class="filter-item ${state.filter === filter ? 'active' : ''}" data-filter="${filter}" type="button">
      <span>${translate(`filters.${filter}`)}</span>
      <span class="filter-count">${counts[filter] ?? 0}</span>
    </button>
  `).join('');

  filterList.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      state.filter = button.dataset.filter;
      renderAll();
      void ensureDetailForSelection();
    });
  });
}

function renderOverview() {
  if (!state.payload) return;
  const { summary, telemetry } = state.payload;

  $('#skill-title').textContent = translate('library.titleWithCount', { count: summary.total });
  $('#skill-subtitle').textContent = telemetry?.usageAvailable
    ? translate('library.subtitleLoaded')
    : translate('library.subtitleFallback');
  if (sortSelect) {
    sortSelect.innerHTML = SORT_OPTIONS.map((option) => `
      <option value="${option.value}" ${state.sortBy === option.value ? 'selected' : ''}>${translate(option.labelKey)}</option>
    `).join('');
  }
}

function renderSkillGrid() {
  const skills = currentSkills();
  const selected = ensureSelectedSkill();

  if (!skills.length) {
    skillGrid.innerHTML = '';
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  skillGrid.innerHTML = skills.map((skill) => `
    <article class="skill-card ${selected && selected.name === skill.name ? 'selected' : ''} ${skillEnabled(skill) ? '' : 'is-disabled'}" data-skill-name="${escapeHtml(skill.name)}">
      <div class="skill-card-body">
        <div class="skill-card-head">
          <h3>${escapeHtml(skill.emoji || 'OC')} ${escapeHtml(skill.name)}</h3>
          <span class="tag ${skill.status?.tone === 'ready' ? 'ready' : 'blocked'}">${escapeHtml(statusLabel(skill))}</span>
        </div>
        <p class="skill-card-desc">${escapeHtml(skill.description)}</p>
        <div class="card-tags">
          <span class="health-badge ${escapeHtml(skill.health?.level || 'healthy')}">${escapeHtml(skill.health?.label || (state.locale === 'en' ? 'Normal' : '正常'))}</span>
          <span class="tag ${buildTagClass(skill)}">${escapeHtml(sourceLabel(skill))}</span>
          ${skill.configEntry?.exists ? `<span class="tag ready">${escapeHtml(translate('skill.cardConfigured'))}</span>` : `<span class="tag bundled">${escapeHtml(translate('skill.cardNeedsConfig'))}</span>`}
          ${(skill.automation?.boundCount || 0) > 0 ? `<span class="tag bundled">${escapeHtml(translate('skill.cardBoundTask'))}</span>` : ''}
        </div>
        <div class="risk-summary-list">
          ${(skill.health?.risks?.slice(0, 2) || []).map((risk) => `<div class="risk-summary-item">• ${escapeHtml(risk.title)}${risk.detail ? `：${escapeHtml(risk.detail)}` : ''}</div>`).join('') || `<div class="risk-summary-item">${escapeHtml(state.locale === 'en' ? 'No obvious risks detected yet.' : '当前还没有明显风险。')}</div>`}
        </div>
        <div class="skill-card-footer">
          <div class="skill-switch-copy">
            <span class="skill-switch-label">${escapeHtml(translate('skill.toggleLabel'))}</span>
            <span class="skill-switch-status ${skillEnabled(skill) ? 'enabled' : 'disabled'}">${escapeHtml(skillEnabled(skill) ? translate('skill.toggleOn') : translate('skill.toggleOff'))}</span>
          </div>
          <label class="skill-toggle ${togglingSkills.has(skill.name) ? 'is-loading' : ''}" aria-label="${escapeHtml(skill.name)} ${escapeHtml(translate('skill.toggleLabel'))}">
            <input
              type="checkbox"
              data-skill-toggle="${escapeHtml(skill.name)}"
              ${skillEnabled(skill) ? 'checked' : ''}
              ${togglingSkills.has(skill.name) ? 'disabled' : ''}
            />
            <span class="skill-toggle-track"></span>
          </label>
        </div>
      </div>
    </article>
  `).join('');

  skillGrid.querySelectorAll('[data-skill-name]').forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target.closest('.skill-toggle')) {
        return;
      }
      state.selectedSkillName = card.dataset.skillName;
      state.selectedFilePath = '';
      state.fileEditorMessage = '';
      state.workbenchOpen = true;
      renderAll();
      void ensureDetailForSelection();
    });
  });

  skillGrid.querySelectorAll('[data-skill-toggle]').forEach((input) => {
    input.closest('.skill-toggle')?.addEventListener('click', (event) => {
      event.stopPropagation();
    });
    input.addEventListener('click', (event) => {
      event.stopPropagation();
    });
    input.addEventListener('change', (event) => {
      event.stopPropagation();
      void toggleSkillEnabled(input.dataset.skillToggle, input.checked);
    });
  });
}

async function toggleSkillEnabled(skillName, nextEnabled) {
  const summary = state.payload?.skills?.find((item) => item.name === skillName);
  if (!summary || togglingSkills.has(skillName)) return;

  const previousSummary = JSON.parse(JSON.stringify(summary));
  const cachedDetail = detailCache.get(skillName);
  const previousDetail = cachedDetail ? JSON.parse(JSON.stringify(cachedDetail)) : null;

  togglingSkills.add(skillName);
  applyOptimisticSkillEnabled(skillName, nextEnabled);
  showSkillToggleNotice(nextEnabled ? translate('skill.toggleEnabledNotice') : translate('skill.toggleDisabledNotice'), nextEnabled ? 'good' : 'neutral');
  renderAll();

  try {
    const payload = {
      enabled: nextEnabled,
      apiKey: summary.configEntry?.apiKey || '',
      env: summary.configEntry?.env || {},
      config: summary.configEntry?.config || {}
    };

    const detail = await apiFetch(`/api/skills/${encodeURIComponent(skillName)}/config`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    detailCache.set(skillName, detail);
    await loadDashboard(true);
    showSkillToggleNotice(nextEnabled ? translate('skill.toggleEnabledDone') : translate('skill.toggleDisabledDone'), nextEnabled ? 'good' : 'neutral');

    if (state.selectedSkillName === skillName && state.workbenchOpen) {
      await ensureDetailForSelection(true);
    }
  } catch (error) {
    console.error('Failed to toggle skill state:', error);
    restoreSkillState(skillName, previousSummary, previousDetail);
    showSkillToggleNotice(translate('skill.toggleFailed'), 'danger');
  } finally {
    togglingSkills.delete(skillName);
    renderAll();
  }
}

function inferEnabledStatus(skill) {
  const remembered = previousSkillStatus.get(skill.name);
  if (remembered) {
    return { ...remembered };
  }

  if (skill?.configEntry?.exists) {
    return {
      tone: 'ready',
      label: translate('skill.status.ready'),
      note: state.locale === 'en' ? 'This Skill is enabled and ready to use.' : '当前 Skill 已启用，可以继续使用。'
    };
  }

  return {
    tone: 'blocked',
    label: translate('skill.status.blocked'),
    note: state.locale === 'en' ? 'This Skill is enabled, but still needs configuration.' : '当前 Skill 已启用，但仍需要补充配置。'
  };
}

function applyOptimisticSkillEnabled(skillName, nextEnabled) {
  const summary = state.payload?.skills?.find((item) => item.name === skillName);
  if (summary) {
    if (!nextEnabled && summary.status?.tone !== 'off') {
      previousSkillStatus.set(skillName, { ...summary.status });
    }
    summary.configEntry = {
      ...summary.configEntry,
      exists: true,
      enabled: nextEnabled
    };
    summary.status = nextEnabled
      ? inferEnabledStatus(summary)
      : {
          tone: 'off',
          label: translate('skill.status.off'),
          note: state.locale === 'en' ? 'This Skill has been manually disabled.' : '当前 Skill 已被手动禁用。'
        };
  }

  const detail = detailCache.get(skillName);
  if (detail) {
    detail.configEntry = {
      ...detail.configEntry,
      exists: true,
      enabled: nextEnabled
    };
    detail.status = summary?.status ? { ...summary.status } : detail.status;
    detailCache.set(skillName, detail);
  }
}

function restoreSkillState(skillName, previousSummary, previousDetail) {
  if (state.payload?.skills) {
    const index = state.payload.skills.findIndex((item) => item.name === skillName);
    if (index >= 0) {
      state.payload.skills[index] = previousSummary;
    }
  }

  if (previousDetail) {
    detailCache.set(skillName, previousDetail);
  }
}

function showSkillToggleNotice(message, tone = 'neutral') {
  const notice = $('#skill-toggle-notice');
  if (!notice) return;

  notice.hidden = false;
  notice.textContent = message;
  notice.className = `skill-toggle-notice ${tone}`;

  if (skillToggleNoticeTimer) {
    window.clearTimeout(skillToggleNoticeTimer);
  }

  skillToggleNoticeTimer = window.setTimeout(() => {
    notice.hidden = true;
  }, 2200);
}

function buildRequirementSection(detail, summary) {
  const skill = detail || summary;
  if (!skill) {
    return '<div class="requirement-item"><strong>提示</strong>当前没有可展示的 Skill。</div>';
  }

  const items = [];

  if (skill.missing?.bins?.length) {
    items.push(`<div class="requirement-item"><strong>缺少 CLI</strong>${escapeHtml(skill.missing.bins.join('、'))}</div>`);
  }
  if (skill.missing?.env?.length) {
    items.push(`<div class="requirement-item"><strong>缺少环境变量</strong>${escapeHtml(skill.missing.env.join('、'))}</div>`);
  }
  if (skill.missing?.config?.length) {
    items.push(`<div class="requirement-item"><strong>缺少配置项</strong>${escapeHtml(skill.missing.config.join('、'))}</div>`);
  }
  if (detail?.install?.length) {
    items.push(`<div class="requirement-item"><strong>安装提示</strong>${escapeHtml(detail.install.join('；'))}</div>`);
  }
  if (detail?.configChecks?.length) {
    items.push(`<div class="requirement-item"><strong>常用字段</strong>${escapeHtml(detail.configChecks.join('、'))}</div>`);
  }

  if (!items.length) {
    items.push('<div class="requirement-item"><strong>当前状态</strong>当前没有额外补项，可以直接保存或进入 OpenClaw 使用。</div>');
  }

  return items.join('');
}

function populateConfigForm(detail) {
  configEnabled.checked = Boolean(detail?.configEntry?.enabled ?? true);
  primaryEnvGroup.hidden = !detail?.primaryEnv;
  primaryEnvLabel.textContent = detail?.primaryEnv ? `${detail.primaryEnv} / apiKey` : '主密钥';
  configApiKey.value = detail?.configEntry?.apiKey || '';
  configEnvJson.value = JSON.stringify(detail?.configEntry?.env || {}, null, 2);
  configJson.value = JSON.stringify(detail?.configEntry?.config || {}, null, 2);
  renderCommonConfigFields(detail);
  reloadConfigBtn.disabled = !detail || state.loadingDetail;
  renderConfigGuard(detail);
}

function renderConfigGuard(detail) {
  const validation = buildConfigValidation(detail);
  configValidationBanner.className = `notice-banner ${validation.tone}`;
  configValidationBanner.textContent = validation.message;

  configRiskList.innerHTML = validation.risks.length
    ? validation.risks.map((risk) => `<div class="detail-item"><strong>风险提醒</strong>${escapeHtml(risk)}</div>`).join('')
    : '<div class="detail-item"><strong>风险提醒</strong>当前没有额外风险提醒。</div>';

  configDiffList.innerHTML = validation.diffs.length
    ? validation.diffs.map((diff) => `<div class="detail-item"><strong>配置变更</strong>${escapeHtml(diff)}</div>`).join('')
    : '<div class="detail-item"><strong>配置变更</strong>当前表单和磁盘内容一致。</div>';

  saveConfigBtn.disabled = !detail || state.savingConfig || !validation.canSave;
}

function renderWorkbench() {
  const summary = getSelectedSummary() || ensureSelectedSkill();
  const detail = getSelectedDetail();
  const fileEntry = getSelectedFileEntry(detail);
  const fileDetail = getSelectedFileDetail();
  if (workbenchModal) {
    workbenchModal.hidden = !(state.view === 'library' && state.workbenchOpen);
  }
  syncBodyModalState();

  if (!summary) {
    $('#workbench-title').textContent = '等待选择 Skill';
    $('#workbench-desc').textContent = '当前筛选条件没有可展示的 Skill。';
    $('#runtime-banner').className = 'status-banner warn';
    $('#runtime-banner-text').textContent = '先从左侧选择一个 Skill，再看它的文件结构。';
    $('#runtime-banner-side').textContent = '--';
    automationWarning.hidden = false;
    automationWarning.textContent = '这里会展示当前 Skill 的目录结构、文件说明和可编辑内容。';
    fileEntryList.innerHTML = '<button class="file-entry-button" type="button"><span class="file-entry-title">暂无文件</span><span class="file-entry-meta">选择一个 Skill 后，这里会列出它的结构和 supporting files。</span><span class="file-entry-config">配置项会跟着文件一起显示。</span></button>';
    detailList.innerHTML = '<div class="detail-item"><strong>文件数量</strong>暂无可用 Skill。</div>';
    fileMeaningBanner.textContent = '选择一个 Skill 后，这里会解释当前文件的作用，以及这个文件通常承载哪些配置。';
    healthList.innerHTML = '<div class="detail-item"><strong>健康状态</strong>暂无可展示的 Skill。</div>';
    $('#requirement-list').innerHTML = '<div class="requirement-item"><strong>配置提示</strong>当前没有可展示的配置提示。</div>';
    fileEditorNotice.textContent = '选择一个可编辑文件后，可以直接在这里修改并保存。';
    fileEditorMeta.textContent = '当前还没有选中文件。';
    fileEditorContent.value = '';
    fileEditorContent.disabled = true;
    fileEditorContent.hidden = false;
    fileEditorReadonly.hidden = true;
    reloadFileBtn.disabled = true;
    saveFileBtn.disabled = true;
    return;
  }

  $('#workbench-title').textContent = summary.name;
  $('#workbench-desc').textContent = detail?.description || summary.description;
  $('#runtime-banner').className = `status-banner ${detail?.fileEntries?.length ? 'good' : 'warn'}`;
  $('#runtime-banner-text').textContent = state.loadingDetail
    ? '正在读取这个 Skill 的文件结构...'
    : fileEntry
      ? `当前文件：${fileEntry.path}`
      : '当前 Skill 还没有读取到可展示的文件。';
  $('#runtime-banner-side').textContent = summary.sourceLabel;
  automationWarning.hidden = false;
  automationWarning.innerHTML = detail
    ? `目录位置：<code>${escapeHtml(detail.location)}</code>${detail.skillMdPath ? ` · 主入口：<code>${escapeHtml(detail.skillMdPath)}</code>` : ''}`
    : '正在读取这个 Skill 的目录位置和文件结构。';

  if (!detail) {
    fileEntryList.innerHTML = '<button class="file-entry-button" type="button"><span class="file-entry-title">正在读取文件结构</span><span class="file-entry-meta">稍等一下，马上会列出这个 Skill 的目录和文件。</span><span class="file-entry-config">读取完成后会告诉你每个文件能改什么。</span></button>';
    detailList.innerHTML = `
      <div class="detail-item"><strong>来源</strong>${escapeHtml(summary.sourceLabel)}</div>
      <div class="detail-item"><strong>健康状态</strong>${escapeHtml(summary.health?.label || '正常')}</div>
      <div class="detail-item"><strong>文件数量</strong>正在读取中</div>
    `;
    fileMeaningBanner.textContent = '正在读取当前 Skill 的文件结构、文件说明和配置提示。';
    healthList.innerHTML = `
      <div class="detail-item"><strong>健康状态</strong>${escapeHtml(summary.health?.label || '正常')}</div>
      ${(summary.health?.risks?.length ? summary.health.risks.map((risk) => `<div class="detail-item"><strong>${escapeHtml(risk.title)}</strong>${escapeHtml(risk.detail || '')}</div>`).join('') : '<div class="detail-item"><strong>风险提示</strong>当前还没有明显风险。</div>')}
    `;
    $('#requirement-list').innerHTML = '<div class="requirement-item"><strong>配置提示</strong>文件结构读取完成后显示。</div>';
    fileEditorNotice.textContent = '正在读取当前 Skill 的文件内容。';
    fileEditorMeta.textContent = '请稍等，正在准备文件编辑器。';
    fileEditorContent.value = '';
    fileEditorContent.disabled = true;
    fileEditorContent.hidden = false;
    fileEditorReadonly.hidden = true;
    reloadFileBtn.disabled = true;
    saveFileBtn.disabled = true;
    return;
  }

  if (!state.selectedFilePath || !fileEntry) {
    state.selectedFilePath = chooseDefaultFilePath(detail);
    if (state.selectedFilePath) {
      queueMicrotask(() => {
        void ensureSelectedFile();
      });
    }
  }

  fileEntryList.innerHTML = (detail.fileEntries || []).length
    ? detail.fileEntries.map((entry) => `
      <button class="file-entry-button ${entry.path === state.selectedFilePath ? 'active' : ''}" data-file-path="${escapeHtml(entry.path)}" type="button">
        <span class="file-entry-title">
          <span>${escapeHtml(entry.path)}</span>
          <span class="tag ${entry.editable ? 'ready' : 'bundled'}">${entry.isDirectory ? '目录' : entry.editable ? '可编辑' : '只读'}</span>
        </span>
        <span class="file-entry-meta">${escapeHtml(entry.purpose)}</span>
        <span class="file-entry-config">配置：${escapeHtml(summarizeFileEntryConfig(entry))}</span>
      </button>
    `).join('')
    : '<button class="file-entry-button" type="button"><span class="file-entry-title">没有读取到文件</span><span class="file-entry-meta">这个 Skill 目录目前没有可展示的文件结构。</span><span class="file-entry-config">如果本地目录不完整，这里不会展示可编辑文件。</span></button>';

  fileEntryList.querySelectorAll('[data-file-path]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedFilePath = button.dataset.filePath;
      state.fileEditorMessage = '';
      renderWorkbench();
      void ensureSelectedFile();
    });
  });

  detailList.innerHTML = `
    <div class="detail-item"><strong>健康状态</strong>${escapeHtml(detail.health?.label || '正常')}</div>
    <div class="detail-item"><strong>文件数量</strong>${detail.fileEntries?.length || 0} 个结构项</div>
    <div class="detail-item"><strong>可编辑文本</strong>${(detail.fileEntries || []).filter((entry) => entry.editable).length} 个</div>
    <div class="detail-item"><strong>主入口</strong>${escapeHtml(detail.skillMdPath || '未识别到 SKILL.md')}</div>
  `;

  if (!fileEntry) {
    fileMeaningBanner.textContent = '这个 Skill 的文件结构已经读到，但当前还没有选中文件。';
    healthList.innerHTML = [
      `<div class="detail-item"><strong>健康状态</strong>${escapeHtml(detail.health?.label || '正常')}</div>`,
      ...(detail.health?.risks?.length
        ? detail.health.risks.map((risk) => `<div class="detail-item"><strong>${escapeHtml(risk.title)}</strong>${escapeHtml(risk.detail || '')}${risk.actionLabel ? `<div class="foot-note" style="margin-top:4px;">建议动作：${escapeHtml(risk.actionLabel)}</div>` : ''}</div>`)
        : ['<div class="detail-item"><strong>风险提示</strong>当前还没有明显风险。</div>']),
      '<div class="detail-item"><strong>文件说明</strong>点左边任意一个文件，就能看到它的作用、配置项和是否支持手动编辑。</div>'
    ].join('');
    $('#requirement-list').innerHTML = '<div class="requirement-item"><strong>配置提示</strong>选中文件后显示。</div>';
    fileEditorNotice.textContent = '先从上面的文件列表里选一个文件。';
    fileEditorMeta.textContent = '当前还没有选中文件。';
    fileEditorContent.value = '';
    fileEditorContent.disabled = true;
    fileEditorContent.hidden = false;
    fileEditorReadonly.hidden = true;
    reloadFileBtn.disabled = true;
    saveFileBtn.disabled = true;
    return;
  }

  if (state.loadingFile && !fileDetail) {
    fileMeaningBanner.textContent = `正在读取 ${fileEntry.path} 的说明和内容。`;
    healthList.innerHTML = [
      `<div class="detail-item"><strong>健康状态</strong>${escapeHtml(detail.health?.label || '正常')}</div>`,
      ...(detail.health?.risks?.slice(0, 3) || []).map((risk) => `<div class="detail-item"><strong>${escapeHtml(risk.title)}</strong>${escapeHtml(risk.detail || '')}</div>`),
      `<div class="detail-item"><strong>文件说明</strong>${escapeHtml(fileEntry.purpose)}</div>`
    ].join('');
    $('#requirement-list').innerHTML = '<div class="requirement-item"><strong>配置提示</strong>正在解析这个文件里的配置结构。</div>';
    fileEditorNotice.textContent = `正在读取 ${fileEntry.path}。`;
    fileEditorMeta.textContent = `${fileEntry.path} · 正在加载`;
    fileEditorContent.value = '';
    fileEditorContent.disabled = true;
    fileEditorContent.hidden = false;
    fileEditorReadonly.hidden = true;
    reloadFileBtn.disabled = true;
    saveFileBtn.disabled = true;
    return;
  }

  if (!fileDetail) {
    fileMeaningBanner.textContent = `还没有读取到 ${fileEntry.path} 的内容。`;
    healthList.innerHTML = [
      `<div class="detail-item"><strong>健康状态</strong>${escapeHtml(detail.health?.label || '正常')}</div>`,
      ...(detail.health?.risks?.slice(0, 3) || []).map((risk) => `<div class="detail-item"><strong>${escapeHtml(risk.title)}</strong>${escapeHtml(risk.detail || '')}</div>`),
      `<div class="detail-item"><strong>文件说明</strong>${escapeHtml(fileEntry.purpose)}</div>`
    ].join('');
    $('#requirement-list').innerHTML = '<div class="requirement-item"><strong>配置提示</strong>点“重新读取”试一下。</div>';
    fileEditorNotice.textContent = '文件内容暂时不可用。';
    fileEditorMeta.textContent = `${fileEntry.path} · 未读取`;
    fileEditorContent.value = '';
    fileEditorContent.disabled = true;
    fileEditorContent.hidden = false;
    fileEditorReadonly.hidden = true;
    reloadFileBtn.disabled = false;
    saveFileBtn.disabled = true;
    return;
  }

  fileMeaningBanner.textContent = fileDetail.purpose;
  healthList.innerHTML = `
    <div class="detail-item"><strong>健康状态</strong>${escapeHtml(detail.health?.label || '正常')}</div>
    ${(detail.health?.risks?.length
      ? detail.health.risks.map((risk) => `<div class="detail-item"><strong>${escapeHtml(risk.title)}</strong>${escapeHtml(risk.detail || '')}${risk.actionLabel ? `<div class="foot-note" style="margin-top:4px;">建议动作：${escapeHtml(risk.actionLabel)}</div>` : ''}</div>`).join('')
      : '<div class="detail-item"><strong>风险提示</strong>当前还没有明显风险。</div>')}
    <div class="detail-item"><strong>文件说明</strong>${escapeHtml(fileDetail.purpose)}</div>
    <div class="detail-item"><strong>编辑方式</strong>${fileDetail.editable ? '支持直接编辑并保存。' : '当前只建议查看，不直接编辑。'}</div>
    <div class="detail-item"><strong>这个文件通常配置什么</strong>${escapeHtml((fileDetail.configHints || []).join('；') || '当前没有识别到结构化配置项。')}</div>
    <div class="detail-item"><strong>最后更新</strong>${escapeHtml(fileDetail.updatedAt || '未知')}</div>
  `;
  $('#requirement-list').innerHTML = (fileDetail.configHints || []).length
    ? fileDetail.configHints.map((item) => `<div class="requirement-item"><strong>配置提示</strong>${escapeHtml(item)}</div>`).join('')
    : '<div class="requirement-item"><strong>配置提示</strong>没有识别到明显的结构化配置项。</div>';

  fileEditorNotice.innerHTML = state.fileEditorMessage || (fileDetail.editable
    ? `你正在编辑 <code>${escapeHtml(fileDetail.path)}</code>。保存后会直接写回本地 Skill 文件。`
    : `当前文件 <code>${escapeHtml(fileDetail.path)}</code> 更适合作为目录或素材查看，不建议直接编辑。`);
  fileEditorMeta.textContent = `${fileDetail.path} · ${fileDetail.editable ? '可编辑文本文件' : fileDetail.isDirectory ? '目录' : '只读文件'} · ${fileDetail.size || 0} B`;
  reloadFileBtn.disabled = state.loadingFile || state.savingFile;
  saveFileBtn.disabled = state.loadingFile || state.savingFile || !fileDetail.editable;

  if (fileDetail.editable) {
    const draftKey = fileCacheKey(state.selectedSkillName, state.selectedFilePath);
    const draftValue = fileDrafts.has(draftKey) ? fileDrafts.get(draftKey) : fileDetail.content || '';
    fileEditorReadonly.hidden = true;
    fileEditorContent.hidden = false;
    fileEditorContent.disabled = false;
    if (fileEditorContent.value !== draftValue) {
      fileEditorContent.value = draftValue;
    }
  } else {
    fileEditorContent.hidden = true;
    fileEditorContent.disabled = true;
    fileEditorReadonly.hidden = false;
    fileEditorReadonly.textContent = fileDetail.content || (fileDetail.configHints || []).join('\n') || '当前文件更适合作为只读内容查看。';
  }
}

function generatorOptionLabel(options, value) {
  return generatorHelpers.labelForOption(options, value, state.locale);
}

function generatorFieldErrorMap() {
  return {
    scenarioName: '#gen-scenario-name-error',
    useWhen: '#gen-use-when-error',
    userSays: '#gen-user-says-error',
    scenarioGoal: '#gen-scenario-goal-error',
    triggerKeywords: '#gen-trigger-keywords-error',
    commandName: '#gen-trigger-command-name-error',
    inputTypes: '#gen-input-types-error',
    inputDescription: '#gen-inputs-error',
    outputTypes: '#gen-output-types-error',
    outputDescription: '#gen-output-desc-error',
    acceptanceChecks: '#gen-acceptance-checks-error',
    steps: '#gen-steps-error',
    branches: '#gen-branches-error',
    optionalBackground: '#gen-optional-background-error',
    constraintsMust: '#gen-constraints-error'
  };
}

function syncGeneratorTextFieldsFromDom() {
  Object.entries(GENERATOR_TEXT_FIELD_IDS).forEach(([key, selector]) => {
    const element = $(selector);
    if (element) {
      state.generator.form[key] = element.value || '';
    }
  });

  if (generatorMaterialUsage) {
    updateMaterialPromptModePreview();
  }
}

function buildPromptBlocks(payload) {
  return generatorHelpers.buildPromptPreviewBlocks(payload, state.locale).map((block) => ({
    ...block,
    generatedContent: block.content,
    draftContent: block.content,
    modified: false,
    collapsed: false,
    isEditing: false
  }));
}

function currentPromptBlocks() {
  return state.generator.promptBlocks.length
    ? state.generator.promptBlocks
    : buildPromptBlocks(getGeneratorPayload());
}

function currentPromptText() {
  const payload = getGeneratorPayload();
  return generatorHelpers.combinePromptBlocks(currentPromptBlocks().map((block) => ({
    title: block.title,
    content: block.isEditing ? block.draftContent : block.content
  })), state.locale, {
    referenceMaterials: payload.referenceMaterials
  });
}

function getGeneratorPayload() {
  syncGeneratorTextFieldsFromDom();
  return generatorHelpers.sanitizeFormData({
    ...state.generator.form,
    referenceMaterials: state.generator.referenceMaterials
  });
}

function getGeneratorStepCount() {
  return generatorHelpers.GROUPS.length;
}

function getCurrentGeneratorStep() {
  return Math.max(0, Math.min(state.generator.currentStep, getGeneratorStepCount() - 1));
}

function revokeMaterialPreviewUrl(material) {
  if (!material?.previewUrl || !String(material.previewUrl).startsWith('blob:')) return;
  URL.revokeObjectURL(material.previewUrl);
}

function replaceGeneratorReferenceMaterials(nextMaterials) {
  const normalized = generatorHelpers.normalizeMaterials(nextMaterials);
  const nextIds = new Set(normalized.map((material) => material.id));

  state.generator.referenceMaterials.forEach((material) => {
    if (!nextIds.has(material.id)) {
      revokeMaterialPreviewUrl(material);
    }
  });

  state.generator.referenceMaterials = normalized;
  state.generator.form.referenceMaterials = cloneGeneratorReferenceMaterials(normalized);

  if (state.generator.materialPreviewId && !nextIds.has(state.generator.materialPreviewId)) {
    state.generator.materialPreviewId = '';
  }
}

function setGeneratorStep(stepIndex) {
  state.generator.currentStep = Math.max(0, Math.min(stepIndex, getGeneratorStepCount() - 1));
}

function markGeneratorFieldTouched(fieldKey) {
  state.generator.touchedFields[fieldKey] = true;
}

function hasGeneratorContent() {
  const payload = getGeneratorPayload();
  return Boolean(payload.scenarioName
    || payload.useWhen
    || payload.userSays
    || payload.scenarioGoal
    || payload.inputDescription
    || payload.outputDescription
    || payload.references
    || payload.optionalBackground
    || payload.referenceMaterials.length
    || payload.inputTypes.length
    || payload.outputTypes.length
    || payload.acceptanceChecks.length
    || payload.constraintsMust.length
    || payload.constraintsMustNot.length
    || payload.steps.some((step) => String(step || '').trim())
    || payload.branches.some((item) => item.if || item.then));
}

function applyTemplateToGenerator(templateId) {
  const form = generatorHelpers.createTemplateForm(templateId);
  replaceGeneratorReferenceMaterials(cloneGeneratorReferenceMaterials(form.referenceMaterials));
  state.generator.form = createGeneratorForm(form);
  state.generator.activeTemplateId = templateId;
  state.generator.previewOpen = false;
  state.generator.promptBlocks = [];
  state.generator.nameSuggestions = [];
  state.generator.touchedFields = {};
  state.generator.attemptedGenerate = false;
  applyGeneratorForm(state.generator.form);
  resetMaterialComposerInputs();
  rebuildGeneratorResults({ preserveActionStatus: false, regenerateBlocks: false });
}

function renderGeneratorTemplateOptions() {
  if (!generatorTemplateSelect) return;
  generatorTemplateSelect.innerHTML = generatorHelpers.TEMPLATE_PRESETS.map((preset) => `
    <option value="${preset.id}" ${state.generator.activeTemplateId === preset.id ? 'selected' : ''}>
      ${escapeHtml(state.locale === 'en' ? preset.nameEn : preset.nameZh)}
    </option>
  `).join('');
  const preset = generatorHelpers.getTemplatePreset(state.generator.activeTemplateId);
  if (generatorTemplateDescription) {
    generatorTemplateDescription.textContent = state.locale === 'en' ? preset.descriptionEn : preset.descriptionZh;
  }
}

function renderGeneratorNameSuggestions() {
  if (!generatorNameSuggestions) return;
  if (!state.generator.nameSuggestions.length) {
    generatorNameSuggestions.innerHTML = '';
    return;
  }
  generatorNameSuggestions.innerHTML = state.generator.nameSuggestions.map((item) => `
    <button class="generator-suggestion-btn" data-generator-suggestion="${escapeHtml(item)}" type="button">${escapeHtml(item)}</button>
  `).join('');
  generatorNameSuggestions.querySelectorAll('[data-generator-suggestion]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.dataset.generatorSuggestion || '';
      const input = $('#gen-scenario-name');
      if (input) input.value = value;
      state.generator.form.scenarioName = value;
      rebuildGeneratorResults({ preserveActionStatus: true });
    });
  });
}

function renderChipGroup(container, options, selectedValue, config = {}) {
  if (!container) return;
  const selected = Array.isArray(selectedValue) ? selectedValue : [selectedValue];
  container.innerHTML = options.map((option) => `
    <button
      class="generator-chip-option ${selected.includes(option.value) ? 'active' : ''}"
      type="button"
      data-chip-value="${escapeHtml(option.value)}"
      ${config.name ? `data-chip-group="${escapeHtml(config.name)}"` : ''}
    >
      ${escapeHtml(generatorOptionLabel(options, option.value))}
    </button>
  `).join('');

  container.querySelectorAll('[data-chip-value]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.dataset.chipValue;
      if (config.multiple) {
        const next = new Set(selected);
        if (next.has(value)) {
          next.delete(value);
        } else {
          next.add(value);
        }
        config.onChange([...next]);
        return;
      }
      config.onChange(value);
    });
  });
}

function renderTagList(container, items, removeHandler) {
  if (!container) return;
  const values = Array.isArray(items) ? items.filter(Boolean) : [];
  container.innerHTML = values.length
    ? values.map((item) => `
      <span class="tag-chip">
        <span>${escapeHtml(item)}</span>
        <button type="button" data-remove-tag="${escapeHtml(item)}">×</button>
      </span>
    `).join('')
    : '';
  container.querySelectorAll('[data-remove-tag]').forEach((button) => {
    button.addEventListener('click', () => removeHandler(button.dataset.removeTag));
  });
}

function renderGeneratorTriggerControls() {
  renderChipGroup(generatorTriggerModeList, generatorHelpers.TRIGGER_MODES, state.generator.form.triggerStrategy.mode, {
    name: 'trigger-mode',
    onChange(value) {
      state.generator.form.triggerStrategy.mode = value;
      renderGeneratorTriggerControls();
      rebuildGeneratorResults({ preserveActionStatus: true });
    }
  });

  renderChipGroup(generatorModelInvocationList, [
    { value: 'auto', labelZh: '允许模型自动调用', labelEn: 'Allow model invocation' },
    { value: 'manual', labelZh: '仅允许显式调用', labelEn: 'Explicit invocation only' }
  ], state.generator.form.triggerStrategy.allowModelInvocation ? 'auto' : 'manual', {
    name: 'model-invocation',
    onChange(value) {
      state.generator.form.triggerStrategy.allowModelInvocation = value === 'auto';
      renderGeneratorTriggerControls();
      rebuildGeneratorResults({ preserveActionStatus: true });
    }
  });

  generatorKeywordConfig.hidden = state.generator.form.triggerStrategy.mode !== 'keyword';
  generatorCommandConfig.hidden = !['slash', 'tool'].includes(state.generator.form.triggerStrategy.mode);

  triggerKeywordRule.innerHTML = generatorHelpers.KEYWORD_RULES.map((item) => `
    <option value="${item.value}" ${state.generator.form.triggerStrategy.keywordRule === item.value ? 'selected' : ''}>${escapeHtml(generatorOptionLabel(generatorHelpers.KEYWORD_RULES, item.value))}</option>
  `).join('');
  triggerPostAction.innerHTML = generatorHelpers.POST_ACTIONS.map((item) => `
    <option value="${item.value}" ${state.generator.form.triggerStrategy.postAction === item.value ? 'selected' : ''}>${escapeHtml(generatorOptionLabel(generatorHelpers.POST_ACTIONS, item.value))}</option>
  `).join('');
  triggerCommandName.value = state.generator.form.triggerStrategy.commandName || '';
  triggerCommandDescription.value = state.generator.form.triggerStrategy.commandDescription || '';

  renderTagList(triggerKeywordList, state.generator.form.triggerStrategy.keywords, (value) => {
    state.generator.form.triggerStrategy.keywords = state.generator.form.triggerStrategy.keywords.filter((item) => item !== value);
    renderGeneratorTriggerControls();
    rebuildGeneratorResults({ preserveActionStatus: true });
  });
  renderTagList(triggerExcludeList, state.generator.form.triggerStrategy.excludeKeywords, (value) => {
    state.generator.form.triggerStrategy.excludeKeywords = state.generator.form.triggerStrategy.excludeKeywords.filter((item) => item !== value);
    renderGeneratorTriggerControls();
    rebuildGeneratorResults({ preserveActionStatus: true });
  });
  renderTagList(triggerCommandAliasList, state.generator.form.triggerStrategy.commandAliases, (value) => {
    state.generator.form.triggerStrategy.commandAliases = state.generator.form.triggerStrategy.commandAliases.filter((item) => item !== value);
    renderGeneratorTriggerControls();
    rebuildGeneratorResults({ preserveActionStatus: true });
  });
}

function renderGeneratorExecutionControls() {
  renderChipGroup(generatorInputTypeList, generatorHelpers.INPUT_TYPE_OPTIONS, state.generator.form.inputTypes, {
    name: 'input-types',
    multiple: true,
    onChange(values) {
      state.generator.form.inputTypes = values;
      renderGeneratorExecutionControls();
      rebuildGeneratorResults({ preserveActionStatus: true });
    }
  });

  renderChipGroup(generatorOutputTypeList, generatorHelpers.OUTPUT_TYPE_OPTIONS, state.generator.form.outputTypes, {
    name: 'output-types',
    multiple: true,
    onChange(values) {
      state.generator.form.outputTypes = values;
      renderGeneratorExecutionControls();
      rebuildGeneratorResults({ preserveActionStatus: true });
    }
  });

  renderChipGroup(generatorAcceptanceList, generatorHelpers.ACCEPTANCE_OPTIONS, state.generator.form.acceptanceChecks, {
    name: 'acceptance-checks',
    multiple: true,
    onChange(values) {
      state.generator.form.acceptanceChecks = values;
      renderGeneratorExecutionControls();
      rebuildGeneratorResults({ preserveActionStatus: true });
    }
  });

  generatorStepItems.innerHTML = state.generator.form.steps.map((step, index) => `
    <div class="step-card" data-step-index="${index}">
      <div class="step-card-head">
        <span class="step-card-index">${state.locale === 'en' ? `Step ${index + 1}` : `步骤 ${index + 1}`}</span>
        <div class="step-card-actions">
          <button class="small-btn" type="button" data-step-move="up" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button class="small-btn" type="button" data-step-move="down" ${index === state.generator.form.steps.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="small-btn" type="button" data-step-remove="${index}">${state.locale === 'en' ? 'Delete' : '删除'}</button>
        </div>
      </div>
      <input class="text-input" type="text" data-generator-step-input="${index}" value="${escapeHtml(step)}" placeholder="${escapeHtml(state.locale === 'en' ? 'Describe this step' : '描述这一步要做什么')}" />
    </div>
  `).join('');

  generatorStepItems.querySelectorAll('[data-step-move]').forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('[data-step-index]');
      const index = Number(card.dataset.stepIndex);
      const delta = button.dataset.stepMove === 'up' ? -1 : 1;
      const target = index + delta;
      if (target < 0 || target >= state.generator.form.steps.length) return;
      const next = [...state.generator.form.steps];
      [next[index], next[target]] = [next[target], next[index]];
      state.generator.form.steps = next;
      renderGeneratorExecutionControls();
      rebuildGeneratorResults({ preserveActionStatus: true });
    });
  });

  generatorStepItems.querySelectorAll('[data-step-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.stepRemove);
      const next = state.generator.form.steps.filter((_, itemIndex) => itemIndex !== index);
      state.generator.form.steps = next.length ? next : [''];
      renderGeneratorExecutionControls();
      rebuildGeneratorResults({ preserveActionStatus: true });
    });
  });

  generatorStepItems.querySelectorAll('[data-generator-step-input]').forEach((input) => {
    input.addEventListener('input', () => {
      state.generator.form.steps[Number(input.dataset.generatorStepInput)] = input.value;
      rebuildGeneratorResults({ preserveActionStatus: true });
    });
  });

  generatorBranchItems.innerHTML = state.generator.form.branches.map((item, index) => `
    <div class="branch-card" data-branch-index="${index}">
      <div class="branch-card-head">
        <span class="branch-card-index">${state.locale === 'en' ? `Rule ${index + 1}` : `规则 ${index + 1}`}</span>
        <div class="branch-card-actions">
          <button class="small-btn" type="button" data-branch-remove="${index}">${state.locale === 'en' ? 'Delete' : '删除'}</button>
        </div>
      </div>
      <input class="text-input" type="text" data-branch-if="${index}" value="${escapeHtml(item.if || '')}" placeholder="${escapeHtml(state.locale === 'en' ? 'If...' : '如果……')}" />
      <input class="text-input" type="text" data-branch-then="${index}" value="${escapeHtml(item.then || '')}" placeholder="${escapeHtml(state.locale === 'en' ? 'Then...' : '那么……')}" />
    </div>
  `).join('');

  generatorBranchItems.querySelectorAll('[data-branch-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.branchRemove);
      const next = state.generator.form.branches.filter((_, itemIndex) => itemIndex !== index);
      state.generator.form.branches = next.length ? next : [{ if: '', then: '' }];
      renderGeneratorExecutionControls();
      rebuildGeneratorResults({ preserveActionStatus: true });
    });
  });

  generatorBranchItems.querySelectorAll('[data-branch-if]').forEach((input) => {
    input.addEventListener('input', () => {
      state.generator.form.branches[Number(input.dataset.branchIf)].if = input.value;
      rebuildGeneratorResults({ preserveActionStatus: true });
    });
  });
  generatorBranchItems.querySelectorAll('[data-branch-then]').forEach((input) => {
    input.addEventListener('input', () => {
      state.generator.form.branches[Number(input.dataset.branchThen)].then = input.value;
      rebuildGeneratorResults({ preserveActionStatus: true });
    });
  });
}

function renderGeneratorReferenceControls() {
  renderChipGroup(generatorReferenceRoleList, generatorHelpers.REFERENCE_ROLE_OPTIONS, state.generator.form.referenceRole, {
    name: 'reference-role',
    onChange(value) {
      state.generator.form.referenceRole = value;
      renderGeneratorReferenceControls();
      rebuildGeneratorResults({ preserveActionStatus: true });
    }
  });

  renderTagList(mustList, state.generator.form.constraintsMust, (value) => {
    state.generator.form.constraintsMust = state.generator.form.constraintsMust.filter((item) => item !== value);
    renderGeneratorReferenceControls();
    rebuildGeneratorResults({ preserveActionStatus: true });
  });
  renderTagList(mustNotList, state.generator.form.constraintsMustNot, (value) => {
    state.generator.form.constraintsMustNot = state.generator.form.constraintsMustNot.filter((item) => item !== value);
    renderGeneratorReferenceControls();
    rebuildGeneratorResults({ preserveActionStatus: true });
  });

  const backgroundLength = (state.generator.form.optionalBackground || '').length;
  if (generatorBackgroundCounter) {
    generatorBackgroundCounter.textContent = `${backgroundLength} / 200`;
  }
}

function applyGeneratorForm(form) {
  Object.entries(GENERATOR_TEXT_FIELD_IDS).forEach(([key, selector]) => {
    const element = $(selector);
    if (element) {
      element.value = form[key] || '';
    }
  });

  $('#gen-trigger-description').value = form.triggerStrategy.description || '';
  triggerCommandName.value = form.triggerStrategy.commandName || '';
  triggerCommandDescription.value = form.triggerStrategy.commandDescription || '';
  if (generatorTemplateSelect) generatorTemplateSelect.value = form.templateId || 'blank';
  renderGeneratorTriggerControls();
  renderGeneratorExecutionControls();
  renderGeneratorReferenceControls();
}

function renderGeneratorFieldErrors() {
  const validation = state.generator.validation;
  const errorMap = generatorFieldErrorMap();

  Object.entries(errorMap).forEach(([field, selector]) => {
    const target = $(selector);
    if (!target) return;
    const visible = state.generator.attemptedGenerate || state.generator.touchedFields[field];
    const message = visible ? (validation.fieldIssues[field]?.[0] || '') : '';
    target.textContent = message;
  });
}

function renderGeneratorValidationSummary() {
  const validation = state.generator.validation;
  const visible = state.generator.attemptedGenerate && validation.topIssues.length > 0;
  if (!generatorValidationSummary) return;
  generatorValidationSummary.hidden = !visible;
  if (!visible) return;
  generatorValidationTitle.textContent = state.locale === 'en' ? 'Fill these items before sending' : '生成前建议先补齐这些信息';
  generatorValidationCount.textContent = String(validation.topIssues.length);
  generatorValidationList.innerHTML = validation.topIssues.map((issue) => `<li>${escapeHtml(issue)}</li>`).join('');
}

function renderGeneratorGroupProgress() {
  const progress = generatorHelpers.getGeneratorProgress(getGeneratorPayload());

  progress.sections.forEach((section, index) => {
    const target = document.querySelector(`[data-generator-progress="${section.key}"]`);
    const group = document.querySelector(`[data-generator-group="${section.key}"]`);
    if (target) target.textContent = `${section.filled}/${section.total}`;
    if (group) {
      group.hidden = index !== getCurrentGeneratorStep();
      if (section.complete && section.total > 0) group.dataset.complete = 'true';
      else delete group.dataset.complete;
    }
  });

  return progress;
}

function renderGeneratorStepList() {
  if (!generatorStepList) return;
  const progress = generatorHelpers.getGeneratorProgress(getGeneratorPayload());
  generatorStepList.innerHTML = generatorHelpers.GROUPS.map((group, index) => {
    const section = progress.sections.find((item) => item.key === group.key) || { filled: 0, total: 0, complete: false };
    const classNames = ['generator-step-pill', index === getCurrentGeneratorStep() ? 'active' : '', section.complete ? 'complete' : ''].filter(Boolean).join(' ');
    return `
      <button class="${classNames}" data-generator-step="${index}" type="button">
        <span class="generator-step-pill-index">${state.locale === 'en' ? `Step ${index + 1}` : `步骤 ${index + 1}`}</span>
        <span class="generator-step-pill-title">${escapeHtml(group.label.replace(/^[A-Z]\.\s*/, ''))}</span>
        <span class="generator-step-pill-meta">${state.locale === 'en' ? `${section.filled}/${section.total} completed` : `${section.filled}/${section.total} 已填写`}</span>
      </button>
    `;
  }).join('');

  generatorStepList.querySelectorAll('[data-generator-step]').forEach((button) => {
    button.addEventListener('click', () => {
      setGeneratorStep(Number(button.dataset.generatorStep));
      renderGeneratorWizard();
    });
  });
}

function renderGeneratorWizard() {
  renderGeneratorGroupProgress();
  renderGeneratorStepList();
  renderGeneratorFieldErrors();
  renderGeneratorValidationSummary();
  renderGeneratorTemplateOptions();
  renderGeneratorNameSuggestions();
  const isFirstStep = getCurrentGeneratorStep() === 0;
  const isLastStep = getCurrentGeneratorStep() === getGeneratorStepCount() - 1;
  generatorPrevBtn.hidden = isFirstStep;
  generatorPreviewBtn.textContent = isLastStep ? translate('generator.buttons.generate') : translate('generator.buttons.next');
  generatorPreviewBtn.dataset.action = isLastStep ? 'open-preview-modal' : 'next-generator-step';
}

function getGeneratorMaterialById(materialId) {
  return state.generator.referenceMaterials.find((material) => material.id === materialId) || null;
}

function formatGeneratorMaterialMeta(material) {
  const parts = [
    materialKindLabel(material.kind),
    generatorOptionLabel(generatorHelpers.MATERIAL_USAGE_OPTIONS, material.usage),
    generatorOptionLabel(generatorHelpers.MATERIAL_PROMPT_MODE_OPTIONS, material.promptMode)
  ];
  if (material.mimeType) parts.push(material.mimeType);
  if (material.size) {
    const size = material.size < 1024
      ? `${material.size} B`
      : material.size < 1024 * 1024
        ? `${Math.round(material.size / 102.4) / 10} KB`
        : `${Math.round(material.size / (1024 * 102.4)) / 10} MB`;
    parts.push(size);
  }
  return parts.join(' · ');
}

function materialKindLabel(kind) {
  const labels = state.locale === 'en'
    ? { note: 'Note', link: 'Link', path: 'Local Path', file: 'File', image: 'Image' }
    : { note: '补充说明', link: '链接', path: '本地路径', file: '文件', image: '图片' };
  return labels[kind] || kind;
}

function buildGeneratorMaterialSummary(materials) {
  const counts = materials.reduce((result, material) => {
    const key = material.kind || 'note';
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});

  return Object.entries(counts).map(([kind, count]) => ({
    label: state.locale === 'en' ? `${materialKindLabel(kind)} ${count}` : `${materialKindLabel(kind)} ${count} 份`,
    kind
  }));
}

function renderGeneratorMaterialModal() {
  if (!generatorMaterialModal) return;

  const material = getGeneratorMaterialById(state.generator.materialPreviewId);
  if (!material) {
    generatorMaterialModal.hidden = true;
    generatorMaterialModalMeta.innerHTML = '';
    generatorMaterialModalRender.innerHTML = `<pre>${escapeHtml(state.locale === 'en' ? 'No previewable material is currently selected.' : '当前没有可预览的材料。')}</pre>`;
    generatorMaterialModalOpen.hidden = true;
    generatorMaterialModalOpen.removeAttribute('href');
    syncBodyModalState();
    return;
  }

  generatorMaterialModal.hidden = false;
  generatorMaterialModalTitle.textContent = material.name || material.value || '未命名材料';
  generatorMaterialModalSubtitle.textContent = state.locale === 'en'
    ? `${materialKindLabel(material.kind)} · Usage: ${generatorOptionLabel(generatorHelpers.MATERIAL_USAGE_OPTIONS, material.usage)}`
    : `${materialKindLabel(material.kind)} · 用途：${generatorOptionLabel(generatorHelpers.MATERIAL_USAGE_OPTIONS, material.usage)}`;
  generatorMaterialModalMeta.innerHTML = `
    <div class="detail-item"><strong>${escapeHtml(state.locale === 'en' ? 'Type' : '类型')}</strong>${escapeHtml(materialKindLabel(material.kind))}</div>
    <div class="detail-item"><strong>${escapeHtml(state.locale === 'en' ? 'Prompt mode' : '进入 Prompt 方式')}</strong>${escapeHtml(generatorOptionLabel(generatorHelpers.MATERIAL_PROMPT_MODE_OPTIONS, material.promptMode))}</div>
    <div class="detail-item"><strong>${escapeHtml(state.locale === 'en' ? 'Value' : '内容')}</strong>${escapeHtml(material.value || (state.locale === 'en' ? 'Not provided' : '未提供'))}</div>
    <div class="detail-item"><strong>${escapeHtml(state.locale === 'en' ? 'Note' : '备注')}</strong>${escapeHtml(material.note || (state.locale === 'en' ? 'Not provided' : '未提供'))}</div>
    <div class="detail-item"><strong>${escapeHtml(state.locale === 'en' ? 'Metadata' : '其他信息')}</strong>${escapeHtml(formatGeneratorMaterialMeta(material) || (state.locale === 'en' ? 'Not provided' : '未提供'))}</div>
  `;

  const openHref = material.previewUrl || (material.kind === 'link' ? material.value : '');
  if (openHref) {
    generatorMaterialModalOpen.hidden = false;
    generatorMaterialModalOpen.href = openHref;
  } else {
    generatorMaterialModalOpen.hidden = true;
    generatorMaterialModalOpen.removeAttribute('href');
  }

  if (material.kind === 'image' && material.previewUrl) {
    generatorMaterialModalRender.innerHTML = `<img src="${escapeHtml(material.previewUrl)}" alt="${escapeHtml(material.name || (state.locale === 'en' ? 'Reference image' : '参考图片'))}" />`;
  } else if ((material.mimeType || '').includes('pdf') && material.previewUrl) {
    generatorMaterialModalRender.innerHTML = `<iframe src="${escapeHtml(material.previewUrl)}" title="${escapeHtml(material.name || (state.locale === 'en' ? 'PDF preview' : 'PDF 预览'))}"></iframe>`;
  } else if (material.kind === 'link') {
    generatorMaterialModalRender.innerHTML = `<pre>${escapeHtml(material.value || '')}</pre>`;
  } else if (material.kind === 'path') {
    generatorMaterialModalRender.innerHTML = `<pre>${escapeHtml(state.locale === 'en' ? 'Browser mode cannot read the original file content from a local path directly.' : '网页模式下无法直接读取本地路径指向的原文件内容。')}\n\n${escapeHtml(material.value || '')}</pre>`;
  } else if (material.previewUrl) {
    generatorMaterialModalRender.innerHTML = `<pre>${escapeHtml(formatGeneratorMaterialMeta(material))}</pre>`;
  } else {
    generatorMaterialModalRender.innerHTML = `<pre>${escapeHtml(material.note || material.value || material.name || '')}</pre>`;
  }

  syncBodyModalState();
}

function openGeneratorMaterialModal(materialId) {
  state.generator.materialPreviewId = materialId;
  renderGeneratorMaterialModal();
}

function closeGeneratorMaterialModal() {
  if (!state.generator.materialPreviewId) return;
  state.generator.materialPreviewId = '';
  renderGeneratorMaterialModal();
}

function renderGeneratorMaterials() {
  if (!state.generator.referenceMaterials.length) {
    generatorMaterialList.innerHTML = `<span class="file-chip">${escapeHtml(translate('generator.fields.materialEmpty'))}</span>`;
    return;
  }

  generatorMaterialList.innerHTML = `<div class="material-card-list">${state.generator.referenceMaterials.map((material) => `
    <div class="material-card">
      <div class="material-card-head">
        <div>
          <div><strong>${escapeHtml(material.name || material.value || '未命名材料')}</strong></div>
          <div class="material-card-meta">${escapeHtml(formatGeneratorMaterialMeta(material))}</div>
        </div>
        <button class="small-btn" type="button" data-remove-material="${escapeHtml(material.id)}">${escapeHtml(translate('generator.buttons.delete'))}</button>
      </div>
      ${material.value && material.value !== material.name ? `<div class="material-card-value">${escapeHtml(material.value)}</div>` : ''}
      ${material.note ? `<div class="material-card-meta">${escapeHtml(state.locale === 'en' ? `Note: ${material.note}` : `备注：${material.note}`)}</div>` : ''}
      <div class="generator-material-inline-actions">
        <button class="small-btn" type="button" data-preview-material="${escapeHtml(material.id)}">${escapeHtml(translate('generator.buttons.previewMaterial'))}</button>
      </div>
    </div>
  `).join('')}</div>`;

  generatorMaterialList.querySelectorAll('[data-remove-material]').forEach((button) => {
    button.addEventListener('click', () => {
      replaceGeneratorReferenceMaterials(state.generator.referenceMaterials.filter((material) => material.id !== button.dataset.removeMaterial));
      rebuildGeneratorResults({ preserveActionStatus: true });
    });
  });

  generatorMaterialList.querySelectorAll('[data-preview-material]').forEach((button) => {
    button.addEventListener('click', () => openGeneratorMaterialModal(button.dataset.previewMaterial));
  });
}

function renderGeneratorMaterialPreview() {
  if (!generatorMaterialPreview) return;

  const materials = state.generator.referenceMaterials;
  if (!materials.length) {
    generatorMaterialPreview.hidden = true;
    generatorMaterialPreviewSummary.innerHTML = '';
    generatorMaterialPreviewList.innerHTML = '';
    return;
  }

  generatorMaterialPreview.hidden = false;
  const summary = buildGeneratorMaterialSummary(materials);
  generatorMaterialPreviewSummary.innerHTML = [
    `<span class="file-chip">${escapeHtml(state.locale === 'en' ? `${materials.length} items` : `共 ${materials.length} 份`)}</span>`,
    ...summary.map((item) => `<span class="file-chip">${escapeHtml(item.label)}</span>`)
  ].join('');

  generatorMaterialPreviewList.innerHTML = materials.map((material) => `
    <button class="material-card-button" data-preview-material="${escapeHtml(material.id)}" type="button">
      <div>
        <div><strong>${escapeHtml(material.name || material.value || '未命名材料')}</strong></div>
        <div class="material-card-meta">${escapeHtml(formatGeneratorMaterialMeta(material))}</div>
      </div>
      ${material.note ? `<div class="material-card-meta">${escapeHtml(state.locale === 'en' ? `Note: ${material.note}` : `备注：${material.note}`)}</div>` : ''}
    </button>
  `).join('');

  generatorMaterialPreviewList.querySelectorAll('[data-preview-material]').forEach((button) => {
    button.addEventListener('click', () => openGeneratorMaterialModal(button.dataset.previewMaterial));
  });
}

function updateMaterialPromptModePreview() {
  if (!generatorMaterialPromptModePreview) return;
  const usage = generatorMaterialUsage?.value || 'background';
  const mapping = {
    template: 'style',
    example: 'style',
    background: 'background',
    forbidden: 'constraint'
  };
  const mode = mapping[usage] || 'background';
  generatorMaterialPromptModePreview.textContent = state.locale === 'en'
    ? `Prompt mode: ${generatorOptionLabel(generatorHelpers.MATERIAL_PROMPT_MODE_OPTIONS, mode)}`
    : `进入 Prompt 的方式：${generatorOptionLabel(generatorHelpers.MATERIAL_PROMPT_MODE_OPTIONS, mode)}`;
}

function resetMaterialComposerInputs() {
  generatorMaterialValue.value = '';
  generatorMaterialNote.value = '';
  generatorMaterialFile.value = '';
  if (generatorMaterialUsage) generatorMaterialUsage.value = 'background';
  updateMaterialComposerPlaceholder();
}

function updateMaterialComposerPlaceholder() {
  if (generatorMaterialType.value === 'link') {
    generatorMaterialValue.placeholder = state.locale === 'en' ? 'Enter a reference link, e.g. https://example.com/template' : '输入参考链接，例如 https://example.com/template';
  } else if (generatorMaterialType.value === 'path') {
    generatorMaterialValue.placeholder = state.locale === 'en' ? 'Enter a local file path, e.g. /Users/demo/Desktop/template.xlsx' : '输入本地文件路径，例如 /Users/demo/Desktop/template.xlsx';
  } else {
    generatorMaterialValue.placeholder = state.locale === 'en' ? 'Enter a short note title, e.g. historical template notes' : '输入这份补充说明的标题，例如 历史模板说明';
  }
  updateMaterialPromptModePreview();
}

function addTypedReferenceMaterial() {
  const kind = generatorMaterialType.value;
  const value = generatorMaterialValue.value.trim();
  const note = generatorMaterialNote.value.trim();
  const usage = generatorMaterialUsage?.value || 'background';
  const promptMode = usage === 'template' || usage === 'example' ? 'style' : usage === 'forbidden' ? 'constraint' : 'background';

  if (!value) {
    setGeneratorStatus(state.locale === 'en'
      ? 'Enter a link, local path, or a short material title before adding it.'
      : '先输入链接、本地路径或这份材料的标题，再添加到参考材料里。', 'warn');
    return;
  }

  replaceGeneratorReferenceMaterials([
    ...state.generator.referenceMaterials,
    {
      kind,
      usage,
      promptMode,
      name: value,
      value,
      note
    }
  ]);
  resetMaterialComposerInputs();
  rebuildGeneratorResults({ preserveActionStatus: true });
  setGeneratorStatus(state.locale === 'en'
    ? 'Reference material added. It will be summarized and attached to the prompt preview.'
    : '已加入参考材料，这份材料会以文字摘要形式进入 Prompt 预览。', 'good');
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',').pop() : result;
      resolve(base64 || '');
    };
    reader.onerror = () => {
      reject(reader.error || new Error('Unable to read file'));
    };
    reader.readAsDataURL(file);
  });
}

async function addFileReferenceMaterials(fileList) {
  const usage = generatorMaterialUsage?.value || 'background';
  const promptMode = usage === 'template' || usage === 'example' ? 'style' : usage === 'forbidden' ? 'constraint' : 'background';
  const files = Array.from(fileList || []);
  const nextMaterials = await Promise.all(files.map(async (file, index) => ({
    id: `file-${file.name}-${file.size}-${Date.now()}-${index}`,
    kind: file.type?.startsWith('image/') ? 'image' : 'file',
    usage,
    promptMode,
    name: file.name,
    value: file.name,
    note: generatorMaterialNote.value.trim(),
    size: file.size || 0,
    mimeType: file.type || '',
    previewUrl: typeof URL?.createObjectURL === 'function' ? URL.createObjectURL(file) : '',
    encodedContent: await readFileAsBase64(file),
    originalPath: typeof file.path === 'string' ? file.path : ''
  })));

  if (!nextMaterials.length) return;
  replaceGeneratorReferenceMaterials([...state.generator.referenceMaterials, ...nextMaterials]);
  resetMaterialComposerInputs();
  rebuildGeneratorResults({ preserveActionStatus: true });
  setGeneratorStatus(state.locale === 'en'
    ? `Added ${nextMaterials.length} reference materials.`
    : `已加入 ${nextMaterials.length} 份参考材料。`, 'good');
}

function setGeneratorStatus(message, tone = 'neutral') {
  state.generator.lastSendStatus = message;
  state.generator.lastSendTone = tone;
  generatorStatus.textContent = message;
}

function rebuildGeneratorResults(options = {}) {
  const payload = getGeneratorPayload();
  state.generator.form = createGeneratorForm(payload);
  state.generator.referenceMaterials = cloneGeneratorReferenceMaterials(payload.referenceMaterials);
  state.generator.prompt = generatorHelpers.buildOpenClawPrompt(payload, state.locale);
  state.generator.readiness = generatorHelpers.getGeneratorReadiness(payload, state.locale);
  state.generator.validation = generatorHelpers.buildValidation(payload, state.locale);
  if (options.regenerateBlocks) {
    state.generator.promptBlocks = buildPromptBlocks(payload);
  }
  if (!options.preserveActionStatus) {
    state.generator.lastSendStatus = state.generator.readiness.message;
    state.generator.lastSendTone = state.generator.readiness.tone;
  }
  renderGeneratorResults();
  return state.generator.prompt;
}

function hasUnsavedGeneratorBlockEdits() {
  return state.generator.promptBlocks.some((block) => block.isEditing && block.draftContent !== block.content);
}

function renderGeneratorPromptBlocks() {
  if (!generatorBlockList) return;
  if (!state.generator.promptBlocks.length) {
    generatorBlockList.innerHTML = `<pre class="code-block">${escapeHtml(translate('generator.modals.promptEmpty'))}</pre>`;
    return;
  }

  generatorBlockList.innerHTML = state.generator.promptBlocks.map((block) => `
    <section class="generator-block-card" data-block-id="${escapeHtml(block.id)}" data-collapsed="${block.collapsed ? 'true' : 'false'}">
      <div class="generator-block-head">
        <div class="generator-block-title-row">
          <div class="generator-block-title">${escapeHtml(block.title)}</div>
          ${block.modified ? `<span class="generator-block-status">${escapeHtml(state.locale === 'en' ? 'Modified' : '已修改')}</span>` : ''}
        </div>
        <div class="generator-block-actions">
          <button class="small-btn" type="button" data-block-toggle="${escapeHtml(block.id)}">${escapeHtml(block.collapsed ? (state.locale === 'en' ? 'Expand' : '展开') : (state.locale === 'en' ? 'Collapse' : '折叠'))}</button>
          <button class="small-btn" type="button" data-block-copy="${escapeHtml(block.id)}">${escapeHtml(state.locale === 'en' ? 'Copy block' : '复制区块')}</button>
          ${block.isEditing
            ? `<button class="small-btn" type="button" data-block-save="${escapeHtml(block.id)}">${escapeHtml(state.locale === 'en' ? 'Save block' : '保存区块')}</button>`
            : `<button class="small-btn" type="button" data-block-edit="${escapeHtml(block.id)}">${escapeHtml(state.locale === 'en' ? 'Edit' : '编辑')}</button>`}
          <button class="small-btn" type="button" data-block-restore="${escapeHtml(block.id)}">${escapeHtml(state.locale === 'en' ? 'Restore' : '恢复原内容')}</button>
        </div>
      </div>
      <div class="generator-block-body">
        ${block.isEditing
          ? `<textarea class="text-area generator-block-editor" data-block-editor="${escapeHtml(block.id)}">${escapeHtml(block.draftContent)}</textarea>`
          : `<pre class="code-block generator-block-content">${escapeHtml(block.content)}</pre>`}
      </div>
    </section>
  `).join('');

  generatorBlockList.querySelectorAll('[data-block-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      state.generator.promptBlocks = state.generator.promptBlocks.map((block) => block.id === button.dataset.blockToggle ? { ...block, collapsed: !block.collapsed } : block);
      renderGeneratorPromptBlocks();
    });
  });

  generatorBlockList.querySelectorAll('[data-block-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const block = state.generator.promptBlocks.find((item) => item.id === button.dataset.blockCopy);
      if (!block) return;
      try {
        await copyGeneratedPrompt(block.content);
        setGeneratorStatus(state.locale === 'en' ? 'The selected block has been copied.' : '已复制当前区块内容。', 'good');
      } catch (error) {
        setGeneratorStatus(error.message || (state.locale === 'en' ? 'Unable to copy this block.' : '当前环境无法直接复制这个区块。'), 'warn');
      }
    });
  });

  generatorBlockList.querySelectorAll('[data-block-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      state.generator.promptBlocks = state.generator.promptBlocks.map((block) => block.id === button.dataset.blockEdit
        ? { ...block, isEditing: true, draftContent: block.content }
        : block);
      renderGeneratorPromptBlocks();
    });
  });

  generatorBlockList.querySelectorAll('[data-block-save]').forEach((button) => {
    button.addEventListener('click', () => {
      state.generator.promptBlocks = state.generator.promptBlocks.map((block) => block.id === button.dataset.blockSave
        ? {
            ...block,
            isEditing: false,
            content: block.draftContent,
            modified: block.draftContent !== block.generatedContent
          }
        : block);
      renderGeneratorPromptBlocks();
    });
  });

  generatorBlockList.querySelectorAll('[data-block-editor]').forEach((textarea) => {
    textarea.addEventListener('input', () => {
      state.generator.promptBlocks = state.generator.promptBlocks.map((block) => block.id === textarea.dataset.blockEditor
        ? { ...block, draftContent: textarea.value }
        : block);
    });
  });

  generatorBlockList.querySelectorAll('[data-block-restore]').forEach((button) => {
    button.addEventListener('click', () => {
      state.generator.promptBlocks = state.generator.promptBlocks.map((block) => block.id === button.dataset.blockRestore
        ? { ...block, content: block.generatedContent, draftContent: block.generatedContent, modified: false, isEditing: false }
        : block);
      renderGeneratorPromptBlocks();
    });
  });
}

function renderGeneratorResults() {
  generatorStatus.textContent = state.generator.lastSendStatus;
  renderGeneratorWizard();
  renderGeneratorMaterials();
  renderGeneratorMaterialPreview();
  renderGeneratorMaterialModal();
  renderGeneratorPromptBlocks();
  const canAct = Boolean(currentPromptText().trim());
  generatorSendBtn.disabled = !canAct;
  generatorCopyBtn.disabled = !canAct;
  generatorPreviewModal.hidden = !state.generator.previewOpen;
  syncBodyModalState();
}

function applyDefaultGeneratorState() {
  state.generator = createGeneratorState();
  replaceGeneratorReferenceMaterials(cloneGeneratorReferenceMaterials(DEFAULT_GENERATOR_PAYLOAD.referenceMaterials));
  applyGeneratorForm(state.generator.form);
  resetMaterialComposerInputs();
}

function resetGeneratorForm() {
  applyDefaultGeneratorState();
  state.generator.lastSendStatus = state.locale === 'en'
    ? 'The generator has been reset. You can start from a template or fill the blank form step by step.'
    : '已重置生成器。你可以从模板开始，也可以按步骤填写空白表单。';
  state.generator.lastSendTone = 'neutral';
  rebuildGeneratorResults({ preserveActionStatus: true, regenerateBlocks: false });
}

function openGeneratorPreviewModal() {
  state.generator.attemptedGenerate = true;
  const payload = getGeneratorPayload();
  state.generator.validation = generatorHelpers.buildValidation(payload, state.locale);
  state.generator.readiness = generatorHelpers.getGeneratorReadiness(payload, state.locale);
  state.generator.promptBlocks = buildPromptBlocks(payload);
  state.generator.previewOpen = true;
  state.generator.lastSendStatus = state.generator.readiness.message;
  state.generator.lastSendTone = state.generator.readiness.tone;
  renderGeneratorResults();
}

function closeGeneratorPreviewModal() {
  if (!state.generator.previewOpen) return;
  if (hasUnsavedGeneratorBlockEdits()) {
    const shouldClose = window.confirm(state.locale === 'en'
      ? 'There are unsaved block edits. Close the preview anyway?'
      : '当前有尚未保存的区块编辑内容，确定直接关闭预览吗？');
    if (!shouldClose) return;
  }
  state.generator.previewOpen = false;
  closeGeneratorMaterialModal();
  renderGeneratorResults();
}

function closeWorkbenchModal() {
  if (!state.workbenchOpen) return;
  state.workbenchOpen = false;
  renderWorkbench();
}

async function copyGeneratedPrompt(prompt) {
  const finalPrompt = prompt || currentPromptText() || rebuildGeneratorResults();

  if (window.openclawDesktop?.copyText) {
    return window.openclawDesktop.copyText(finalPrompt);
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(finalPrompt);
    return {
      ok: true,
      mode: 'browser'
    };
  }

  throw new Error(state.locale === 'en'
    ? 'Clipboard write is not available in this environment. Please copy the prompt manually from the preview.'
    : '当前环境无法直接写入剪贴板，请打开预览后手动复制 Prompt。');
}

async function openOpenClawControl(payloadOrPrompt) {
  const prompt = typeof payloadOrPrompt === 'string' ? payloadOrPrompt : payloadOrPrompt?.prompt;
  const finalPrompt = prompt || currentPromptText() || rebuildGeneratorResults();
  const payload = {
    prompt: finalPrompt,
    referenceMaterials: getGeneratorPayload().referenceMaterials
  };

  if (window.openclawDesktop?.openOpenClawControl) {
    return window.openclawDesktop.openOpenClawControl(payload);
  }

  const result = await apiFetch('/api/openclaw/control/send', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (!result?.opened && result?.url) {
    const popup = window.open(result.url, '_blank', 'noopener,noreferrer');
    return {
      ...result,
      opened: Boolean(popup)
    };
  }

  return result;
}

async function sendToOpenClaw() {
  const prompt = currentPromptText() || rebuildGeneratorResults();
  let copyOk = false;
  let openResult = null;

  try {
    await copyGeneratedPrompt(prompt);
    copyOk = true;
  } catch (error) {
    setGeneratorStatus(error.message || (state.locale === 'en'
      ? 'Direct copy is not available in this environment. Please copy the prompt manually.'
      : '当前环境无法直接复制 Prompt，请手动复制。'), 'warn');
  }

  try {
    openResult = await openOpenClawControl(prompt);
  } catch (error) {
    setGeneratorStatus(state.locale === 'en'
      ? `Unable to open the OpenClaw console: ${error.message || error}`
      : `未能打开 OpenClaw 控制台：${error.message || error}`, 'danger');
    return;
  }

  if (openResult?.opened && openResult?.submitted) {
    setGeneratorStatus(state.locale === 'en'
      ? 'The OpenClaw console has opened and the prompt has been sent automatically.'
      : '已自动打开 OpenClaw 控制台，并把 Prompt 直接发送出去。你现在可以直接在聊天页继续追问或查看结果。', 'good');
    return;
  }

  if (copyOk && openResult?.opened) {
    setGeneratorStatus(state.locale === 'en'
      ? 'The prompt has been copied and the OpenClaw console is open. If it was not auto-filled, paste and send it manually.'
      : '已生成发送内容，已复制到剪贴板，已打开 OpenClaw 控制台。如果没有自动填入，请直接粘贴发送。', 'good');
    return;
  }

  if (openResult?.opened) {
    setGeneratorStatus(state.locale === 'en'
      ? 'The OpenClaw console is open, but clipboard success could not be confirmed. Please copy the prompt from the preview and paste it manually.'
      : '已打开 OpenClaw 控制台，但当前环境无法确认剪贴板写入是否成功。请在预览弹窗里手动复制 Prompt 后粘贴发送。', 'warn');
    return;
  }

  setGeneratorStatus(state.locale === 'en'
    ? 'Unable to open the OpenClaw console. Keep the preview open and copy the prompt manually.'
    : '未能打开 OpenClaw 控制台。请保留预览弹窗，并手动复制 Prompt 使用。', 'danger');
}

async function hydrateControlLink() {
  if (!topControlLink) return;

  try {
    const payload = await apiFetch('/api/openclaw/control/url', {
      attemptRecovery: false
    });
    if (payload?.url) {
      topControlLink.href = payload.url;
    }
  } catch {
    topControlLink.href = OPENCLAW_CONTROL_URL;
  }
}

function renderGeneratorView() {
  renderGeneratorTriggerControls();
  renderGeneratorExecutionControls();
  renderGeneratorReferenceControls();
  renderGeneratorResults();
}

function renderAll() {
  renderStaticCopy();
  renderViewTabs();
  renderViewPanels();
  renderGeneratorView();

  if (!state.payload) return;

  renderOverview();
  renderFilterList();
  renderSkillGrid();
  renderWorkbench();
}

async function loadDashboard(force = false) {
  state.loadingDashboard = true;
  refreshState.textContent = translate('library.refreshLoading');
  refreshBtn.disabled = true;

  try {
    if (force) detailCache.clear();
    const path = force ? '/api/dashboard?force=1' : '/api/dashboard';
    state.payload = await apiFetch(path);

    if (state.filter === 'personal' && !state.payload.skills.some((skill) => skill.source === 'personal')) {
      state.filter = 'all';
    }

    if (!state.selectedSkillName && state.payload.skills.length) {
      state.selectedSkillName = chooseDefaultSkill(state.payload.skills)?.name || '';
    }

    renderAll();
    clearBrowserReconnectTimer();
    refreshState.textContent = translate('library.lastRefresh', { relative: relativeTime(state.payload.generatedAt) });
    await ensureDetailForSelection(force);
  } catch (error) {
    refreshState.textContent = isDesktopClient()
      ? translate('library.refreshFailedDesktop')
      : translate('library.refreshFailedBrowser', { seconds: Math.round(BROWSER_RETRY_DELAY_MS / 1000) });
    renderDashboardErrorState(error);
    scheduleBrowserReconnect(force);
  } finally {
    state.loadingDashboard = false;
    refreshBtn.disabled = false;
  }
}

async function loadSkillDetail(skillName, force = false) {
  if (!skillName) return null;
  if (!force && detailCache.has(skillName)) return detailCache.get(skillName);

  state.loadingDetail = true;
  renderWorkbench();

  try {
    const path = force
      ? `/api/skills/${encodeURIComponent(skillName)}?force=1`
      : `/api/skills/${encodeURIComponent(skillName)}`;
    const detail = await apiFetch(path);
    detailCache.set(skillName, detail);
    return detail;
  } catch (error) {
    configNotice.textContent = `读取 Skill 详情失败：${error.message}`;
    return null;
  } finally {
    state.loadingDetail = false;
    renderWorkbench();
  }
}

async function ensureDetailForSelection(force = false) {
  const summary = getSelectedSummary() || ensureSelectedSkill();
  if (!summary) return;
  await loadSkillDetail(summary.name, force);
  await ensureSelectedFile(force);
}

function parseJsonField(label, value) {
  const text = String(value || '').trim();
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`${label} 必须是 JSON 对象`);
    }
    return parsed;
  } catch {
    throw new Error(`${label} 不是合法的 JSON 对象`);
  }
}

function attachConfigFieldListeners() {
  [configEnabled, configApiKey, configEnvJson, configJson].forEach((element) => {
    element.addEventListener('input', () => {
      if (element === configJson) {
        renderCommonConfigFields(getSelectedDetail() || getSelectedSummary());
      }
      renderConfigGuard(getSelectedDetail() || getSelectedSummary());
    });
    element.addEventListener('change', () => {
      if (element === configJson) {
        renderCommonConfigFields(getSelectedDetail() || getSelectedSummary());
      }
      renderConfigGuard(getSelectedDetail() || getSelectedSummary());
    });
  });
}

function pushUniqueTag(nextList, value) {
  const normalized = String(value || '').trim();
  if (!normalized) return nextList;
  return [...new Set([...nextList, normalized])];
}

function attachTagComposer(input, addButton, getter, setter, touchedField, afterChange) {
  if (!input || !addButton) return;
  const submit = () => {
    const value = input.value.trim();
    if (!value) return;
    setter(pushUniqueTag(getter(), value));
    input.value = '';
    if (touchedField) markGeneratorFieldTouched(touchedField);
    if (typeof afterChange === 'function') afterChange();
    rebuildGeneratorResults({ preserveActionStatus: true });
  };
  addButton.addEventListener('click', submit);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  });
}

function attachGeneratorFieldListeners() {
  Object.entries(GENERATOR_TEXT_FIELD_IDS).forEach(([key, selector]) => {
    const element = $(selector);
    if (!element) return;
    element.addEventListener('input', () => {
      state.generator.form[key] = element.value;
      rebuildGeneratorResults({ preserveActionStatus: true });
    });
    element.addEventListener('blur', () => {
      markGeneratorFieldTouched(key);
      rebuildGeneratorResults({ preserveActionStatus: true });
    });
  });

  const triggerDescription = $('#gen-trigger-description');
  triggerDescription?.addEventListener('input', () => {
    state.generator.form.triggerStrategy.description = triggerDescription.value;
    rebuildGeneratorResults({ preserveActionStatus: true });
  });
  triggerDescription?.addEventListener('blur', () => {
    markGeneratorFieldTouched('triggerDescription');
    rebuildGeneratorResults({ preserveActionStatus: true });
  });

  triggerKeywordRule?.addEventListener('change', () => {
    state.generator.form.triggerStrategy.keywordRule = triggerKeywordRule.value;
    rebuildGeneratorResults({ preserveActionStatus: true });
  });
  triggerPostAction?.addEventListener('change', () => {
    state.generator.form.triggerStrategy.postAction = triggerPostAction.value;
    rebuildGeneratorResults({ preserveActionStatus: true });
  });
  triggerCommandName?.addEventListener('input', () => {
    state.generator.form.triggerStrategy.commandName = triggerCommandName.value;
    rebuildGeneratorResults({ preserveActionStatus: true });
  });
  triggerCommandName?.addEventListener('blur', () => {
    markGeneratorFieldTouched('commandName');
    rebuildGeneratorResults({ preserveActionStatus: true });
  });
  triggerCommandDescription?.addEventListener('input', () => {
    state.generator.form.triggerStrategy.commandDescription = triggerCommandDescription.value;
    rebuildGeneratorResults({ preserveActionStatus: true });
  });

  attachTagComposer(triggerKeywordInput, triggerKeywordAdd, () => state.generator.form.triggerStrategy.keywords, (next) => {
    state.generator.form.triggerStrategy.keywords = next;
  }, 'triggerKeywords', renderGeneratorTriggerControls);
  attachTagComposer(triggerExcludeInput, triggerExcludeAdd, () => state.generator.form.triggerStrategy.excludeKeywords, (next) => {
    state.generator.form.triggerStrategy.excludeKeywords = next;
  }, null, renderGeneratorTriggerControls);
  attachTagComposer(triggerCommandAliasInput, triggerCommandAliasAdd, () => state.generator.form.triggerStrategy.commandAliases, (next) => {
    state.generator.form.triggerStrategy.commandAliases = next;
  }, null, renderGeneratorTriggerControls);
  attachTagComposer(mustInput, mustAdd, () => state.generator.form.constraintsMust, (next) => {
    state.generator.form.constraintsMust = next;
  }, 'constraintsMust', renderGeneratorReferenceControls);
  attachTagComposer(mustNotInput, mustNotAdd, () => state.generator.form.constraintsMustNot, (next) => {
    state.generator.form.constraintsMustNot = next;
  }, 'constraintsMust', renderGeneratorReferenceControls);
}

searchBox.addEventListener('input', (event) => {
  state.search = event.target.value;
  renderAll();
  void ensureDetailForSelection();
});

sortSelect.addEventListener('change', (event) => {
  state.sortBy = event.target.value;
  renderAll();
  void ensureDetailForSelection();
});

refreshBtn.addEventListener('click', () => {
  void loadDashboard(true);
});

reloadConfigBtn.addEventListener('click', () => {
  void loadDashboard(true);
});

reloadFileBtn.addEventListener('click', () => {
  void reloadSelectedFile(true);
});

fileEditorForm.addEventListener('submit', (event) => {
  event.preventDefault();
  void saveSelectedFile();
});

fileEditorContent.addEventListener('input', () => {
  if (!state.selectedSkillName || !state.selectedFilePath) return;
  fileDrafts.set(fileCacheKey(state.selectedSkillName, state.selectedFilePath), fileEditorContent.value);
});

configForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const summary = getSelectedSummary();
  if (!summary) return;

  try {
    state.savingConfig = true;
    saveConfigBtn.disabled = true;
    configNotice.textContent = '正在写回本地 openclaw.json...';

    const payload = {
      enabled: configEnabled.checked,
      apiKey: configApiKey.value.trim(),
      env: parseJsonField('环境变量 JSON', configEnvJson.value),
      config: parseJsonField('配置项 JSON', configJson.value)
    };

    const detail = await apiFetch(`/api/skills/${encodeURIComponent(summary.name)}/config`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    detailCache.set(summary.name, detail);
    await loadDashboard(true);
    renderWorkbench();
    configNotice.innerHTML = `已保存到 <code>skills.entries.${escapeHtml(detail.skillKey)}</code>。`;
  } catch (error) {
    configNotice.textContent = error.message;
  } finally {
    state.savingConfig = false;
    saveConfigBtn.disabled = false;
  }
});

generatorResetBtn.addEventListener('click', () => {
  resetGeneratorForm();
});

generatorPrevBtn.addEventListener('click', () => {
  setGeneratorStep(getCurrentGeneratorStep() - 1);
  renderGeneratorWizard();
});

generatorCopyBtn.addEventListener('click', async () => {
  try {
    const prompt = currentPromptText() || rebuildGeneratorResults();
    await copyGeneratedPrompt(prompt);
    setGeneratorStatus(state.locale === 'en'
      ? 'The prompt has been copied to your clipboard. You can paste it into the OpenClaw console now.'
      : '已生成 Prompt，并已复制到剪贴板。你现在可以直接粘贴到 OpenClaw 控制台。', 'good');
  } catch (error) {
    setGeneratorStatus(error.message || (state.locale === 'en'
      ? 'Clipboard write is not available in this environment. Please copy the prompt manually from the preview.'
      : '当前环境无法直接写入剪贴板，请打开预览后手动复制 Prompt。'), 'warn');
  }
});

generatorSendBtn.addEventListener('click', () => {
  void sendToOpenClaw();
});

generatorPreviewBtn.addEventListener('click', () => {
  if (getCurrentGeneratorStep() < getGeneratorStepCount() - 1) {
    setGeneratorStep(getCurrentGeneratorStep() + 1);
    renderGeneratorWizard();
    return;
  }

  openGeneratorPreviewModal();
});

generatorTemplateSelect?.addEventListener('change', () => {
  const nextTemplateId = generatorTemplateSelect.value;
  if (nextTemplateId === state.generator.activeTemplateId) return;
  if (hasGeneratorContent()) {
    const confirmed = window.confirm(state.locale === 'en'
      ? 'Switching templates will overwrite the current form. Continue?'
      : '切换模板会覆盖当前内容，确定继续吗？');
    if (!confirmed) {
      generatorTemplateSelect.value = state.generator.activeTemplateId;
      return;
    }
  }
  applyTemplateToGenerator(nextTemplateId);
});

generatorTemplateClearBtn?.addEventListener('click', () => {
  if (hasGeneratorContent()) {
    const confirmed = window.confirm(state.locale === 'en'
      ? 'Clear the current generator form and go back to blank?'
      : '确定清空当前内容并回到空白模板吗？');
    if (!confirmed) return;
  }
  applyTemplateToGenerator('blank');
});

generatorSuggestNameBtn?.addEventListener('click', () => {
  const payload = getGeneratorPayload();
  state.generator.nameSuggestions = generatorHelpers.buildSuggestedSkillNames(payload).map((item) => item.replaceAll('_', ' '));
  renderGeneratorNameSuggestions();
});

generatorStepAdd?.addEventListener('click', () => {
  state.generator.form.steps = [...state.generator.form.steps, ''];
  renderGeneratorExecutionControls();
  rebuildGeneratorResults({ preserveActionStatus: true });
});

generatorBranchAdd?.addEventListener('click', () => {
  state.generator.form.branches = [...state.generator.form.branches, { if: '', then: '' }];
  renderGeneratorExecutionControls();
  rebuildGeneratorResults({ preserveActionStatus: true });
});

generatorMaterialAdd.addEventListener('click', () => {
  addTypedReferenceMaterial();
});

generatorMaterialType.addEventListener('change', () => {
  updateMaterialComposerPlaceholder();
});

generatorMaterialUsage?.addEventListener('change', () => {
  updateMaterialPromptModePreview();
});

generatorMaterialFile.addEventListener('change', (event) => {
  void addFileReferenceMaterials(event.target.files);
});

generatorModalCloseBtn.addEventListener('click', () => {
  closeGeneratorPreviewModal();
});

generatorPreviewModal.addEventListener('click', (event) => {
  if (event.target === generatorPreviewModal) {
    closeGeneratorPreviewModal();
  }
});

generatorMaterialModalCloseBtn.addEventListener('click', () => {
  closeGeneratorMaterialModal();
});

generatorMaterialModal.addEventListener('click', (event) => {
  if (event.target === generatorMaterialModal) {
    closeGeneratorMaterialModal();
  }
});

workbenchModalCloseBtn.addEventListener('click', () => {
  closeWorkbenchModal();
});

workbenchModal.addEventListener('click', (event) => {
  if (event.target === workbenchModal) {
    closeWorkbenchModal();
  }
});

languageToggleBtn?.addEventListener('click', () => {
  setLocale(state.locale === 'zh' ? 'en' : 'zh');
  rebuildGeneratorResults({ preserveActionStatus: true, regenerateBlocks: state.generator.previewOpen });
  renderAll();
});

themeToggleBtn?.addEventListener('click', () => {
  setTheme(state.theme === 'dark' ? 'light' : 'dark');
  renderAll();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.generator.materialPreviewId) {
    closeGeneratorMaterialModal();
    return;
  }
  if (event.key === 'Escape' && state.generator.previewOpen) {
    closeGeneratorPreviewModal();
    return;
  }
  if (event.key === 'Escape' && state.workbenchOpen) {
    closeWorkbenchModal();
  }
});

function initialize() {
  hydrateClientInfo();
  setLocale(state.locale);
  setTheme(state.theme, false);
  applyDefaultGeneratorState();
  updateMaterialComposerPlaceholder();
  void hydrateControlLink();
  attachConfigFieldListeners();
  attachGeneratorFieldListeners();
  rebuildGeneratorResults();
  renderAll();
  loadDashboard();
}

initialize();
