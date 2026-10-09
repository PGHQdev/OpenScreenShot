---
title: 整页截图扩展对比（2026）
description: 从价格、源代码、权限、标注、PDF 和录屏对比 OpenScreenShot、GoFullPage 等 6 款扩展，并介绍浏览器内置工具。
audience: everyday
order: 7
---

如果你只是偶尔需要整页截图，Chrome DevTools、Microsoft Edge 和 Firefox 的内置工具无需安装就能截取整个页面。如果你经常截取页面，下面这些扩展在以下方面各不相同：哪些功能免费、安装时请求哪些网站访问权限、能否录制视频，以及源代码是否公开。每一节都说明了该工具适合谁。

OpenScreenShot 是我们的产品，我们也列出了其他工具更合适的情况。所有事实截至 2026 年 10 月 9 日，来自商店页面、扩展清单和厂商页面，链接附在各节中。本页比较功能，不对工具排名。

## 工具一览

| 工具                  | 价格                                  | 开源                        | 安装时访问所有网站 | 标注免费？                         | PDF                         | 录屏                 |
| --------------------- | ------------------------------------- | --------------------------- | ------------------ | ---------------------------------- | --------------------------- | -------------------- |
| OpenScreenShot        | 免费                                  | 是，MIT                     | 否                 | 是                                 | 是                          | 仅标签页，Chrome 版  |
| GoFullPage            | 免费；Premium 每年 $12                | 否                          | 否                 | 否，需 Premium                     | 是；智能分页需 Premium      | 否                   |
| FullPage Capture      | 免费；Pro 每年 $19                    | 否                          | 是                 | 是                                 | 是；可搜索 PDF 需 Pro       | 否                   |
| Awesome Screenshot    | 免费方案；付费方案每月 $5 起          | 无公开源代码                | 是                 | 基础工具；付费方案提供全部工具     | 是                          | 桌面、标签页、摄像头 |
| FireShot              | 免费；Pro 每年 $39.95 或一次性 $99.95 | 否                          | 否                 | 据商店页面有文字、箭头、模糊       | 是，含链接；高级 PDF 需 Pro | 否                   |
| FuseBase Pro (Nimbus) | 免费方案；Pro 价格未公布              | 否                          | 是                 | 标注和模糊；免费与付费的划分未公布 | 是                          | 屏幕和摄像头         |
| Chrome DevTools       | 免费，内置                            | DevTools 前端，BSD-3-Clause | 无需安装           | 未记载编辑器                       | 未记载                      | 未记载               |
| Edge Screenshot       | 免费，内置                            | 否                          | 无需安装           | 笔和触控标记                       | 未记载                      | 未记载               |
| Firefox Screenshots   | 免费，内置                            | Firefox 的一部分            | 无需安装           | 未记载                             | 未记载                      | 未记载               |

“安装时访问所有网站”是指扩展在你添加时请求访问每个网站的主机权限。Chrome 会把这项请求显示为“Read and change all your data on all websites”（读取和更改您在所有网站上的所有数据）。

## OpenScreenShot

[OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) 免费，没有付费层级，并以 MIT 许可证在 [GitHub 上公开源代码](https://github.com/pghqdev/OpenScreenShot)。它已上架 Chrome 应用商店 和 [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/)。点击一次工具栏图标即可开始整页截图；可见区域、选定区域和元素模式在右键菜单和键盘快捷键中。见[截图模式](/zh-cn/docs/#modes)。

编辑器包含形状、箭头、文字、步骤编号、带不透明填充的模糊、Spotlight（聚光）、裁剪和 Cut（裁切）。导出格式为 PNG、JPEG、WebP 或 PDF，PDF 可为单页、适配 A4 或 Letter，或拆分为多页。它在安装时不请求任何主机权限。Chrome 版可以[录制标签页](/zh-cn/docs/#record)并导出为 MP4 或 WebM；第一次录制时，Chrome 会请求标签页捕获权限。Firefox 版只能截图。

不太适合的情况：

- 它截取浏览器标签页中的网页。它无法截取你的桌面或其他应用，并且只能录制标签页。
- 它没有云存储或分享链接。你需要自己分享导出的文件。
- 它的 PDF 把截图作为图片保存，因此文字无法搜索。
- 浏览器页面，例如 `chrome://` 设置页和浏览器商店，无法截取。

## GoFullPage

[GoFullPage](https://gofullpage.com/) 一键截取页面，并导出 PNG、JPEG 或 PDF。它的[常见问题](https://gofullpage.com/faq)称，免费版对截图次数以及图片和 PDF 导出没有限制。[Premium](https://gofullpage.com/premium) 在 7 天试用后每年 $12，增加裁剪、标注（模糊、文字、高亮）、URL 和时间戳，以及智能 PDF 分页。

其代码不公开。常见问题称，开发者在 2018 年为原始的 MIT 项目创建了一个私有分支。2026 年 8 月，GoFullPage 因其[博客](https://blog.gofullpage.com/2026/08/11/gofullpage-chrome-update/)所说的“a copyright-related issue”（一个与版权相关的问题）被从 Chrome 应用商店 下架，主商店页面于 2026 年 9 月 10 日恢复。官方 [Firefox 版](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/)于 2026 年 9 月 7 日推出。它在安装时不请求任何主机权限。

GoFullPage 适合想要一键截图和 PDF 导出、不需要标注的人，或愿意为标注付费的人。见 [GoFullPage 替代方案](/zh-cn/alternatives/gofullpage/)。

## FullPage Capture

[FullPage Capture](https://fullpagecapture.net/) 称截图、保存、复制和打印都免费，没有水印，也没有使用次数限制。它的 [Chrome 商店页面](https://chromewebstore.google.com/detail/ggacghlcchiiejclfdajbpkbjfgjhfol)介绍了一个免费编辑器，带箭头、形状、文字、荧光笔、编号徽章和模糊，另有带可点击链接的 PDF。Pro 在 7 天试用后每年 $19，增加可搜索 PDF、证据模式、批量截图和云上传。

其代码不公开，我们只找到了 Chrome 商店页面。它的清单要求访问所有网站，因此 Chrome 在安装时会显示“所有网站”警告。它适合需要可搜索 PDF 或批量截图、并接受该权限的人。见 [FullPage Capture 替代方案](/zh-cn/alternatives/fullpage-capture/)。

## Awesome Screenshot

[Awesome Screenshot](https://chromewebstore.google.com/detail/nlipoenfbbikpbjkfpfillcgkoblgpmj) 来自 Diigo，把截图与可录制桌面、标签页或摄像头的录屏器结合在一起。它的[价格页面](https://www.awesomescreenshot.com/pricing)列出的免费方案包含最多 100 张截图、基础标注和 720p 录像。Basic 按年付费每月 $5，Professional 按年付费每月 $6，录像最高 4K。它提供带分享链接的云存储，也支持本地保存。

它在安装时请求访问所有网站，其 Chrome 隐私部分披露会收集“Website content”（网站内容）。它的 [Firefox 商店页面](https://addons.mozilla.org/en-US/firefox/addon/screenshot-capture-annotate/)标明采用 Mozilla Public License 2.0，但我们没有找到公开的源代码仓库。它适合希望在一个工具中同时拥有分享链接和录屏器的团队。见 [Awesome Screenshot 替代方案](/zh-cn/alternatives/awesome-screenshot/)。

## FireShot

[FireShot](https://getfireshot.com/) 可把整页保存为带链接的 PDF、PNG 或 JPEG。根据其[购买页面](https://getfireshot.com/buy.php)，FireShot Pro 每年 $39.95，或一次性 $99.95，可用于两台设备。Pro 增加高级 PDF 导出、Windows 上带智能标注的编辑器、截图历史和批量截图。我们没有确认免费 Chrome 版包含哪些编辑工具。

其代码不公开。FireShot 在安装时不请求主机权限，但它请求原生消息传递权限，Chrome 会将其显示为一条单独的警告。它的 [Firefox 附加组件](https://addons.mozilla.org/en-US/firefox/addon/fireshot/)最后一次更新是在 2023 年 6 月 5 日。FireShot 适合想要批量截图或一次性许可证的 Windows 用户。见 [FireShot 替代方案](/zh-cn/alternatives/fireshot/)。

## Nimbus 和 FuseBase Pro

原来的 Nimbus Screenshot Chrome 商店页面现在显示“This item is not available”（此商品不可用），Nimbus 的截图页面会重定向到 [FuseBase](https://thefusebase.com/screenshot/)。Nimbus Web 现在发布 [FuseBase Pro](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn)，用于截图、屏幕和摄像头录制、标注、模糊和保存 PDF。它可上传到 FuseBase、Google Drive、Dropbox 和 Slack。

免费方案最多录制 5 分钟，Pro 最多 10 小时。[FuseBase 价格页面](https://thefusebase.com/pricing/)列出的是平台方案，没有写明扩展的价格。FuseBase Pro 在安装时请求访问所有网站。它适合已经在使用 FuseBase 的人。见 [Nimbus 替代方案](/zh-cn/alternatives/nimbus/)。

## 无需安装：浏览器内置工具

### Chrome DevTools

打开 DevTools，按 Ctrl+Shift+P（macOS 上为 Cmd+Shift+P），输入“screenshot”，然后选择 **Capture full size screenshot**（截取完整尺寸的屏幕截图）。Chrome 会保存一个 PNG。文档中没有介绍编辑器；[Command Menu 文档](https://developer.chrome.com/docs/devtools/command-menu)列出了其他截图命令。见 [Chrome 指南](/zh-cn/full-page-screenshot/chrome/)。

### Microsoft Edge Screenshot

根据 Microsoft 的[策略页面](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled)，Edge 已把 Web Capture 更名为 Screenshot，按 Ctrl+Shift+S 即可打开。它可截取整页或某个区域，你可以用笔或触控进行标记。见 [Edge 指南](/zh-cn/full-page-screenshot/edge/)。

### Firefox Screenshots

根据 [Mozilla 的指南](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/)，右键点击页面，选择 **Take Screenshot**（截图），然后选择 **Save full page**（保存整个页面）。你可以复制或下载结果。上传到 Mozilla 服务器的功能已于 2019 年 5 月随 Firefox 67 终止。见 [Firefox 指南](/zh-cn/full-page-screenshot/firefox/)。

Safari、Brave、Opera、Vivaldi 和 Arc 请参阅[各浏览器指南](/zh-cn/full-page-screenshot/)。

## 该选哪一个

- **只截一个页面、就在今天、无需安装：** 你浏览器的内置工具。
- **免费标注和 PDF、安装时不访问所有网站、源代码可读：** OpenScreenShot。
- **一键截图、不需要标注：** GoFullPage 的免费版。
- **可搜索 PDF 或批量截图：** FullPage Capture Pro 或 FireShot Pro。
- **为团队提供分享链接和桌面录制：** Awesome Screenshot 或 FuseBase Pro。
- **截取桌面应用：** 使用桌面工具；见[适用于各平台的开源截图工具](/zh-cn/blog/open-source-screenshot-tools/)。
- **通过脚本或 CI 截图：** 见[面向开发者的网站截图工具](/zh-cn/blog/website-screenshot-tools-for-developers/)。

所有这些工具在处理无限滚动的信息流和延迟加载的图片时都可能遇到困难；[Chrome 整页截图指南](/zh-cn/blog/full-page-screenshot-chrome/)说明了如何检查截图。如需并排对比 OpenScreenShot、GoFullPage 和 FullPage Capture，请参阅[对比页面](/zh-cn/compare/)。
