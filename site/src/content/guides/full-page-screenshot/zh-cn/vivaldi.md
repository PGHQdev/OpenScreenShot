---
title: 如何在 Vivaldi 中截取整页截图
description: 用 Vivaldi 的 Capture 工具截取整页 PNG 或 JPEG，了解 30,000 像素上限，从 Chrome 应用商店 安装 OpenScreenShot。
order: 7
---

Vivaldi 内置 Capture（截图）工具。点击状态栏中的相机图标，选择 **Full Page**（整页），选择 PNG、JPEG 或剪贴板，然后点击 **Capture**（截取）。Full Page 截图最多到 30,000 像素为止。OpenScreenShot 同样可在 Vivaldi 中使用：Vivaldi 是 Chromium 浏览器，可以从 Chrome 应用商店 安装扩展。

## 内置方法

Vivaldi 在 [Capture a screenshot](https://help.vivaldi.com/desktop/tools/capture-a-screenshot/) 中介绍了这个工具。

1. 打开你要截取的页面。
2. 点击状态栏中的相机图标。你也可以打开快捷命令（Windows 和 Linux 上按 `F2`，macOS 上按 `Cmd+E`），然后输入 `Capture`。
3. 选择 **Full Page**（整页）。
4. 选择输出方式：**Save as PNG**（另存为 PNG）、**Save as JPEG**（另存为 JPEG）或 **Copy to Clipboard**（复制到剪贴板）。
5. 点击 **Capture**（截取）。保存的文件存放在 **Settings**（设置）> **Webpages**（网页）> **Image Capture**（图像截取）> **Capture Storage Folder**（截图存储文件夹）中设置的文件夹。

Vivaldi 还可以把截图转为“笔记”面板中的一条新笔记，并附上截图日期和页面网址。

[Vivaldi 的键盘快捷键列表](https://help.vivaldi.com/desktop/shortcuts/keyboard-shortcuts/)中没有页面截图的默认按键。如需快捷键，请打开 **Settings**（设置）> **Keyboard**（键盘），把一个按键映射到 **Capture Page to disk**（截取页面到磁盘）或 **Capture Page to Clipboard**（截取页面到剪贴板）。

## 局限

- **尺寸**：Full Page 截图最多 30,000 像素。对于更长的页面，请截取你需要的区块。
- **行为未说明**：Vivaldi 没有说明它如何生成整页图片，以及如何处理吸顶页头。请检查图片的顶部和中部，看页头是否缺失或重复。
- **懒加载**：标记为 `loading="lazy"` 的图片只在你滚动到附近时才加载。请先把页面滚动一遍再截图，否则图片中的部分区域可能是空白。
- **内部滚动容器**：有开发者反映，Chromium、Firefox 和 WebKit 中的整页截图，对于在固定高度外壳内滚动的面板，只显示一屏高度。Vivaldi 没有说明它在这方面的行为，因此请检查带有滚动内容窗格的网页应用和文档网站。
- **标注**：Vivaldi 没有为截图说明任何绘图或标注工具。要添加箭头或文字，请在其他应用中打开文件。

## 使用 OpenScreenShot

OpenScreenShot 逐个视口滚动页面，并把各部分拼接成一张图片。固定页头只在顶部截取一次，滚动内部元素的页面也能正常截取。高度超过 32,000 设备像素的页面最多保存为六张图片。

1. 在 Vivaldi 中打开 [OpenScreenShot 商店页面](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)并添加扩展。Vivaldi 在其[扩展帮助](https://help.vivaldi.com/desktop/appearance-customization/extensions/)中介绍了如何从 Chrome 应用商店 安装。
2. 把 OpenScreenShot 图标固定到工具栏。
3. 打开页面并点击图标，或按 `Ctrl+Shift+S`（macOS 上为 `⌘⇧S`）。在默认设置下，整页截图立即开始，结果在编辑器中打开。
4. 检查顶部、底部以及所有吸顶导航。
5. 点击**保存图片**并选择 PNG、JPEG、WebP 或 PDF，或点击**复制**。

如果点击图标打开的是菜单，请选择**整页**；这由**一键 Express 模式**设置控制。导出前，编辑器可添加箭头、文字、步骤编号、模糊和裁剪。[截图模式参考](/zh-cn/docs/#modes)和[导出参考](/zh-cn/docs/#export)列出了所有选项。

## 如何选择

- 对于 30,000 像素以内的页面，如需 PNG 或 JPEG，请使用 Vivaldi 的 Capture 工具，尤其是你想把截图连同网址存入笔记时。
- 对于更长的页面、滚动内部面板的页面，或者需要标注或保存为 PDF 的截图，请使用 OpenScreenShot，例如[帮助文档和教程](/zh-cn/use-cases/documentation/)或[设计评审](/zh-cn/use-cases/design-review/)。
- 如果你经常截图且不需要标注，请映射一个 Vivaldi 快捷键。

[Opera 指南](/zh-cn/full-page-screenshot/opera/)和 [Brave 指南](/zh-cn/full-page-screenshot/brave/)介绍了其他自带截图工具的 Chromium 浏览器。对于浏览器设置等阻止扩展的页面，请参阅[支持与已知限制](/zh-cn/support/)。
