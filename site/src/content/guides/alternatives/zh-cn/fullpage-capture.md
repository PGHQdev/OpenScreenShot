---
title: 'FullPage Capture 替代品：开源，安装时不要求访问所有网站'
description: FullPage Capture 与 OpenScreenShot 对比。两者都能免费截取和标注整页。OpenScreenShot 开源，安装时不要求访问所有网站。
order: 2
---

如果你想要一款代码可以阅读、安装时不要求访问所有网站的整页截图扩展，就换用 OpenScreenShot。如果你需要 FullPage Capture 的 PDF 导出所提供的功能，就继续使用它：其商店页面介绍了带可点击链接和智能分页的 PDF，其 Pro 套餐还增加了可搜索的 PDF。OpenScreenShot 把 PDF 保存为图片，因此其中的文字无法搜索或选择，链接也不可用。OpenScreenShot 只在浏览器中截取网页；它不截取桌面窗口或整个屏幕。

OpenScreenShot 是我们的产品。本页关于 FullPage Capture 的信息截至 2026 年 10 月 9 日，来自其 [Chrome 应用商店 页面](https://chromewebstore.google.com/detail/ggacghlcchiiejclfdajbpkbjfgjhfol)、[网站](https://fullpagecapture.net/)，以及从 Google 更新服务器获取的 1.19.67 版清单文件。

## FullPage Capture 与 OpenScreenShot 对比

|                  | FullPage Capture                                                         | OpenScreenShot                                                           |
| ---------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| 价格             | 免费；Pro 在 7 天试用后每年 $19                                          | 免费，没有付费版本                                                       |
| 开源             | 否                                                                       | 是，MIT                                                                  |
| 安装时的网站访问 | 所有网站（必需 `<all_urls>`）                                            | 无。开始截图时访问当前标签页                                             |
| 整页截图         | 是，免费，无水印                                                         | 是，免费，无水印                                                         |
| 标注和模糊       | 免费（箭头、形状、文字、荧光笔、画笔、编号标记、模糊和像素化）           | 免费（形状、箭头、文字、荧光笔、画笔、步骤编号、模糊、马赛克、纯色填充） |
| PDF 导出         | 是，带可点击链接和智能分页；可搜索 PDF 属于 Pro                          | 是，以图片形式：单页，或带重叠的 A4 或 Letter 多页                       |
| 标签页录屏       | 否                                                                       | 是，仅限 Chrome（Firefox 版本只截图）                                    |
| 账号或云端       | 商店页面称无需账号；Pro 使用账号和“Send to your cloud”（发送到你的云端） | 无需账号，不上传                                                         |

[完整对比](/zh-cn/compare/)把 GoFullPage 也放在同一张表中。

## 安装时的访问权限

FullPage Capture 的清单文件要求 `<all_urls>` 主机权限。安装带有该权限的扩展时，Chrome 会显示警告“Read and change all your data on all websites”（读取和更改你在所有网站上的数据）。其商店页面写道：“No account, no analytics, no network requests. Files stay on your device”（无需账号，无分析，无网络请求。文件留在你的设备上），其网站写道：“The extension makes zero network requests”（该扩展不发出任何网络请求）。我们没有测试它的网络行为，本页对此不作任何声明。

OpenScreenShot 不要求主机权限。它使用 `activeTab`，只在你点击图标、按下快捷键或从右键菜单选择截图的那一刻访问一个标签页。Chrome 只在你第一次点击**录屏**时请求可选的标签页截取权限。只有你开启**跨网站录制**时，才会请求访问所有网站。[隐私部分](/zh-cn/docs/#privacy)说明了截图如何留在你的设备上。

## 你保留的功能

工作流程很接近。在默认的**一键 Express 模式**下，点击一次工具栏图标就会开始**整页**截图，结果在**编辑器**中打开。箭头、形状、文字、编号标记和模糊全部免费。保存、复制和 PDF 导出也免费，任何导出都没有水印。

## 有哪些变化

遮盖信息时，选择**模糊**（`B`），然后在**遮盖**下选择**纯色**填充。纯色在导出图片中完全覆盖该区域。[遮盖指南](/zh-cn/blog/redact-screenshot/)介绍了如何检查保存的文件。

PDF 的工作方式不同。点击**保存图片**打开**导出**对话框，选择 **PDF**，然后选择**完整**生成一个与图片同尺寸的页面，或选择 **A4** 或 **Letter** 并配合**拆分为多页**。各页之间重叠 5 mm，因此文字不会在行中间被截断。[截图转 PDF 指南](/zh-cn/blog/save-screenshot-as-pdf/)比较了各种布局。

OpenScreenShot 没有批量截图，也没有云端上传。它增加了用于截取单张卡片或表格的**截取元素**、用于设置内边距、圆角、阴影和背景的 **Beautify** 面板，以及 Chrome 中录制为 MP4 或 WebM 的标签页录屏。它也可以在 Firefox 中截图。

## 如何切换

1. 从 [Chrome 应用商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) 或 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) 安装 OpenScreenShot。
2. 把图标固定到工具栏；如果 FullPage Capture 固定在同一位置，取消固定它。
3. 打开一个长页面并点击图标。在**编辑器**中检查结果。
4. 在**设置**中设置**截图后**：**编辑器**用于标注，**剪贴板**用于立即粘贴图片，**下载**用于直接保存 PNG 而不打开标签页。
5. 在**设置**中设置**文件名模板**，例如 `{date}_{domain}`，让保存的文件按日期和网站排序。
6. 不再使用 FullPage Capture 时，从 `chrome://extensions` 移除它。

要在问题跟踪系统中使用带标注的截图，见[缺陷报告截图](/zh-cn/use-cases/bug-reports/)。[截图模式参考](/zh-cn/docs/#modes)介绍了每种模式。其他整页截图工具见 [GoFullPage 替代品](/zh-cn/alternatives/gofullpage/)和 [FireShot 替代品](/zh-cn/alternatives/fireshot/)。
