---
title: 适用于各平台的开源截图工具
description: 按运行环境介绍 OpenScreenShot、Screenity、ShareX、Flameshot、Playwright 等开源截图工具。
audience: everyday
order: 8
---

请根据你要截取的内容所在的位置来选择开源截图工具。Windows 屏幕上的任何内容，用 ShareX。Linux、macOS 或 Windows 桌面，用 Flameshot。网页，用 OpenScreenShot 等浏览器工具或 Firefox 内置的 Screenshots 工具；通过脚本截图，用 shot-scraper、Playwright 或 Puppeteer。

OpenScreenShot 是我们的产品。本页会说明它不适合的情况，并且不对工具排名。所有事实截至 2026 年 10 月 9 日，来自各项目的代码仓库、商店页面或官方网站，链接见下文。

## 各工具支持的平台

| 工具                | 运行环境                                           | 截取内容                                 | 许可证           | 整页     | 视频                     |
| ------------------- | -------------------------------------------------- | ---------------------------------------- | ---------------- | -------- | ------------------------ |
| OpenScreenShot      | Chrome、Firefox                                    | 标签页中的网页                           | MIT              | 是       | 标签页录制，仅 Chrome 版 |
| Screenity           | Chrome 以及使用 Chrome 应用商店 的 Chromium 浏览器 | 录制标签页、区域、桌面、应用窗口或摄像头 | GPL-3.0          | 未记载   | 是                       |
| ShareX              | Windows                                            | 屏幕上的任何内容                         | GPL-3.0          | 滚动截图 | 视频和 GIF               |
| Flameshot           | Linux、macOS、Windows                              | 屏幕区域                                 | GPL-3.0          | 否       | 未记载                   |
| Firefox Screenshots | Firefox 桌面版                                     | 网页                                     | Firefox 的一部分 | 是       | 未记载                   |
| shot-scraper        | Python 3.10 或更高版本                             | 网页，通过命令                           | Apache-2.0       | 是，默认 | 是，通过脚本文件         |
| Playwright          | Node.js、Python、Java、.NET                        | 网页，通过代码                           | Apache-2.0       | 是       | 是                       |
| Puppeteer           | Node.js                                            | 网页，通过代码                           | Apache-2.0       | 是       | 是，Chrome               |

这些工具都不能在 Android 或 iOS 上运行。浏览器扩展只能看到其标签页中的网页。桌面应用能看到整个屏幕，但不知道网页在哪里结束。

## 浏览器中：OpenScreenShot

