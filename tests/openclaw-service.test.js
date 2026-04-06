const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  buildSkillHealth,
  collectSkillUsageStats,
  createOpenClawService,
  extractJsonPayload,
  inferBundledSkillsDir,
  readCronJobsState,
  resolveOpenClawExecutable
} = require('../src/lib/openclaw-service');

test('extractJsonPayload skips warning lines before JSON', () => {
  const payload = extractJsonPayload('[skills] Skipping invalid skill\n{"skills":[{"name":"demo"}]}');
  assert.deepEqual(payload, {
    skills: [
      { name: 'demo' }
    ]
  });
});

test('resolveOpenClawExecutable prefers Windows npm global install', () => {
  const executable = resolveOpenClawExecutable({
    platform: 'win32',
    home: 'C:\\Users\\demo',
    env: {
      APPDATA: 'C:\\Users\\demo\\AppData\\Roaming'
    },
    existsSync(filePath) {
      return filePath === path.join('C:\\Users\\demo\\AppData\\Roaming', 'npm', 'openclaw.cmd');
    }
  });

  assert.equal(executable, path.join('C:\\Users\\demo\\AppData\\Roaming', 'npm', 'openclaw.cmd'));
});

test('inferBundledSkillsDir finds Windows bundled skills directory', () => {
  const skillsDir = inferBundledSkillsDir('openclaw.cmd', {
    platform: 'win32',
    home: 'C:\\Users\\demo',
    env: {
      APPDATA: 'C:\\Users\\demo\\AppData\\Roaming'
    },
    existsSync(filePath) {
      return filePath === path.join('C:\\Users\\demo\\AppData\\Roaming', 'npm', 'node_modules', 'openclaw', 'skills');
    }
  });

  assert.equal(skillsDir, path.join('C:\\Users\\demo\\AppData\\Roaming', 'npm', 'node_modules', 'openclaw', 'skills'));
});

test('updateSkillConfig writes skills.entries to config json', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'openclaw-client-test-'));
  const configPath = path.join(tempRoot, 'openclaw.json');
  fs.writeFileSync(configPath, JSON.stringify({}, null, 2));

  const service = createOpenClawService({
    home: tempRoot,
    stateDir: tempRoot,
    configPath,
    managedSkillsDir: path.join(tempRoot, 'skills'),
    bundledSkillsDir: path.join(tempRoot, 'bundled'),
    cacheMs: 0,
    runOpenClaw(args) {
      if (args[0] === 'skills' && args[1] === 'list') {
        return Promise.resolve(JSON.stringify({
          skills: [
            {
              name: 'voice-call',
              skillKey: 'voice-call',
              description: 'demo',
              source: 'personal',
              eligible: true,
              bundled: false,
              primaryEnv: 'OPENCLAW_API_KEY',
              missing: {
                bins: [],
                env: [],
                config: [],
                os: []
              }
            }
          ]
        }));
      }

      if (args[0] === 'skills' && args[1] === 'info') {
        return Promise.resolve(JSON.stringify({
          name: 'voice-call',
          skillKey: 'voice-call',
          source: 'personal',
          bundled: false,
          primaryEnv: 'OPENCLAW_API_KEY',
          requirements: {
            bins: [],
            env: [],
            config: [],
            os: []
          },
          missing: {
            bins: [],
            env: [],
            config: [],
            os: []
          },
          install: [],
          configChecks: []
        }));
      }

      throw new Error(`Unexpected command: ${args.join(' ')}`);
    }
  });

  await service.updateSkillConfig('voice-call', {
    enabled: true,
    apiKey: 'demo-key',
    env: {
      OPENCLAW_REGION: 'cn'
    },
    config: {
      timeout: '120'
    }
  });

  const saved = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assert.deepEqual(saved.skills.entries['voice-call'], {
    enabled: true,
    apiKey: 'demo-key',
    env: {
      OPENCLAW_REGION: 'cn'
    },
    config: {
      timeout: '120'
    }
  });
});

