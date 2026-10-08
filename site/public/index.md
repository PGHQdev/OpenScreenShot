# OpenScreenShot

Free, open-source full page screenshot tool for Chrome and Firefox — full-page (scroll-and-stitch), visible-area, region, and element capture with annotation and PDF export, plus tab recording in Chrome with a timeline editor and MP4 or WebM export. 100% local and private: works fully offline, screenshots and recordings never leave the device.

- Chrome Web Store: https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp
- Firefox Add-ons: https://addons.mozilla.org/firefox/addon/openscreenshot/
- Source: https://github.com/pghqdev/OpenScreenShot
- Docs: https://openscreenshot.app/docs/
- Support: https://openscreenshot.app/support/
- Privacy: https://openscreenshot.app/privacy/
- License: MIT

## Features

- Full Page — scroll-and-stitch capture of the entire page; a page taller than one image saves as up to six images
- Visible Area — capture exactly what's on screen
- Selected Region — click & drag to grab an area
- Capture element — hover to select a card, chart, table, or image and capture its exact bounds
- Capture from the popup, a keyboard shortcut, or the page's right-click menu, with an optional 3/5/10s delay and a repeat-last-region item that re-runs the previous selection rectangle
- Quick capture — send a shot straight to the clipboard or to disk, skipping the editor
- Annotation editor — shapes (rectangle, rounded, oval, triangle, optional solid fill), arrows (four tip styles, bendable), line, pen, highlighter, text, numbered step badges, blur (soft, mosaic, or solid redaction), spotlight, eyedropper, crop, and cut; select, move, and resize any annotation, with undo/redo and a reorderable tool rail
- Frame — presets, spacing, rounded corners, drop shadow, and a gradient, solid, or transparent background
- Drop or paste any image into the editor to annotate it — no capture needed
- Crash-safe — edits are saved locally as you work and offered back if the tab closes
- Export — PNG, JPEG, WebP, PDF (single or multi-page), at 25–200% or an exact pixel width, or copy to the clipboard
- Screen recording (Chrome) — record the current tab or part of it (optional `tabCapture` permission, requested once) from a control tab beside the page, so no controls appear in the video; mic, tab audio, and a webcam bubble; auto zoom at cursor clicks, manual zoom blocks, per-segment trim, click ripples, a frame, and an optional synthetic cursor; MP4 (H.264 + AAC) or WebM export; crash-safe 1-second chunks with recovery

## Agents & CLI

`openscreenshot` is a separate, optional, local CLI/MCP server for scripting screenshots. No account, no hosted service — it drives the Chrome already on your machine.

```bash
npx openscreenshot shot https://example.com --out shot.png --full
```

MCP server: `{ "command": "npx", "args": ["openscreenshot", "serve"] }`, tool `capture_screenshot`.

Skill: https://openscreenshot.app/skills/capture-screenshot.md

## Learn by task

Read the [blog and guides](https://openscreenshot.app/blog/) for full-page capture, PDF export, redaction, tool comparisons, CLI screenshots, MCP setup, and CI artifacts. See also [use cases](https://openscreenshot.app/use-cases/), [full-page screenshots by browser](https://openscreenshot.app/full-page-screenshot/), and [alternatives](https://openscreenshot.app/alternatives/). Every page has a Markdown copy at `<page URL>index.md`.

The optional CLI/MCP package starts a fresh headless browser, without your ordinary browser login session. MCP returns image content to the client, which may transmit it to a hosted model provider according to its settings.