[OpenScreenShot](https://github.com/pghqdev/OpenScreenShot) 是一款采用 MIT 许可证的扩展，适用于 [Chrome](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) 和 [Firefox](https://addons.mozilla.org/firefox/addon/openscreenshot/)。它可以截取整页、可见区域、选定区域或单个元素。然后它会打开一个带箭头、形状、文字、步骤编号、模糊和裁剪的编辑器，并导出 PNG、JPEG、WebP 或 PDF。截图和编辑都在你的浏览器中运行，扩展不会上传你的截图或录像。[文档](/zh-cn/docs/)介绍了每种模式。

Chrome 版还可以[录制标签页](/zh-cn/docs/#record)，可选择加入麦克风、标签页音频和摄像头，并导出 MP4 或 WebM。Firefox 版只能截图。

当你需要的内容在浏览器标签页之外时，OpenScreenShot 就不是合适的工具。它无法截取桌面、其他应用或浏览器设置页面，也不能录制整个屏幕。

## 浏览器录制：Screenity

[Screenity](https://github.com/alyssaxuu/screenity) 是一款适用于 Chrome 的录屏和标注扩展。它可以录制标签页、区域、桌面、任意应用窗口或摄像头，并可录入麦克风和内部音频。它可导出 MP4、GIF 或 WebM，或保存到 Google Drive。你可以绘图，添加文字、箭头和形状，并模糊页面上的敏感内容。

许可证为 [GPL-3.0](https://github.com/alyssaxuu/screenity/blob/master/LICENSE)。README 称，从 3.0.0 版起，Manifest V3 版本的许可证改为 GPLv3。该扩展免费，本地录制无需登录。[Screenity Pro](https://screenity.io/pro) 在 7 天试用后每月 $10 或每年 $120，需要账号，增加编辑器、链接分享以及在欧盟服务器上的云托管。README 称，部分代码路径会连接到 Screenity Pro，并且只在 Chrome 应用商店 版本中启用。

Screenity 在安装时请求访问所有网站。它的文档没有介绍整页截图。当你需要录制桌面或其他应用时，请选择它而不是 OpenScreenShot；见 [Screenity 替代方案](/zh-cn/alternatives/screenity/)。

## Windows：ShareX

[ShareX](https://getsharex.com/) 是一款免费、无广告的 Windows 应用，采用 [GPL-3.0](https://github.com/ShareX/ShareX) 许可证。它可截取屏幕、窗口或区域；它的[滚动截图](https://getsharex.com/docs/scrolling-screenshot)会比较连续的截图并追加发生变化的部分，因此一张图片可以容纳滚动超出屏幕的内容。它还能录制视频和 GIF，README 中还列出了 OCR 和二维码扫描功能。

图片编辑器有形状、箭头、文字、对话气泡、模糊、像素化、高亮和聚光。ShareX 可以上传到许多服务；如果你进行了配置，截图后任务可以自动上传。截取隐私内容前，请先检查这些设置。你可以下载安装程序、便携版，或从 Microsoft Store 或 Steam 获取。最新版本 v21.0.0 于 2026 年 7 月 3 日发布。

ShareX 不能在 macOS 或 Linux 上运行。

## Linux、macOS 和 Windows：Flameshot

[Flameshot](https://flameshot.org/) 是一款适用于 Linux、macOS 和 Windows 的免费截图工具，采用 [GPL-3.0](https://github.com/flameshot-org/flameshot) 许可证。你选择一个区域后，可以直接在原处用箭头、高亮、模糊或像素化、文字、手绘线条、方框和计数编号进行标注。它还有命令行界面。它的 README 列出了一个可选的 Imgur 上传功能，按 Return 键即会启动，因此截取隐私内容前请先了解这个按键。

[14.0.0 版](https://github.com/flameshot-org/flameshot/releases/tag/v14.0.0)（2026 年 6 月）会询问要截取哪台显示器，并在 Linux 上以 xdg-desktop-portal 作为主要截图途径。README 称对 GNOME 和 Plasma Wayland 的支持仍为实验性。

Flameshot 没有滚动截图功能。相关的[功能请求](https://github.com/flameshot-org/flameshot/issues/1130)仍未关闭。我们在它的文档中没有找到录屏功能。如需在 Linux 上截取完整网页，请将 Flameshot 与浏览器工具结合使用。

## 内置：Firefox Screenshots

Firefox 是开源的，它的 Screenshots 工具无需安装。根据 [Mozilla 的指南](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/)，右键点击页面，选择 **Take Screenshot**（截图），然后选择一个区域、可见区域或 **Save full page**（保存整个页面）。你可以复制或下载结果。Mozilla 在 Firefox 67（2019 年 5 月）中[终止了上传](https://blog.mozilla.org/futurereleases/2019/01/24/clarifying-the-future-of-firefox-screenshots/)到其 Screenshots 服务器的功能，因此截图会留在本地。

如果想用命令截图，根据 [DevTools 文档](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html)，Firefox DevTools 控制台接受 `:screenshot --fullpage`，它会把 PNG 保存到“下载”文件夹。Chrome 的 DevTools 前端也以 [BSD-3-Clause](https://github.com/ChromeDevTools/devtools-frontend) 许可证开源，它的 **Capture full size screenshot**（截取完整尺寸的屏幕截图）命令会保存一个 PNG。[整页截图指南](/zh-cn/full-page-screenshot/)介绍了每种浏览器。

## 通过脚本：shot-scraper、Playwright、Puppeteer

这些工具通过命令或代码截取网页，适合重复性工作和 CI。它们在自己的浏览器中加载页面，因此看不到你已登录的标签页。

- [shot-scraper](https://github.com/simonw/shot-scraper) 是基于 Playwright 的 Python 命令行工具。它默认截取整页截图，还可以保存 PDF，并根据 YAML 脚本录制视频。
- [Playwright](https://github.com/microsoft/playwright) 是 Microsoft 的浏览器自动化和测试框架，支持 Chromium、Firefox 和 WebKit，提供截图、PDF 和视频 API。
- [Puppeteer](https://github.com/puppeteer/puppeteer) 是 Google 的 Node.js 库，支持 Chrome 和 Firefox，提供截图、PDF 和 MP4 录制 API。

我们自己采用 MIT 许可证的 `openscreenshot` 软件包提供一个命令行工具和一个面向 AI 智能体的 MCP 服务器。[开发者工具对比](/zh-cn/blog/website-screenshot-tools-for-developers/)附带命令介绍了以上所有工具。

## 该选哪一个

- **Windows 屏幕上的任何内容，需要滚动截图：** ShareX。
- **Linux 或 macOS 上的屏幕区域：** Flameshot。
- **带标注和 PDF 导出的完整网页：** OpenScreenShot；如需无需安装的快速截图，可用 Firefox Screenshots。
- **录制桌面或其他应用：** Screenity，或 Windows 上的 ShareX。
- **通过脚本或 CI 截图：** shot-scraper、Playwright 或 Puppeteer。

如果工具不需要开源，[整页截图扩展对比](/zh-cn/blog/full-page-screenshot-extensions/)还介绍了 GoFullPage、FireShot 等工具。[对比页面](/zh-cn/compare/)把 OpenScreenShot、GoFullPage 和 FullPage Capture 放在一起比较。
