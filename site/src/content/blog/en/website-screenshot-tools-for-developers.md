---
title: Website screenshot tools for developers, CI, and AI agents
description: Compare the openscreenshot CLI and MCP server, shot-scraper, capture-website-cli, pageres-cli, Playwright, Puppeteer, and Playwright MCP by runtime, full-page support, CLI, MCP, video, and license.
audience: developers
order: 9
---

For a PNG of a public page from a shell script or CI job, a command-line tool is enough: openscreenshot, shot-scraper, capture-website-cli, or pageres-cli. When the capture needs a login, clicks, assertions, or video, write it with Playwright or Puppeteer. For an AI agent, a local MCP server returns screenshots to the model: `openscreenshot serve` takes one screenshot per call, and Playwright MCP drives a whole browser session.

The `openscreenshot` package is our product, and this page says where it is the weaker choice. It compares features and does not rank the tools. All facts are as of 9 October 2026 and come from each project’s repository, package registry, or official docs, linked below.

## The tools at a glance

| Tool                | Language / runtime                                  | Full page            | CLI         | MCP                    | Video              | License    |
| ------------------- | --------------------------------------------------- | -------------------- | ----------- | ---------------------- | ------------------ | ---------- |
| openscreenshot      | Node.js 22.12+, installed Chrome, Chromium, or Edge | `--full`             | Yes         | Yes, stdio             | No                 | MIT        |
| shot-scraper        | Python 3.10+, Playwright browsers                   | Default              | Yes         | Not listed             | Yes, WebM or MP4   | Apache-2.0 |
| capture-website-cli | Node.js 20+, Puppeteer Chrome                       | `--full-page`        | Yes         | Not listed             | No                 | MIT        |
| pageres-cli         | Node.js 20+, Puppeteer Chrome                       | Default              | Yes         | Not listed             | No                 | MIT        |
| Playwright          | Node.js, Python, Java, .NET                         | `fullPage: true`     | Test runner | Through Playwright MCP | Yes                | Apache-2.0 |
| Puppeteer           | Node.js 22.12+                                      | `fullPage: true`     | Not listed  | Not listed             | Yes, MP4 in Chrome | Apache-2.0 |
| Playwright MCP      | Node.js through `npx`, or Docker                    | `fullPage` parameter | Server only | Yes, stdio or HTTP     | Yes, opt-in        | Apache-2.0 |

“Not listed” means the project’s own docs that we checked do not describe the feature.

## openscreenshot (CLI and MCP server)

