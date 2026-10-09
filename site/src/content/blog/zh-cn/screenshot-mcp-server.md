---
title: 为 AI 智能体设置本地截图 MCP 服务器
description: 将 OpenScreenShot 连接到 stdio MCP 客户端，并用明确的 URL、视口和整页选项请求 PNG 截图。
audience: developers
order: 5
---

OpenScreenShot 提供一个本地 MCP 服务器，它只有一个工具：`capture_screenshot`。MCP 客户端可以用网页 URL 调用它，并收到 PNG 图像内容。服务器会在你的机器上启动一个独立的 Chrome 兼容无头浏览器；不需要浏览器扩展。

## 把服务器添加到你的 MCP 客户端

请先安装 Node.js、pnpm 和一个 Chrome 兼容浏览器。按客户端的配置格式添加一个服务器条目。接受 `mcpServers` 对象的客户端可以使用：

```json
{
  "mcpServers": {
    "openscreenshot": {
      "command": "pnpm",
      "args": ["dlx", "openscreenshot", "serve"]
    }
  }
}
```

客户端必须能在其可执行文件路径中找到 `pnpm`。保存配置后，请重启或重新加载其 MCP 连接。服务器使用 stdio，因此由客户端启动一个本地进程；没有需要填写的托管 MCP URL。

如果 Chrome 安装在不常见的位置，请通过客户端的环境变量配置传入 `CHROME_PATH`。请使用可执行文件的完整路径，而不是包含该应用的文件夹。

## 调用 capture_screenshot

最简单的工具输入是：

```json
{ "url": "https://example.com" }
```

这会以默认的 1280 × 800 尺寸截取视口。如需可复现的请求，请明确设置视口和整页选项：

```json
{
  "url": "https://example.com",
  "fullPage": true,
  "width": 1440,
  "height": 900
}
```

`width` 接受 200 到 3840 的整数，`height` 接受 200 到 2160 的整数。该工具返回 MIME 类型为 `image/png` 的 MCP 图像内容。该工具没有输出路径参数。结果是显示还是保存取决于客户端；如果你需要直接得到一个命名文件，请使用 [CLI](/zh-cn/blog/screenshot-cli/)。

## 智能体能看到什么、不能看到什么

截图在一个全新的无头浏览器中开始。它不会继承你平常 Chrome 窗口中的 Cookie 或登录会话。因此，需要身份验证的页面可能只会显示登录界面。当前工具不提供登录步骤、Cookie 注入、选择器等待或交互式点击。

在得出结论之前，请让智能体先说明返回的图片中实际可见的内容。截图有助于检查版式、间距和可见的错误；但它无法确认表单能否正确提交，也无法确认键盘导航是否可用。

## 截图会发送到哪里？

截图在本地生成，并返回给 MCP 客户端。如果该客户端使用托管模型，它可能会按照自身设置把返回的图片发送给模型提供方。本地截图并不意味着整个智能体对话都留在设备上。

如需尺寸可预测的自动截图，请参阅 [CI 截图](/zh-cn/blog/screenshots-for-ci/)。[智能体截图技能](/skills/capture-screenshot.md)和[服务器源代码](https://github.com/pghqdev/OpenScreenShot/blob/main/mcp/src/serve.ts)提供面向机器的说明和工具定义。
