---
title: 如何在 Microsoft Edge 中截取整页截图
description: 用 Edge 内置的 Screenshot 工具或 DevTools 命令截取整个页面，了解其局限，并从 Chrome 应用商店 安装 OpenScreenShot。
order: 2
---

Microsoft Edge 内置 Screenshot（屏幕截图）工具，它以前名为 Web capture（网页捕获）。按 `Ctrl+Shift+S`，选择 **Capture full page**（捕获整页），然后复制截图或将其保存到你的设备。OpenScreenShot 同样可在 Edge 中使用：Edge 是 Chromium 浏览器，在你允许来自其他应用商店的扩展后，即可从 Chrome 应用商店 安装它。

## 内置方法

Microsoft 在其 [Edge 截图指南](https://www.microsoft.com/en-us/edge/learning-center/screenshot-webpage)中介绍了这个工具。

1. 打开你要截取的页面。
2. 按 `Ctrl+Shift+S`。你也可以右键点击页面并选择 **Screenshot**（屏幕截图），或打开 **Settings and more**（设置及其他）（**...**）并选择 **Screenshot**（屏幕截图）。
3. 选择中间的选项 **Capture full page**（捕获整页）。
4. 如有需要，在预览中用绘图工具标注截图。
5. 复制截图，或将其保存到你的设备。

Microsoft 表示，功能是否可用可能因设备类型、市场和浏览器版本而异。管理员还可以通过 [WebCaptureEnabled 策略](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled)关闭这个工具。在工作电脑上，如果找不到 **Screenshot**（屏幕截图）项，可能是设置了这项策略。

Edge 也有 Chromium 的 DevTools 截图功能。打开 DevTools，开启设备仿真，打开 **More options**（更多选项），然后选择 **Capture a full size screenshot**（截取完整尺寸的屏幕截图）。Microsoft 在其[设备模式文章](https://learn.microsoft.com/en-us/microsoft-edge/devtools/device-mode/)中说明了这一点。[Chrome 指南](/zh-cn/full-page-screenshot/chrome/)比较了这种方式和扩展。

## 局限

- **行为未说明**：Microsoft 没有说明 Screenshot 工具如何生成整页图片、页面长度上限是多少，以及如何处理吸顶页头、懒加载和内部滚动容器。分享前请逐一检查截图。
- **内部滚动容器**：有用户在 Microsoft Q&A 上反映，在内部元素中滚动的页面上，例如带有滚动内容窗格的网页应用，整页截图会失败。Microsoft 尚未确认这一点。
- **DevTools 页面尺寸**：DevTools 截图使用 Chromium 的截图命令，宽度或高度达到 131,072 CSS 像素或以上的页面会被拒绝，并报错“Page is too large.”
- **懒加载**：标记为 `loading="lazy"` 的图片只在你滚动到附近时才加载。请先把页面滚动一遍再截图，否则图片中的部分区域可能是空白。
- **吸顶页头**：滚动并拼接多个部分的截图工具会重复所有停留在屏幕上的元素。请检查图片中是否有页头出现了不止一次。

## 使用 OpenScreenShot

OpenScreenShot 滚动页面，分段截取，再把各部分拼接成一张图片。固定页头只在顶部截取一次，滚动内部元素的页面也能正常截取。高度超过 32,000 设备像素的页面最多保存为六张图片。

1. 在 Edge 中打开 [OpenScreenShot 商店页面](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)。Edge 询问时，选择 **Allow extensions from other stores**（允许来自其他应用商店的扩展），然后添加扩展。Microsoft 在其[扩展帮助](https://support.microsoft.com/en-us/edge/add-turn-off-or-remove-extensions-in-microsoft-edge)中说明了这一步。
2. 把 OpenScreenShot 图标固定到工具栏。
3. 打开页面并点击图标。在默认设置下，整页截图立即开始，结果在编辑器中打开。
4. 检查顶部、底部以及所有在滚动时加载的区块。
5. 点击**保存图片**并选择 PNG、JPEG、WebP 或 PDF，或点击**复制**。

OpenScreenShot 的整页快捷键是 `Ctrl+Shift+S`，与 Edge 的 Screenshot 工具按键相同。如果按下后打开的是 Edge 的工具，请改为点击图标，或通过截图菜单中的**快捷键**链接设置其他按键。[截图模式参考](/zh-cn/docs/#modes)列出了其他模式。

## 如何选择

- 对于为整个窗口滚动的页面，如需快速截图并画几笔，请使用 Edge 的 Screenshot 工具。
- 当页面滚动内部面板、你需要导出 PDF、JPEG 或 WebP，或者需要步骤编号和纯色遮盖时，请使用 OpenScreenShot，例如[帮助文档和教程](/zh-cn/use-cases/documentation/)或[客服回复](/zh-cn/use-cases/customer-support/)。
- 当管理员关闭了 Screenshot 工具，而你又无法安装扩展时，请使用 DevTools 截图。

[导出参考](/zh-cn/docs/#export)介绍了文件格式和缩放比例。对于浏览器设置等 OpenScreenShot 无法截取的页面，请参阅[支持与已知限制](/zh-cn/support/)。
