<div align="center">

<img src="https://openscreenshot.app/icon-192.png" alt="" width="72" height="72" />

# openscreenshot

**Website screenshots from your terminal, your CI, or your AI agent.**

A local CLI and MCP server. It drives the Chrome already on your machine.<br />
No hosted service. No API key. No account.

[![npm](https://img.shields.io/npm/v/openscreenshot?color=E8503A)](https://www.npmjs.com/package/openscreenshot) [![License](https://img.shields.io/badge/license-MIT-1B1A17)](https://github.com/PGHQdev/OpenScreenShot/blob/main/LICENSE) [![Node](https://img.shields.io/node/v/openscreenshot?color=1B1A17)](https://nodejs.org)

[Website](https://openscreenshot.app) · [CLI guide](https://openscreenshot.app/blog/screenshot-cli/) · [MCP guide](https://openscreenshot.app/blog/screenshot-mcp-server/) · [Report a bug](https://github.com/PGHQdev/OpenScreenShot/issues)

</div>

---

## Quick start

```sh
npx openscreenshot shot https://example.com --out example.png --full
```

That opens a headless Chrome, loads the page, saves a full-page PNG, and closes the browser.

**You need:** Node.js 22.12 or newer, and Google Chrome, Chromium, or Microsoft Edge.
The package ships no browser of its own, so the install stays small.

| Package manager | Run once                             | Install globally             |
| --------------- | ------------------------------------ | ---------------------------- |
| npm             | `npx openscreenshot shot <url>`      | `npm i -g openscreenshot`    |
| pnpm            | `pnpm dlx openscreenshot shot <url>` | `pnpm add -g openscreenshot` |
| Bun             | `bunx openscreenshot shot <url>`     | `bun add -g openscreenshot`  |

Install globally to use the `openscreenshot` command everywhere. For CI, add it to the
project instead (`npm i -D openscreenshot`), so each run uses the version in your lockfile.

## CLI

```
openscreenshot shot <url> [--out <file>|-] [--full] [--width <n>] [--height <n>]
```

| Option         | Default          | What it does                                              |
| -------------- | ---------------- | --------------------------------------------------------- |
| `<url>`        | required         | The page to capture. Use a full URL with `https://`.      |
| `--out <file>` | `screenshot.png` | Where to write the PNG. Use `-` to write bytes to stdout. |
| `--full`       | off              | Capture the whole scrollable page, not only the viewport. |
| `--width <n>`  | `1280`           | Viewport width in pixels, from 200 to 3840.               |
| `--height <n>` | `800`            | Viewport height in pixels, from 200 to 2160.              |

### Examples

```sh
# Full page
openscreenshot shot https://example.com --out page.png --full

# Fixed desktop viewport
openscreenshot shot https://example.com --out desktop.png --width 1440 --height 900

# Narrow viewport to check a responsive layout
openscreenshot shot https://example.com --out narrow.png --width 390 --height 844

# Pipe the PNG to another tool
openscreenshot shot https://example.com --out - > shot.png
```

The output is always PNG. A `.jpg` or `.pdf` file name does not convert it.

A narrow viewport changes the layout width only. The CLI keeps a desktop user agent, so it
does not emulate a phone's touch input or pixel ratio.

### Exit codes

| Code | Meaning                                                        |
| ---- | -------------------------------------------------------------- |
| `0`  | The PNG was written.                                           |
| `1`  | The capture failed, for example Chrome not found or a timeout. |
| `2`  | Bad usage or an option out of range.                           |

Exit code `0` means the browser saved an image. It does not prove that the page loaded
correctly, so look at the PNG for error pages or loading spinners.

## MCP server

`openscreenshot serve` starts a [Model Context Protocol](https://modelcontextprotocol.io)
server over stdio. Your AI client starts it as a local process; there is no URL to enter.

### Add it to your client

Clients that use an `mcpServers` object (Claude Desktop, Cursor, Windsurf, and others):

```json
{
  "mcpServers": {
    "openscreenshot": {
      "command": "npx",
      "args": ["-y", "openscreenshot", "serve"]
    }
  }
}
```

Claude Code:

```sh
claude mcp add openscreenshot -- npx -y openscreenshot serve
```

Restart or reload the client after you save the config. The client must find `npx` (or
`pnpm`, `bunx`) on its `PATH`.

### Tool: `capture_screenshot`

| Input      | Type    | Default | Notes                      |
| ---------- | ------- | ------- | -------------------------- |
| `url`      | string  | —       | Required. A full page URL. |
| `fullPage` | boolean | `false` | Capture the whole page.    |
| `width`    | integer | `1280`  | 200 to 3840.               |
| `height`   | integer | `800`   | 200 to 2160.               |

```json
{ "url": "https://example.com", "fullPage": true, "width": 1440, "height": 900 }
```

The tool returns the PNG as MCP image content (`image/png`). It does not write a file. To
save a named file, use the CLI.

## What it can and cannot capture

Each capture starts a fresh headless browser with an empty profile.

- **It can** capture any page a signed-out visitor can see: public sites, docs, status
  pages, staging builds, and `localhost` dev servers.
- **It cannot** see your cookies or signed-in sessions. A page behind a login shows the
  login screen.
- **It does not** click, type, wait for a selector, or set cookies. Navigation waits until
  the network is quiet (`networkidle2`), for up to 30 seconds.

For signed-in pages, annotations, or PDF export, use the
[OpenScreenShot browser extension](https://openscreenshot.app) for Chrome and Firefox.

## Use cases

- **CI/CD:** capture pages on every deploy for release notes, docs, or visual review.
  See the [CI guide](https://openscreenshot.app/blog/screenshots-for-ci/).
- **DevOps:** snapshot dashboards and status pages into incident reports and runbooks
  from cron or a chat command.
- **AI agents:** let an agent look at the page it just built or changed.

## Troubleshooting

**`Chrome not found`.** The CLI checks the standard install paths on macOS, Linux, and
Windows. If your browser is somewhere else, set `CHROME_PATH` to the executable file:

```sh
CHROME_PATH=/usr/bin/chromium openscreenshot shot https://example.com
```

On Windows, Chrome installed for one user lives under `%LOCALAPPDATA%`, and Edge is not
probed. Set `CHROME_PATH` for both. In an MCP client, set `CHROME_PATH` in the server's
`env` block.

**Timeout.** The page did not go quiet within 30 seconds. Pages with long-polling or
streaming connections can do this.

**Blank or half-loaded image.** Some pages render after the network goes quiet. The CLI
has no extra wait option yet.

## Privacy and security

- Everything runs on your machine. The package sends no telemetry and calls no
  OpenScreenShot server.
- In MCP mode, your client receives the image. If the client uses a hosted model, it may
  send the image to that model's provider.
- The headless browser runs with `--no-sandbox` so it works in containers and CI. Capture
  only URLs you trust.

## Links

- Source: [`mcp/` in PGHQdev/OpenScreenShot](https://github.com/PGHQdev/OpenScreenShot/tree/main/mcp)
- Browser extension: [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) · [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/)
- Support the project: [ko-fi.com/pghqdev](https://ko-fi.com/pghqdev)

MIT © OpenScreenShot @PGHQdev
