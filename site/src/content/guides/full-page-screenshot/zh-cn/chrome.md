---
title: 如何在 Chrome 中截取整页截图：DevTools 还是扩展
description: 使用 Chrome DevTools 的 Capture full size screenshot 命令，了解它的不足，并与 OpenScreenShot 的整页截图作比较。
order: 1
---

Chrome 无需扩展即可截取整页截图，但只能通过 DevTools。打开 DevTools，打开命令菜单，输入 `screenshot`，然后运行 **Capture full size screenshot**（截取完整尺寸的屏幕截图）。Chrome 会把整个页面保存为 PNG 文件。Chrome 的常规菜单中没有截图项：Google 的帮助在 **Cast, save, and share**（投放、保存和分享）下只列出了“分享”“发送到您的设备”和“创建二维码”。如需可以标注、可以导出为 PDF，或者能截取在面板内滚动的页面的截图，请安装 OpenScreenShot 并点击它的图标。

## 内置方法

1. 打开你要截取的页面。
2. [打开 DevTools](https://developer.chrome.com/docs/devtools/open)：在 Windows 和 Linux 上按 `F12` 或 `Ctrl+Shift+I`，在 macOS 上按 `Cmd+Option+I`。
3. 打开[命令菜单](https://developer.chrome.com/docs/devtools/command-menu)：按 `Ctrl+Shift+P`，macOS 上按 `Cmd+Shift+P`。
4. 输入 `screenshot` 并选择 **Capture full size screenshot**（截取完整尺寸的屏幕截图）。
5. Chrome 把整个页面保存为 PNG 文件。

设备模式中也有同样的截图功能。打开设备工具栏，打开它的 **More options**（更多选项）菜单，然后选择完整尺寸截图项。Google 的[设备模式文档](https://developer.chrome.com/docs/devtools/device-mode)称之为 **Capture a full size screenshot**（截取完整尺寸的屏幕截图）。

整个流程没有单一的快捷键。Google 没有为这种截图说明任何标注工具，因此箭头、文字和遮盖需要在其他应用中完成。

## 局限

- **必须打开 DevTools**：这个命令只在命令菜单和设备模式菜单中。
- **页面尺寸**：宽度或高度达到 131,072 CSS 像素或以上的页面会被 Chromium 拒绝，并报错“Page is too large.”
- **吸顶和固定元素**：截图时，Chromium 会把视图调整为整个页面的尺寸并隐藏滚动条。按窗口高度（`100vh`）设置尺寸的区块以及固定页头或页脚可能会按这个高视图排版。固定页脚可能只在图片底部出现一次，全高的首屏区块可能被拉长。
- **懒加载**：标记为 `loading="lazy"` 的图片和框架只在你滚动到附近时才加载。请先把页面滚动一遍再运行命令，否则图片中的部分区域可能是空白。
- **内部滚动容器**：Chromium 按页面本身的滚动尺寸确定截图大小。当页面在固定高度外壳内滚动一个面板时，例如网页应用或带有滚动内容窗格的文档网站，截图只显示该面板的一屏高度。

## 使用 OpenScreenShot

OpenScreenShot 逐个视口滚动页面，截取每个部分，再把各部分拼接成一张图片。它在第一个部分中截取固定页头，并只在顶部放置一次。滚动内部元素而非窗口的页面也能正常截取。高度超过 32,000 设备像素的页面最多保存为六张图片。

1. [从 Chrome 应用商店 安装 OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)，并把它的图标固定到工具栏。
2. 打开页面并点击图标，或按 `Ctrl+Shift+S`（macOS 上为 `⌘⇧S`）。
3. 在编辑器中检查结果，尤其是顶部、底部以及所有吸顶导航。
4. 点击**保存图片**并选择 PNG、JPEG、WebP 或 PDF。旁边的**复制**和 **PDF** 一键即可完成。

如果打开的是菜单而不是直接截图，请选择**整页**。这由**一键 Express 模式**设置控制。[Chrome 整页截图指南](/zh-cn/blog/full-page-screenshot-chrome/)逐步介绍了这款扩展的用法，包括区块缺失或重复的情况。[截图模式参考](/zh-cn/docs/#modes)和[导出参考](/zh-cn/docs/#export)列出了所有选项。

## DevTools 与 OpenScreenShot 对比

- **开始方式**：DevTools 需要两个快捷键和一条输入的命令。OpenScreenShot 只需点击一次或按一个快捷键。
- **输出**：DevTools 保存 PNG。OpenScreenShot 可导出 PNG、JPEG、WebP 或 PDF，也可复制图片。
- **编辑**：DevTools 没有编辑功能。OpenScreenShot 会打开编辑器，提供箭头、文字、步骤编号、模糊和裁剪。
- **安装**：DevTools 已内置于 Chrome。OpenScreenShot 是一款采用 MIT 许可证的扩展，在本地处理截图。

## 如何选择

- 在无法添加扩展的电脑上，如需为普通页面一次性生成 PNG，请使用 DevTools。
- 对于滚动内部面板的页面、带有吸顶页头的页面，以及分享前需要标注的截图，请使用 OpenScreenShot，例如[错误报告](/zh-cn/use-cases/bug-reports/)或[设计评审](/zh-cn/use-cases/design-review/)。
- 两者在 Microsoft Edge 中也都可以使用；[Edge 指南](/zh-cn/full-page-screenshot/edge/)介绍了 Edge 自带的 Screenshot 工具。

如果在 `chrome://settings` 等浏览器页面上截图失败，请参阅[支持与已知限制](/zh-cn/support/)。
