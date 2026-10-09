---
title: 'Nimbus Screenshot 替代方案：迁移到 FuseBase 之后的本地截图'
description: Nimbus Screenshot 现已更名为 FuseBase Pro。OpenScreenShot 是免费开源的选择，在你的设备上完成整页截图、标注和标签页录屏。
order: 5
---

Nimbus Screenshot 现在以 FuseBase Pro 的名称在 Chrome 中发布，发布者为 Nimbus Web。如果你曾用 Nimbus 截取、标注和录制网页，并希望使用一款把文件留在你设备上的免费工具、无需账号、无需云端工作区，请改用 OpenScreenShot。如果你需要 OpenScreenShot 没有的功能，请继续使用 FuseBase Pro：超出单个标签页的屏幕录制，以及上传到 FuseBase、Google Drive、Dropbox 或 Slack。OpenScreenShot 只录制一个浏览器标签页，仅支持 Chrome。它不能截取桌面窗口或整个屏幕。

OpenScreenShot 是我们的产品。本页有关 FuseBase Pro 的信息截至 2026 年 10 月 9 日，来源为其 [Chrome 应用商店 页面](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn)、FuseBase 的[截图页面](https://thefusebase.com/screenshot/)和[定价页面](https://thefusebase.com/pricing/)、旧的 [Nimbus Firefox 附加组件页面](https://addons.mozilla.org/en-US/firefox/addon/nimbus-screenshot/)，以及从 Google 更新服务器获取的 3.6.19 版清单。

## Nimbus Screenshot 发生了什么

原来的 Nimbus Screenshot & Screen Video Recorder 页面已不在 Chrome 应用商店 中。旧的 Nimbus 截图页面 nimbusweb.me/screenshot.php 现在重定向到 FuseBase 截图页面。当前的 Chrome 扩展是“FuseBase Pro - Capture screenshots and Video record”，由 Nimbus Web, Inc. 提供。旧的 Nimbus 附加组件仍在 Firefox 上架。它最后一次更新是在 2020 年 7 月 31 日。

## FuseBase Pro 与 OpenScreenShot 对比

|                      | FuseBase Pro（原 Nimbus）                             | OpenScreenShot                                |
| -------------------- | ----------------------------------------------------- | --------------------------------------------- |
| 价格                 | 免费套餐录制最长 5 分钟；Pro 套餐录制最长 10 小时     | 免费，没有付费档位                            |
| 开源                 | 否                                                    | 是，MIT                                       |
| 安装时的网站访问权限 | 所有网站（必需 `<all_urls>`，在每个页面运行内容脚本） | 无。在你开始截图时访问当前标签页              |
| 整页截图             | 是                                                    | 是                                            |
| 标注和模糊           | 是                                                    | 是，所有工具免费                              |
| PDF 导出             | 是，据其商店页面                                      | 是                                            |
| 标签页录屏           | 是，屏幕和摄像头；GIF 和 MP4 转换为高级功能           | 是，仅限标签页，仅限 Chrome；MP4 和 WebM 免费 |
| 账号或云端           | 上传到 FuseBase、Google Drive、Dropbox 和 Slack       | 无需账号，不上传                              |

FuseBase 截图页面没有显示截图 Pro 套餐的价格。FuseBase 定价页面列出的是工作区套餐，起价为 Solo 每月 32 美元或 39 美元（视计费方式而定），且没有提到这款截图扩展。

## 你保留的功能

你保留整页截图、带标注工具和模糊的编辑器，以及 PDF 导出。在 Chrome 中，你保留带摄像头的录屏，而且 OpenScreenShot 还能录制麦克风和标签页音频。导出文件没有水印。

## 有变化的地方

文件留在你的设备上。OpenScreenShot 把截图存储在浏览器本地存储中，把录像存储在 IndexedDB 中，直到你删除它们，并且没有分析或遥测。FuseBase Pro 在 Chrome 应用商店 的隐私部分披露，它会收集个人身份信息、身份验证信息和网站内容。要分享 OpenScreenShot 截图，点击**复制**后粘贴，或点击**保存图片**后附上文件。

安装时的访问权限更小。OpenScreenShot 使用 `activeTab`，它在你开始截图时覆盖一个标签页。Chrome 在你第一次点击**录屏**时请求可选的标签页截取权限，仅在你打开**跨网站录制**时才请求访问所有网站的权限。

录屏覆盖一个标签页。在弹出窗口中点击**录屏**，选择**麦克风**、**标签页音频**或**摄像头**，然后录制整个标签页或你拖选的区域。录屏编辑器在每次点击处添加 2 倍缩放，你可以裁剪片段并放置摄像头气泡。MP4 和 WebM 导出免费。OpenScreenShot 没有 GIF 导出。请参阅[录屏参考](/zh-cn/docs/#record)。

## 如何切换

1. 从 [Chrome 应用商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)或 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) 安装 OpenScreenShot。Firefox 版只能截图。
2. 把图标固定到工具栏。
3. 在页面上点击图标。在默认的**一键 Express 模式**下，这会开始**整页**截图并打开**编辑器**。右键点击页面可选择**可见区域**、**选定区域**和**截取元素**。
4. 在**设置**中设置**截图后**：**编辑器**、**剪贴板**或**下载**。
5. 从 FuseBase 或你的云存储下载你想保留的文件。要标注旧截图，把图片拖到 OpenScreenShot 编辑器上。
6. 检查 `chrome://extensions`，如果你不再使用 Nimbus 或 FuseBase 扩展，就将其移除。

简短的功能视频请参阅[产品演示视频](/zh-cn/use-cases/product-demos/)。供团队使用的带标注截图请参阅[为设计评审截取页面](/zh-cn/use-cases/design-review/)。其他录屏工具请参阅 [Awesome Screenshot 替代方案](/zh-cn/alternatives/awesome-screenshot/)和 [Screenity 替代方案](/zh-cn/alternatives/screenity/)。