test('skill file APIs expose file structure, config hints and writable text content', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'openclaw-file-api-test-'));
  const configPath = path.join(tempRoot, 'openclaw.json');
  const managedSkillsDir = path.join(tempRoot, 'skills');
  const skillDir = path.join(managedSkillsDir, 'voice-call');
  const templatePath = path.join(skillDir, 'assets', 'template.md');

  fs.mkdirSync(path.join(skillDir, 'assets'), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify({}, null, 2));
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), [
    '---',
    'name: voice-call',
    'description: Voice call demo skill',
    '---',
    '',
    '# 适用场景',
    '',
    '用于拨打和记录语音电话。'
  ].join('\n'));
  fs.writeFileSync(path.join(skillDir, 'metadata.openclaw'), JSON.stringify({
    requires: {
      env: ['OPENCLAW_API_KEY']
    },
    install: ['npm install']
  }, null, 2));
  fs.writeFileSync(templatePath, '# Template\n\n- Title\n');

  const service = createOpenClawService({
    home: tempRoot,
    stateDir: tempRoot,
    configPath,
    managedSkillsDir,
    bundledSkillsDir: path.join(tempRoot, 'bundled'),
    cacheMs: 0,
    runOpenClaw(args) {
      if (args[0] === 'skills' && args[1] === 'list') {
        return Promise.resolve(JSON.stringify({
          skills: [
            {
              name: 'voice-call',
              skillKey: 'voice-call',
              description: 'voice demo',
              source: 'personal',
              eligible: true,
              bundled: false,
              primaryEnv: 'OPENCLAW_API_KEY',
              missing: {
                bins: [],
                env: [],
                config: [],
                os: []
              }
            }
          ]
        }));
      }

      if (args[0] === 'skills' && args[1] === 'info') {
        return Promise.resolve(JSON.stringify({
          name: 'voice-call',
          skillKey: 'voice-call',
          source: 'personal',
          bundled: false,
          filePath: path.join(skillDir, 'SKILL.md'),
          baseDir: skillDir,
          primaryEnv: 'OPENCLAW_API_KEY',
          requirements: {
            bins: [],
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
          configChecks: ['template']
        }));
      }

      throw new Error(`Unexpected command: ${args.join(' ')}`);
    }
  });

  const detail = await service.getSkillDetail('voice-call', true);
  const skillEntry = detail.fileEntries.find((entry) => entry.path === 'SKILL.md');
  const metadataEntry = detail.fileEntries.find((entry) => entry.path === 'metadata.openclaw');

  assert.ok(skillEntry);
  assert.match(skillEntry.purpose, /Skill 主说明文件/);
  assert.match(skillEntry.configHints[0], /frontmatter 字段/);
  assert.ok(metadataEntry);
  assert.equal(metadataEntry.editable, true);
  assert.match(metadataEntry.configHints[0], /顶层配置|可见配置项/);

  const skillFile = await service.getSkillFile('voice-call', 'SKILL.md');
  assert.equal(skillFile.editable, true);
  assert.match(skillFile.content, /Voice call demo skill/);
  assert.match(skillFile.configHints[0], /frontmatter 字段/);

  const dirEntry = await service.getSkillFile('voice-call', 'assets/');
  assert.equal(dirEntry.isDirectory, true);
  assert.equal(dirEntry.editable, false);
  assert.match(dirEntry.configHints[0], /assets\/template\.md/);

  const updated = await service.updateSkillFile('voice-call', 'assets/template.md', '# Template\n\n- Updated\n');
  assert.equal(updated.editable, true);
  assert.match(updated.content, /Updated/);
  assert.match(fs.readFileSync(templatePath, 'utf8'), /Updated/);
});

