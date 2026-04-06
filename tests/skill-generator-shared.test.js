const test = require('node:test');
const assert = require('node:assert/strict');

const generator = require('../public/skill-generator-shared.js');

function createExampleForm() {
  return generator.createTemplateForm('prd');
}

test('buildScenarioSummary returns 2 to 4 summary lines for the structured generator flow', () => {
  const summary = generator.buildScenarioSummary(createExampleForm());

  assert.equal(Array.isArray(summary), true);
  assert.equal(summary.length >= 2 && summary.length <= 4, true);
  assert.match(summary[0], /PRD 需求文档生成/);
  assert.match(summary[3], /关键词触发|触发方式偏向/);
});

test('buildSuggestedSkillNames returns three stable scenario-oriented candidates for PRD template', () => {
  const names = generator.buildSuggestedSkillNames(createExampleForm());

  assert.deepEqual(names, [
    'prd_draft_builder',
    'requirements_to_prd',
    'scope_structurer'
  ]);
});

test('buildMissingInfo reports required and quality gaps without inventing content', () => {
  const missing = generator.buildMissingInfo({
    scenarioName: '会议纪要转行动项',
    useWhen: '',
    userSays: '',
    scenarioGoal: '',
    inputDescription: '',
    outputDescription: '',
    acceptanceChecks: [],
    steps: [''],
    branches: [{ if: '', then: '' }],
    references: '',
    constraintsMust: [],
    constraintsMustNot: []
  });

  assert.deepEqual(missing.includes('缺少什么时候会用到这个 Skill'), true);
  assert.deepEqual(missing.includes('缺少用户通常会怎么说'), true);
  assert.deepEqual(missing.includes('缺少最终想要的结果'), true);
  assert.deepEqual(missing.includes('缺少参考模板 / 示例，Skill 格式稳定性会受影响'), true);
  assert.deepEqual(missing.includes('缺少约束和禁忌，OpenClaw 可能不知道哪些内容必须避免'), true);
});

test('buildMissingInfo accepts reference materials as template context', () => {
  const missing = generator.buildMissingInfo({
    scenarioName: '会议纪要转行动项',
    useWhen: '当我拿到妙记和会议纪要时使用',
    userSays: '帮我整理会议纪要',
    scenarioGoal: '输出行动项',
    inputDescription: '会议纪要',
    outputDescription: '行动项清单',
    acceptanceChecks: ['complete'],
    steps: ['先提炼任务'],
    branches: [{ if: '输入不完整', then: '先指出缺失信息' }],
    references: '',
    constraintsMust: ['保留重点'],
    referenceMaterials: [
      {
        kind: 'file',
        name: 'action-template.xlsx',
        value: 'action-template.xlsx',
        usage: 'template',
        promptMode: 'style'
      }
    ]
  });

  assert.deepEqual(missing.includes('缺少参考模板 / 示例，Skill 格式稳定性会受影响'), false);
});

test('buildSupportingFilesHint recommends supporting files for structured templates', () => {
  const hint = generator.buildSupportingFilesHint(createExampleForm());

  assert.match(hint, /supporting files/);
  assert.match(hint, /模板|示例输出|字段说明|术语表/);
});

test('buildPromptPreviewBlocks returns eight editable blocks in PRD order', () => {
  const blocks = generator.buildPromptPreviewBlocks(createExampleForm());

  assert.equal(blocks.length, 8);
  assert.deepEqual(blocks.map((block) => block.id), [
    'summary',
    'names',
    'applicable',
    'notApplicable',
    'skillMd',
    'supporting',
    'testing',
    'missing'
  ]);
  assert.ok(blocks.every((block) => block.editable));
});

test('buildOpenClawPrompt combines blocks without splitting characters and respects provided facts', () => {
  const prompt = generator.buildOpenClawPrompt(createExampleForm());

  assert.match(prompt, /## 场景定位总结/);
  assert.match(prompt, /PRD 需求文档生成/);
  assert.match(prompt, /## SKILL\.md/);
  assert.match(prompt, /## supporting files 建议/);
  assert.match(prompt, /## 测试方法/);
  assert.match(prompt, /## 待补充信息/);
  assert.doesNotMatch(prompt, /#\n#\n \n场/);
  assert.doesNotMatch(prompt, /单\n个\n字\n符/);
});

test('getGeneratorReadiness returns progress and send state for a ready template', () => {
  const form = createExampleForm();
  const readiness = generator.getGeneratorReadiness(form);
  const progress = generator.getGeneratorProgress(form);

  assert.equal(readiness.canSend, true);
  assert.match(readiness.label, /已准备好生成/);
  assert.equal(progress.sections.length, 3);
  assert.equal(progress.requiredFilled, progress.requiredTotal);
});

test('getPromptStats returns length and line count', () => {
  const stats = generator.getPromptStats('第一行\n第二行');
  assert.deepEqual(stats, {
    length: 7,
    lines: 2
  });
});
