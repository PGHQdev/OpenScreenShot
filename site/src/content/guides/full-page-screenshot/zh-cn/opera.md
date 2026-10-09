---
title: 如何在 Opera 中截取整页截图
description: Opera 的 Snapshot 工具只能把整页保存为 PDF。了解步骤和局限，以及如何用 OpenScreenShot 截取整页图片。
order: 6
---

Opera 内置的 Snapshot（快照）工具可以把选区或可见区域截取为图片，但整页只能保存为 PDF。按 `Shift+Ctrl+5`（macOS 上为 `Shift+Cmd+2`），然后选择 **Save page as PDF**（将页面另存为 PDF）。如需整页图片文件，请安装 OpenScreenShot。Opera 是 Chromium 浏览器，在你添加 Opera 的 **Install Chrome Extensions** 附加组件后，即可从 Chrome 应用商店 安装它。

## 内置方法

Opera 在其[功能帮助页面](https://help.opera.com/en/latest/features/)和 [Snapshot 页面](https://www.opera.com/features/snapshot)中介绍了 Snapshot。

1. 打开你要截取的页面。
2. 在 Windows 和 Linux 上按 `Shift+Ctrl+5`，在 macOS 上按 `Shift+Cmd+2`。你也可以点击工具栏右侧的相机图标。
3. 选择 **Save page as PDF**（将页面另存为 PDF）。Opera 把整个页面从上到下保存为 PDF。

Snapshot 有两个图片选项。**Capture Full Screen**（截取全屏）只截取页面的可见区域，**Capture**（截取）截取一个由你调整的框。两者都生成图片，你可以用 Zoom、Arrow、Blur、Highlight、Pencil、Selfie camera、Emojis 和 Text 进行标注，然后用 **Save Image**（保存图片）保存为 PNG，或复制到剪贴板。

## 局限

- **整页只能保存为 PDF**：图片截图只覆盖可见区域或选区。要获取整个页面，你得到的是 PDF。
- **排版未说明**：Opera 没有说明 PDF 是一个长页面还是多个页面、如何处理吸顶页头，以及如何处理在固定高度外壳内滚动面板的页面。分享前请打开 PDF 检查。
- **懒加载**：标记为 `loading="lazy"` 的图片只在你滚动到附近时才加载。请先把页面滚动一遍再保存，否则部分区域可能是空白。
- **无限滚动**：持续加载的信息流没有真正的底部。任何截图都只包含你开始截图之前已加载的内容。

## 使用 OpenScreenShot

OpenScreenShot 滚动页面，分段截取，再把各部分拼接成一张图片。固定页头只在顶部截取一次，滚动内部元素的页面也能正常截取。高度超过 32,000 设备像素的页面最多保存为六张图片。

1. 从 Opera 附加组件中添加 **Install Chrome Extensions** 附加组件。Opera 在 [Using add-ons from Chrome in Opera](https://blogs.opera.com/tips-and-tricks/2021/10/using-addons-from-chrome-in-opera/) 中说明了这一点。
2. 打开 [OpenScreenShot 商店页面](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)并添加扩展。
3. 把 OpenScreenShot 图标固定到工具栏。
4. 打开页面并点击图标，或按 `Ctrl+Shift+S`（macOS 上为 `⌘⇧S`）。在默认设置下，整页截图立即开始，结果在编辑器中打开。
5. 检查顶部、底部以及所有吸顶导航。
6. 点击**保存图片**并选择 PNG、JPEG、WebP 或 PDF，或点击**复制**。

如果点击图标打开的是菜单，请选择**整页**；这由**一键 Express 模式**设置控制。OpenScreenShot 生成的 PDF 以图片形式保存截图，因此看起来与屏幕上的页面一致，但其中的文字无法搜索或选择。在**页面大小**下，**完整**会生成一个与图片尺寸相同的页面，**A4** 或 **Letter** 可以把长截图拆分到多个页面。[截图转 PDF 指南](/zh-cn/blog/save-screenshot-as-pdf/)比较了这些版式。

## 如何选择

- 如需无需安装即可快速生成整页 PDF，请使用 Snapshot 的 **Save page as PDF**（将页面另存为 PDF）。
- 对于可见区域或选区，如需画几笔标注，请使用 Snapshot 的图片选项。
- 如需整页 PNG、JPEG 或 WebP，对于滚动内部面板的页面，或者需要与屏幕一致的 PDF 时，请使用 OpenScreenShot，例如[设计评审](/zh-cn/use-cases/design-review/)或[保存页面副本](/zh-cn/use-cases/archive-web-pages/)。

[截图模式参考](/zh-cn/docs/#modes)和[导出参考](/zh-cn/docs/#export)列出了所有选项。[Vivaldi 指南](/zh-cn/full-page-screenshot/vivaldi/)介绍了另一款自带截图工具的 Chromium 浏览器。对于浏览器设置等阻止扩展的页面，请参阅[支持与已知限制](/zh-cn/support/)。
