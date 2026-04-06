# 部署、打包与开源发布

## 本地开发

```bash
npm install
npm start
```

这会直接启动桌面客户端，并在应用内部拉起一个仅本机可访问的 OpenClaw 数据服务。

如果你只想用浏览器调试页面，可以运行：

```bash
npm run dev:web
```

## 冒烟测试

```bash
npm test
npm run smoke
```

`npm run smoke` 会拉起 Electron 客户端、加载首页，然后自动退出，适合做改动后的快速验证。

## 打包

### macOS

```bash
npm run dist
```

产物会输出到 `release/` 目录。

### Windows

代码层已经兼容以下默认路径：

- OpenClaw 配置：`%USERPROFILE%\\.openclaw\\openclaw.json`
- OpenClaw CLI：`%APPDATA%\\npm\\openclaw.cmd`
- OpenClaw 内置技能目录：`%APPDATA%\\npm\\node_modules\\openclaw\\skills`

如果你的 Windows 环境不在默认位置，可以设置：

```bash
set OPENCLAW_BIN=C:\path\to\openclaw.cmd
```

然后再运行客户端。

如果要在 Windows 上原生打包安装包，建议在 Windows 机器上执行：

```bash
npm install
npm run dist
```

## 开源发布

```bash
git add .
git commit -m "feat: prepare open-source release"
git remote add origin <your-repo-url>
git push -u origin main
```

推荐在推送前先确认：

- `npm test`
- `npm run smoke`
- `README.md`、`LICENSE`、`CONTRIBUTING.md`、`SECURITY.md` 已齐备
- `.github/workflows/ci.yml` 已存在

如果本机已经配置了 GitHub CLI 或 SSH key，也可以先创建远程仓库再 push。
