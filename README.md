# ClawForge

ClawForge is an open-source desktop and browser-based workspace for OpenClaw Skill browsing, configuration, and prompt generation.

中文说明：这是一个面向本地 OpenClaw 环境的可视化配置项目，支持浏览真实 Skill、查看结构文件、手动修改配置，以及生成并发送 Skill Prompt。

## What It Does

- Read real local OpenClaw Skill data instead of rendering mock content
- Browse Skills by source, status, and search keywords
- Drill into a Skill workbench to inspect files, config hints, and editable content
- Enable or disable Skills from the library UI
- Generate structured Skill prompts from a multi-step scenario form
- Send prompts to OpenClaw Control and attach compatible reference files
- Run in Electron or browser mode

## App Modes

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

## Main Areas

### Skill Generator

- Multi-step scenario form
- Reference material management
- Prompt preview modal
- One-click send to OpenClaw

### Skill Library

- Search and lightweight filtering
- Three-column card layout
- Enable / disable switches
- Drill-down Skill workbench modal

### Skill Workbench

- File structure overview
- File meaning and config hints
- Local file editing and save-back

## Project Structure

- `public/index.html`: UI layout and styling
- `public/app.js`: client state, interactions, and browser-mode flows
- `public/skill-generator-shared.js`: shared generator logic
- `src/main.js`: Electron entry
- `src/preload.js`: desktop bridge
- `src/server.js`: local API and static server
- `src/lib/openclaw-service.js`: local OpenClaw data and config logic
- `src/lib/openclaw-control.js`: OpenClaw Control browser automation
- `tests/`: service, UI, generator, and control tests

## Scripts

```bash
npm start      # Electron desktop client
npm run dev    # Electron desktop client
npm run dev:web
npm test
npm run smoke
npm run dist
```

## Windows Compatibility

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

## Validation

Run before publishing or opening a PR:

```bash
npm test
npm run smoke
```

## Documentation

- [Deployment guide](docs/DEPLOY.md)
- [Contributing guide](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## License

MIT. See [LICENSE](LICENSE).
