---
title: 如何在 Arc 中截取整页截图
description: 在 macOS 上用 Arc 的 Capture Full Page 命令保存 PNG，了解其未说明之处，从 Chrome 应用商店 安装 OpenScreenShot。
order: 8
---

macOS 版 Arc 有一个 **Capture Full Page**（截取整页）命令。按 `Cmd+T` 打开命令栏，输入 `Capture Full Page` 并选中它。Arc 会把整个页面的 PNG 下载到你的默认下载位置。Arc 的帮助文档只为 macOS 说明了这个命令。OpenScreenShot 同样可在 Arc 中使用：Arc 是 Chromium 浏览器，可以从 Chrome 应用商店 安装扩展。

## 内置方法

Arc 在 [How to take full page screen captures in Arc](https://resources.arc.net/hc/en-us/articles/25481392111895-How-To-Take-Full-Page-Screen-Captures-in-Arc) 中介绍了这个命令。

1. 打开你要截取的页面。
2. 按 `Cmd+T` 打开命令栏，输入 `Capture Full Page` 并选中它。你也可以选择 **File**（文件）> **Capture Full Page**（截取整页）。
3. Arc 把 PNG 下载到你的默认下载位置。

这个命令没有默认快捷键。要添加快捷键，请打开 **Arc** > **Settings**（设置）> **Shortcuts**（快捷键），搜索 `capture`，再为 **Capture Full Page** 设置一个按键。

如需带样式的截图，请开启 [Developer Mode](https://resources.arc.net/hc/en-us/articles/20468488031511-Developer-Mode-Instant-Dev-Tools)，使用工具栏中的截图按钮，或在命令栏中运行 **Capture in Portrait Mode**（以纵向模式截取）。Arc 另有一个 Capture 工具，可截取选区并支持编辑和 Easels，它同样仅限 macOS。

## 局限

- **仅限 macOS**：Arc 没有为 Windows 版 Arc 说明任何整页命令。
- **行为未说明**：Arc 没有说明它如何生成图片、尺寸上限是多少，以及如何处理吸顶页头。请检查 PNG 的顶部和中部，看页头是否缺失或重复。
- **标注**：Arc 没有说明整页截图的编辑功能。要添加箭头或文字，请在其他应用中打开 PNG。
- **懒加载**：标记为 `loading="lazy"` 的图片只在你滚动到附近时才加载。请先把页面滚动一遍再截图，否则图片中的部分区域可能是空白。
- **内部滚动容器**：有开发者反映，Chromium、Firefox 和 WebKit 中的整页截图，对于在固定高度外壳内滚动的面板，只显示一屏高度。请检查带有滚动内容窗格的网页应用和文档网站。
- **无限滚动**：持续加载的信息流没有真正的底部。截图只包含你开始截图之前已加载的内容。

## 使用 OpenScreenShot

OpenScreenShot 逐个视口滚动页面，并把各部分拼接成一张图片。固定页头只在顶部截取一次，滚动内部元素的页面也能正常截取。高度超过 32,000 设备像素的页面最多保存为六张图片。

1. 在 Arc 中打开 [OpenScreenShot 商店页面](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)并添加扩展。Arc 在 [Extensions in Arc](https://resources.arc.net/hc/en-us/articles/19434259167767-Extensions-in-Arc-How-to-Import-Add-Open) 中介绍了如何从 Chrome 应用商店 安装。
2. 固定 OpenScreenShot 图标。
3. 打开页面并点击图标，或按 `⌘⇧S`。在默认设置下，整页截图立即开始，结果在编辑器中打开。
4. 检查顶部、底部以及所有吸顶导航。
5. 点击**保存图片**并选择 PNG、JPEG、WebP 或 PDF，或点击**复制**。

如果点击图标打开的是菜单，请选择**整页**；这由**一键 Express 模式**设置控制。要在 OpenScreenShot 中为截图添加样式，请在编辑器中打开 **Beautify** 面板：它可添加内边距、圆角、阴影，以及渐变、纯色或透明背景，边框会进入每次导出。[截图模式参考](/zh-cn/docs/#modes)和[导出参考](/zh-cn/docs/#export)列出了所有选项。

## 如何选择

- 在 macOS 上，如需为整个窗口滚动的页面快速生成 PNG，请使用 Arc 的 **Capture Full Page**。
- 对于滚动内部面板的页面，或者你想标注、遮盖或将截图保存为 PDF 时，请使用 OpenScreenShot，例如[设计评审](/zh-cn/use-cases/design-review/)。
- 如需自定义内边距和背景的带样式图片，请使用 OpenScreenShot 的 **Beautify** 面板，例如[社交媒体截图](/zh-cn/use-cases/social-media/)。

[Chrome 指南](/zh-cn/full-page-screenshot/chrome/)比较了 Chrome 的 DevTools 截图和扩展，[Brave 指南](/zh-cn/full-page-screenshot/brave/)介绍了另一款带内置工具的 Chromium 浏览器。对于浏览器设置等阻止扩展的页面，请参阅[支持与已知限制](/zh-cn/support/)。
