---
title: 如何在 Firefox 中截取整页截图
description: 用 Firefox 内置的 Screenshots 工具或 :screenshot 命令截取整个页面，了解尺寸上限，并使用 OpenScreenShot 附加组件。
order: 3
---

Firefox 内置 Screenshots（截图）工具。按 `Ctrl+Shift+S`（macOS 上为 `Cmd+Shift+S`），选择 **Save full page**（保存整个页面），然后选择 **Download**（下载）保存 PNG，或选择 **Copy**（复制）把图片放到剪贴板。Firefox 版 OpenScreenShot 附加组件增加了一个编辑器，可添加箭头、文字和遮盖，并可导出为 PNG、JPEG、WebP 或 PDF。

## 内置方法

Mozilla 在 [Take screenshots in Firefox](https://support.mozilla.org/en-US/kb/take-screenshots-firefox) 中介绍了这个工具。

1. 打开你要截取的页面。
2. 在 Windows 和 Linux 上按 `Ctrl+Shift+S`，在 macOS 上按 `Cmd+Shift+S`。你也可以右键点击页面的空白处，然后选择 **Take Screenshot**（截图）。
3. 选择右上角的 **Save full page**（保存整个页面）。
4. 在预览中，选择 **Download**（下载）把 PNG 保存到 Firefox 下载文件夹，或选择 **Copy**（复制）。

预览提供 **Copy**（复制）和 **Download**（下载）。要添加箭头或文字，请在其他应用中打开 PNG。

Firefox DevTools 提供了第二种方式。打开 Web 控制台并输入 `:screenshot --fullpage`，Firefox 就会保存整个页面的 PNG。你也可以在 DevTools 设置的 **Available Toolbox Buttons**（可用工具箱按钮）下开启 **Take a screenshot of the entire page**（为整个页面截图）按钮。Mozilla 在其 [DevTools 截图指南](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html)中说明了这两种方式。

## 局限

- **尺寸**：截图的任一边超过 32,766 像素或面积超过 472,907,776 像素时，Firefox 会裁剪截图，并显示“Your screenshot was cropped because it was too large.”Firefox 针对超大截图的错误消息给出了不同的数字：最长边小于 32,700 像素，或总面积小于 124,900,000 像素。
- **显示缩放**：Firefox 按设备像素计算这些上限，即页面宽度和高度乘以显示器的像素比。在 2x 显示器上，以 CSS 像素计的页面高度上限减半，约为 16,383。
- **内部滚动容器**：Firefox 从窗口的滚动宽度和高度获取整页边界。当页面在固定高度外壳内滚动一个面板时，该面板内的内容不会展开，因此截图只显示它的一屏高度。
- **懒加载**：标记为 `loading="lazy"` 的图片只在你滚动到附近时才加载。请先把页面滚动一遍再截图，否则图片中的部分区域可能是空白。
- **无限滚动**：随滚动不断加载更多内容的信息流没有真正的底部。截图只包含你开始截图之前已加载的内容。
- **吸顶页头**：分享前请检查图片的顶部和中部，看页头是否缺失、重复或位置错误。

## 使用 OpenScreenShot

Firefox 版 OpenScreenShot 只能截图，标签页录屏在 Chrome 版中。它的整页模式滚动页面，分段截取，再把各部分拼接成一张图片，固定页头只在顶部放置一次。滚动内部元素而非窗口的页面也能正常截取。

1. [从 Firefox Add-ons 安装 OpenScreenShot](https://addons.mozilla.org/firefox/addon/openscreenshot/)，并把它的图标固定到工具栏。
2. 打开页面并滚动一遍，让懒加载的图片加载，然后回到顶部。
3. 点击 OpenScreenShot 图标；如果打开了模式菜单，请选择**整页**。
4. 在编辑器中检查结果，尤其是顶部、底部以及所有吸顶导航。
5. 点击**保存图片**并选择 PNG、JPEG、WebP 或 PDF，或点击**复制**。

Firefox 把 `Ctrl+Shift+S` 用于它自己的 Screenshots 工具，因此要使用 OpenScreenShot 时，请点击工具栏图标。[截图模式参考](/zh-cn/docs/#modes)介绍了各个模式，[导出参考](/zh-cn/docs/#export)介绍了格式和缩放比例。

## 如何选择

- 对于为整个窗口滚动且不超过尺寸上限的页面，如需快速生成 PNG，请使用 Firefox Screenshots。
- 如果你已经在使用 Web 控制台，请使用 `:screenshot --fullpage` 命令。
- 对于滚动内部面板的页面，以及需要标注或保存为 PDF 的截图，请使用 OpenScreenShot，例如[错误报告](/zh-cn/use-cases/bug-reports/)或[保存页面副本](/zh-cn/use-cases/archive-web-pages/)。

[Chrome 指南](/zh-cn/full-page-screenshot/chrome/)和 [Edge 指南](/zh-cn/full-page-screenshot/edge/)介绍了在 Chromium 浏览器中完成同样的任务，OpenScreenShot 在这些浏览器中还可以录制标签页。对于 Firefox 设置等阻止扩展的页面，请参阅[支持与已知限制](/zh-cn/support/)。
