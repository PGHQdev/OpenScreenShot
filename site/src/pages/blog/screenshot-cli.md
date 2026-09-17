---
layout: ../../layouts/Article.astro
title: Take website screenshots from the command line
description: Use the OpenScreenShot CLI to save PNG screenshots with a fixed viewport, full-page capture, or binary output to stdout.
audience: Developers & agents
order: 4
---

The OpenScreenShot CLI captures a webpage as a PNG using a locally installed Chrome-compatible browser. It is a separate package from the browser extension. With Node.js, pnpm, and Chrome installed, run:

```sh
pnpm dlx openscreenshot shot https://example.com --out screenshot.png --full
```

The command starts a separate headless browser, navigates to the URL, writes the image, and closes the browser. It does not attach to the tabs or signed-in profile in your everyday browser.

## Set the viewport explicitly

For a viewport screenshot, omit `--full`. Width defaults to 1280 pixels and height defaults to 800 pixels. Set both when a layout needs a particular size:

```sh
pnpm dlx openscreenshot shot https://example.com --out desktop.png --width 1440 --height 900
pnpm dlx openscreenshot shot https://example.com --out narrow.png --width 390 --height 844
```

Width accepts integers from 200 to 3840; height accepts integers from 200 to 2160. A narrow viewport tests responsive layout at that width. It does not emulate a phone’s touch input, device pixel ratio, or mobile browser: the CLI uses a desktop user agent.

Add `--full` to capture beyond the viewport. The headless browser’s full-page capture differs from the extension’s scroll-and-stitch implementation; do not assume every dynamic page will look identical in both.

## Save a file or write to stdout

Without `--out`, the command writes `screenshot.png` in the current directory. Use an explicit filename to make artifacts easy to identify. Create any parent output directory before running the command.

`--out -` writes PNG bytes to stdout:

```sh
pnpm dlx openscreenshot shot https://example.com --out - > screenshot.png
```

Use binary-safe redirection. The CLI always produces PNG; naming the output `capture.jpg` or `capture.pdf` does not convert it. For annotated images or PDF output, use the [extension editor](/docs/#export).

## Resolve common failures

If Chrome is not found, install it or set `CHROME_PATH` to the browser executable. For example, on a Linux system where Chromium is installed at that path:

```sh
CHROME_PATH=/usr/bin/chromium pnpm dlx openscreenshot shot https://example.com --out screenshot.png
```

Navigation waits for `networkidle2` with a 30-second timeout. The current command has no custom wait, selector, cookie, or login options. A successful capture also does not prove that the application loaded correctly: inspect the PNG for error pages, loading states, and missing assets.

Exit code 0 indicates the capture command completed, 1 indicates a capture failure, and 2 indicates invalid usage or validated arguments. Use those codes when chaining commands, then review the image itself.

For repeatable artifacts, read [the CI capture guide](/blog/screenshots-for-ci/). For an agent-driven workflow, see [the MCP setup guide](/blog/screenshot-mcp-server/). The [CLI source](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src) is the reference for the available flags.
