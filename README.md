# ClawForge

[![Release](https://img.shields.io/github/v/release/kelin3296-jpg/openclaw-skill-visual-config-client)](https://github.com/kelin3296-jpg/openclaw-skill-visual-config-client/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/kelin3296-jpg/openclaw-skill-visual-config-client/ci.yml?branch=main)](https://github.com/kelin3296-jpg/openclaw-skill-visual-config-client/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/kelin3296-jpg/openclaw-skill-visual-config-client)](LICENSE)

ClawForge is an open-source desktop and browser workspace focused on generating OpenClaw Skills from structured scenarios and real local context.

中文说明：ClawForge 是一个围绕本地 OpenClaw Skill Generator 场景打造的开源工作台，重点是把重复任务整理成可发送、可复用、可迭代的 Skill Prompt。

![ClawForge cover](docs/media/repo-cover.png)

## Why ClawForge

OpenClaw Skill drafting usually needs a clear scenario, stable output structure, and enough local context to avoid prompt drift. ClawForge keeps the early-stage workflow intentionally lightweight so you can:

- generate new Skill prompts from structured scenarios
- iterate on prompt blocks before sending
- keep reference materials and local context in one place
- send prompts to OpenClaw Control in one step
- reuse real local Skill data as support context when needed

## Highlights

- Generator-first workspace: one primary workflow centered on Skill generation
- Structured three-step flow: define the scenario, shape the output, then tighten constraints
- Block-based prompt preview: review, edit, restore, and copy the final prompt safely
- Reference material support: add local paths, files, images, notes, and links
- OpenClaw send flow: open the real Google Chrome browser and auto-send compatible prompt payloads
- Dual runtime: Electron desktop client plus browser mode for UI iteration
- Cross-platform support: works with macOS and Windows path conventions

## Main Areas

### Skill Generator Workspace

- three-step guided form
- live readiness and missing-info feedback
- right-rail prompt signal and block summary
- reference material management
- preview modal for final prompt
- one-click send to OpenClaw

### Prompt Preview

- editable block-by-block preview
- copy or restore any section before sending
- fast validation of final prompt structure

### Local Skill Context

- read real local OpenClaw data as supporting context
- keep heavier library/workbench capability in the background
- avoid turning the first release into a complex all-in-one admin console

## Screenshots

### Skill Generator

![Skill Generator](docs/media/readme-generator.png)

### Prompt Preview

![Prompt Preview](docs/media/readme-prompt-preview.png)

## Quick Start

### Desktop client

```bash
npm install
npm start
```

### Browser mode

```bash
npm install
npm run dev:web
```

Then open:

```text
http://127.0.0.1:4318
```

## Requirements

- Node.js 20+
- A local OpenClaw environment
- Google Chrome installed if you want the automated browser send flow

## Project Structure

```text
public/
  index.html                    UI layout and styles
  app.js                        generator-first client state and interactions
  skill-generator-shared.js     shared generator logic
src/
  main.js                       Electron entry
  preload.js                    desktop bridge
  server.js                     local API server
  lib/
    openclaw-service.js         local OpenClaw data + config logic
    openclaw-control.js         OpenClaw Control browser automation
tests/
  *.test.js                     service, generator UI, and control coverage
```

## Scripts

```bash
npm start      # Electron desktop client
npm run dev    # Electron desktop client
npm run dev:web
npm test
npm run smoke
npm run dist
```

## Platform Notes

### Windows

The project already handles these default Windows paths:

- OpenClaw config: `%USERPROFILE%\\.openclaw\\openclaw.json`
- OpenClaw CLI: `%APPDATA%\\npm\\openclaw.cmd`
- Bundled Skills: `%APPDATA%\\npm\\node_modules\\openclaw\\skills`

If your setup differs, you can override with:

```bash
OPENCLAW_BIN=C:\path\to\openclaw.cmd
OPENCLAW_CONFIG_PATH=C:\path\to\openclaw.json
OPENCLAW_STATE_DIR=C:\path\to\.openclaw
```

### macOS

- supports local OpenClaw config discovery
- supports Chrome-based OpenClaw Control automation
- supports Electron desktop packaging

## Validation

Run before publishing or opening a PR:

```bash
npm test
npm run smoke
```

## Roadmap

- keep the generator workflow focused and lightweight
- better attachment coverage for more material types
- stronger block editing and prompt review ergonomics
- optional screenshots and demo walkthroughs in the repo homepage

## Documentation

- [Deployment guide](docs/DEPLOY.md)
- [Contributing guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## License

MIT. See [LICENSE](LICENSE).
