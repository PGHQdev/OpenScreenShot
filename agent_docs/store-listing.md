# Chrome Web Store listing

Source of truth for the store listing text. The store reads the title and the
summary from the uploaded package (`public/_locales/en/messages.json`); the
full description below is pasted into the Developer Dashboard by hand — the
CWS API cannot set listing text.

## Title (manifest `extName`, max 75 chars)

Full Page Screenshot & Annotate - OpenScreenShot

## Summary (manifest `extDesc`, max 132 chars)

Full page, region & visible screenshots with an annotation editor. Export PNG, JPEG, WebP, PDF. 100% private, offline, no uploads.

## Full description (paste into dashboard; plain text, no markdown)

```
Capture a full page screenshot of any website in one click. OpenScreenShot is a free, open-source screenshot extension for Chrome that captures the entire scrolling page, a selected region, or the visible area, then opens the capture in a built-in annotation editor. Export as PNG, JPEG, WebP, or multi-page PDF. Everything runs on your device: no account, no uploads, no telemetry.

CAPTURE
• Full page screen capture — scrolls and stitches the whole page automatically, even very long pages
• Selected region — drag to select, fine-tune with arrow keys, repeat your last region
• Visible area — grab what is on screen right now
• Delayed capture (3s / 5s / 10s) for menus and hover states
• Right-click context menu and keyboard shortcuts for every mode

ANNOTATE
• Arrows, shapes, lines, text, and highlighter
• Step number badges that stay in order
• Blur or redact sensitive information before you share
• Spotlight to dim everything except the part that matters
• Crop, resize, zoom to cursor, full undo/redo history

EXPORT
• PNG, JPEG, or WebP with quality control
• Multi-page PDF: A4 or Letter, fit-to-page or split with margins
• Copy to clipboard from anywhere in the editor
• Filename templates and saved defaults

PRIVATE BY DESIGN
Your screenshots never leave your device. Capture, editing, and export all run locally, and the extension works fully offline. No sign-up, no tracking, no third-party services, and only the minimum permissions a screenshot needs.

OPEN SOURCE
OpenScreenShot is MIT-licensed. Read the code, file issues, or contribute at github.com/pghqdev/OpenScreenShot.

WHO IT IS FOR
Developers filing bug reports, QA testers, designers collecting references, writers building tutorials and documentation, support teams, and anyone who needs a scrolling screenshot of an entire webpage.
```

## Assets

- Screenshots: `docs/assets/store/cws-1..4.jpg` (1280x800) — rendered by `npm run shots`
- Promo tile: `docs/assets/store/promo-tile.jpg` (440x280) — rendered by `npm run shots`

## Dashboard steps (manual)

1. Paste the full description above.
2. Upload the four screenshots and the promo tile.
3. Confirm category (Tools) and language (English).
4. Title and summary update only when the next release package is uploaded.
