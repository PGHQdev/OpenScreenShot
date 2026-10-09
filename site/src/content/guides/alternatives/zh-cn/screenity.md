---
title: 'Screenity 替代方案：截图和标签页录屏集于一个扩展'
description: Screenity 与 OpenScreenShot 对比。两者都开源。OpenScreenShot 另有整页截图和 PDF 导出，安装时不请求访问所有网站。
order: 7
---

如果你既录制浏览器标签页，也截取整页截图，并希望用一个开源扩展完成两者、安装时不访问所有网站，请改用 OpenScreenShot。如果你录制的不止一个标签页，请继续使用 Screenity：它能录制区域、桌面、任意应用窗口或摄像头，并能导出 GIF 或保存到 Google Drive。OpenScreenShot 只录制一个浏览器标签页，不能截取桌面窗口或整个屏幕。Screenity 的付费 Pro 套餐还提供链接分享和云端托管，OpenScreenShot 不提供这些。

OpenScreenShot 是我们的产品。本页有关 Screenity 的信息截至 2026 年 10 月 9 日，来源为其 [GitHub 仓库](https://github.com/alyssaxuu/screenity)和[清单](https://github.com/alyssaxuu/screenity/blob/master/src/manifest.json)、其 [Chrome 应用商店 页面](https://chromewebstore.google.com/detail/screenity-screen-recorder/kbbdabhdfibnancpjfhlkhafgdilcnji)、其 [Pro 页面](https://screenity.io/pro)，以及 Chrome 的[权限警告列表](https://developer.chrome.com/docs/extensions/reference/permissions-list)。

## Screenity 与 OpenScreenShot 对比

|                      | Screenity                                                  | OpenScreenShot                                       |
| -------------------- | ---------------------------------------------------------- | ---------------------------------------------------- |
| 价格                 | 扩展免费；Pro 每月 10 美元或每年 120 美元，可试用 7 天     | 免费，没有付费档位                                   |
| 开源                 | 是，GPL-3.0                                                | 是，MIT                                              |
| 安装时的网站访问权限 | 所有网站（必需 `<all_urls>`，另加 `tabs` 和 `tabCapture`） | 无。标签页截取为可选权限，在首次录屏时请求           |
| 整页截图             | 我们查阅的来源未提及                                       | 是                                                   |
| 标注和模糊           | 绘图、文字、箭头、形状；模糊页面内容                       | 截图上的形状、箭头、文字、步骤编号、模糊、聚光、裁剪 |
| PDF 导出             | 我们查阅的来源未提及                                       | 是                                                   |
| 标签页录屏           | 是，另有区域、桌面、应用窗口和摄像头                       | 是，仅限标签页，仅限 Chrome（Firefox 版只能截图）    |
| 视频导出             | MP4、GIF、WebM 或 Google Drive                             | MP4 或 WebM                                          |
| 账号或云端           | 免费扩展无需登录；Pro 使用账号和托管在欧盟的云端           | 无需账号，不上传                                     |

## 你保留的功能

两个扩展都开源，都把免费录像保存在你的设备上，无需登录。在 OpenScreenShot 中，点击弹出窗口中的**录屏**，选择**麦克风**、**标签页音频**或**摄像头**。保留**整个标签页**，或在预览上拖动以录制页面的一部分。录屏标签页上有计时器和**暂停**、**停止**、**取消**按钮，因此视频中不会出现任何控件。按 `Alt+Shift+X` 可从任意标签页停止录制。

## 有变化的地方

录屏编辑器在光标的每次点击处添加 2 倍缩放。你可以移动或删除这些缩放，以 1.5 倍、2 倍或 3 倍添加手动缩放，并裁剪每个片段。摄像头画面以圆形气泡加入导出视频，位置由你决定，**Beautify** 面板可添加内边距和背景。导出默认渲染 MP4（H.264 和 AAC），也可选择 WebM。[录屏参考](/zh-cn/docs/#record)介绍了每个控件。

截图是同一个扩展的一部分。在默认的**一键 Express 模式**下，点击工具栏图标即开始**整页**截图。截图编辑器提供带**纯色**填充的**模糊**用于遮盖，**保存图片**会打开**导出**对话框，可选 PNG、JPEG、WebP 或 PDF。OpenScreenShot 在录制期间不向页面添加任何内容，因此你不能在录制时在页面上绘图。标注适用于截图。

安装时的访问权限更小。Screenity 的清单需要 `<all_urls>`，Chrome 的列表中，`tabCapture` 显示“Read and change all your data on all websites”（读取和更改你在所有网站上的所有数据），`tabs` 显示“Read your browsing history”（读取你的浏览历史记录）。OpenScreenShot 安装时只使用 `activeTab`，仅在你第一次点击**录屏**时请求标签页截取权限。仅当你打开**跨网站录制**时，它才请求访问所有网站的权限；该选项让点击跟踪在标签页跳转到另一个网站后继续工作。

## 如何切换

1. 从 [Chrome 应用商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)安装 OpenScreenShot。[Firefox 版](https://addons.mozilla.org/firefox/addon/openscreenshot/)只能截图。
2. 把图标固定到工具栏。
3. 截取第一张截图：在页面上点击图标，在**编辑器**中查看结果。
4. 在弹出窗口中点击**录屏**，接受 Chrome 的标签页截取提示。录一段短视频并导出。
5. 截图时，在**设置**中设置**截图后**：**编辑器**、**剪贴板**或**下载**。
6. 在移除 Screenity 之前，导出你想保留的 Screenity 录像。

功能演示请参阅[产品演示视频](/zh-cn/use-cases/product-demos/)。要在 issue 中展示 bug，请参阅[用于 bug 报告的截图](/zh-cn/use-cases/bug-reports/)。如果你通过链接与团队分享视频，请对比 [Loom 替代方案](/zh-cn/alternatives/loom/)。如需可上传到云端的录屏工具，请参阅 [Nimbus 替代方案](/zh-cn/alternatives/nimbus/)。
