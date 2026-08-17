<div align="center">

<img src="docs/assets/brand-mark.svg" alt="" width="88" height="88" />

# OpenScreenShot

**Capture anything. Edit it instantly.**

Open-source full page screenshot extension for Chrome — entire-scrolling-page, region, and
visible-area capture with a built-in annotation editor and PDF export. 100% local and
private: works fully offline, and your screenshots never leave your device.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/hdabbojjccojlapnfjpdppcpfcnhgmdp?label=Chrome%20Web%20Store&logo=googlechrome&logoColor=white&color=E8503A)](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)
[![Users](https://img.shields.io/chrome-web-store/users/hdabbojjccojlapnfjpdppcpfcnhgmdp?label=users&color=F5A623)](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)
[![License](https://img.shields.io/badge/license-MIT-1B1A17)](./LICENSE)
[![Manifest V3](https://img.shields.io/badge/manifest-v3-1B1A17)](./manifest.json)

[**➜ Add to Chrome**](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) &nbsp;·&nbsp; [Website](https://openscreenshot.app) &nbsp;·&nbsp; [Docs](https://openscreenshot.app/docs/) &nbsp;·&nbsp; [Support](https://openscreenshot.app/support/) &nbsp;·&nbsp; [Roadmap](./ROADMAP.md)

<img src="docs/assets/hero.jpg" alt="OpenScreenShot popup open over a web page with a region selection in progress" width="860" />

</div>

---

Capture the **entire scrolling page** (scroll-and-stitch), the **visible viewport**, or a
**selected region** — then annotate the result and export as PNG, JPEG, WebP, or PDF.
Built as a Manifest V3 extension with no servers, no accounts, and no telemetry.

## From page to finished screenshot

|                                        1 · Capture                                        |                                             2 · Edit                                             |                                           3 · Export                                           |
| :---------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------: |
| <img src="docs/assets/step-1.jpg" alt="Popup with Full page, Visible area, and Region" /> | <img src="docs/assets/step-2.jpg" alt="Editor with step badges, highlighter, arrow, and rect" /> | <img src="docs/assets/step-3.jpg" alt="Export dialog with PNG, JPEG, WebP, and PDF options" /> |
|               One click in the popup, a keyboard shortcut, or keys `1`–`3`                |                   Full-screen editor opens on every capture, undo all the way                    |                   PNG, JPEG, WebP, or multi-page PDF — download or clipboard                   |

## Features

- **Full Page** — scroll-and-stitch the whole page top to bottom with live progress; fixed headers are composited once at the top. Works on pages that scroll an inner element, too.
- **Visible Area** — capture exactly what's on screen right now.
- **Selected Region** — click & drag to grab an area, with a Capture/Cancel bar to confirm.
- **Annotation editor** — rectangle, arrow, line, pen, highlighter, text, numbered step badges, blur (soft, mosaic, or solid redaction), spotlight, crop; select, move/resize any annotation, undo/redo; hold Shift for squares and 45° lines; color, stroke width & font size remembered across sessions.
- **Export** — PNG, JPEG, WebP, and PDF (single or multi-page with overlap), or copy straight to clipboard with `Cmd/Ctrl+C`.
- **Keyboard-first** — capture shortcuts, number keys `1`–`3` in the popup, `1`–`8` for the editor palette, and a "reopen last capture" escape hatch.
- **Settings** — theme, default format, quality, filename template, PDF defaults.
- **Polished & accessible** — dark/light UI, modal focus trap, toolbar arrow-key navigation.

## Install

**From the Chrome Web Store** — [**Add to Chrome**](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). That's it.

**From source** — see [Development](#development) below.

## Agents & CLI

[![npm](https://img.shields.io/npm/v/openscreenshot?label=openscreenshot&color=E8503A)](https://www.npmjs.com/package/openscreenshot)

`openscreenshot` (npm) is a **separate, optional, local** tool for scripting screenshots from
the command line or from an AI agent. It drives the Chrome already on your machine (no
browser download) and runs entirely on your machine — no account, no hosted service. The
browser extension above is unaffected: it stays a client-side, no-server capture tool.

**Run it** — no install needed:

```bash
npx openscreenshot shot https://example.com --out shot.png --full
```

Set `CHROME_PATH` if your Chrome can't be found automatically.

**MCP server (for agents)** — add to your MCP client config:

```json
{ "command": "npx", "args": ["openscreenshot", "serve"] }
```

Then call the `capture_screenshot` tool with `{ "url": "https://example.com" }`.

Like the extension, this tool runs locally and uploads nothing — it just renders a page and
hands you the PNG.

## Permissions

OpenScreenShot requests the minimum permissions a screenshot tool needs — and explains
every one:

| Permission                       | Why                                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| `activeTab`                      | Access the current tab — only when you click the extension or use a shortcut                       |
| `scripting`                      | Inject on-demand page functions for scroll-and-stitch & region selection                           |
| `storage` (+ `unlimitedStorage`) | Settings, onboarding state, and stashing large full-page PNGs for the editor                       |
| `downloads`                      | Save exports to your Downloads folder                                                              |
| `options_ui`                     | The editor is registered as a full-tab options page so crxjs bundles it; opened after each capture |

**`host_permissions` is empty.** We never request `<all_urls>` — `activeTab` grants access
on your click, and `scripting` runs only within that grant. The extension cannot read any
site in the background.

## Privacy

**100% local. 100% private. Works fully offline.**

Your screenshots never leave your device — there are no servers, no accounts, no sign-ups,
and no tracking. Every capture, edit, and export happens right inside your browser, so
nothing is ever uploaded, stored in the cloud, or seen by anyone but you. You could pull
the network cable and it would work exactly the same.

Read the full [Privacy Policy](./PRIVACY.md).

## Development

### Tech stack

- **TypeScript** (strict) + **Preact** for the popup/editor UI
- **Vite** + **[@crxjs/vite-plugin](https://github.com/crxjs/crxjs)** for Manifest V3 bundling & HMR
- **Canvas compositing in-page** via on-demand `chrome.scripting` injection (no offscreen document needed)
- **[jsPDF](https://github.com/parallax/jsPDF)** (lazy-loaded, zero vulnerabilities) for PDF export
- **Vitest** for unit tests, **Playwright** for e2e (planned)

### Prerequisites

- Node.js 22+
- npm 10+

### Install & develop

```bash
npm install
npm run icons      # generate the extension icons into public/icons
npm run dev        # start Vite + crxjs with HMR (writes to dist/)
```

Then load the extension in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `dist/` folder

### Build for production

```bash
npm run build      # type-check + bundle into dist/
```

Load `dist/` as an unpacked extension, or run `npm run package` to produce
`openscreenshot-vX.Y.Z.zip` for the Chrome Web Store.

### Scripts

| Script              | Description                                         |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Vite dev server with extension HMR                  |
| `npm run build`     | Type-check and bundle the extension into `dist/`    |
| `npm run typecheck` | Run `tsc --noEmit`                                  |
| `npm run lint`      | ESLint (flat config)                                |
| `npm test`          | Run unit tests (Vitest)                             |
| `npm run icons`     | Regenerate extension icons from the SVG source      |
| `npm run shots`     | Re-render the marketing screenshots (`docs/assets`) |
| `npm run format`    | Format the codebase with Prettier                   |
| `npm run package`   | Build + zip `dist/` for store submission            |

### Project structure

```
openscreenshot/
├── manifest.json            # MV3 manifest (crxjs entry)
├── public/
│   ├── icons/               # generated extension icons
│   └── _locales/en/         # i18n messages
├── src/
│   ├── background/          # service worker (capture coordinator)
│   ├── content/             # on-demand capture funcs (scroll, region)
│   ├── editor/              # annotation editor + export (Preact, own tab)
│   ├── popup/               # popup UI (Preact)
│   └── shared/              # design tokens, messaging, storage, types, utils
├── mcp/                     # optional local CLI + MCP server
├── tests/                   # unit + e2e tests
└── scripts/
    ├── generate-icons.mjs   # SVG → PNG/ICO icon pipeline
    └── shots/               # marketing screenshot pipeline (npm run shots)
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md). Please follow the
[Code of Conduct](./CODE_OF_CONDUCT.md). Curious what's next? Check the
[public roadmap](./ROADMAP.md).

<div align="center">

## Support the project

OpenScreenShot is free and open source. If you find it useful, consider supporting its
development — every coffee helps!

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/T7A624DAY7)

</div>

## License

[MIT](./LICENSE) © OpenScreenShot Contributors
