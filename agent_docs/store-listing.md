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
• Beautify: padding, rounded corners, shadow, and gradient backgrounds for polished sharing

EXPORT
• PNG, JPEG, or WebP with quality control
• Multi-page PDF: A4 or Letter, fit-to-page or split with margins
• Copy to clipboard from anywhere in the editor
• Filename templates and saved defaults
• Export at 25/50/100/200% or an exact pixel width

PRIVATE BY DESIGN
Your screenshots never leave your device. Capture, editing, and export all run locally, and the extension works fully offline. No sign-up, no tracking, no third-party services, and only the minimum permissions a screenshot needs.

OPEN SOURCE
OpenScreenShot is MIT-licensed. Read the code, file issues, or contribute at github.com/pghqdev/OpenScreenShot.

WHO IT IS FOR
Developers filing bug reports, QA testers, designers collecting references, writers building tutorials and documentation, support teams, and anyone who needs a scrolling screenshot of an entire webpage.
```

## Permission justifications (Privacy practices tab)

One field per permission in `manifest.json`. Paste as plain text.

**activeTab**

```
The capture runs against the tab the user acts on. A click on the toolbar button, a click on the OpenScreenShot right-click menu item, or one of the keyboard shortcuts grants activeTab for that tab, and the extension then reads its pixels with chrome.tabs.captureVisibleTab and injects the scroll and region-select helpers into it. activeTab keeps this scoped to the one tab the user chose, so the extension declares no host permissions and has no standing access to any site. Without it there is no way to screenshot the page the user is looking at.
```

**scripting**

```
Full page and region capture need to run code in the page. For a full page capture the extension injects a function that reads the document height, scrolls the page step by step, hides sticky and fixed elements during the scroll, and restores the scroll position afterwards; the visible frames are stitched into one image. For a region capture it injects the drag-to-select overlay that returns the chosen rectangle. Both scripts are self-contained functions bundled in the package, injected with chrome.scripting.executeScript only into the tab granted by activeTab, and removed when the capture ends. No remote code is loaded.
```

**storage**

```
chrome.storage.local holds three things, all on the device: the user settings (export format and quality, PDF page size, filename template, delay), the last region rectangle so "Repeat last region" can reuse it, and the capture that was just taken, which the editor page reads on open and then deletes. The extension has no server and no account, so this local store is the only place state can live. Nothing is sent anywhere.
```

**unlimitedStorage**

```
A capture is handed to the editor through chrome.storage.local as a PNG data URL. A full page screenshot of a long page is often larger than the 10 MB default quota for chrome.storage.local, so the write fails and the capture is lost without this permission. unlimitedStorage raises that limit. The extension writes one capture at a time and deletes it once the editor has loaded it.
```

**downloads**

```
Saving is the end of the workflow. When the user exports from the editor, the extension calls chrome.downloads.download with the generated PNG, JPEG, WebP, or PDF and the filename built from the user's template, so the file lands in the normal Downloads folder. The URL passed is always a local data or blob URL produced by the extension. The extension never reads, searches, or opens the user's download history.
```

**contextMenus**

```
OpenScreenShot uses contextMenus to add one "OpenScreenShot" submenu to the page right-click menu. The submenu holds the same capture actions as the toolbar popup: Full page, Visible area, Region, and Repeat last region. This gives users a second way to start a capture, next to the toolbar button and the keyboard shortcuts. The menu items are static and are created once at install time. The extension reads only the ID of the clicked menu item to select the capture mode. It does not read the page, the selected text, the link URL, or any other data from the click event. A click grants activeTab for that capture, in the same way that opening the popup does. Without this permission the right-click capture entry point cannot exist.
```

**Remote code**: No, I am not using remote code. All scripts are in the package.

**Data usage**: no data collected. The extension has no network code and no host permissions.

## Assets

- Screenshots: `docs/assets/store/cws-1..4.jpg` (1280x800) — rendered by `npm run shots`
- Promo tile: `docs/assets/store/promo-tile.jpg` (440x280) — rendered by `npm run shots`
- Marquee: `docs/assets/store/marquee.jpg` (1400x560) — rendered by `npm run shots`

## Dashboard steps (manual)

1. Paste the full description above.
2. Upload the four screenshots and the promo tile.
3. Confirm category (Tools) and language (English).
4. On the Privacy practices tab, paste one justification per permission from the
   section above, then answer the remote code and data usage questions.
5. Title and summary update only when the next release package is uploaded.
