<div align="center">

<img src="docs/assets/brand-mark.svg" alt="" width="88" height="88" />

# OpenScreenShot

**Screenshots and tab recording for Chrome. Everything stays on your device.**

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/hdabbojjccojlapnfjpdppcpfcnhgmdp?label=Chrome%20Web%20Store&logo=googlechrome&logoColor=white&color=E8503A)](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)
[![Users](https://img.shields.io/chrome-web-store/users/hdabbojjccojlapnfjpdppcpfcnhgmdp?label=users&color=F5A623)](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)
[![CI](https://github.com/pghqdev/OpenScreenShot/actions/workflows/ci.yml/badge.svg)](https://github.com/pghqdev/OpenScreenShot/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-1B1A17)](./LICENSE)

[**➜ Add to Chrome**](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) &nbsp;·&nbsp; [Website](https://openscreenshot.app) &nbsp;·&nbsp; [Docs](https://openscreenshot.app/docs/) &nbsp;·&nbsp; [Roadmap](./ROADMAP.md)

<img src="docs/assets/demo.gif" alt="A full page is captured, annotated in the editor, and exported as PNG" width="860" />

</div>

Most screenshot extensions want an account, a watermark, or your browsing history.
This one runs on your machine and wants nothing: no server, no telemetry, works offline.

Capture a full page, the visible area, or a region, then annotate and export.
Record the current tab when a still image is not enough.

## Features

- **Capture whole pages**, even behind sticky headers and inside nested scrollers
- **Annotate** with arrows, text, numbered steps, spotlight, and crop, with full undo
- **Blur or redact secrets** before you share
- **Record the tab** with auto-zoom at your clicks, mic and webcam, and trim
- **Export** as PNG, JPEG, WebP, or multi-page PDF, or copy straight to the clipboard

The full tour, every shortcut, and the settings reference live in the
[docs](https://openscreenshot.app/docs/).

## Install

[**Add to Chrome**](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) —
works on Chrome, Edge, Brave, Arc, and other Chromium browsers. To build from source, see
[Development](#development).

## Permissions & privacy

`host_permissions` is empty: `activeTab` grants access on your click, and the extension
cannot read any site in the background. Captures, recordings, and edits stay in local
browser storage until you export or delete them. Full policy: [PRIVACY.md](./PRIVACY.md).

<details>
<summary><b>Every permission, line by line</b></summary>

<br />

| Permission                       | Why                                                                                                                                            |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `activeTab`                      | Access the current tab — only when you click the extension, use a shortcut, or pick a capture from the right-click menu                        |
| `scripting`                      | Inject on-demand page functions for scroll-and-stitch, region selection, the quick-mode clipboard write, and the in-page recording control bar |
| `storage` (+ `unlimitedStorage`) | Settings, onboarding state, the last region rect, editing drafts, and stashing large full-page PNGs and recording chunks for the editor        |
| `downloads`                      | Save exports, quick-mode captures, and recording exports to your Downloads folder                                                              |
| `contextMenus`                   | Add one capture submenu to the page right-click menu                                                                                           |
| `clipboardWrite`                 | Copy a screenshot from the editor or from quick mode; it never reads the clipboard                                                             |
| `offscreen`                      | Run the recording engine in a hidden document — `MediaRecorder` and the IndexedDB writes need a page context a service worker doesn't have     |
| `tabCapture` (optional)          | Requested once, at your first recording; every recording after that starts in one click                                                        |
| `<all_urls>` (optional host)     | Only if you turn on "Record across sites" — keeps the cursor overlay alive when a recording navigates to a new origin                          |

</details>

## Development

TypeScript (strict) + Preact, bundled by Vite + [@crxjs/vite-plugin](https://github.com/crxjs/crxjs).
One runtime dependency (Preact); unit tests with Vitest. Node.js 22+ and npm 10+.

```bash
npm install
npm run icons      # generate the extension icons into public/icons
npm run dev        # Vite + crxjs with HMR (writes to dist/)
```

Load `dist/` via `chrome://extensions` → Developer mode → **Load unpacked**.

`npm run build` type-checks and bundles; `npm run package` produces the store zip. Other
scripts: `typecheck`, `lint`, `test`, `format`, `shots` (marketing screenshots),
`site:dev` / `site:deploy` (openscreenshot.app).

<details>
<summary><b>Project structure</b></summary>

<br />

```
openscreenshot/
├── manifest.json            # MV3 manifest (crxjs entry)
├── public/                  # icons + i18n messages
├── src/
│   ├── background/          # service worker (capture + recording coordinator)
│   ├── content/             # on-demand capture funcs (scroll, region, recording overlay)
│   ├── editor/              # annotation editor + export (Preact, own tab)
│   ├── offscreen/           # recording engine: MediaRecorder + IndexedDB chunks
│   ├── popup/               # popup UI (Preact)
│   ├── recorder/            # recording editor: timeline, zoom, trim, export (Preact, own tab)
│   └── shared/              # design tokens, messaging, storage, types, utils
├── mcp/                     # optional local CLI + MCP server
├── docs/                    # openscreenshot.app, served by site-worker.js
├── tests/unit/              # unit tests (Vitest)
└── scripts/                 # icon + screenshot pipelines
```

</details>

## Screenshots from the CLI or an agent

[![npm](https://img.shields.io/npm/v/openscreenshot?label=openscreenshot&color=E8503A)](https://www.npmjs.com/package/openscreenshot)

`openscreenshot` (npm) is a separate, optional tool that drives the Chrome already on your
machine — also fully local:

```bash
npx openscreenshot shot https://example.com --out shot.png --full
```

As an MCP server, add `{ "command": "npx", "args": ["openscreenshot", "serve"] }` to your
client config and call the `capture_screenshot` tool.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and the [roadmap](./ROADMAP.md). If
OpenScreenShot is useful to you, you can [buy me a coffee](https://ko-fi.com/T7A624DAY7).

## License

[MIT](./LICENSE) © OpenScreenShot @PGHQdev
