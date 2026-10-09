---
title: 面向开发者、CI 和 AI 智能体的网站截图工具
description: 从运行环境、整页、CLI、MCP、视频和许可证对比 openscreenshot CLI 和 MCP 服务器、shot-scraper、Playwright 等工具。
audience: developers
order: 9
---

如果只是在 shell 脚本或 CI 任务中截取公开页面的 PNG，命令行工具就够了：openscreenshot、shot-scraper、capture-website-cli 或 pageres-cli。如果截图需要登录、点击、断言或视频，请用 Playwright 或 Puppeteer 编写。对于 AI 智能体，本地 MCP 服务器会把截图返回给模型：`openscreenshot serve` 每次调用截取一张截图，而 Playwright MCP 驱动整个浏览器会话。

`openscreenshot` 软件包是我们的产品，本页会说明它在哪些情况下较弱。本页比较功能，不对工具排名。所有事实截至 2026 年 10 月 9 日，来自各项目的代码仓库、软件包注册表或官方文档，链接见下文。

## 工具一览

| 工具                | 语言 / 运行环境                                   | 整页             | CLI        | MCP                 | 视频                  | 许可证     |
| ------------------- | ------------------------------------------------- | ---------------- | ---------- | ------------------- | --------------------- | ---------- |
| openscreenshot      | Node.js 22.12+，已安装的 Chrome、Chromium 或 Edge | `--full`         | 是         | 是，stdio           | 否                    | MIT        |
| shot-scraper        | Python 3.10+，Playwright 浏览器                   | 默认             | 是         | 未列出              | 是，WebM 或 MP4       | Apache-2.0 |
| capture-website-cli | Node.js 20+，Puppeteer Chrome                     | `--full-page`    | 是         | 未列出              | 否                    | MIT        |
| pageres-cli         | Node.js 20+，Puppeteer Chrome                     | 默认             | 是         | 未列出              | 否                    | MIT        |
| Playwright          | Node.js、Python、Java、.NET                       | `fullPage: true` | 测试运行器 | 通过 Playwright MCP | 是                    | Apache-2.0 |
| Puppeteer           | Node.js 22.12+                                    | `fullPage: true` | 未列出     | 未列出              | 是，Chrome 中可录 MP4 | Apache-2.0 |
| Playwright MCP      | 通过 `npx` 运行的 Node.js，或 Docker              | `fullPage` 参数  | 仅服务器   | 是，stdio 或 HTTP   | 是，需手动开启        | Apache-2.0 |

“未列出”是指我们查阅的项目自身文档中没有介绍该功能。

## openscreenshot（CLI 和 MCP 服务器）

