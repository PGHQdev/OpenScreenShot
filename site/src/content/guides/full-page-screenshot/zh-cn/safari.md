---
title: 如何在 Safari 中截取整页截图
description: Mac 上的 Safari 无法截取整页图片。你可以把整个页面存为 PDF，在 Web Inspector 中截取单个元素，或使用其他浏览器。
order: 4
---

Mac 上的 Safari 没有整页截图命令。最接近的内置选项是 PDF：选择 **File**（文件）> **Print**（打印），点击对话框底部的 **PDF**，然后保存文件。如需图片文件，Safari 的 Web Inspector 可以截取页面中的单个元素。OpenScreenShot 没有 Safari 版本。Safari 从 Mac App Store 安装 Safari Web Extensions，无法安装 Chrome 应用商店 或 Firefox 附加组件的安装包。在 Mac 上，Chrome、Firefox、Edge 和其他浏览器可以运行 OpenScreenShot。

## 内置方法

### 将页面存为 PDF

Apple 在 [Print or create a PDF of a webpage in Safari](https://support.apple.com/guide/safari/print-or-create-a-pdf-of-a-webpage-ibrw1060/18.0/mac/15.0) 中介绍了这种方式。

1. 打开你要保存的页面。
2. 把页面滚动一遍，让延迟加载的图片加载完成。
3. 选择 **File**（文件）> **Print**（打印）。
4. 要保留页面的颜色，请在打印选项中开启背景图片和颜色的打印。你也可以在页眉和页脚中加入网址和日期。
5. 点击对话框底部的 **PDF** 并保存文件。

### 在 Web Inspector 中截取元素

1. 选择 **Safari** > **Settings**（设置）> **Advanced**（高级），然后选中 **Show features for web developers**（显示网页开发者功能）。WebKit 在 [Enabling Web Inspector](https://webkit.org/web-inspector/enabling-web-inspector/) 中说明了这一点。
2. 打开页面，按 `Option+Cmd+I` 打开 Web Inspector。
3. 在 **Elements**（元素）标签页中，右键点击一个节点，例如 `<html>` 或 `<body>`，然后选择 **Capture Screenshot**（截取屏幕快照）。
4. Safari 把该节点的快照保存为文件。

Apple 没有说明截取 `<html>` 时是否包含页面可见部分以下的内容，也没有说明它写入哪种图片格式。依赖这个文件之前，请先检查它。

## 局限

- **没有整页图片**：这两种方式都无法得到整页截图工具生成的那种截图。PDF 是页面的打印版本，Web Inspector 中的选项只截取一个节点。
- **打印版式**：PDF 使用打印版式，因此文件中的页面可能与屏幕上的页面看起来不同。如果设计依赖背景图片和颜色，请开启它们。
- **懒加载**：标记为 `loading="lazy"` 的图片只在你滚动到附近时才加载。请先把页面滚动一遍再打印或截图，否则部分区域可能是空白。
- **内部滚动容器**：有开发者反映，当页面在固定高度外壳内滚动一个面板时，WebKit（Safari 所用的引擎）中的自动整页截图只显示一屏高度。对于采用这种结构的页面，请仔细检查。
- **吸顶页头**：请检查结果中的页头是否缺失、重复或位置错误。

## 使用 OpenScreenShot

OpenScreenShot 不支持 Safari。如果同一台 Mac 上装有 Chrome、Firefox、Edge、Brave、Opera、Vivaldi 或 Arc，请在其中打开页面并使用这款扩展。Chrome 和其他 Chromium 浏览器从 [Chrome 应用商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)安装它。Firefox 从 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) 安装它。

1. 在其他浏览器中安装 OpenScreenShot，并把它的图标固定到工具栏。
2. 打开页面并点击图标。在 Chrome 中，`⌘⇧S` 也可以开始整页截图。
3. 在编辑器中检查结果。
4. 点击**保存图片**并选择 PNG、JPEG、WebP 或 PDF。

这款扩展滚动页面，把各部分拼接成一张图片，并只在顶部放置一次固定页头。高度超过 32,000 设备像素的页面最多保存为六张图片。[Chrome 指南](/zh-cn/full-page-screenshot/chrome/)和 [Firefox 指南](/zh-cn/full-page-screenshot/firefox/)分别给出了各浏览器的步骤，包括它们自带的内置工具。

## 如何选择

- 如需保留文章或收据页面的可读副本，请在 Safari 中使用 **File**（文件）> **Print**（打印）> **PDF**。
- 如需页面中某一部分（例如卡片或图表）的图片，请使用 Web Inspector 的 **Capture Screenshot**（截取屏幕快照）。
- 如需可以标注的整页图片，或者与屏幕显示一致的页面 PDF，请在 Mac 上的其他浏览器中使用 OpenScreenShot。[截图转 PDF 指南](/zh-cn/blog/save-screenshot-as-pdf/)比较了 PDF 版式，[保存页面的可视副本](/zh-cn/use-cases/archive-web-pages/)介绍了命名和存储。

其他问题请参阅[支持与已知限制](/zh-cn/support/)。
