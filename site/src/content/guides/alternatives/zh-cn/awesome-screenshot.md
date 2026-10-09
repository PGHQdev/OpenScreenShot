---
title: 'Awesome Screenshot 替代品：数据留在你设备上的免费工具'
description: Awesome Screenshot 与 OpenScreenShot 对比。免费的标注、模糊、PDF 和标签页录屏都留在你的设备上，只有一个免费版本，安装时不要求访问所有网站。
order: 3
---

如果你在浏览器内截图和录屏，希望一切都留在你的设备上，并且所有编辑器工具都免费、没有套餐限制，就换用 OpenScreenShot。如果你需要 Awesome Screenshot 的云端功能，就继续使用它：分享链接、云存储，以及桌面和摄像头录制，其 Professional 套餐最高支持 4K。OpenScreenShot 没有分享链接，也没有云端。它只录制一个浏览器标签页，仅限 Chrome，并且不截取桌面窗口或整个屏幕。

OpenScreenShot 是我们的产品。本页关于 Awesome Screenshot 的信息截至 2026 年 10 月 9 日，来自其 [Chrome 应用商店 页面](https://chromewebstore.google.com/detail/nlipoenfbbikpbjkfpfillcgkoblgpmj)、[价格页面](https://www.awesomescreenshot.com/pricing)、[Firefox 附加组件页面](https://addons.mozilla.org/en-US/firefox/addon/screenshot-capture-annotate/)，以及从 Google 更新服务器获取的 4.4.44 版清单文件。

## Awesome Screenshot 与 OpenScreenShot 对比

|                  | Awesome Screenshot                                            | OpenScreenShot                                    |
| ---------------- | ------------------------------------------------------------- | ------------------------------------------------- |
| 价格             | 免费套餐；Basic 每月 $5 起，Professional 每月 $6 起，按年计费 | 免费，没有付费版本                                |
| 开源             | Firefox 页面声明为 MPL 2.0；我们没有找到公开的源代码仓库      | 是，MIT，源代码公开                               |
| 安装时的网站访问 | 所有网站（必需 `<all_urls>`，在每个页面运行内容脚本）         | 无。开始截图时访问当前标签页                      |
| 整页截图         | 是                                                            | 是                                                |
| 标注和模糊       | 是；免费套餐提供基础工具，付费套餐提供全部工具                | 全部工具免费                                      |
| PDF 导出         | 是                                                            | 是                                                |
| 标签页录屏       | 是，另可录制桌面和摄像头                                      | 是，仅限标签页，仅限 Chrome（Firefox 版本只截图） |
| 账号或云端       | 云存储和分享链接；也提供本地保存                              | 无需账号，不上传                                  |

## 套餐限制

Awesome Screenshot 免费套餐列出最多 100 张截图、基础标注，以及最多 20 段 720p 录像。其本地保存允许无限截图，以及最长 5 分钟的录像。Basic 按年计费每月 $5，按月计费每月 $6。Professional 按年计费每月 $6，按月计费每月 $8，提供无限录像，最高 4K。

OpenScreenShot 只有一个版本。每种截图模式、编辑器工具和导出格式都免费，也无需创建账号。

## 你保留的功能

你保留整页、可见区域和区域截图，以及一个带形状、箭头、文字、高亮和模糊的编辑器。你保留 PNG、JPEG 和 PDF 导出。在 Chrome 中，你保留带麦克风和摄像头的标签页录屏。

## 有哪些变化

你的截图留在你的设备上。OpenScreenShot 把截图存储在浏览器本地存储中，把录像存储在 IndexedDB 中，并且不上传它们。Chrome 应用商店 上 Awesome Screenshot 的隐私部分披露它会收集“网站内容”（"Website content"）。要分享 OpenScreenShot 截图，点击**复制**后粘贴图片，或点击**保存图片**后附上文件。详情见[隐私部分](/zh-cn/docs/#privacy)。

安装时的访问权限更小。OpenScreenShot 使用 `activeTab`，每次只访问一个标签页。你第一次点击**录屏**时，Chrome 会请求可选的标签页截取权限；只有你开启**跨网站录制**时，才会请求访问所有网站。

录屏器只录制一个标签页。在弹出窗口中点击**录屏**，选择**麦克风**、**标签页音频**或**摄像头**，然后保留**整个标签页**，或拖动选择页面的一部分来录制。停止后，录像编辑器会在每次点击处添加 2 倍缩放。你可以修剪、放置摄像头气泡，并导出 MP4 或 WebM。见[录屏参考](/zh-cn/docs/#record)。

遮盖信息时，使用**模糊**（`B`）的**纯色**填充，它在导出图片中完全覆盖该区域。

## 如何切换

1. 从 [Chrome 应用商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) 或 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) 安装 OpenScreenShot。
2. 把图标固定到工具栏。
3. 在长页面上点击图标。在默认的**一键 Express 模式**下，这会开始**整页**截图并打开**编辑器**。右键点击页面，打开 **OpenScreenShot** 子菜单，可选择**可见区域**、**选定区域**或**截取元素**。
4. 在**设置**中设置**截图后**：**编辑器**、**剪贴板**或**下载**。
5. 停止使用 Awesome Screenshot 之前，从其云存储下载你想保留的截图和视频。要标注旧图片，把它拖到 OpenScreenShot 编辑器上。

要制作功能的短视频，见[产品演示视频](/zh-cn/use-cases/product-demos/)。要在客服回复中使用截图，见[客服截图](/zh-cn/use-cases/customer-support/)。如果你在比较带云端链接的录屏工具，见 [Loom 替代品](/zh-cn/alternatives/loom/)和 [Nimbus 替代品](/zh-cn/alternatives/nimbus/)。