[openscreenshot](https://www.npmjs.com/package/openscreenshot) 通过 `puppeteer-core` 驱动你机器上已有的 Chrome、Chromium 或 Edge，因此不会下载浏览器。一条命令即可保存整页 PNG：

```sh
npx openscreenshot shot https://example.com --out example.png --full
```

参数有 `--out`（文件，或用 `-` 表示 stdout）、`--full`、`--width`（200 到 3840，默认 1280）和 `--height`（200 到 2160，默认 800）。退出码 0 表示已写入 PNG，1 表示截图失败，2 表示用法错误。`openscreenshot serve` 通过 stdio 启动一个 MCP 服务器，它只有一个工具 `capture_screenshot`，接受 `url`、`fullPage`、`width` 和 `height`，并返回 PNG 图像内容。[CLI 指南](/zh-cn/blog/screenshot-cli/)、[MCP 指南](/zh-cn/blog/screenshot-mcp-server/)和 [CI 指南](/zh-cn/blog/screenshots-for-ci/)介绍了设置方法，具体以[源代码](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src)为准。

它较弱的地方：

- 每次截图都会用空的配置文件启动一个全新的浏览器。它没有 Cookie、登录、点击或选择器等待，因此需要登录的页面只会显示登录界面。
- 页面导航会等待 `networkidle2`，最长 30 秒，没有额外的等待选项。在网络空闲后才渲染的页面可能只加载了一半。
- 只能输出 PNG，没有 PDF 或视频。
- MCP 服务器只支持本地 stdio，没有托管 URL 或 HTTP 传输。该工具返回图片，不会写入文件。
- 浏览器以 `--no-sandbox` 运行，以便在容器中使用。请只截取你信任的 URL。
- 在 Windows 上，无法检测到 Edge 和按用户安装的 Chrome；请设置 `CHROME_PATH`。

如需截取已登录的页面、添加标注或手动导出 PDF，请使用[浏览器扩展](/zh-cn/docs/)。

## shot-scraper

[shot-scraper](https://github.com/simonw/shot-scraper) 是基于 Playwright 的 Python 工具。根据其[截图文档](https://github.com/simonw/shot-scraper/blob/main/docs/screenshots.md)，安装它、下载它的浏览器，然后截图：

```sh
pip install shot-scraper
shot-scraper install
shot-scraper https://example.com -o example.png
```

省略 `--height` 时，截图为整页。`--selector` 截取单个元素，`shot-scraper pdf` 保存 PDF，`multi` 运行一份 YAML 截图列表。[1.10](https://github.com/simonw/shot-scraper/releases/tag/1.10) 中加入的 `video` 命令可根据 YAML 分镜脚本录制 WebM，`--mp4` 会用 ffmpeg 将其转换。默认浏览器为 Chromium，也可以安装 Firefox 和 WebKit。如果你的团队使用 Python，或者你希望用一个工具完成截图、PDF 和脚本化演示视频，请选择它。

## capture-website-cli

[capture-website-cli](https://github.com/sindresorhus/capture-website-cli) 是 Sindre Sorhus 开发的 Node.js 工具，用 Puppeteer 截取页面。默认截取视口；`--full-page` 截取整个可滚动页面：

```sh
npm install --global capture-website-cli
capture-website https://example.com --output=screenshot.png --full-page
```

不带 `--output` 时，它会把图片写入 stdout。它可输出 PNG、JPEG 或 WebP。`--element`、`--hide-elements`、`--remove-elements`、`--click-element`、`--dark-mode`、`--style` 和 `--script` 等参数会在截图前预处理页面，这是 openscreenshot 做不到的。如果你需要在截图前隐藏 Cookie 横幅或注入 CSS，请选择它。

## pageres-cli

[pageres-cli](https://github.com/sindresorhus/pageres-cli) 可在一次运行中以多种分辨率截取多个 URL：

```sh
pageres https://example.com 1366x768 1600x900
```

它会截取每一组 URL 和分辨率，默认为整页；`--crop` 会把每张图片限制在设定的高度内。输出为 PNG 或 JPEG，默认尺寸为 1366x768。`iphone5s` 等设备关键字已不再支持。项目活跃度较低：最近一次发布是 2025 年 9 月 9 日的 v9.0.0，它把 Node.js 要求提高到 20，并增加了三个参数。如需快速检查不同宽度下的响应式效果，请选择它。

## Playwright

[Playwright](https://github.com/microsoft/playwright) 是 Microsoft 的自动化和测试框架，支持 Chromium、Firefox 和 WebKit，并提供 Node.js、Python、Java 和 .NET 绑定。整页截图只是 [`page.screenshot`](https://playwright.dev/docs/api/class-page#page-screenshot) 的一个选项：

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://playwright.dev/docs/api/class-page#page-pdf) 只能在无头 Chromium 中使用。[视频录制](https://playwright.dev/docs/videos)是一个上下文选项，测试运行器可以只保留失败测试的视频。当截图只是某个测试中的一步、而该测试需要登录、点击和断言时，请选择 Playwright。

## Puppeteer

[Puppeteer](https://github.com/puppeteer/puppeteer) 是 Google 的 Node.js 库，支持 Chrome 和 Firefox。`npm i puppeteer` 会下载 Chrome for Testing。[截图选项](https://pptr.dev/api/puppeteer.screenshotoptions)使用相同的形式：

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://pptr.dev/api/puppeteer.page.pdf) 会使用打印 CSS 生成 PDF。puppeteer-core 25.10.0 中加入的 [`page.record()`](https://pptr.dev/api/puppeteer.page.record) 可在 Chrome 中录制 MP4。Firefox 通过 WebDriver BiDi 运行，部分功能不受支持。openscreenshot 是 `puppeteer-core` 的一层薄封装，因此当你需要的不止它的四个截图选项时，请直接使用 Puppeteer。

## Playwright MCP

[Playwright MCP](https://github.com/microsoft/playwright-mcp) 让智能体通过无障碍快照驱动浏览器，因此不需要视觉模型。它的 [README](https://github.com/microsoft/playwright-mcp/blob/v0.0.83/README.md) 给出了以下标准配置：

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

`browser_take_screenshot` 工具接受 `fullPage` 参数，并返回 PNG、JPEG 或 WebP。PDF 和视频工具需通过 `--caps` 手动开启。浏览器默认以有界面模式运行，并保留持久的配置文件，因此登录状态可以延续；`--isolated`、`--storage-state` 和 `--extension`（用于连接正在运行的 Chrome 或 Edge）会改变这一行为。`--port` 会改用 HTTP 而不是 stdio 提供服务。它仍是 0.0.x 版本（v0.0.83）。当智能体必须登录、点击或填写表单时，请选择它而不是 `openscreenshot serve`。

## 该选哪一个

- **在脚本或 CI 产物中截取公开页面的 PNG：** openscreenshot、shot-scraper 或 capture-website-cli。
- **以多种宽度截取同一页面：** pageres-cli。
- **先隐藏元素或注入 CSS：** capture-website-cli 或 shot-scraper。
- **通过命令行生成 PDF 或脚本化演示视频：** shot-scraper。
- **在测试套件中登录、点击和断言：** Playwright 或 Puppeteer。
- **只需要查看页面的智能体：** `openscreenshot serve`。
- **必须与页面交互或登录的智能体：** Playwright MCP。
- **截取并标注已登录页面的人：** 使用扩展；见[整页截图扩展对比](/zh-cn/blog/full-page-screenshot-extensions/)。
