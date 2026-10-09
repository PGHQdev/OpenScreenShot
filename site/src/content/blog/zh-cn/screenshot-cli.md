---
title: 从命令行截取网站截图
description: 用 OpenScreenShot CLI 以固定视口、整页截图或输出二进制到 stdout 的方式保存 PNG 截图。
audience: developers
order: 4
---

OpenScreenShot CLI 使用本地安装的 Chrome 兼容浏览器，把网页截取为 PNG。它是独立于浏览器扩展的另一个软件包。安装 Node.js、pnpm 和 Chrome 后，运行：

```sh
pnpm dlx openscreenshot shot https://example.com --out screenshot.png --full
```

该命令启动一个独立的无头浏览器，打开 URL，写入图片，然后关闭浏览器。它不会连接到你日常浏览器中的标签页或已登录的配置文件。

## 明确设置视口

要截取视口截图，请省略 `--full`。宽度默认为 1280 像素，高度默认为 800 像素。当版式需要特定尺寸时，请同时设置两者：

```sh
pnpm dlx openscreenshot shot https://example.com --out desktop.png --width 1440 --height 900
pnpm dlx openscreenshot shot https://example.com --out narrow.png --width 390 --height 844
```

宽度接受 200 到 3840 的整数；高度接受 200 到 2160 的整数。窄视口用于测试该宽度下的响应式版式。它不会模拟手机的触控输入、设备像素比或移动浏览器：CLI 使用桌面版用户代理。

加上 `--full` 可截取视口以外的内容。无头浏览器的整页截图与扩展的“滚动并拼接”实现不同；不要假定每个动态页面在两者中看起来完全一样。

## 保存为文件或写入 stdout

不带 `--out` 时，命令会在当前目录写入 `screenshot.png`。使用明确的文件名，便于识别产物。运行命令前，请先创建输出所需的上级目录。

`--out -` 会把 PNG 字节写入 stdout：

```sh
pnpm dlx openscreenshot shot https://example.com --out - > screenshot.png
```

请使用二进制安全的重定向。CLI 始终输出 PNG；把输出命名为 `capture.jpg` 或 `capture.pdf` 并不会转换格式。如需带标注的图片或 PDF 输出，请使用[扩展编辑器](/zh-cn/docs/#export)。

## 解决常见故障

如果找不到 Chrome，请安装它，或把 `CHROME_PATH` 设为浏览器可执行文件。例如，在 Chromium 安装于以下路径的 Linux 系统上：

```sh
CHROME_PATH=/usr/bin/chromium pnpm dlx openscreenshot shot https://example.com --out screenshot.png
```

页面导航会等待 `networkidle2`，超时时间为 30 秒。当前命令没有自定义等待、选择器、Cookie 或登录选项。截图成功也不能证明应用已正确加载：请检查 PNG 中是否有错误页面、加载状态和缺失的资源。

退出码 0 表示截图命令已完成，1 表示截图失败，2 表示用法无效或参数校验失败。串联命令时请使用这些退出码，然后检查图片本身。

如需可重复的产物，请阅读 [CI 截图指南](/zh-cn/blog/screenshots-for-ci/)。如需由智能体驱动的流程，请参阅 [MCP 设置指南](/zh-cn/blog/screenshot-mcp-server/)。可用参数以 [CLI 源代码](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src)为准。
