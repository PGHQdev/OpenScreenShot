---
layout: ../../layouts/Article.astro
title: Set up a local screenshot MCP server for an AI agent
description: Connect OpenScreenShot to a stdio MCP client and request PNG screenshots with explicit URL, viewport, and full-page options.
audience: Developers & agents
order: 5
---

OpenScreenShot provides a local MCP server with one tool: `capture_screenshot`. An MCP client can call it with a webpage URL and receive PNG image content. The server launches a separate headless Chrome-compatible browser on your machine; the browser extension is not required.

## Add the server to your MCP client

Install Node.js, pnpm, and a Chrome-compatible browser first. Add a server entry using your client’s configuration format. Clients that accept an `mcpServers` object can use:

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

The client must be able to find `pnpm` on its executable path. Restart or reload its MCP connections after saving the configuration. The server uses stdio, so the client starts a local process; there is no hosted MCP URL to enter.

If Chrome is installed somewhere unusual, pass `CHROME_PATH` through the client’s environment configuration. Use the full path to the executable, rather than the folder containing the application.

## Call capture_screenshot

A minimal tool input is:

```json
{ "url": "https://example.com" }
```

This produces a viewport capture at the default 1280 × 800 size. Set the viewport and full-page option explicitly for a reproducible request:

```json
{
  "url": "https://example.com",
  "fullPage": true,
  "width": 1440,
  "height": 900
}
```

`width` accepts integers from 200 to 3840 and `height` from 200 to 2160. The tool returns MCP image content with MIME type `image/png`. There is no output-path argument for this tool. Whether the result is displayed or saved depends on the client; use the [CLI](/blog/screenshot-cli/) when you need a named file directly.

## What the agent can and cannot see

The capture starts in a fresh headless browser. It does not inherit the cookies or signed-in session from your ordinary Chrome window. A page behind authentication may therefore produce a login screen. The current tool does not expose login steps, cookie injection, selector waits, or interactive clicks.

Ask the agent to identify what is actually visible in the returned image before drawing conclusions. A screenshot can help inspect layout, spacing, and visible errors; it cannot establish that a form submits correctly or that keyboard navigation works.

## Where does the screenshot go?

The screenshot is generated locally and returned to the MCP client. If that client uses a hosted model, it may transmit the returned image to the model provider according to its own settings. Local capture does not imply that the whole agent conversation stays on the device.

For automated captures with predictable dimensions, see [screenshots for CI](/blog/screenshots-for-ci/). The [agent capture skill](/skills/capture-screenshot.md) and [server source](https://github.com/pghqdev/OpenScreenShot/blob/main/mcp/src/serve.ts) provide the machine-oriented instructions and tool definition.
