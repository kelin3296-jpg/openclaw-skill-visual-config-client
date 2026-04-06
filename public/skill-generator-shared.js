(function universal(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }

  root.OpenClawSkillGenerator = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function factory() {
  const TRIGGER_MODES = [
    { value: 'auto', labelZh: '自动触发（模型判断）', labelEn: 'Automatic (model judged)' },
    { value: 'keyword', labelZh: '关键词触发', labelEn: 'Keyword trigger' },
    { value: 'slash', labelZh: 'Slash Command 触发', labelEn: 'Slash command trigger' },
    { value: 'tool', labelZh: '工具直达触发', labelEn: 'Direct tool trigger' }
  ];

  const KEYWORD_RULES = [
    { value: 'any', labelZh: '任一关键词命中', labelEn: 'Any keyword matches' },
    { value: 'atLeastTwo', labelZh: '至少命中 2 个关键词', labelEn: 'At least 2 keywords match' },
    { value: 'keywordPlusIntent', labelZh: '关键词 + 意图同时满足', labelEn: 'Keyword plus intent match' }
  ];

  const POST_ACTIONS = [
    { value: 'boost', labelZh: '提升该 Skill 调用优先级', labelEn: 'Boost this Skill priority' },
    { value: 'slash', labelZh: '自动转为 /skill {skillName}', labelEn: 'Convert to /skill {skillName}' },
    { value: 'tool', labelZh: '自动转为工具调用', labelEn: 'Convert to tool invocation' }
  ];

  const INPUT_TYPE_OPTIONS = [
    { value: 'text', labelZh: '文本', labelEn: 'Text' },
    { value: 'pdf', labelZh: 'PDF', labelEn: 'PDF' },
    { value: 'image', labelZh: '图片', labelEn: 'Image' },
    { value: 'sheet', labelZh: '表格', labelEn: 'Sheet' },
    { value: 'link', labelZh: '链接', labelEn: 'Link' },
    { value: 'code', labelZh: '代码', labelEn: 'Code' },
    { value: 'localFile', labelZh: '本地文件', labelEn: 'Local file' }
  ];

  const OUTPUT_TYPE_OPTIONS = [
    { value: 'markdown', labelZh: 'Markdown', labelEn: 'Markdown' },
    { value: 'table', labelZh: '表格', labelEn: 'Table' },
    { value: 'json', labelZh: 'JSON', labelEn: 'JSON' },
    { value: 'checklist', labelZh: '清单', labelEn: 'Checklist' },
    { value: 'report', labelZh: '正文报告', labelEn: 'Report' },
    { value: 'card', labelZh: '卡片摘要', labelEn: 'Card summary' }
  ];

  const ACCEPTANCE_OPTIONS = [
    { value: 'complete', labelZh: '结构完整', labelEn: 'Complete structure' },
    { value: 'noFabrication', labelZh: '不编造信息', labelEn: 'No fabricated information' },
    { value: 'keepDetails', labelZh: '保留关键细节', labelEn: 'Keep key details' },
    { value: 'fixedFormat', labelZh: '输出格式固定', labelEn: 'Stable output format' },
    { value: 'prioritizeHighlights', labelZh: '重点信息优先', labelEn: 'Prioritize key insights' },
    { value: 'readyToUse', labelZh: '可直接复制使用', labelEn: 'Ready to copy and use' }
  ];

  const REFERENCE_ROLE_OPTIONS = [
    { value: 'strict', labelZh: '强约束', labelEn: 'Strict constraint' },
    { value: 'style', labelZh: '风格参考', labelEn: 'Style reference' },
    { value: 'background', labelZh: '背景说明', labelEn: 'Background context' }
  ];

  const MATERIAL_USAGE_OPTIONS = [
    { value: 'template', labelZh: '模板', labelEn: 'Template' },
    { value: 'example', labelZh: '示例', labelEn: 'Example' },
    { value: 'background', labelZh: '背景资料', labelEn: 'Background material' },
    { value: 'forbidden', labelZh: '禁忌说明', labelEn: 'Forbidden guidance' }
  ];

  const MATERIAL_PROMPT_MODE_OPTIONS = [
    { value: 'constraint', labelZh: '作为约束写入', labelEn: 'Write as constraints' },
    { value: 'style', labelZh: '作为风格参考写入', labelEn: 'Write as style reference' },
    { value: 'background', labelZh: '作为背景摘要写入', labelEn: 'Write as background summary' }
  ];

  const FIELD_LABELS = {
    scenarioName: 'Skill 场景名称',
    useWhen: '什么时候会用到这个 Skill',
    userSays: '用户通常会怎么说',
    scenarioGoal: '最终想要的结果',
    triggerMode: '触发方式',
    triggerDescription: '触发说明',
    triggerKeywords: '触发关键词',
    excludeKeywords: '排除关键词',
    keywordRule: '命中规则',
    postAction: '触发后动作',
    commandName: '命令名',
    commandAliases: '命令别名',
    commandDescription: '命令说明',
    modelInvocation: '模型调用策略',
    inputTypes: '输入类型',
    inputDescription: '输入里通常会包含什么',
    outputTypes: '输出类型',
    outputDescription: '输出内容说明',
    outputFormat: '输出格式要求',
    acceptanceChecks: '验收标准',
    acceptanceCustom: '补充你的专属标准',
    steps: '标准步骤',
    branches: '例外情况 / 分支',
    references: '参考模板 / 示例',
    referenceRole: '参考角色',
    constraintsMust: '必须做到',
    constraintsMustNot: '绝对不要做',
    optionalBackground: '补充背景'
  };

  const FIELD_LABELS_EN = {
    scenarioName: 'Skill scenario name',
    useWhen: 'When will this Skill be used',
    userSays: 'What will the user usually say',
    scenarioGoal: 'Final desired outcome',
    triggerMode: 'Trigger mode',
    triggerDescription: 'Trigger description',
    triggerKeywords: 'Trigger keywords',
    excludeKeywords: 'Exclude keywords',
    keywordRule: 'Keyword rule',
    postAction: 'Post-match action',
    commandName: 'Command name',
    commandAliases: 'Command aliases',
    commandDescription: 'Command description',
    modelInvocation: 'Model invocation',
    inputTypes: 'Input types',
    inputDescription: 'What is usually included in the input',
    outputTypes: 'Output types',
    outputDescription: 'Output description',
    outputFormat: 'Output format requirements',
    acceptanceChecks: 'Acceptance checks',
    acceptanceCustom: 'Custom criteria',
    steps: 'Standard steps',
    branches: 'Exceptions / branches',
    references: 'Templates / examples',
    referenceRole: 'Reference role',
    constraintsMust: 'Must do',
    constraintsMustNot: 'Never do',
    optionalBackground: 'Additional background'
  };

  const REQUIRED_FIELDS = [
    'scenarioName',
    'useWhen',
    'userSays',
    'scenarioGoal',
    'inputDescription',
    'outputDescription'
  ];

  const QUALITY_FIELDS = [
    'acceptanceChecks',
    'steps',
    'branches',
    'references',
    'constraintsMust'
  ];

  const GROUPS = [
    {
      key: 'definition',
      label: 'A. 场景与触发',
      fields: ['scenarioName', 'useWhen', 'userSays', 'triggerMode', 'triggerDescription', 'scenarioGoal'],
      includeMaterials: false
    },
    {
      key: 'execution',
      label: 'B. 输入、输出与流程',
      fields: ['inputTypes', 'inputDescription', 'outputTypes', 'outputDescription', 'outputFormat', 'acceptanceChecks', 'steps', 'branches'],
      includeMaterials: false
    },
    {
      key: 'reference',
      label: 'C. 约束与参考',
      fields: ['references', 'referenceRole', 'constraintsMust', 'constraintsMustNot', 'optionalBackground'],
      includeMaterials: true
    }
  ];

  const PROMPT_BLOCK_TITLES = {
    zh: {
      summary: '场景定位总结',
      names: '推荐 Skill 名称',
      applicable: '适用场景',
      notApplicable: '不适用场景',
      skillMd: 'SKILL.md',
      supporting: 'supporting files 建议',
      testing: '测试方法',
      missing: '待补充信息'
    },
    en: {
      summary: 'Scenario summary',
      names: 'Suggested Skill names',
      applicable: 'Applicable scenarios',
      notApplicable: 'Non-applicable scenarios',
      skillMd: 'SKILL.md',
      supporting: 'Supporting files suggestion',
      testing: 'Testing method',
      missing: 'Missing information'
    }
  };

  const TEMPLATE_PRESETS = [
    {
      id: 'blank',
      nameZh: '空白开始',
      nameEn: 'Start blank',
      descriptionZh: '从空白表单开始，适合自定义场景。',
      descriptionEn: 'Start from a blank generator form.',
      form: {}
    },
    {
      id: 'prd',
      nameZh: 'PRD 需求文档生成',
      nameEn: 'PRD document drafting',
      descriptionZh: '把需求背景、约束和目标整理成结构化 PRD。',
      descriptionEn: 'Turn requirement notes into a structured PRD.',
      form: {
        scenarioName: 'PRD 需求文档生成',
        useWhen: '每次拿到零散需求背景、讨论记录或产品草稿，需要整理成正式 PRD 时使用。',
        userSays: '帮我整理成 PRD\n把这个需求写成正式文档\n输出结构化 PRD',
        scenarioGoal: '输出一份结构化 PRD 初稿，包含背景、目标、范围、流程、边界和待确认事项，供产品或研发直接评审。',
        triggerStrategy: {
          mode: 'keyword',
          description: '当用户要求整理需求、输出 PRD、梳理范围和边界时触发。',
          keywords: ['PRD', '需求文档', '需求说明'],
          excludeKeywords: [],
          keywordRule: 'keywordPlusIntent',
          postAction: 'boost',
          commandName: '/prd-draft',
          commandAliases: ['prd', '需求稿'],
          commandDescription: '根据输入需求背景生成结构化 PRD 初稿',
          allowModelInvocation: true
        },
        inputTypes: ['text', 'link', 'localFile'],
        inputDescription: '需求背景、会议记录、流程草图、截图、链接、已有草稿。',
        outputTypes: ['markdown', 'report', 'checklist'],
        outputDescription: '结构化 PRD，包含目标、范围、功能流程、边界条件、验收和待确认问题。',
        outputFormat: '优先 Markdown 结构；标题层级清晰；最后追加待确认事项清单。',
        acceptanceChecks: ['complete', 'noFabrication', 'fixedFormat', 'readyToUse'],
        acceptanceCustom: '如果输入有冲突，需要单独列出冲突点。',
        steps: ['理解需求背景', '抽取关键目标与范围', '整理流程与边界', '生成结构化 PRD'],
        branches: [
          { if: '输入需求不完整', then: '先列缺失信息，再给 MVP 版本' },
          { if: '功能边界不清楚', then: '明确列出假设和待确认项' }
        ],
        references: '历史 PRD、公司文档模板、研发评审规范',
        referenceRole: 'strict',
        constraintsMust: ['结构完整', '标注待确认项'],
        constraintsMustNot: ['编造业务事实', '省略关键边界条件'],
        optionalBackground: '适合把零散讨论快速整理成可评审的 PRD 初稿。'
      }
    },
    {
      id: 'meeting',
      nameZh: '会议纪要 / 行动项提炼',
      nameEn: 'Meeting notes / action items',
      descriptionZh: '把转写稿或纪要整理成行动项和责任人。',
      descriptionEn: 'Turn transcripts into meeting notes and action items.',
      form: {
        scenarioName: '会议纪要与行动项提炼',
        useWhen: '每次拿到会议转写、妙记或聊天记录，需要整理成结构化纪要并提炼行动项时使用。',
        userSays: '帮我整理会议纪要\n提炼行动项\n总结会议重点',
        scenarioGoal: '输出结构化会议纪要，提炼行动项、责任人、截止时间和待确认事项。',
        triggerStrategy: {
          mode: 'keyword',
          description: '当用户提到纪要、会议总结、行动项时触发。',
          keywords: ['会议纪要', '行动项', '会议总结'],
          excludeKeywords: [],
          keywordRule: 'any',
          postAction: 'boost',
          commandName: '/meeting-notes',
          commandAliases: ['纪要', '行动项'],
          commandDescription: '整理会议纪要并提炼行动项',
          allowModelInvocation: true
        },
        inputTypes: ['text', 'pdf', 'link'],
        inputDescription: '会议转写稿、聊天记录、妙记链接、议程说明。',
        outputTypes: ['markdown', 'table', 'checklist'],
        outputDescription: '纪要摘要、关键结论、行动项表格、待跟进事项。',
        outputFormat: '行动项尽量结构化，至少包含任务、负责人、截止时间。',
        acceptanceChecks: ['complete', 'keepDetails', 'readyToUse'],
        acceptanceCustom: '没有明确责任人时要标注待确认。',
        steps: ['阅读会议内容', '提炼重点结论', '抽取行动项', '检查负责人和截止时间'],
        branches: [
          { if: '没有明确行动项', then: '只输出纪要摘要并标注无明确待办' }
        ],
        references: '会议纪要模板、行动项表格样例',
        referenceRole: 'strict',
        constraintsMust: ['保留关键细节', '明确责任归属'],
        constraintsMustNot: ['捏造承诺', '跳过冲突信息'],
        optionalBackground: '适合复盘会议并快速形成后续执行清单。'
      }
    },
    {
      id: 'competitive',
      nameZh: '竞品调研总结',
      nameEn: 'Competitive analysis summary',
      descriptionZh: '把截图、链接和笔记整理成竞品分析。',
      descriptionEn: 'Summarize screenshots and notes into a competitive report.',
      form: {
        scenarioName: '竞品调研总结',
        useWhen: '拿到竞品截图、产品链接和分析笔记，需要整理成调研结论和对比表时使用。',
        userSays: '整理竞品分析\n根据这些截图做总结\n输出竞品调研报告',
        scenarioGoal: '输出结构化竞品调研总结，包含对比维度、亮点、风险和启发。',
        triggerStrategy: {
          mode: 'keyword',
          description: '当用户提到竞品、调研、对比分析时触发。',
          keywords: ['竞品', '调研', '对标'],
          excludeKeywords: [],
          keywordRule: 'keywordPlusIntent',
          postAction: 'boost',
          commandName: '/competitive-summary',
          commandAliases: ['竞品分析'],
          commandDescription: '生成结构化竞品调研总结',
          allowModelInvocation: true
        },
        inputTypes: ['image', 'link', 'text'],
        inputDescription: '竞品截图、产品链接、体验记录、维度说明。',
        outputTypes: ['markdown', 'table', 'report'],
        outputDescription: '竞品对比结论、功能维度表、亮点和风险总结。',
        outputFormat: '先给结论，再给对比维度表，最后给机会点。',
        acceptanceChecks: ['complete', 'noFabrication', 'prioritizeHighlights'],
        acceptanceCustom: '所有结论都要回扣到给定材料。',
        steps: ['阅读材料', '整理维度', '总结差异', '提炼机会点'],
        branches: [
          { if: '截图和笔记信息冲突', then: '标记冲突并列出来源，不自行合并' }
        ],
        references: '竞品分析模板、过往调研报告',
        referenceRole: 'style',
        constraintsMust: ['先结论后细节'],
        constraintsMustNot: ['脱离材料扩写功能'],
        optionalBackground: '适合产品调研、复盘或汇报前快速整理分析结论。'
      }
    },
    {
      id: 'xiaohongshu',
      nameZh: '小红书文案整理',
      nameEn: 'Xiaohongshu copy整理',
      descriptionZh: '把素材和要点整理成小红书文案。',
      descriptionEn: 'Create Xiaohongshu post copy from notes and assets.',
      form: {
        scenarioName: '小红书文案整理',
        useWhen: '当已经有素材、笔记或口播草稿，需要整理成小红书笔记文案时使用。',
        userSays: '帮我写成小红书文案\n整理成笔记\n做成可发的内容',
        scenarioGoal: '输出可直接发布的小红书文案，包含标题、正文结构、亮点和结尾互动。',
        triggerStrategy: {
          mode: 'keyword',
          description: '当用户明确要求整理成小红书笔记时触发。',
          keywords: ['小红书', '笔记', '文案'],
          excludeKeywords: [],
          keywordRule: 'keywordPlusIntent',
          postAction: 'boost',
          commandName: '/rednote-copy',
          commandAliases: ['笔记文案'],
          commandDescription: '生成小红书风格文案',
          allowModelInvocation: true
        },
        inputTypes: ['text', 'image', 'link'],
        inputDescription: '产品信息、使用体验、亮点截图、语气要求。',
        outputTypes: ['markdown', 'card'],
        outputDescription: '标题建议、正文结构、亮点金句、结尾互动句。',
        outputFormat: '文案要口语化，段落短，适合直接复制发布。',
        acceptanceChecks: ['keepDetails', 'prioritizeHighlights', 'readyToUse'],
        acceptanceCustom: '',
        steps: ['理解内容主题', '提炼亮点', '组织成发布结构', '检查语气和节奏'],
        branches: [],
        references: '爆款文案样例、品牌语气规范',
        referenceRole: 'style',
        constraintsMust: ['保留真实体验感'],
        constraintsMustNot: ['过度营销', '夸大结果'],
        optionalBackground: '适合快速从素材到成稿。'
      }
    },
    {
      id: 'analysis',
      nameZh: '数据分析报告',
      nameEn: 'Data analysis report',
      descriptionZh: '把数据表和分析笔记整理成报告。',
      descriptionEn: 'Turn data tables into an analysis report.',
      form: {
        scenarioName: '数据分析报告',
        useWhen: '当拿到数据表、图表或分析笔记，需要整理成结构化分析报告时使用。',
        userSays: '根据这份数据做分析\n整理成报告\n输出分析结论',
        scenarioGoal: '输出结构化分析报告，包含关键发现、原因判断、风险和建议。',
        triggerStrategy: {
          mode: 'auto',
          description: '当用户要求基于数据输出分析结论或报告时触发。',
          keywords: [],
          excludeKeywords: [],
          keywordRule: 'any',
          postAction: 'boost',
          commandName: '/analysis-report',
          commandAliases: ['数据分析'],
          commandDescription: '生成结构化分析报告',
          allowModelInvocation: true
        },
        inputTypes: ['sheet', 'text', 'link'],
        inputDescription: '数据表、指标定义、分析目标、时间范围、备注说明。',
        outputTypes: ['report', 'table', 'markdown'],
        outputDescription: '关键指标结论、洞察、风险、建议动作。',
        outputFormat: '先摘要，再分指标说明，最后给建议。',
        acceptanceChecks: ['complete', 'noFabrication', 'prioritizeHighlights'],
        acceptanceCustom: '没有证据支持的判断必须标注为假设。',
        steps: ['理解分析目标', '核对口径', '提炼结论', '输出建议'],
        branches: [
          { if: '口径不清楚', then: '先列口径风险并暂停强结论' }
        ],
        references: '历史分析报告、指标口径说明',
        referenceRole: 'background',
        constraintsMust: ['结论有依据', '风险要单列'],
        constraintsMustNot: ['编造趋势原因'],
        optionalBackground: '适合运营、业务或产品分析的报告整理。'
      }
    },
    {
      id: 'daily-report',
      nameZh: '周报 / 日报生成',
      nameEn: 'Daily / weekly report',
      descriptionZh: '把碎片化工作记录整理成日报或周报。',
      descriptionEn: 'Turn scattered work logs into daily or weekly reports.',
      form: {
        scenarioName: '周报 / 日报生成',
        useWhen: '每次有零散工作记录、会议记录和任务进展，需要整理成日报或周报时使用。',
        userSays: '帮我整理周报\n做日报\n把这些工作记录写成汇报',
        scenarioGoal: '输出结构化日报或周报，包含完成事项、进展、风险和下步计划。',
        triggerStrategy: {
          mode: 'keyword',
          description: '当用户提到日报、周报、工作汇报时触发。',
          keywords: ['日报', '周报', '汇报'],
          excludeKeywords: [],
          keywordRule: 'any',
          postAction: 'boost',
          commandName: '/weekly-report',
          commandAliases: ['日报'],
          commandDescription: '整理成结构化工作汇报',
          allowModelInvocation: true
        },
        inputTypes: ['text', 'link', 'localFile'],
        inputDescription: '工作记录、任务进展、会议纪要、截图和待办。',
        outputTypes: ['markdown', 'checklist', 'report'],
        outputDescription: '完成事项、进展摘要、风险、下周计划。',
        outputFormat: '按完成 / 风险 / 计划三段输出。',
        acceptanceChecks: ['complete', 'keepDetails', 'readyToUse'],
        acceptanceCustom: '',
        steps: ['整理输入记录', '按主题归并', '提炼重点', '形成汇报结构'],
        branches: [],
        references: '历史周报模板、团队汇报格式',
        referenceRole: 'strict',
        constraintsMust: ['重点清晰', '风险单列'],
        constraintsMustNot: ['重复流水账'],
        optionalBackground: '适合定期汇报场景。'
      }
    },
    {
      id: 'faq',
      nameZh: '客服 FAQ 回复',
      nameEn: 'Customer FAQ replies',
      descriptionZh: '把知识库和规则整理成可复用 FAQ 回复。',
      descriptionEn: 'Generate FAQ replies from help docs and policies.',
      form: {
        scenarioName: '客服 FAQ 回复',
        useWhen: '当需要根据知识库、流程规则和历史回答快速生成 FAQ 回复时使用。',
        userSays: '回复这个问题\n整理成 FAQ 回答\n给出标准回复',
        scenarioGoal: '输出可直接发送的 FAQ 回复，并附上必要的补充说明或升级路径。',
        triggerStrategy: {
          mode: 'slash',
          description: '适合客服或支持人员显式调用，确保回复口径稳定。',
          keywords: [],
          excludeKeywords: [],
          keywordRule: 'any',
          postAction: 'boost',
          commandName: '/faq-reply',
          commandAliases: ['faq', '回复'],
          commandDescription: '生成标准 FAQ 回复',
          allowModelInvocation: false
        },
        inputTypes: ['text', 'link', 'localFile'],
        inputDescription: '用户问题、知识库链接、流程说明、禁忌口径。',
        outputTypes: ['markdown', 'card'],
        outputDescription: '标准回复、注意事项、需要升级处理时的说明。',
        outputFormat: '先给可直接发送的回复，再给内部备注。',
        acceptanceChecks: ['fixedFormat', 'noFabrication', 'readyToUse'],
        acceptanceCustom: '',
        steps: ['理解问题', '匹配知识库', '输出标准回复', '检查口径风险'],
        branches: [
          { if: '知识库没有覆盖', then: '明确说明未知并建议升级处理' }
        ],
        references: 'FAQ 手册、客服口径规范',
        referenceRole: 'strict',
        constraintsMust: ['口径稳定', '必要时提供升级路径'],
        constraintsMustNot: ['承诺未确认的结果'],
        optionalBackground: '适合客服、运营和支持团队提高标准回复效率。'
      }
    },
    {
      id: 'mcp',
      nameZh: 'MCP 接入助手',
      nameEn: 'MCP integration helper',
      descriptionZh: '把接入要求整理成可执行的 MCP 接入方案。',
      descriptionEn: 'Turn integration requirements into an MCP setup plan.',
      form: {
        scenarioName: 'MCP 接入助手',
        useWhen: '当需要根据现有项目背景整理 MCP 接入方案、依赖和步骤时使用。',
        userSays: '帮我接 MCP\n整理接入方案\n输出集成步骤',
        scenarioGoal: '输出一份结构化 MCP 接入方案，包含准备项、步骤、依赖、验证方式和风险。',
        triggerStrategy: {
          mode: 'tool',
          description: '适合直接走工具直达流程，避免多余判断。',
          keywords: [],
          excludeKeywords: [],
          keywordRule: 'any',
          postAction: 'tool',
          commandName: '/mcp-onboard',
          commandAliases: ['mcp'],
          commandDescription: '生成 MCP 接入方案',
          allowModelInvocation: false
        },
        inputTypes: ['text', 'code', 'link', 'localFile'],
        inputDescription: '项目背景、仓库结构、目标系统、参考文档。',
        outputTypes: ['markdown', 'checklist', 'json'],
        outputDescription: '接入步骤、依赖清单、风险、验证方法。',
        outputFormat: '先给 checklist，再给详细步骤，最后给验证项。',
        acceptanceChecks: ['complete', 'fixedFormat', 'readyToUse'],
        acceptanceCustom: '涉及权限或密钥时要单独提醒。',
        steps: ['理解现有环境', '梳理依赖', '规划接入步骤', '提供验证方案'],
        branches: [
          { if: '缺少关键环境信息', then: '先列出阻塞项并暂停具体接入步骤' }
        ],
        references: 'MCP 官方文档、现有项目结构',
        referenceRole: 'background',
        constraintsMust: ['步骤可执行', '风险明确'],
        constraintsMustNot: ['跳过权限依赖检查'],
        optionalBackground: '适合技术接入和方案整理场景。'
      }
    }
  ];

  function normalizeLocale(locale) {
    return locale === 'en' ? 'en' : 'zh';
  }

  function fieldLabel(field, locale = 'zh') {
    return normalizeLocale(locale) === 'en' ? FIELD_LABELS_EN[field] : FIELD_LABELS[field];
  }

  function blankTriggerStrategy() {
    return {
      mode: 'auto',
      description: '',
      keywords: [],
      excludeKeywords: [],
      keywordRule: 'any',
      postAction: 'boost',
      commandName: '',
      commandAliases: [],
      commandDescription: '',
      allowModelInvocation: true
    };
  }

  function blankForm() {
    return {
      templateId: 'blank',
      scenarioName: '',
      useWhen: '',
      userSays: '',
      scenarioGoal: '',
      triggerStrategy: blankTriggerStrategy(),
      inputTypes: [],
      inputDescription: '',
      outputTypes: [],
      outputDescription: '',
      outputFormat: '',
      acceptanceChecks: [],
      acceptanceCustom: '',
      steps: ['', '', '', ''],
      branches: [{ if: '', then: '' }],
      references: '',
      referenceRole: 'style',
      constraintsMust: [],
      constraintsMustNot: [],
      optionalBackground: '',
      referenceMaterials: []
    };
  }

  function toString(value) {
    return String(value || '').trim();
  }

  function uniq(items) {
    return [...new Set((Array.isArray(items) ? items : []).map((item) => String(item || '').trim()).filter(Boolean))];
  }

  function splitFreeText(value) {
    return String(value || '')
      .split(/\r?\n|,|，|、|；|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function normalizeSteps(rawSteps) {
    if (Array.isArray(rawSteps)) {
      const values = rawSteps.map((step) => toString(step)).filter(Boolean);
      return values.length ? values : ['', '', '', ''];
    }

    const values = splitFreeText(rawSteps);
    return values.length ? values : ['', '', '', ''];
  }

  function normalizeBranches(rawBranches) {
    if (Array.isArray(rawBranches)) {
      const values = rawBranches
        .map((item) => ({
          if: toString(item?.if),
          then: toString(item?.then)
        }))
        .filter((item) => item.if || item.then);
      return values.length ? values : [{ if: '', then: '' }];
    }

    const text = toString(rawBranches);
    if (!text) return [{ if: '', then: '' }];
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = /^如果(.+?)[，,]?[那么则]\s*(.+)$/.exec(line) || /^if\s+(.+?)\s+then\s+(.+)$/i.exec(line);
        if (match) {
          return {
            if: toString(match[1]),
            then: toString(match[2])
          };
        }
        return {
          if: line,
          then: ''
        };
      });
  }

  function normalizeTags(value) {
    if (Array.isArray(value)) return uniq(value);
    return uniq(splitFreeText(value));
  }

  function normalizeMaterial(material, index = 0) {
    const kind = ['note', 'link', 'path', 'file', 'image'].includes(material?.kind) ? material.kind : 'note';
    const name = toString(material?.name || material?.value || `${kind}-${index + 1}`);
    const value = toString(material?.value || material?.name);
    const note = toString(material?.note);
    const size = Number(material?.size || 0);
    const mimeType = toString(material?.mimeType);
    const previewUrl = toString(material?.previewUrl);
    const encodedContent = toString(material?.encodedContent);
    const originalPath = toString(material?.originalPath);
    const usage = MATERIAL_USAGE_OPTIONS.some((option) => option.value === material?.usage) ? material.usage : 'background';
    const promptMode = MATERIAL_PROMPT_MODE_OPTIONS.some((option) => option.value === material?.promptMode) ? material.promptMode : usage === 'template' ? 'style' : usage === 'forbidden' ? 'constraint' : 'background';

    return {
      id: toString(material?.id || `${kind}-${name}-${index}`),
      kind,
      name,
      value,
      note,
      usage,
      promptMode,
      size: Number.isFinite(size) ? size : 0,
      mimeType,
      previewUrl,
      encodedContent,
      originalPath
    };
  }

  function normalizeMaterials(materials) {
    return (Array.isArray(materials) ? materials : [])
      .map((material, index) => normalizeMaterial(material, index))
      .filter((material) => material.name || material.value);
  }

  function sanitizeTriggerStrategy(value) {
    const base = blankTriggerStrategy();
    const mode = TRIGGER_MODES.some((item) => item.value === value?.mode) ? value.mode : 'auto';
    return {
      mode,
      description: toString(value?.description),
      keywords: normalizeTags(value?.keywords),
      excludeKeywords: normalizeTags(value?.excludeKeywords),
      keywordRule: KEYWORD_RULES.some((item) => item.value === value?.keywordRule) ? value.keywordRule : 'any',
      postAction: POST_ACTIONS.some((item) => item.value === value?.postAction) ? value.postAction : 'boost',
      commandName: toString(value?.commandName),
      commandAliases: normalizeTags(value?.commandAliases),
      commandDescription: toString(value?.commandDescription),
      allowModelInvocation: value?.allowModelInvocation !== false
    };
  }

  function sanitizeFormData(formData) {
    const base = blankForm();
    const form = formData || {};

    const normalized = {
      ...base,
      templateId: toString(form.templateId || base.templateId) || 'blank',
      scenarioName: toString(form.scenarioName),
      useWhen: toString(form.useWhen || form.triggerScenario),
      userSays: toString(form.userSays),
      scenarioGoal: toString(form.scenarioGoal),
      triggerStrategy: sanitizeTriggerStrategy(form.triggerStrategy || form.trigger || {}),
      inputTypes: uniq(Array.isArray(form.inputTypes) ? form.inputTypes : splitFreeText(form.inputTypes)),
      inputDescription: toString(form.inputDescription || form.inputs),
      outputTypes: uniq(Array.isArray(form.outputTypes) ? form.outputTypes : splitFreeText(form.outputTypes)),
      outputDescription: toString(form.outputDescription || form.outputs),
      outputFormat: toString(form.outputFormat),
      acceptanceChecks: uniq(Array.isArray(form.acceptanceChecks) ? form.acceptanceChecks : splitFreeText(form.acceptanceChecks)),
      acceptanceCustom: toString(form.acceptanceCustom || form.acceptanceCriteria),
      steps: normalizeSteps(form.steps),
      branches: normalizeBranches(form.branches),
      references: toString(form.references),
      referenceRole: REFERENCE_ROLE_OPTIONS.some((item) => item.value === form.referenceRole) ? form.referenceRole : 'style',
      constraintsMust: normalizeTags(form.constraintsMust),
      constraintsMustNot: normalizeTags(form.constraintsMustNot || form.constraints),
      optionalBackground: toString(form.optionalBackground),
      referenceMaterials: normalizeMaterials(form.referenceMaterials)
    };

    if (!normalized.userSays && normalized.useWhen) {
      normalized.userSays = '';
    }

    return normalized;
  }

  function cloneForm(formData) {
    return sanitizeFormData(JSON.parse(JSON.stringify(formData || blankForm())));
  }

  function getTemplatePreset(templateId) {
    return TEMPLATE_PRESETS.find((preset) => preset.id === templateId) || TEMPLATE_PRESETS[0];
  }

  function createTemplateForm(templateId) {
    const preset = getTemplatePreset(templateId);
    return sanitizeFormData({
      ...blankForm(),
      templateId: preset.id,
      ...preset.form
    });
  }

  function labelForOption(options, value, locale = 'zh') {
    const item = options.find((option) => option.value === value);
    if (!item) return value;
    return normalizeLocale(locale) === 'en' ? item.labelEn : item.labelZh;
  }

  function countFilled(form, fields) {
    return fields.filter((field) => {
      const value = form[field];
      if (Array.isArray(value)) {
        return value.some((item) => {
          if (typeof item === 'string') return item.trim();
          if (item && typeof item === 'object') return Object.values(item).some((entry) => toString(entry));
          return false;
        });
      }
      if (value && typeof value === 'object') {
        return Object.values(value).some((entry) => Array.isArray(entry) ? entry.length : toString(entry));
      }
      return toString(value);
    }).length;
  }

  function getGeneratorProgress(formData) {
    const form = sanitizeFormData(formData);
    const sections = GROUPS.map((group) => {
      const total = group.fields.length + (group.includeMaterials ? 1 : 0);
      const filled = countFilled(form, group.fields) + (group.includeMaterials && form.referenceMaterials.length ? 1 : 0);
      return {
        key: group.key,
        label: group.label,
        filled,
        total,
        complete: filled >= total
      };
    });

    return {
      sections,
      filledFields: countFilled(form, Object.keys(FIELD_LABELS)),
      totalFields: Object.keys(FIELD_LABELS).length,
      materialsCount: form.referenceMaterials.length,
      requiredFilled: countFilled(form, REQUIRED_FIELDS),
      requiredTotal: REQUIRED_FIELDS.length
    };
  }

  function getAcceptanceChecklistSummary(form, locale = 'zh') {
    const labels = form.acceptanceChecks.map((value) => labelForOption(ACCEPTANCE_OPTIONS, value, locale));
    if (form.acceptanceCustom) {
      labels.push(form.acceptanceCustom);
    }
    return labels;
  }

  function shorten(text, maxLength = 72) {
    const value = String(text || '').replace(/\s+/g, ' ').trim();
    if (!value) return '';
    return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
  }

  function summarizeMaterialKinds(materials, locale = 'zh') {
    const labels = normalizeLocale(locale) === 'en'
      ? {
          note: 'Notes',
          link: 'Links',
          path: 'Local Paths',
          file: 'Files',
          image: 'Images'
        }
      : {
          note: '备注',
          link: '链接',
          path: '本地路径',
          file: '文件',
          image: '图片'
        };
    return uniq(materials.map((item) => labels[item.kind] || item.kind));
  }

  function formatMaterialSize(size) {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 102.4) / 10} KB`;
    return `${Math.round(size / (1024 * 102.4)) / 10} MB`;
  }

  function buildReferenceMaterialsSummary(materials, locale = 'zh') {
    if (!materials.length) {
      return normalizeLocale(locale) === 'en' ? 'No additional reference materials yet.' : '当前没有额外参考材料。';
    }

    return materials.map((material) => {
      const usageLabel = labelForOption(MATERIAL_USAGE_OPTIONS, material.usage, locale);
      const modeLabel = labelForOption(MATERIAL_PROMPT_MODE_OPTIONS, material.promptMode, locale);
      const parts = [
        material.name || material.value,
        labelForOption([
          { value: 'link', labelZh: '链接', labelEn: 'Link' },
          { value: 'path', labelZh: '本地路径', labelEn: 'Local path' },
          { value: 'file', labelZh: '文件', labelEn: 'File' },
          { value: 'image', labelZh: '图片', labelEn: 'Image' },
          { value: 'note', labelZh: '备注', labelEn: 'Note' }
        ], material.kind, locale),
        normalizeLocale(locale) === 'en' ? `Usage: ${usageLabel}` : `用途：${usageLabel}`,
        normalizeLocale(locale) === 'en' ? `Prompt mode: ${modeLabel}` : `进入 Prompt：${modeLabel}`
      ];
      if (material.value && material.value !== material.name) parts.push(material.value);
      if (material.note) parts.push(normalizeLocale(locale) === 'en' ? `Note: ${material.note}` : `备注：${material.note}`);
      if (material.size) parts.push(normalizeLocale(locale) === 'en' ? `Size: ${formatMaterialSize(material.size)}` : `大小：${formatMaterialSize(material.size)}`);
      return `- ${parts.join(' · ')}`;
    }).join('\n');
  }

  function buildScenarioSummary(formData, locale = 'zh') {
    const form = sanitizeFormData(formData);
    const summary = [];
    const triggerModeLabel = labelForOption(TRIGGER_MODES, form.triggerStrategy.mode, locale);
    const inputTypes = form.inputTypes.map((value) => labelForOption(INPUT_TYPE_OPTIONS, value, locale)).slice(0, 4);
    const outputTypes = form.outputTypes.map((value) => labelForOption(OUTPUT_TYPE_OPTIONS, value, locale)).slice(0, 4);

    if (normalizeLocale(locale) === 'en') {
      summary.push(`This Skill targets the repeated scenario "${form.scenarioName || 'current scenario'}".`);
      summary.push(`Use it when ${shorten(form.useWhen || 'the scenario appears')}, and the user usually says ${shorten(form.userSays || 'something similar to the scenario request')}.`);
      summary.push(`The final outcome is to ${shorten(form.scenarioGoal || 'produce a reusable deliverable for OpenClaw')}.`);
      summary.push(`It prefers ${triggerModeLabel.toLowerCase()} and works with inputs such as ${inputTypes.length ? inputTypes.join(', ') : 'not specified'} to produce ${outputTypes.length ? outputTypes.join(', ') : 'not specified'}.`);
    } else {
      summary.push(`这个 Skill 聚焦“${form.scenarioName || '当前场景'}”这一类重复流程。`);
      summary.push(`适用时机是：${shorten(form.useWhen || '相关任务出现时')}；用户通常会说：${shorten(form.userSays || '与当前场景相近的话术')}。`);
      summary.push(`最终目标是：${shorten(form.scenarioGoal || '生成一个可直接交付的 OpenClaw 结果')}。`);
      summary.push(`触发方式偏向“${triggerModeLabel}”，常见输入类型是${inputTypes.length ? inputTypes.join('、') : '未明确'}，输出类型是${outputTypes.length ? outputTypes.join('、') : '未明确'}。`);
    }

    return summary.slice(0, 4);
  }

  function buildSuggestedSkillNames(formData) {
    const form = sanitizeFormData(formData);
    const source = [form.scenarioName, form.useWhen, form.userSays, form.scenarioGoal].join(' ').toLowerCase();

    if (/(ppt|演示|幻灯片|deck|slides)/.test(source)) {
      return ['ppt_deck_builder', 'materials_to_presentation', 'presentation_story_structurer'];
    }
    if (/(prd|需求)/.test(source)) {
      return ['prd_draft_builder', 'requirements_to_prd', 'scope_structurer'];
    }
    if (/(会议|纪要|行动项|meeting)/.test(source)) {
      return ['meeting_action_extractor', 'notes_to_action_items', 'followup_structurer'];
    }
    if (/(竞品|对标|competitive)/.test(source)) {
      return ['competitive_analysis_writer', 'screenshots_to_report', 'competitor_report_structurer'];
    }
    if (/(周报|日报|汇报)/.test(source)) {
      return ['weekly_report_builder', 'worklog_to_report', 'status_update_structurer'];
    }
    if (/(faq|客服|回复)/.test(source)) {
      return ['faq_reply_builder', 'support_answer_structurer', 'policy_to_reply'];
    }

    const tokens = uniq(source.match(/[a-z][a-z0-9]+/g) || []).slice(0, 3);
    const lead = tokens[0] || 'scenario';
    const second = tokens[1] || 'workflow';
    const third = tokens[2] || 'output';
    return uniq([
      `${lead}_${second}_builder`,
      `${lead}_to_${third}`,
      `${second}_${third}_structurer`
    ]).slice(0, 3);
  }

  function buildApplicableScenarios(formData, locale = 'zh') {
    const form = sanitizeFormData(formData);
    const items = [];

    if (form.useWhen) {
      items.push(normalizeLocale(locale) === 'en'
        ? `When ${form.useWhen}`
        : `当${form.useWhen}`);
    }

    splitFreeText(form.userSays).slice(0, 4).forEach((item) => {
      items.push(normalizeLocale(locale) === 'en'
        ? `When the user says something like "${item}"`
        : `当用户会说“${item}”这类话术时`);
    });

    if (!items.length) {
      items.push(normalizeLocale(locale) === 'en'
        ? 'When the request maps to this exact repeated scenario.'
        : '当请求和这个具体重复场景高度一致时。');
    }

    return uniq(items);
  }

  function buildNonApplicableScenarios(formData, locale = 'zh') {
    const form = sanitizeFormData(formData);
    const items = [
      normalizeLocale(locale) === 'en'
        ? 'Do not use this as a general role-based assistant.'
        : '不要把它当成岗位级通用助手。',
      normalizeLocale(locale) === 'en'
        ? 'Do not use it when the request requires missing domain rules or external facts not provided by the user.'
        : '当用户没有提供必要规则或事实时，不要强行扩展执行。'
    ];

    if (form.constraintsMustNot.length) {
      form.constraintsMustNot.slice(0, 3).forEach((item) => {
        items.push(normalizeLocale(locale) === 'en' ? `Never use it to ${item}` : `不要用于：${item}`);
      });
    }

    if (!form.referenceMaterials.length) {
      items.push(normalizeLocale(locale) === 'en'
        ? 'If the task depends on external files or templates that are still missing, ask for them first.'
        : '如果任务依赖关键模板或材料但尚未提供，应该先索取材料。');
    }

    return uniq(items);
  }

  function buildTriggerStrategySummary(formData, locale = 'zh') {
    const form = sanitizeFormData(formData);
    const trigger = form.triggerStrategy;
    const lines = [
      normalizeLocale(locale) === 'en'
        ? `Trigger mode: ${labelForOption(TRIGGER_MODES, trigger.mode, locale)}`
        : `触发方式：${labelForOption(TRIGGER_MODES, trigger.mode, locale)}`,
      normalizeLocale(locale) === 'en'
        ? `Trigger description: ${trigger.description || form.useWhen || 'Not provided'}`
        : `触发说明：${trigger.description || form.useWhen || '未提供'}`,
      normalizeLocale(locale) === 'en'
        ? `Model invocation: ${trigger.allowModelInvocation ? 'Allowed' : 'Explicit invocation only'}`
        : `模型调用策略：${trigger.allowModelInvocation ? '允许模型自动调用' : '仅允许显式调用'}`
    ];

    if (trigger.mode === 'keyword') {
      lines.push(normalizeLocale(locale) === 'en'
        ? `Keywords: ${trigger.keywords.length ? trigger.keywords.join(', ') : 'Not provided'}`
        : `触发关键词：${trigger.keywords.length ? trigger.keywords.join('、') : '未提供'}`);
      lines.push(normalizeLocale(locale) === 'en'
        ? `Exclude keywords: ${trigger.excludeKeywords.length ? trigger.excludeKeywords.join(', ') : 'None'}`
        : `排除关键词：${trigger.excludeKeywords.length ? trigger.excludeKeywords.join('、') : '无'}`);
      lines.push(normalizeLocale(locale) === 'en'
        ? `Keyword rule: ${labelForOption(KEYWORD_RULES, trigger.keywordRule, locale)}`
        : `命中规则：${labelForOption(KEYWORD_RULES, trigger.keywordRule, locale)}`);
      lines.push(normalizeLocale(locale) === 'en'
        ? `Post action: ${labelForOption(POST_ACTIONS, trigger.postAction, locale)}`
        : `触发后动作：${labelForOption(POST_ACTIONS, trigger.postAction, locale)}`);
    }

    if (trigger.mode === 'slash' || trigger.mode === 'tool') {
      lines.push(normalizeLocale(locale) === 'en'
        ? `Command name: ${trigger.commandName || 'Not provided'}`
        : `命令名：${trigger.commandName || '未提供'}`);
      lines.push(normalizeLocale(locale) === 'en'
        ? `Command aliases: ${trigger.commandAliases.length ? trigger.commandAliases.join(', ') : 'None'}`
        : `命令别名：${trigger.commandAliases.length ? trigger.commandAliases.join('、') : '无'}`);
      lines.push(normalizeLocale(locale) === 'en'
        ? `Command description: ${trigger.commandDescription || 'Not provided'}`
        : `命令说明：${trigger.commandDescription || '未提供'}`);
    }

    return lines.join('\n');
  }

  function buildSupportingFilesHint(formData, locale = 'zh') {
    const form = sanitizeFormData(formData);
    const score = [
      form.references,
      form.referenceMaterials.some((item) => item.usage === 'template'),
      form.referenceMaterials.some((item) => item.usage === 'example'),
      form.branches.filter((item) => item.if && item.then).length >= 2,
      form.inputTypes.length >= 3,
      form.constraintsMust.length >= 2
    ].filter(Boolean).length;

    if (score >= 4) {
      return normalizeLocale(locale) === 'en'
        ? 'Strongly recommended: prepare supporting files such as templates, example outputs, field definitions, or glossaries so the Skill remains stable.'
        : '强烈建议准备 supporting files，例如固定模板、示例输出、字段说明或术语表，这样 Skill 会更稳定。';
    }

    if (score >= 2) {
      return normalizeLocale(locale) === 'en'
        ? 'Supporting files will likely help. If you already have reusable templates or examples, include them together with the Skill.'
        : '当前场景已经有 supporting files 的必要性。如果你手里有固定模板、案例或字段说明，建议一起补上。';
    }

    return normalizeLocale(locale) === 'en'
      ? 'A focused SKILL.md is enough for now. Supporting files can be added later once this flow becomes stable.'
      : '当前先生成聚焦的 SKILL.md 就够了，等流程稳定后再补 supporting files 也可以。';
  }

  function buildMissingInfo(formData, locale = 'zh') {
    const form = sanitizeFormData(formData);
    const missing = [];

    REQUIRED_FIELDS.forEach((field) => {
      const value = form[field];
      if ((Array.isArray(value) && !value.length) || (!Array.isArray(value) && !toString(value))) {
        missing.push(normalizeLocale(locale) === 'en' ? `Missing ${fieldLabel(field, locale)}` : `缺少${fieldLabel(field, locale)}`);
      }
    });

    if (!form.acceptanceChecks.length && !form.acceptanceCustom) {
      missing.push(normalizeLocale(locale) === 'en'
        ? 'Missing acceptance criteria, so it will be hard to judge the output quality later.'
        : '缺少验收标准，后续很难判断输出是否合格');
    }

    if (!form.steps.some((step) => toString(step))) {
      missing.push(normalizeLocale(locale) === 'en'
        ? 'Missing standard steps, so the execution path may be unstable.'
        : '缺少标准步骤，执行路径可能不稳定');
    }

    if (!form.branches.some((item) => item.if && item.then)) {
      missing.push(normalizeLocale(locale) === 'en'
        ? 'Missing exceptions / branches, so edge cases may be skipped.'
        : '缺少例外情况 / 分支，异常路径容易漏掉');
    }

    if (!form.references && !form.referenceMaterials.length) {
      missing.push(normalizeLocale(locale) === 'en'
        ? 'Missing templates or examples, so the output format may be less stable.'
        : '缺少参考模板 / 示例，Skill 格式稳定性会受影响');
    }

    if (!form.constraintsMust.length && !form.constraintsMustNot.length) {
      missing.push(normalizeLocale(locale) === 'en'
        ? 'Missing constraints, so OpenClaw may not know what must be avoided.'
        : '缺少约束和禁忌，OpenClaw 可能不知道哪些内容必须避免');
    }

    if (form.triggerStrategy.mode === 'keyword' && !form.triggerStrategy.keywords.length) {
      missing.push(normalizeLocale(locale) === 'en'
        ? 'Keyword trigger is enabled but the trigger keywords are still empty.'
        : '已选择关键词触发，但触发关键词还未填写');
    }

    if ((form.triggerStrategy.mode === 'slash' || form.triggerStrategy.mode === 'tool') && !form.triggerStrategy.commandName) {
      missing.push(normalizeLocale(locale) === 'en'
        ? 'Command trigger is enabled but the command name is still empty.'
        : '已选择命令触发，但命令名还未填写');
    }

    if (form.optionalBackground.length > 200) {
      missing.push(normalizeLocale(locale) === 'en'
        ? 'Additional background is too long. Keep it concise so the prompt stays focused.'
        : '补充背景过长，建议收敛到 200 字以内，让 Prompt 更聚焦');
    }

    return missing;
  }

  function buildValidation(formData, locale = 'zh') {
    const form = sanitizeFormData(formData);
    const fieldIssues = {};
    const topIssues = [];

    function pushIssue(field, message) {
      fieldIssues[field] ??= [];
      fieldIssues[field].push(message);
      topIssues.push(message);
    }

    if (!form.scenarioName) pushIssue('scenarioName', normalizeLocale(locale) === 'en' ? 'Give this Skill a clear scenario name.' : '请先给这个 Skill 一个明确的场景名称。');
    if (!form.useWhen) pushIssue('useWhen', normalizeLocale(locale) === 'en' ? 'Describe when this Skill should be used.' : '请说明什么时候会用到这个 Skill。');
    if (!form.userSays) pushIssue('userSays', normalizeLocale(locale) === 'en' ? 'Add a few user utterances so trigger matching is clearer.' : '请补充用户通常会怎么说，让触发更清楚。');
    if (!form.scenarioGoal) pushIssue('scenarioGoal', normalizeLocale(locale) === 'en' ? 'Describe the final expected outcome.' : '请说明最终想要的结果。');
    if (form.triggerStrategy.mode === 'keyword' && !form.triggerStrategy.keywords.length) pushIssue('triggerKeywords', normalizeLocale(locale) === 'en' ? 'Keyword mode needs trigger keywords.' : '关键词触发需要填写触发关键词。');
    if ((form.triggerStrategy.mode === 'slash' || form.triggerStrategy.mode === 'tool') && !form.triggerStrategy.commandName) pushIssue('commandName', normalizeLocale(locale) === 'en' ? 'Command trigger needs a command name.' : '命令触发需要填写命令名。');
    if (!form.inputTypes.length) pushIssue('inputTypes', normalizeLocale(locale) === 'en' ? 'Choose at least one input type.' : '请至少选择一种输入类型。');
    if (!form.inputDescription) pushIssue('inputDescription', normalizeLocale(locale) === 'en' ? 'Describe what the input usually contains.' : '请说明输入里通常会包含什么。');
    if (!form.outputTypes.length) pushIssue('outputTypes', normalizeLocale(locale) === 'en' ? 'Choose at least one output type.' : '请至少选择一种输出类型。');
    if (!form.outputDescription) pushIssue('outputDescription', normalizeLocale(locale) === 'en' ? 'Describe the expected output content.' : '请说明输出内容。');
    if (!form.steps.some((step) => toString(step))) pushIssue('steps', normalizeLocale(locale) === 'en' ? 'Add at least one standard step.' : '请至少补充一个标准步骤。');
    if (!form.acceptanceChecks.length && !form.acceptanceCustom) pushIssue('acceptanceChecks', normalizeLocale(locale) === 'en' ? 'Add acceptance checks so quality can be judged.' : '请补充验收标准，方便判断结果是否合格。');
    if (!form.constraintsMust.length && !form.constraintsMustNot.length) pushIssue('constraintsMust', normalizeLocale(locale) === 'en' ? 'Add at least one constraint or taboo.' : '请至少补充一个必须做到或绝对不要做。');
    if (form.optionalBackground && form.optionalBackground.length > 200) pushIssue('optionalBackground', normalizeLocale(locale) === 'en' ? 'Additional background is too long. Keep it within 200 characters.' : '补充背景建议控制在 200 字以内。');

    return {
      valid: !topIssues.length,
      topIssues,
      fieldIssues
    };
  }

  function buildSkillMarkdown(formData, locale = 'zh') {
    const form = sanitizeFormData(formData);
    const names = buildSuggestedSkillNames(form);
    const trigger = buildTriggerStrategySummary(form, locale);
    const acceptance = getAcceptanceChecklistSummary(form, locale);
    const applicable = buildApplicableScenarios(form, locale);
    const nonApplicable = buildNonApplicableScenarios(form, locale);
    const steps = form.steps.filter((step) => toString(step));
    const branches = form.branches.filter((item) => item.if || item.then);

    if (normalizeLocale(locale) === 'en') {
      return [
        '---',
        `name: ${names[0]}`,
        `description: ${form.scenarioName || 'OpenClaw scenario Skill'}`,
        '---',
        '',
        `# ${form.scenarioName || 'Scenario Skill'}`,
        '',
        '## Purpose',
        form.scenarioGoal || 'Not provided',
        '',
        '## Applicable scenarios',
        ...(applicable.map((item) => `- ${item}`)),
        '',
        '## Non-applicable scenarios',
        ...(nonApplicable.map((item) => `- ${item}`)),
        '',
        '## Trigger strategy',
        trigger,
        '',
        '## Input expectations',
        `Types: ${form.inputTypes.map((value) => labelForOption(INPUT_TYPE_OPTIONS, value, locale)).join(', ') || 'Not provided'}`,
        form.inputDescription || 'Not provided',
        '',
        '## Output expectations',
        `Types: ${form.outputTypes.map((value) => labelForOption(OUTPUT_TYPE_OPTIONS, value, locale)).join(', ') || 'Not provided'}`,
        `Output content: ${form.outputDescription || 'Not provided'}`,
        `Format requirements: ${form.outputFormat || 'Not provided'}`,
        '',
        '## Standard steps',
        ...(steps.length ? steps.map((step, index) => `${index + 1}. ${step}`) : ['1. Not provided']),
        '',
        '## Exceptions / branches',
        ...(branches.length ? branches.map((item) => `- If ${item.if || 'not provided'}, then ${item.then || 'not provided'}`) : ['- Not provided']),
        '',
        '## Acceptance checks',
        ...(acceptance.length ? acceptance.map((item) => `- ${item}`) : ['- Not provided']),
        '',
        '## Constraints',
        ...(form.constraintsMust.length ? form.constraintsMust.map((item) => `- Must: ${item}`) : ['- Must: Not provided']),
        ...(form.constraintsMustNot.length ? form.constraintsMustNot.map((item) => `- Never: ${item}`) : ['- Never: Not provided']),
        '',
        '## References',
        `Role: ${labelForOption(REFERENCE_ROLE_OPTIONS, form.referenceRole, locale)}`,
        form.references || 'Not provided',
        '',
        '## Background',
        form.optionalBackground || 'Not provided'
      ].join('\n');
    }

    return [
      '---',
      `name: ${names[0]}`,
      `description: ${form.scenarioName || 'OpenClaw 场景 Skill'}`,
      '---',
      '',
      `# ${form.scenarioName || '场景 Skill'}`,
      '',
      '## 目标',
      form.scenarioGoal || '未提供',
      '',
      '## 适用场景',
      ...(applicable.map((item) => `- ${item}`)),
      '',
      '## 不适用场景',
      ...(nonApplicable.map((item) => `- ${item}`)),
      '',
      '## 触发策略',
      trigger,
      '',
      '## 输入要求',
      `输入类型：${form.inputTypes.map((value) => labelForOption(INPUT_TYPE_OPTIONS, value, locale)).join('、') || '未提供'}`,
      form.inputDescription || '未提供',
      '',
      '## 输出要求',
      `输出类型：${form.outputTypes.map((value) => labelForOption(OUTPUT_TYPE_OPTIONS, value, locale)).join('、') || '未提供'}`,
      `输出内容：${form.outputDescription || '未提供'}`,
      `输出格式：${form.outputFormat || '未提供'}`,
      '',
      '## 标准步骤',
      ...(steps.length ? steps.map((step, index) => `${index + 1}. ${step}`) : ['1. 未提供']),
      '',
      '## 例外情况 / 分支',
      ...(branches.length ? branches.map((item) => `- 如果${item.if || '未提供'}，那么${item.then || '未提供'}`) : ['- 未提供']),
      '',
      '## 验收标准',
      ...(acceptance.length ? acceptance.map((item) => `- ${item}`) : ['- 未提供']),
      '',
      '## 约束和禁忌',
      ...(form.constraintsMust.length ? form.constraintsMust.map((item) => `- 必须做到：${item}`) : ['- 必须做到：未提供']),
      ...(form.constraintsMustNot.length ? form.constraintsMustNot.map((item) => `- 绝对不要做：${item}`) : ['- 绝对不要做：未提供']),
      '',
      '## 参考模板 / 示例',
      `参考角色：${labelForOption(REFERENCE_ROLE_OPTIONS, form.referenceRole, locale)}`,
      form.references || '未提供',
      '',
      '## 补充背景',
      form.optionalBackground || '未提供'
    ].join('\n');
  }

  function buildTestingMethod(formData, locale = 'zh') {
    const form = sanitizeFormData(formData);
    const acceptance = getAcceptanceChecklistSummary(form, locale);
    const lines = normalizeLocale(locale) === 'en'
      ? [
          '1. Prepare a sample input that matches the scenario description.',
          '2. Verify the trigger strategy aligns with the request phrasing.',
          '3. Check whether the output structure matches the expected output types and format.',
          '4. Validate the result using the acceptance checks below.',
          ...(acceptance.length ? acceptance.map((item, index) => `${index + 5}. ${item}`) : [])
        ]
      : [
          '1. 准备一份符合场景描述的真实样例输入。',
          '2. 检查触发策略是否能覆盖用户常见话术。',
          '3. 验证输出结构是否符合预期的输出类型和格式要求。',
          '4. 根据以下验收标准逐条检查结果。',
          ...(acceptance.length ? acceptance.map((item, index) => `${index + 5}. ${item}`) : [])
        ];
    return lines.join('\n');
  }

  function buildPromptPreviewBlocks(formData, locale = 'zh') {
    const form = sanitizeFormData(formData);
    const titles = PROMPT_BLOCK_TITLES[normalizeLocale(locale)];
    const summary = buildScenarioSummary(form, locale).join('\n');
    const names = buildSuggestedSkillNames(form).map((item, index) => `${index + 1}. ${item}`).join('\n');
    const applicable = buildApplicableScenarios(form, locale).map((item) => `- ${item}`).join('\n');
    const nonApplicable = buildNonApplicableScenarios(form, locale).map((item) => `- ${item}`).join('\n');
    const skillMd = buildSkillMarkdown(form, locale);
    const supporting = buildSupportingFilesHint(form, locale);
    const testing = buildTestingMethod(form, locale);
    const missing = buildMissingInfo(form, locale).length
      ? buildMissingInfo(form, locale).map((item) => `- ${item}`).join('\n')
      : normalizeLocale(locale) === 'en'
        ? 'The current information already covers the core requirements.'
        : '当前输入已经覆盖主要信息，可以直接进入 Skill 设计。';

    return [
      { id: 'summary', title: titles.summary, content: summary, editable: true },
      { id: 'names', title: titles.names, content: names, editable: true },
      { id: 'applicable', title: titles.applicable, content: applicable, editable: true },
      { id: 'notApplicable', title: titles.notApplicable, content: nonApplicable, editable: true },
      { id: 'skillMd', title: titles.skillMd, content: skillMd, editable: true },
      { id: 'supporting', title: titles.supporting, content: supporting, editable: true },
      { id: 'testing', title: titles.testing, content: testing, editable: true },
      { id: 'missing', title: titles.missing, content: missing, editable: true }
    ];
  }

  function combinePromptBlocks(blocks, locale = 'zh', options = {}) {
    const headings = normalizeLocale(locale) === 'en'
      ? ['# OpenClaw Skill Generation Request', '', 'Use the edited blocks below as the final request content.']
      : ['# OpenClaw Skill 生成请求', '', '请按以下经过编辑确认的区块作为最终请求内容。'];
    const referenceMaterials = normalizeMaterials(options.referenceMaterials);
    const body = (Array.isArray(blocks) ? blocks : [])
      .map((block) => `## ${block.title}\n${block.content || (normalizeLocale(locale) === 'en' ? 'Not provided' : '未提供')}`)
      .join('\n\n');
    const materialSection = referenceMaterials.length
      ? [
          normalizeLocale(locale) === 'en' ? '## Reference materials list' : '## 参考材料清单',
          buildReferenceMaterialsSummary(referenceMaterials, locale)
        ].join('\n')
      : '';

    return [
      ...headings,
      '',
      materialSection,
      materialSection ? '' : null,
      body
    ].filter((item) => item !== null).join('\n');
  }

  function buildOpenClawPrompt(formData, locale = 'zh') {
    const form = sanitizeFormData(formData);
    return combinePromptBlocks(buildPromptPreviewBlocks(form, locale), locale, {
      referenceMaterials: form.referenceMaterials
    });
  }

  function getPromptStats(prompt) {
    const content = String(prompt || '').trim();
    return {
      length: content.length,
      lines: content ? content.split(/\r?\n/).length : 0
    };
  }

  function getGeneratorReadiness(formData, locale = 'zh') {
    const form = sanitizeFormData(formData);
    const validation = buildValidation(form, locale);
    const progress = getGeneratorProgress(form);

    if (!countFilled(form, Object.keys(FIELD_LABELS))) {
      return {
        tone: 'neutral',
        label: normalizeLocale(locale) === 'en' ? 'Not started' : '尚未开始',
        canSend: false,
        ...progress,
        message: normalizeLocale(locale) === 'en'
          ? 'Start from step 1. Fill the scenario and trigger information first.'
          : '可以先从步骤一开始，先把场景和触发方式写清楚。'
      };
    }

    if (!validation.topIssues.length) {
      return {
        tone: 'good',
        label: normalizeLocale(locale) === 'en' ? 'Ready to generate' : '已准备好生成',
        canSend: true,
        ...progress,
        message: normalizeLocale(locale) === 'en'
          ? 'The current information is complete enough. You can generate, edit blocks, copy, and send.'
          : '当前信息已经足够完整，可以生成、编辑区块、复制并发送。'
      };
    }

    if (progress.requiredFilled >= Math.max(3, Math.floor(progress.requiredTotal / 2))) {
      return {
        tone: 'warn',
        label: normalizeLocale(locale) === 'en' ? 'MVP ready' : '可生成 MVP 版',
        canSend: true,
        ...progress,
        message: normalizeLocale(locale) === 'en'
          ? 'An MVP prompt can already be generated. Filling the missing fields will make the result more stable.'
          : '当前已经能生成 MVP 版 Prompt，补齐缺失项后结果会更稳。'
      };
    }

    return {
      tone: 'danger',
      label: normalizeLocale(locale) === 'en' ? 'Incomplete' : '信息还不完整',
      canSend: false,
      ...progress,
      message: normalizeLocale(locale) === 'en'
        ? `The current form is still missing: ${validation.topIssues.slice(0, 3).join('; ')}`
        : `当前还缺少关键信息：${validation.topIssues.slice(0, 3).join('；')}`
    };
  }

  return {
    ACCEPTANCE_OPTIONS,
    FIELD_LABELS,
    GROUPS,
    INPUT_TYPE_OPTIONS,
    KEYWORD_RULES,
    MATERIAL_PROMPT_MODE_OPTIONS,
    MATERIAL_USAGE_OPTIONS,
    OUTPUT_TYPE_OPTIONS,
    POST_ACTIONS,
    PROMPT_BLOCK_TITLES,
    QUALITY_FIELDS,
    REFERENCE_ROLE_OPTIONS,
    REQUIRED_FIELDS,
    TEMPLATE_PRESETS,
    TRIGGER_MODES,
    blankForm,
    buildApplicableScenarios,
    buildMissingInfo,
    buildOpenClawPrompt,
    buildPromptPreviewBlocks,
    buildReferenceMaterialsSummary,
    buildScenarioSummary,
    buildSkillGeneratorSummary: buildScenarioSummary,
    buildSkillMarkdown,
    buildSuggestedSkillNames,
    buildSupportingFilesHint,
    buildTestingMethod,
    buildTriggerStrategySummary,
    buildValidation,
    cloneForm,
    combinePromptBlocks,
    createTemplateForm,
    fieldLabel,
    getGeneratorProgress,
    getGeneratorReadiness,
    getPromptStats,
    getTemplatePreset,
    labelForOption,
    normalizeMaterials,
    sanitizeFormData
  };
}));
