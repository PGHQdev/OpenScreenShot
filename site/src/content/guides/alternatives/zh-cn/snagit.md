---
title: 'Snagit 替代方案：在浏览器中免费截取网页'
description: Snagit 与 OpenScreenShot 对比。如果你只截取网页，OpenScreenShot 在 Chrome 中免费提供整页截图、标注、模糊、PDF 和标签页录屏。
order: 9
---

如果你用 Snagit 截取的大多是网页，请改用 OpenScreenShot：它在浏览器中提供整页截图、标注、遮盖、PDF 导出和标签页录屏，免费且无需登录。如果你截取桌面应用、程序窗口或整个屏幕，请继续使用 Snagit。Snagit 是适用于 Windows 和 macOS 的桌面应用，而 OpenScreenShot 按设计只在浏览器中截取网页。Snagit 还能录制系统音频和全屏，能在程序窗口内滚动截图，并提供 Smart Redact，可模糊或遮挡电子邮件地址、电话号码和信用卡信息。OpenScreenShot 没有这些功能。

OpenScreenShot 是我们的产品。本页有关 Snagit 的信息截至 2026 年 10 月 9 日，来源为 TechSmith 的 [Snagit 页面](https://www.techsmith.com/snagit/)、其[商店页面](https://www.techsmith.com/store/snagit)，以及其[关于订阅定价的支持文章](https://support.techsmith.com/hc/en-us/articles/27009223314701-TechSmith-Transition-to-Annual-Subscription-Pricing-Model-in-2025)。

## Snagit 与 OpenScreenShot 对比

|                      | Snagit                                                     | OpenScreenShot                                                                    |
| -------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 价格                 | 按用户年度订阅；自 Snagit 2025 起不再提供新的永久许可证    | 免费，没有付费档位                                                                |
| 开源                 | 否                                                         | 是，MIT                                                                           |
| 平台                 | 适用于 Windows 10 和 11 以及 macOS 14 或更高版本的桌面应用 | 适用于 Chrome 和 Firefox 的浏览器扩展                                             |
| 安装时的网站访问权限 | 不适用（桌面应用）                                         | 无。在你开始截图时访问当前标签页                                                  |
| 整页截图             | 是，长滚动窗口和网页                                       | 是，网页                                                                          |
| 标注和模糊           | 箭头、标注框、文字、标记；Smart Redact                     | 形状、箭头、文字、步骤编号、聚光、带纯色填充的模糊                                |
| PDF 导出             | 是                                                         | 是                                                                                |
| 标签页录屏           | 屏幕、麦克风、系统音频和摄像头                             | 一个浏览器标签页，带麦克风、标签页音频和摄像头，仅限 Chrome（Firefox 版只能截图） |
| 账号或云端           | 订阅需要登录；TechSmith Screencast 上最多 25 个视频        | 无需账号，不上传                                                                  |

我们在所在地区无法从 TechSmith 商店页面加载美元价格，因此本页不列出价格。请在[商店页面](https://www.techsmith.com/store/snagit)查看你所在地区的价格。

## 你保留的功能

对于网页，主要任务都能照常完成。**整页**滚动页面并拼接成一张图片。**选定区域**截取一个矩形，**截取元素**按精确边界截取一张卡片、一个表格或一个图表。**编辑器**提供可走曲线路径的箭头、形状、文字、带编号的**步骤编号**标记、荧光笔，以及 **Spotlight（聚光）**，可调暗重点以外的所有内容。**裁剪**和 **Cut（裁切）** 用于修剪图片。[标注参考](/zh-cn/docs/#annotate)列出了所有工具。

你保留 PDF 导出和复制到剪贴板。点击**保存图片**打开**导出**对话框，可选 PNG、JPEG、WebP 或 PDF；或点击**复制**，把图片粘贴到文档中。**Beautify** 面板可添加内边距、圆角、阴影和背景，生成带边框的图片。

## 有变化的地方

在 OpenScreenShot 中，你需要自己遮盖每一项隐私内容。选择**模糊**（`B`），在**遮盖**下选择**纯色**填充，然后拖过每一项。纯色在导出文件中完全遮住该区域。[遮盖指南](/zh-cn/blog/redact-screenshot/)介绍了如何检查保存的文件。

录屏覆盖 Chrome 中的一个浏览器标签页。在弹出窗口中点击**录屏**，打开**麦克风**、**标签页音频**或**摄像头**，然后录制整个标签页或你拖选的区域。录屏编辑器在每次点击处添加 2 倍缩放，并导出 MP4 或 WebM。它不能录制其他应用的系统音频，也不能全屏录制。请参阅[录屏参考](/zh-cn/docs/#record)。

截图留在你的设备上，没有账号，也没有云端图库。要标注来自其他工具的截图，把图片拖到编辑器上，或用 `Ctrl+V`（macOS 上为 `⌘V`）粘贴。编辑器处理粘贴的图片与处理截图的方式相同。

## 如何切换

1. 从 [Chrome 应用商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)或 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) 安装 OpenScreenShot。
2. 把图标固定到工具栏。
3. 在一个长页面上点击图标。在默认的**一键 Express 模式**下，这会开始**整页**截图并打开**编辑器**。
4. 在**设置**中设置**截图后**：选择**编辑器**进行标注，选择**剪贴板**以立即粘贴，或选择**下载**以保存 PNG。
5. 用 `{date}` 和 `{title}` 等标记设置**文件名模板**。
6. 如果你继续用 Snagit 处理桌面工作，请确保它的快捷键不与 OpenScreenShot 冲突。在 Chrome 中，你可以在 `chrome://extensions/shortcuts` 更改扩展的快捷键。

带步骤编号的帮助文章请参阅[用于文档的截图](/zh-cn/use-cases/documentation/)。在页面上写评审意见请参阅[为设计评审截取页面](/zh-cn/use-cases/design-review/)。如需同样能截取桌面的免费工具，请参阅 [Lightshot 替代方案](/zh-cn/alternatives/lightshot/)页面。
