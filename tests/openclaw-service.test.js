const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  createOpenClawService,
  extractJsonPayload,
  inferBundledSkillsDir,
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
