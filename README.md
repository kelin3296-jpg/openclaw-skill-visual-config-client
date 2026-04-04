# OpenClaw 技能可视化配置客户端

这是一个直接连接本地 OpenClaw 数据的桌面客户端，不是静态网页示意图。

它会在本机读取真实的 OpenClaw skill 列表、来源路径、依赖检查、`SKILL.md` 预览，以及 `skills.entries.<skillKey>` 的手动配置，并把修改写回本地配置文件。

## 主要能力

- 查看本机真实的 OpenClaw skills，总量、来源、状态和已配置数量
- 按个人技能、内置技能、已就绪、待配置等维度筛选
- 查看每个 skill 的本地路径、目录结构、缺失依赖和 `SKILL.md` 预览
- 直接编辑并保存 `skills.entries.<skillKey>` 到本地 `openclaw.json`
- 同时支持桌面客户端启动和浏览器调试模式
- 兼容 macOS 和 Windows 的默认 OpenClaw 路径

## 项目结构

- `public/index.html`：客户端界面
- `src/main.js`：Electron 桌面入口
- `src/preload.js`：桌面桥接信息
- `src/server.js`：本地 HTTP 服务
- `src/lib/openclaw-service.js`：OpenClaw 数据读取与写回核心逻辑
- `tests/openclaw-service.test.js`：服务层测试
- `docs/DEPLOY.md`：打包、冒烟测试和开源发布说明

## 快速开始

```bash
cd /Users/xieluo/Desktop/openclaw技能可视化配置项目
npm install
npm start
```

启动后会直接打开桌面客户端窗口。

如果只想用浏览器调试页面：

```bash
npm run dev:web
```

然后访问 `http://127.0.0.1:4318`。

## 测试

```bash
npm test
npm run smoke
```

- `npm test`：校验服务层逻辑
- `npm run smoke`：启动 Electron 客户端做一次自动冒烟测试

## Windows 适配

项目已经内置这些默认路径解析：

- OpenClaw 配置：`%USERPROFILE%\\.openclaw\\openclaw.json`
- OpenClaw CLI：`%APPDATA%\\npm\\openclaw.cmd`
- OpenClaw 内置技能：`%APPDATA%\\npm\\node_modules\\openclaw\\skills`

如果你的环境不在这些位置，可以额外设置：

```bash
OPENCLAW_BIN=/custom/path/to/openclaw
OPENCLAW_CONFIG_PATH=/custom/path/to/openclaw.json
OPENCLAW_STATE_DIR=/custom/path/to/.openclaw
```

## 许可证

MIT，详见 `LICENSE`。