test('buildSkillHealth surfaces config and file risks with repair actions', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'openclaw-health-test-'));
  const skillDir = path.join(tempRoot, 'skills', 'demo-skill');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), [
    '---',
    'name: ',
    'description: ',
    '---',
    '',
    '# Demo'
  ].join('\n'));

  const health = buildSkillHealth({
    skillMdPath: path.join(skillDir, 'SKILL.md'),
    fileEntries: [
      { path: 'SKILL.md' },
      { path: 'metadata.openclaw' }
    ],
    primaryEnv: 'OPENCLAW_API_KEY',
    configEntry: {
      exists: true,
      enabled: true,
      apiKey: '',
      env: { OPENCLAW_REGION: 'cn' },
      config: { template: 'demo' }
    },
    missing: {
      bins: ['node'],
      env: ['OPENCLAW_API_KEY'],
      config: ['templatePath'],
      os: []
    },
    automation: {
      available: true,
      boundCount: 1,
      jobs: [
        {
          id: 'cron-1',
          name: '每日巡检',
          lastRunStatus: 'failed'
        }
      ]
    }
  }, { home: tempRoot });

  assert.equal(health.level, 'error');
  assert.equal(health.status, 'fileError');
  assert.match(health.label, /文件异常/);
  assert.deepEqual(health.risks.some((risk) => risk.code === 'configMissing'), true);
  assert.deepEqual(health.risks.some((risk) => risk.code === 'incomplete'), true);
  assert.deepEqual(health.risks.some((risk) => risk.code === 'cronAbnormal'), true);
  assert.match(health.risks.find((risk) => risk.code === 'configMissing')?.actionLabel || '', /配置面板/);
});

test('collectSkillUsageStats and readCronJobsState enrich skills with usage and automation data', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'openclaw-usage-test-'));
  const stateDir = tempRoot;
  const configPath = path.join(tempRoot, 'openclaw.json');
  const managedSkillsDir = path.join(tempRoot, 'skills');
  const agentsDir = path.join(tempRoot, 'agents');
  const cronDir = path.join(tempRoot, 'cron');
  const now = Date.parse('2026-04-05T00:00:00.000Z');

  fs.mkdirSync(path.join(managedSkillsDir, 'voice-call'), { recursive: true });
  fs.writeFileSync(path.join(managedSkillsDir, 'voice-call', 'SKILL.md'), [
    '---',
    'name: voice-call',
    'description: Voice call demo skill',
    '---',
    '',
    '# Voice Call'
  ].join('\n'));
  fs.mkdirSync(path.join(agentsDir, 'main', 'sessions'), { recursive: true });
  fs.mkdirSync(path.join(cronDir, 'runs'), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify({}, null, 2));

  const sessionFile = path.join(agentsDir, 'main', 'sessions', 'demo.jsonl');
  fs.writeFileSync(sessionFile, [
    JSON.stringify({
      timestamp: '2026-04-04T12:00:00.000Z',
      message: {
        content: [
          {
            type: 'toolCall',
            name: 'read',
            arguments: {
              path: path.join(managedSkillsDir, 'voice-call', 'SKILL.md')
            }
          }
        ]
      }
    }),
    JSON.stringify({
      timestamp: '2026-03-20T12:00:00.000Z',
      message: {
        content: [
          {
            type: 'toolCall',
            name: 'read',
            arguments: {
              path: path.join(managedSkillsDir, 'voice-call', 'SKILL.md')
            }
          }
        ]
      }
    })
  ].join('\n'));

  fs.writeFileSync(path.join(cronDir, 'jobs.json'), JSON.stringify({
    jobs: [
      {
        id: 'cron-1',
        name: 'voice-call 每日巡检',
        description: '定时调用 voice-call skill',
        enabled: true,
        schedule: {
          kind: 'cron',
          expr: '0 9 * * *',
          tz: 'Asia/Shanghai'
        },
        payload: {
          message: '请运行 voice-call 并检查状态'
        }
      }
    ]
  }, null, 2));

  fs.writeFileSync(path.join(cronDir, 'runs', 'cron-1.jsonl'), `${JSON.stringify({
    ts: '2026-04-04T09:00:00.000Z',
    status: 'ok'
  })}\n`);

  const usage = collectSkillUsageStats(agentsDir, {
    now,
    validSkillRoots: [managedSkillsDir]
  });
  assert.equal(usage.available, true);
  assert.equal(usage.bySkill.get('voice-call').count7d, 1);
  assert.equal(usage.bySkill.get('voice-call').count30d, 2);

  const cronState = readCronJobsState(stateDir);
  assert.equal(cronState.available, true);
  assert.equal(cronState.jobs.length, 1);
  assert.equal(cronState.jobs[0].lastRunStatus, 'ok');

  const service = createOpenClawService({
    home: tempRoot,
    stateDir,
    configPath,
    agentsDir,
    managedSkillsDir,
    bundledSkillsDir: path.join(tempRoot, 'bundled'),
    cacheMs: 0,
    runOpenClaw(args) {
      if (args[0] === 'skills' && args[1] === 'list') {
        return Promise.resolve(JSON.stringify({
          skills: [
            {
              name: 'voice-call',
              skillKey: 'voice-call',
              description: 'voice demo',
              source: 'personal',
              eligible: true,
              bundled: false,
              missing: {
                bins: [],
                env: [],
                config: [],
                os: []
              }
            }
          ]
        }));
      }

      if (args[0] === 'skills' && args[1] === 'info') {
        return Promise.resolve(JSON.stringify({
          name: 'voice-call',
          skillKey: 'voice-call',
          source: 'personal',
          bundled: false,
          requirements: {
            bins: [],
            env: [],
            config: [],
            os: []
          },
          missing: {
            bins: [],
            env: [],
            config: [],
            os: []
          },
          install: [],
          configChecks: []
        }));
      }

      throw new Error(`Unexpected command: ${args.join(' ')}`);
    }
  });

  const dashboard = await service.getDashboardPayload(true);
  const summary = dashboard.skills[0];
  assert.equal(summary.usage.count7d, 1);
  assert.equal(summary.usage.totalCount, 2);
  assert.equal(summary.automation.boundCount, 1);
  assert.equal(summary.automation.jobs[0].name, 'voice-call 每日巡检');

  const detail = await service.getSkillDetail('voice-call', true);
  assert.equal(detail.usage.count30d, 2);
  assert.equal(detail.automation.jobs[0].scheduleLabel, 'cron 0 9 * * * @ Asia/Shanghai');
});

