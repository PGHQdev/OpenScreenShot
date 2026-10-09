---
title: 如何在 Brave 中截取整页截图
description: 开启 Brave 的工具栏截图按钮，将整页截取为 PNG，了解其局限，并从 Chrome 应用商店 安装 OpenScreenShot。
order: 5
---

Brave 1.94 及更高版本内置截图工具。在 `brave://settings/appearance` 中开启截图按钮，点击它，然后选择 **Full page**（整页）。在 Brave 1.96 及更高版本中，会打开一个预览，你可以在其中下载 PNG 或复制图片。OpenScreenShot 同样可在 Brave 中使用：Brave 是 Chromium 浏览器，可以从 Chrome 应用商店 安装扩展。

## 内置方法

Brave 的帮助中心没有关于这个工具的文章。以下步骤依据 Brave 的[版本说明](https://brave.com/latest/)和[问题跟踪器](https://github.com/brave/brave-browser/issues/57937)。

1. 前往 `brave://settings/appearance`，在工具栏部分开启截图按钮。
2. 打开你要截取的页面。
3. 点击工具栏中的 **Take a screenshot**（截图）按钮。
4. 在 **Capture screenshot**（截取屏幕截图）气泡中选择 **Full page**（整页）。气泡还提供 **Selected area**（所选区域）和 **Visible area**（可见区域）。
5. 在 **Screenshot preview**（截图预览）对话框中，选择 **Download**（下载）保存 PNG，或选择 **Copy to clipboard**（复制到剪贴板）。

在 Brave 1.75 及更高版本中，`Ctrl+Shift+S`（macOS 上为 `Shift+Cmd+S`）可打开 Brave 的截图工具。Brave 的问题跟踪器把这个快捷键描述为选区式截图，因此要截取 **Full page**（整页），请使用工具栏按钮。在 Brave 1.96 中，应用菜单里的截图项移到了 **Save and share**（保存和分享）的“保存”部分。

预览提供 **Download**（下载）和 **Copy to clipboard**（复制到剪贴板）。要添加箭头或文字，请在其他应用中打开 PNG。

## 局限

- **页面尺寸**：**Full page**（整页）选项使用 Chromium 的 DevTools 截图命令。宽度或高度达到 131,072 CSS 像素或以上的页面会被该命令拒绝，并报错“Page is too large.”
- **吸顶和固定元素**：执行该命令时，Chromium 会把视图调整为整个页面的尺寸。按窗口高度（`100vh`）设置尺寸的区块以及固定页头或页脚可能会按这个高视图排版，因此固定页脚可能只在图片底部出现一次。
- **懒加载**：标记为 `loading="lazy"` 的图片只在你滚动到附近时才加载。请先把页面滚动一遍再截图，否则图片中的部分区域可能是空白。
- **内部滚动容器**：Chromium 按页面本身的滚动尺寸确定截图大小。当页面在固定高度外壳内滚动一个面板时，截图只显示该面板的一屏高度。
- **无限滚动**：持续加载的信息流没有真正的底部。截图只包含你开始截图之前已加载的内容。

## 使用 OpenScreenShot

OpenScreenShot 逐个视口滚动页面，并把各部分拼接成一张图片。固定页头只在顶部截取一次，滚动内部元素的页面也能正常截取。高度超过 32,000 设备像素的页面最多保存为六张图片。

1. 在 Brave 中打开 [OpenScreenShot 商店页面](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)并添加扩展。Brave 在 [Using Chrome extensions in Brave](https://brave.com/learn/using-chrome-extensions-in-brave/) 中介绍了如何从 Chrome 应用商店 安装。
2. 把 OpenScreenShot 图标固定到工具栏。
3. 打开页面并点击图标。在默认设置下，整页截图立即开始，结果在编辑器中打开。
4. 检查顶部、底部以及所有吸顶导航。
5. 点击**保存图片**并选择 PNG、JPEG、WebP 或 PDF，或点击**复制**。

OpenScreenShot 的整页快捷键是 `Ctrl+Shift+S`（macOS 上为 `⌘⇧S`），与 Brave 截图工具的按键相同。如果按下后打开的是 Brave 的工具，请改为点击图标，或通过截图菜单中的**快捷键**链接设置其他按键。如果点击图标打开的是菜单，请选择**整页**；这由**一键 Express 模式**设置控制。

## 如何选择

- 如需为整个窗口滚动的页面快速生成 PNG，请使用 Brave 的 **Full page**（整页）按钮。
- 对于滚动内部面板的页面、需要导出 PDF、JPEG 或 WebP，或者分享前需要标注和遮盖时，请使用 OpenScreenShot，例如[错误报告](/zh-cn/use-cases/bug-reports/)。
- 截图要用于帖子时，请使用 OpenScreenShot 的 **Beautify** 面板：它可添加内边距、圆角、阴影和背景。参阅[社交媒体截图](/zh-cn/use-cases/social-media/)。

[截图模式参考](/zh-cn/docs/#modes)和[导出参考](/zh-cn/docs/#export)列出了所有选项。[Chrome 指南](/zh-cn/full-page-screenshot/chrome/)介绍了 DevTools 截图，Brave 中也有这个功能。对于浏览器设置等阻止扩展的页面，请参阅[支持与已知限制](/zh-cn/support/)。
