---
title: 'Loom 替代方案：标签页录屏留在你的设备上'
description: Loom 与 OpenScreenShot 对比。录制浏览器标签页，带摄像头、麦克风和自动缩放，在本地导出 MP4，无需账号，无需付费套餐。
order: 8
---

如果你在 Chrome 中录制网页应用或网页的操作演示，并希望在自己的设备上导出 MP4 文件、无需账号，请改用 OpenScreenShot。如果你通过链接分享视频，请继续使用 Loom：Loom 托管每个视频，提供视频库和团队工作区，并列有桌面版和移动版应用。OpenScreenShot 没有托管，也没有分享链接，因此你需要自己上传或附上导出的文件。它只录制一个浏览器标签页，仅支持 Chrome，不能截取桌面窗口或整个屏幕。

OpenScreenShot 是我们的产品。本页有关 Loom 的信息截至 2026 年 10 月 9 日，来源为其[定价页面](https://www.loom.com/pricing)、其 [Chrome 应用商店 页面](https://chromewebstore.google.com/detail/loom-%E2%80%93-screen-recorder-sc/liecbddmkiiihnedobmlmillhodjkdmb)、Atlassian 的[账号帮助页面](https://support.atlassian.com/loom/docs/use-loom-with-an-atlassian-account)，以及 Chrome 的[权限警告列表](https://developer.chrome.com/docs/extensions/reference/permissions-list)。

## Loom 与 OpenScreenShot 对比

|                      | Loom                                                                                                                                   | OpenScreenShot                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 价格                 | Starter 0 美元（25 个视频，屏幕录制最长 5 分钟）；Business 每用户每月 18 美元；Business + AI 标价每用户每月 24 美元；Enterprise 需咨询 | 免费，没有付费档位                                |
| 开源                 | 否                                                                                                                                     | 是，MIT                                           |
| 安装时的网站访问权限 | 所有网站（必需 `<all_urls>`，在每个页面运行内容脚本）                                                                                  | 无。标签页截取为可选权限，在首次录屏时请求        |
| 整页截图             | 我们查阅的来源未提及                                                                                                                   | 是                                                |
| 标注和模糊           | 我们查阅的来源未提及                                                                                                                   | 是，用于截图                                      |
| PDF 导出             | 我们查阅的来源未提及                                                                                                                   | 是，用于截图                                      |
| 标签页录屏           | 屏幕录制，各套餐有限制                                                                                                                 | 是，仅限标签页，仅限 Chrome（Firefox 版只能截图） |
| 账号或云端           | 需要账号；视频由 Loom 托管                                                                                                             | 无需账号，不上传                                  |

Loom 自 2023 年 11 月起归属 Atlassian，Loom 账号可以使用 Atlassian 账号。

## 你保留的功能

你保留一个从浏览器工具栏启动的录屏工具。在 OpenScreenShot 弹出窗口中点击**录屏**，打开**麦克风**和**摄像头**，然后点击**开始录制**。你的摄像头画面以圆形气泡出现在导出视频中，位置由你决定。**标签页音频**会加入页面的声音。

## 有变化的地方

视频是一个文件。停止录制后，录屏编辑器在同一个标签页中打开。它在每次点击处添加 2 倍缩放，让观看者看到你点击的位置。你可以调整或删除每个缩放，以 1.5 倍、2 倍或 3 倍添加自己的缩放，并裁剪片段。导出会把 MP4（H.264 和 AAC）或 WebM 文件渲染到你的下载文件夹。把它上传到你自己的视频托管服务、聊天或工单。[录屏参考](/zh-cn/docs/#record)介绍了每个控件。

录像留在你的设备上。OpenScreenShot 在录制时把它们保存在 IndexedDB 中，直到你删除该会话。它没有分析或遥测。[隐私部分](/zh-cn/docs/#privacy)有详细说明。

范围是一个标签页。保留**整个标签页**，或在预览上拖动以录制页面的一部分。如果录制过程中标签页跳转到另一个网站，点击跟踪需要**跨网站录制**，它会请求访问所有网站的权限。没有它，视频剩余部分的缩放和点击效果会停止，但视频继续录制。

安装时的访问权限更小。Loom 的清单需要 `<all_urls>`、`tabCapture` 和 `desktopCapture`。Chrome 的列表中，`tabCapture` 显示“Read and change all your data on all websites”（读取和更改你在所有网站上的所有数据），`desktopCapture` 显示“Capture content of your screen”（捕获屏幕内容）。OpenScreenShot 安装时只使用 `activeTab`，仅在你第一次点击**录屏**时请求标签页截取权限。

OpenScreenShot 也能截图。在默认的**一键 Express 模式**下，点击工具栏图标即开始**整页**截图，编辑器提供箭头、步骤编号，以及带**纯色**填充的**模糊**。

## 如何切换

1. 从 [Chrome 应用商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)安装 OpenScreenShot。[Firefox 版](https://addons.mozilla.org/firefox/addon/openscreenshot/)只能截图。
2. 把图标固定到工具栏。
3. 在弹出窗口中点击**录屏**，接受 Chrome 的标签页截取提示。录一段短视频，然后点击**导出**。
4. 按 `Alt+Shift+X` 可从任意标签页停止录制。
5. 截图时，在**设置**中设置**截图后**：**编辑器**、**剪贴板**或**下载**。
6. 在关闭账号或更改套餐之前，下载你想保留的 Loom 视频。

功能演示请参阅[产品演示视频](/zh-cn/use-cases/product-demos/)。客服回复请参阅[客户支持截图](/zh-cn/use-cases/customer-support/)。如需同时能录制桌面的开源录屏工具，请参阅 [Screenity 替代方案](/zh-cn/alternatives/screenity/)。如需带云端链接的录屏工具，请参阅 [Awesome Screenshot 替代方案](/zh-cn/alternatives/awesome-screenshot/)。