test('collectSkillUsageStats ignores invalid SKILL.md files and files outside known roots', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'openclaw-usage-guard-'));
  const agentsDir = path.join(tempRoot, 'agents');
  const validSkillsDir = path.join(tempRoot, 'skills');
  const extraDocsDir = path.join(tempRoot, 'docs');
  const now = Date.parse('2026-04-05T00:00:00.000Z');

  fs.mkdirSync(path.join(agentsDir, 'main', 'sessions'), { recursive: true });
  fs.mkdirSync(path.join(validSkillsDir, 'voice-call'), { recursive: true });
  fs.mkdirSync(path.join(validSkillsDir, 'missing-frontmatter'), { recursive: true });
  fs.mkdirSync(path.join(validSkillsDir, 'missing-description'), { recursive: true });
  fs.mkdirSync(path.join(extraDocsDir, 'notes'), { recursive: true });

  fs.writeFileSync(path.join(validSkillsDir, 'voice-call', 'SKILL.md'), [
    '---',
    'name: voice-call',
    'description: Valid voice skill',
    '---',
    '',
    '# Voice Call'
  ].join('\n'));
  fs.writeFileSync(path.join(validSkillsDir, 'missing-frontmatter', 'SKILL.md'), '# Just a markdown note\n');
  fs.writeFileSync(path.join(validSkillsDir, 'missing-description', 'SKILL.md'), [
    '---',
    'name: broken-skill',
    '---',
    '',
    '# Broken'
  ].join('\n'));
  fs.writeFileSync(path.join(extraDocsDir, 'notes', 'SKILL.md'), [
    '---',
    'name: outside-root',
    'description: This file should not be counted',
    '---',
    '',
    '# Outside'
  ].join('\n'));

  const sessionFile = path.join(agentsDir, 'main', 'sessions', 'guard.jsonl');
  fs.writeFileSync(sessionFile, [
    JSON.stringify({
      timestamp: '2026-04-04T12:00:00.000Z',
      message: {
        content: [
          {
            type: 'toolCall',
            name: 'read',
            arguments: {
              path: path.join(validSkillsDir, 'voice-call', 'SKILL.md')
            }
          }
        ]
      }
    }),
    JSON.stringify({
      timestamp: '2026-04-04T12:10:00.000Z',
      message: {
        content: [
          {
            type: 'toolCall',
            name: 'read',
            arguments: {
              path: path.join(validSkillsDir, 'missing-frontmatter', 'SKILL.md')
            }
          },
          {
            type: 'toolCall',
            name: 'open',
            arguments: {
              path: path.join(validSkillsDir, 'missing-description', 'SKILL.md')
            }
          },
          {
            type: 'toolCall',
            name: 'read',
            arguments: {
              path: path.join(extraDocsDir, 'notes', 'SKILL.md')
            }
          }
        ]
      }
    })
  ].join('\n'));

  const usage = collectSkillUsageStats(agentsDir, {
    now,
    validSkillRoots: [validSkillsDir]
  });

  assert.equal(usage.available, true);
  assert.equal(usage.bySkill.size, 1);
  assert.equal(usage.bySkill.get('voice-call').totalCount, 1);
  assert.equal(usage.bySkill.has('broken-skill'), false);
  assert.equal(usage.bySkill.has('outside-root'), false);
});

