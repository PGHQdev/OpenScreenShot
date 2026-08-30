---
name: capture-screenshot
description: Capture a PNG screenshot of any public web page locally, via the open-source OpenScreenShot CLI or MCP server.
---

# capture-screenshot

Capture a screenshot of a URL on your own machine. No account, no hosted service.

## Install

`npx openscreenshot` (uses the Chrome already on your machine — no browser download; set `CHROME_PATH` if it can't be found).

## CLI

`openscreenshot shot https://example.com --out shot.png --full`

## MCP (for agents)

Add to your MCP client config:
`{ "command": "npx", "args": ["openscreenshot", "serve"] }`
Then call the `capture_screenshot` tool with `{ "url": "https://example.com" }`.

Source: https://github.com/pghqdev/OpenScreenShot
