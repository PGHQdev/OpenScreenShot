---
title: 'FireShot 替代品：浏览器内的免费编辑器，并且开源'
description: FireShot 与 OpenScreenShot 对比。两者都在本地截取整页。OpenScreenShot 开源，并提供免费的浏览器内编辑器和标签页录屏。
order: 4
---

如果你想在浏览器中免费标注和模糊整页截图，在任何能运行 Chrome 或 Firefox 的操作系统上使用，并且代码可以阅读，就换用 OpenScreenShot。如果你需要带可用链接的 PDF、批量或自动截图，或 FireShot Pro 中的额外功能，例如高级 PDF 导出和截图历史，就继续使用 FireShot。OpenScreenShot 把 PDF 保存为图片，因此其中的文字不可搜索，链接也不可用。它只截取网页，不截取桌面窗口或整个屏幕。

OpenScreenShot 是我们的产品。本页关于 FireShot 的信息截至 2026 年 10 月 9 日，来自其 [Chrome 应用商店 页面](https://chromewebstore.google.com/detail/mcbpblocgmgfnpjjppndjkmgjaogfceg)、[网站](https://getfireshot.com/)、[购买页面](https://getfireshot.com/buy.php)、[Firefox 附加组件页面](https://addons.mozilla.org/en-US/firefox/addon/fireshot/)，以及从 Google 更新服务器获取的 2.1.4.18 版清单文件。

## FireShot 与 OpenScreenShot 对比

|                  | FireShot                                                                                                        | OpenScreenShot                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 价格             | 免费（Lite）；Pro 每年 $39.95，或一次性 $99.95 购买可用于两台设备的终身许可                                     | 免费，没有付费版本                                 |
| 开源             | 否（自定义许可证）                                                                                              | 是，MIT                                            |
| 安装时的网站访问 | Chrome 中无；访问所有网站为可选。必需 `nativeMessaging`                                                         | 无。开始截图时访问当前标签页                       |
| 整页截图         | 是                                                                                                              | 是                                                 |
| 标注和模糊       | 商店页面提到文字、箭头和模糊；Pro 列出“Editor & smart annotations (on Windows)”（编辑器和智能标注，Windows 版） | 免费，在浏览器中                                   |
| PDF 导出         | 是，带链接；高级 PDF 属于 Pro                                                                                   | 是，以图片形式：单页，或带重叠的 A4 或 Letter 多页 |
| 标签页录屏       | 否                                                                                                              | 是，仅限 Chrome（Firefox 版本只截图）              |
| 账号或云端       | 本地截图；可选上传和分享                                                                                        | 无需账号，不上传                                   |

## 你保留的功能

两款工具的截图都留在本地。FireShot 网站写道：“100% local captures keep your work private and offline-safe.”（100% 本地截图，让你的工作保持私密并可离线使用。）OpenScreenShot 在你的浏览器中处理截图，并且不上传它们。在 Chrome 中，两者安装时都不要求访问所有网站。

你保留长页面的整页截图，以及 PNG、JPEG 和 PDF 导出。OpenScreenShot 还可保存为 WebP。

## 有哪些变化

编辑器在浏览器标签页中运行，因此在每个操作系统上都一样，并且每个工具都免费。用**箭头**、**文字**、**步骤编号**和 **Spotlight（聚光）** 指出细节，用**模糊**（`B`）的**纯色**填充隐藏私密数据。**裁剪**和 **Cut（裁切）** 可修剪长截图。[标注参考](/zh-cn/docs/#annotate)列出了所有工具。

PDF 的工作方式不同。点击**保存图片**打开**导出**对话框，然后选择 **PDF**。**完整**生成一个与图片同尺寸的页面。**A4** 或 **Letter** 配合**拆分为多页**，会把长截图分成多页，每页之间重叠 5 mm。PDF 以图片形式保存截图，因此没有可点击的链接，也没有可选择的文字。如果你发送的 PDF 需要读者点击链接，FireShot 更适合这项工作。

OpenScreenShot 没有批量截图，没有截图历史，也没有电子邮件或 OneNote 上传。它有**截取元素**、用于制作带边框图片的 **Beautify** 面板，以及 Chrome 中带点击缩放和 MP4 导出的标签页录屏。

FireShot 的 Chrome 清单文件要求 `nativeMessaging`，它让扩展与你电脑上安装的程序通信。OpenScreenShot 不使用本地程序。Chrome 只在你第一次点击**录屏**时请求其可选的标签页截取权限。

FireShot 的 Firefox 附加组件最后更新于 2023 年 6 月 5 日，并请求访问你在所有网站上的数据。OpenScreenShot 的 Firefox 版本安装时不请求网站访问权限，并且只截图。

## 如何切换

1. 从 [Chrome 应用商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) 或 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) 安装 OpenScreenShot。
2. 把图标固定到工具栏。
3. 在长页面上点击图标。在默认的**一键 Express 模式**下，这会开始**整页**截图并打开**编辑器**。
4. 在**设置**中设置**截图后**。选择**下载**，每张截图都以 PNG 格式直接保存到你的下载文件夹；或选择**剪贴板**，立即粘贴。
5. 用 `{date}`、`{domain}` 和 `{title}` 等标记设置**文件名模板**。`/` 会保存到“下载”内的文件夹中。

如果键盘快捷键无法开始截图，打开 `chrome://extensions/shortcuts`，检查是否有其他扩展使用了相同的按键。

要保存带日期的页面副本，见[保存网页的可视副本](/zh-cn/use-cases/archive-web-pages/)。要制作带标注截图的帮助页面，见[文档截图](/zh-cn/use-cases/documentation/)。[导出参考](/zh-cn/docs/#export)介绍了格式和缩放比例。其他整页截图工具见 [GoFullPage 替代品](/zh-cn/alternatives/gofullpage/)和 [FullPage Capture 替代品](/zh-cn/alternatives/fullpage-capture/)。