[openscreenshot](https://www.npmjs.com/package/openscreenshot) drives the Chrome, Chromium, or Edge already on your machine through `puppeteer-core`, so it downloads no browser. One command saves a full-page PNG:

```sh
npx openscreenshot shot https://example.com --out example.png --full
```

The flags are `--out` (a file, or `-` for stdout), `--full`, `--width` (200 to 3840, default 1280), and `--height` (200 to 2160, default 800). Exit code 0 means a PNG was written, 1 means the capture failed, and 2 means bad usage. `openscreenshot serve` starts an MCP server over stdio with one tool, `capture_screenshot`, which takes `url`, `fullPage`, `width`, and `height` and returns PNG image content. The [CLI guide](/blog/screenshot-cli/), [MCP guide](/blog/screenshot-mcp-server/), and [CI guide](/blog/screenshots-for-ci/) cover setup, and the [source](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src) is the reference.

Where it is the weaker choice:

- Each capture starts a fresh browser with an empty profile. It has no cookies, login, clicks, or selector waits, so a page behind a login shows the login screen.
- Navigation waits for `networkidle2` for up to 30 seconds, with no extra wait option. Pages that render after the network goes quiet can come out half-loaded.
- Output is PNG only, with no PDF or video.
- The MCP server is local stdio only, with no hosted URL or HTTP transport. The tool returns an image and does not write a file.
- The browser runs with `--no-sandbox` so it works in containers. Capture only URLs you trust.
- On Windows, Edge and per-user Chrome installs are not detected; set `CHROME_PATH`.

For signed-in pages, annotation, or PDF export by hand, use the [browser extension](/docs/).

## shot-scraper

[shot-scraper](https://github.com/simonw/shot-scraper) is a Python tool built on Playwright. Install it, download its browser, and take a screenshot, per its [screenshot docs](https://github.com/simonw/shot-scraper/blob/main/docs/screenshots.md):

```sh
pip install shot-scraper
shot-scraper install
shot-scraper https://example.com -o example.png
```

When you omit `--height`, the screenshot is full page. `--selector` captures one element, `shot-scraper pdf` saves a PDF, and `multi` runs a YAML list of shots. The `video` command, added in [1.10](https://github.com/simonw/shot-scraper/releases/tag/1.10), records WebM from a YAML storyboard, and `--mp4` converts it with ffmpeg. Chromium is the default browser, and Firefox and WebKit are installable. Pick it when your team works in Python or you want screenshots, PDFs, and scripted demo videos from one tool.

## capture-website-cli

[capture-website-cli](https://github.com/sindresorhus/capture-website-cli) is a Node.js tool by Sindre Sorhus that captures pages with Puppeteer. The default is the viewport; `--full-page` captures the whole scrollable page:

```sh
npm install --global capture-website-cli
capture-website https://example.com --output=screenshot.png --full-page
```

Without `--output`, it writes the image to stdout. It outputs PNG, JPEG, or WebP. Flags such as `--element`, `--hide-elements`, `--remove-elements`, `--click-element`, `--dark-mode`, `--style`, and `--script` prepare the page before capture, which openscreenshot cannot do. Pick it when you need to hide cookie banners or inject CSS before a capture.

## pageres-cli

[pageres-cli](https://github.com/sindresorhus/pageres-cli) captures several URLs at several resolutions in one run:

```sh
pageres https://example.com 1366x768 1600x900
```

It captures every URL and resolution pair, full page by default; `--crop` limits each image to the set height. Output is PNG or JPEG, and the default size is 1366x768. Device keywords such as `iphone5s` are no longer supported. Activity is low: the last release, v9.0.0 on 9 September 2025, raised the Node.js requirement to 20 and added three flags. Pick it for a quick responsive check across widths.

## Playwright

[Playwright](https://github.com/microsoft/playwright) is Microsoft’s automation and test framework for Chromium, Firefox, and WebKit, with bindings for Node.js, Python, Java, and .NET. A full-page screenshot is one option on [`page.screenshot`](https://playwright.dev/docs/api/class-page#page-screenshot):

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://playwright.dev/docs/api/class-page#page-pdf) works in headless Chromium only. [Video recording](https://playwright.dev/docs/videos) is a context option, and the test runner can keep video only for failed tests. Pick Playwright when the screenshot is one step in a test that logs in, clicks, and asserts.

## Puppeteer

[Puppeteer](https://github.com/puppeteer/puppeteer) is Google’s Node.js library for Chrome and Firefox. `npm i puppeteer` downloads Chrome for Testing. The [screenshot options](https://pptr.dev/api/puppeteer.screenshotoptions) use the same shape:

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://pptr.dev/api/puppeteer.page.pdf) generates a PDF with print CSS. [`page.record()`](https://pptr.dev/api/puppeteer.page.record), added in puppeteer-core 25.10.0, records MP4 in Chrome. Firefox runs over WebDriver BiDi, where some features are not supported. openscreenshot is a thin wrapper over `puppeteer-core`, so use Puppeteer directly when you need more than its four capture options.

## Playwright MCP

[Playwright MCP](https://github.com/microsoft/playwright-mcp) lets an agent drive a browser through accessibility snapshots, so it needs no vision model. Its [README](https://github.com/microsoft/playwright-mcp/blob/v0.0.83/README.md) gives this standard config:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

The `browser_take_screenshot` tool takes a `fullPage` parameter and returns PNG, JPEG, or WebP. PDF and video tools are opt-in through `--caps`. The browser runs headed by default and keeps a persistent profile, so logins can carry over; `--isolated`, `--storage-state`, and `--extension` (to connect to a running Chrome or Edge) change that. `--port` serves HTTP instead of stdio. It is still a 0.0.x release (v0.0.83). Pick it over `openscreenshot serve` when the agent must sign in, click, or fill forms.

## Which one to pick

- **A PNG of a public page in a script or CI artifact:** openscreenshot, shot-scraper, or capture-website-cli.
- **The same page at several widths:** pageres-cli.
- **Hide elements or inject CSS first:** capture-website-cli or shot-scraper.
- **PDF or a scripted demo video from the command line:** shot-scraper.
- **Login, clicks, and assertions in a test suite:** Playwright or Puppeteer.
- **An agent that only needs to look at a page:** `openscreenshot serve`.
- **An agent that must interact with the page or sign in:** Playwright MCP.
- **A person who captures and annotates signed-in pages:** an extension; see the [full-page extension comparison](/blog/full-page-screenshot-extensions/).
