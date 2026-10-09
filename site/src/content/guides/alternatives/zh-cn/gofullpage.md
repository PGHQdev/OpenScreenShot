---
title: 'GoFullPage 替代品：免费标注，并且开源'
description: GoFullPage 与 OpenScreenShot 整页截图对比。OpenScreenShot 提供免费的标注、模糊、裁剪和 PDF 分页，代码公开。
order: 1
---

如果你截取整页后还需要裁剪、模糊、标注或把 PDF 拆分为多页，就换用 OpenScreenShot：GoFullPage 把这些功能放在付费的 Premium 套餐中，而 OpenScreenShot 免费提供。OpenScreenShot 还采用 MIT 许可证，因此你可以阅读在你的页面上运行的代码。如果你只截取整页并保存为图片或 PDF、不做编辑，就继续使用 GoFullPage。它的免费版本已经能做到这一点，截图数量没有限制，其常见问题页面还链接了 Microsoft Edge Add-ons 版本。OpenScreenShot 没有 Edge Add-ons 页面，但 Edge 可以从 Chrome 应用商店 安装它。OpenScreenShot 只在浏览器中截取网页；它不截取桌面窗口或整个屏幕。

OpenScreenShot 是我们的产品。本页关于 GoFullPage 的信息截至 2026 年 10 月 9 日，来自其 [Chrome 应用商店 页面](https://chromewebstore.google.com/detail/fdpohaocaechififmbbbbbknoalclacl)、[常见问题](https://gofullpage.com/faq)、[Premium 页面](https://gofullpage.com/premium)，以及 [Firefox 附加组件页面](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/)。

## GoFullPage 与 OpenScreenShot 对比

|                  | GoFullPage                                     | OpenScreenShot                                 |
| ---------------- | ---------------------------------------------- | ---------------------------------------------- |
| 价格             | 免费；Premium 每年 $12（税前），可试用 7 天    | 免费，没有付费版本                             |
| 开源             | 否。自 2018 年起是一个 MIT 项目的私有分支      | 是，MIT                                        |
| 安装时的网站访问 | 无。访问所有网站为可选                         | 无。开始截图时访问当前标签页                   |
| 整页截图         | 是                                             | 是                                             |
| 标注和模糊       | 仅限 Premium（模糊、文字、高亮、裁剪）         | 免费（形状、箭头、文字、步骤编号、模糊、裁剪） |
| PDF 导出         | 免费；智能 PDF 分页属于 Premium                | 免费，包括带重叠拆分的 A4 或 Letter 多页       |
| 标签页录屏       | 否                                             | 是，仅限 Chrome（Firefox 版本只截图）          |
| 账号或云端       | 免费截图无需账号；Premium 使用账号             | 无需账号，不上传                               |
| 浏览器商店       | Chrome 应用商店、Firefox Add-ons、Edge Add-ons | Chrome 应用商店、Firefox Add-ons               |

[完整对比](/zh-cn/compare/)把 FullPage Capture 也加进了同一张表。

## 你保留的功能

主要习惯保持不变。在默认设置下，点击一次 OpenScreenShot 工具栏图标就会开始**整页**截图。这就是**一键 Express 模式**。扩展滚动页面，把各部分拼接成一张图片，并在**编辑器**中打开结果。固定页头只在顶部出现一次，滚动内部元素的页面也能截取。

两款扩展安装时都不要求网站访问权限。OpenScreenShot 使用 `activeTab`，因此只能在你开始截图的那一刻读取你截取的标签页。两者都能保存 PNG、JPEG 和 PDF 文件。两者都可在 Chrome 和 Firefox 中使用。

## 有哪些变化

编辑器工具免费。**裁剪**（`C`）修剪图片，**模糊**（`B`）的**纯色**填充覆盖私密数据，**箭头**、**文字**和**步骤编号**标出重点。**Cut（裁切）**（`X`）从长截图中删除水平条带。[标注参考](/zh-cn/docs/#annotate)列出了每个工具和快捷键。

PDF 布局也免费。点击**保存图片**打开**导出**对话框，选择 **PDF**，然后选择 **A4** 或 **Letter** 并配合**拆分为多页**。每页与下一页重叠 5 mm，因此文字不会在行中间被截断。**保存图片**旁边的 **PDF** 按钮可一键保存 PDF。PDF 以图片形式保存截图，因此其中的文字不可搜索或选择。

你还会得到更多截图模式：**可见区域**、**选定区域**和**截取元素**，后者按精确边界截取一张卡片、表格或图表。在 Chrome 中，**录屏**把标签页录制为 MP4 或 WebM 视频，并在每次点击处缩放。第一次录屏时会请求可选的标签页截取权限。

OpenScreenShot 没有日期或网址水印。改用**设置**中的文件名模板，配合 `{date}` 和 `{domain}`，把这些信息保留在文件名中。

## 如何切换

1. 从 [Chrome 应用商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) 或 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) 安装 OpenScreenShot。
2. 把图标固定到工具栏。如果 GoFullPage 固定在同一位置，取消固定它，以免点错图标。
3. 打开一个长页面并点击 OpenScreenShot 图标。在**编辑器**中检查顶部、底部和所有固定页头。
4. 在**设置**中设置**截图后**。**编辑器**会打开每张截图以便标注。**下载**把 PNG 保存到你的下载文件夹而不打开标签页，接近“截图即保存”的习惯。**剪贴板**复制图片。
5. 要标注你用 GoFullPage 保存的图片，把文件拖到编辑器上，或用 `Ctrl+V`（macOS 上为 `⌘V`）粘贴。

如果键盘快捷键无法开始 OpenScreenShot 截图，打开 `chrome://extensions/shortcuts`，检查是否有其他扩展使用了相同的按键。

要用带日期的文件名保存页面副本，见[保存网页的可视副本](/zh-cn/use-cases/archive-web-pages/)。如果你需要带可点击链接的 PDF，请比较 [FireShot 替代品](/zh-cn/alternatives/fireshot/)和 [FullPage Capture 替代品](/zh-cn/alternatives/fullpage-capture/)。