test('service matches skill directories by frontmatter name instead of forcing folder name equality', async () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'openclaw-frontmatter-name-'));
  const stateDir = tempRoot;
  const configPath = path.join(tempRoot, 'openclaw.json');
  const managedSkillsDir = path.join(tempRoot, 'skills');
  const agentsDir = path.join(tempRoot, 'agents');

  fs.mkdirSync(path.join(managedSkillsDir, 'voice-call'), { recursive: true });
  fs.mkdirSync(path.join(agentsDir, 'main', 'sessions'), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify({}, null, 2));
  fs.writeFileSync(path.join(managedSkillsDir, 'voice-call', 'SKILL.md'), [
    '---',
    'name: voice_call',
    'description: Voice call skill with snake_case name',
    '---',
    '',
    '# Voice Call'
  ].join('\n'));
  fs.writeFileSync(path.join(agentsDir, 'main', 'sessions', 'frontmatter.jsonl'), `${JSON.stringify({
    timestamp: '2026-04-04T12:00:00.000Z',
    message: {
      content: [
        {
          type: 'toolCall',
          name: 'read',
          arguments: {
            path: path.join(managedSkillsDir, 'voice-call', 'SKILL.md')
          }
        }
      ]
    }
  })}\n`);

  const service = createOpenClawService({
    home: tempRoot,
    stateDir,
    configPath,
    agentsDir,
    managedSkillsDir,
    bundledSkillsDir: path.join(tempRoot, 'bundled'),
    cacheMs: 0,
    runOpenClaw(args) {
      if (args[0] === 'skills' && args[1] === 'list') {
        return Promise.resolve(JSON.stringify({
          skills: [
            {
              name: 'voice_call',
              skillKey: 'voice_call',
              description: 'voice demo',
              source: 'personal',
              eligible: true,
              bundled: false,
              missing: {
                bins: [],
                env: [],
                config: [],
                os: []
              }
            }
          ]
        }));
      }

      if (args[0] === 'skills' && args[1] === 'info') {
        return Promise.resolve(JSON.stringify({
          name: 'voice_call',
          skillKey: 'voice_call',
          source: 'personal',
          bundled: false,
          filePath: path.join(managedSkillsDir, 'voice-call', 'SKILL.md'),
          requirements: {
            bins: [],
            env: [],
            config: [],
            os: []
          },
          missing: {
            bins: [],
            env: [],
            config: [],
            os: []
          },
          install: [],
          configChecks: []
        }));
      }

      throw new Error(`Unexpected command: ${args.join(' ')}`);
    }
  });

  const dashboard = await service.getDashboardPayload(true);
  assert.equal(dashboard.skills[0].usage.totalCount, 1);
  assert.match(dashboard.skills[0].skillMdPath, /voice-call[\\/]SKILL\.md$/);
});
