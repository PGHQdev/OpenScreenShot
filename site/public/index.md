# OpenScreenShot

Open-source full page screenshot tool for Chrome — entire-scrolling-page, region, and visible-area capture with annotation and PDF export. 100% local and private: works fully offline, screenshots never leave the device.

- Chrome Web Store: https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp
- Source: https://github.com/pghqdev/OpenScreenShot
- Docs: https://openscreenshot.app/docs/
- Support: https://openscreenshot.app/support/
- License: MIT

## Features

- Full Page — scroll-and-stitch capture of the entire page
- Visible Area — capture exactly what's on screen
- Selected Region — click & drag to grab an area
- Capture from the popup, a keyboard shortcut, or the page's right-click menu, with an optional 3/5/10s delay and a repeat-last-region shortcut
- Quick capture — send a shot straight to the clipboard or to disk, skipping the editor
- Annotation editor — rectangle, arrow, line, pen, highlighter, text, numbered step badges, blur (soft, mosaic, or solid redaction), spotlight, eyedropper, crop; select, move, and resize any annotation, with undo/redo
- Beautify — padding, rounded corners, drop shadow, and a gradient, solid, or transparent background
- Drop or paste any image into the editor to annotate it — no capture needed
- Crash-safe — edits are saved locally as you work and offered back if the tab closes
- Export — PNG, JPEG, WebP, PDF (single or multi-page), at 25–200% or an exact pixel width, or copy to the clipboard
- Screen recording — record the current tab (optional `tabCapture` permission, requested once), with mic, tab audio, and a webcam bubble; auto zoom at cursor clicks, manual zoom blocks, per-segment trim, click ripples, Beautify frame, and WebM export; crash-safe 1-second chunks with recovery and continue-recording; an auto-hiding control bar (hides after 3s, returns at the bottom center) and an optional synthetic cursor overlay drawn from the recorded pointer path, in both the preview and the export

## Agents & CLI

`openscreenshot` is a separate, optional, local CLI/MCP server for scripting screenshots. No account, no hosted service — it drives the Chrome already on your machine.

```bash
npx openscreenshot shot https://example.com --out shot.png --full
```

MCP server: `{ "command": "npx", "args": ["openscreenshot", "serve"] }`, tool `capture_screenshot`.

Skill: https://openscreenshot.app/skills/capture-screenshot.md
