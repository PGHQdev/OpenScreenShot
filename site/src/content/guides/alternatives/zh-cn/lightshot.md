---
title: 'Lightshot 替代品：整页截图，不公开上传'
description: Lightshot 与 OpenScreenShot 对比。在浏览器中整页截图、模糊和导出 PDF，文件留在你的设备上，没有 prnt.sc 链接。
order: 6
---

如果你在 Chrome 或 Firefox 中截取网页，想要整页截图、模糊和 PDF 导出，并且文件留在你的设备上，就换用 OpenScreenShot。如果你要截取其他应用或整个桌面，就继续使用 Lightshot：Lightshot 有 Windows 和 Mac 桌面应用，而 OpenScreenShot 只在浏览器中截取网页。如果你依赖它的即时短链接，也继续使用它。OpenScreenShot 没有上传服务，因此你通过粘贴或附上文件来分享截图。

OpenScreenShot 是我们的产品。本页关于 Lightshot 的信息截至 2026 年 10 月 9 日，来自其 [Chrome 应用商店 页面](https://chromewebstore.google.com/detail/mbniclmhobmnbdlbpiphghaielnnpgdp)、[网站](https://app.prntscr.com/en/index.html)、[Firefox 附加组件页面](https://addons.mozilla.org/firefox/addon/lightshot/)，以及从 Google 更新服务器获取的 7.0.1 版清单文件。

## Lightshot 与 OpenScreenShot 对比

|                  | Lightshot                                       | OpenScreenShot                         |
| ---------------- | ----------------------------------------------- | -------------------------------------- |
| 价格             | 免费                                            | 免费                                   |
| 开源             | 否（自定义许可证）                              | 是，MIT                                |
| 安装时的网站访问 | 所有网站（必需 `*://*/*`）                      | 无。开始截图时访问当前标签页           |
| 整页截图         | 否；商店页面介绍的是区域选择                    | 是                                     |
| 标注和模糊       | 原位编辑                                        | 形状、箭头、文字、步骤编号、模糊、裁剪 |
| PDF 导出         | 否                                              | 是                                     |
| 标签页录屏       | 否                                              | 是，仅限 Chrome（Firefox 版本只截图）  |
| 账号或云端       | 可选上传到 prnt.sc 获取短链接；也提供保存到磁盘 | 无需账号，不上传                       |
| 桌面截图         | 是，使用 Windows 和 Mac 应用                    | 否                                     |

Lightshot Chrome 扩展最后更新于 2024 年 7 月 23 日。

## 上传和分享链接

Lightshot 可以把截图上传到 prnt.sc 并给你一个短链接。查看上传的图片无需账号。2021 年，[Kaspersky 报告](https://www.kaspersky.com/blog/cryptoscam-in-lightshot/39224/)这些网址是连续的，因此改动一个字符就可能打开另一张图片，并指出“Anyone can see published screenshots without authentication”（任何人无需身份验证即可查看已发布的截图）。同年，[AIN.UA 也报告](https://en.ain.ua/2021/09/08/lightshot-allows-people-to-view-screenshots-of-other-users)了同一问题。我们没有核实这一问题在 2026 年是否仍然存在。

OpenScreenShot 没有上传步骤。它在你的浏览器中处理和存储截图，导出的文件进入你的下载文件夹。在你把截图粘贴或附加到某处之前，没有人能看到它。详情见[隐私部分](/zh-cn/docs/#privacy)。

## 你保留的功能

快速区域截图保持不变。按 `Ctrl+Shift+E`（macOS 上为 `⌘⇧E`），或右键点击页面并选择**选定区域**，然后拖出一个矩形并按 `Enter`。编辑器打开，提供箭头、文字、形状和荧光笔。**复制**把图片放到剪贴板，可直接粘贴到聊天中。

要跳过编辑器，把**截图后**设为**剪贴板**。之后每张截图都直接进入剪贴板，接近“截图即粘贴”的习惯。

## 有哪些变化

你可以截取页面的更多内容。**整页**滚动整个页面并拼接成一张图片。**截取元素**按精确边界截取一张卡片、表格或图表。**可见区域**截取标签页中屏幕上显示的内容。

编辑器增加了**模糊**（`B`），可选柔和模糊、马赛克或**纯色**填充，后者完全覆盖私密数据。**步骤编号**标记会自动递增。点击**保存图片**打开**导出**对话框，可保存为 PNG、JPEG、WebP 或 PDF。

安装时的访问权限更小。OpenScreenShot 使用 `activeTab`，每次只访问一个标签页，它无法截取浏览器设置页面、扩展页面或浏览器之外的任何内容。要截取桌面应用或其他程序窗口，你仍然需要桌面工具。

## 如何切换

1. 从 [Chrome 应用商店](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) 或 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) 安装 OpenScreenShot。
2. 把图标固定到工具栏。
3. 试着截第一张图。在默认的**一键 Express 模式**下，点击图标会开始**整页**截图。要截取区域，使用 `Ctrl+Shift+E` 或右键菜单。
4. 在**设置**中设置**截图后**：**剪贴板**用于立即粘贴，**编辑器**用于标注，**下载**用于保存 PNG。
5. 如果你为其他程序保留了桌面截图应用，确保它与 OpenScreenShot 不使用相同的按键。在 Chrome 中，你可以在 `chrome://extensions/shortcuts` 更改扩展的按键。

要在客服回复中快速使用图片，见[客服截图](/zh-cn/use-cases/customer-support/)。要用于发帖，见[社交媒体截图](/zh-cn/use-cases/social-media/)。如果你需要桌面截图，见 [Snagit 替代品](/zh-cn/alternatives/snagit/)页面，了解桌面工具涵盖哪些功能。
