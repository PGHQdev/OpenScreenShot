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
• Quick mode: copy to clipboard or save to disk without opening the editor

ANNOTATE
• Arrows, shapes, lines, text, and highlighter
• Step number badges that stay in order
• Blur or redact sensitive information before you share
• Spotlight to dim everything except the part that matters
• Crop, resize, zoom to cursor, full undo/redo history
• Beautify: padding, rounded corners, shadow, and gradient backgrounds for polished sharing
• Eyedropper: match a color from the screenshot or anywhere on your screen
• Drag and drop or paste any image into the editor to annotate it
• Crash-safe drafts: reopen the editor and pick up where you left off

EXPORT
• PNG, JPEG, or WebP with quality control
• Multi-page PDF: A4 or Letter, fit-to-page or split with margins
• Copy to clipboard from anywhere in the editor
• Filename templates and saved defaults
• Export at 25/50/100/200% or an exact pixel width

RECORD
• Record the current tab in one click — the tabCapture permission prompt appears once, then every recording after starts instantly
• Auto zoom at every click you make, 2x with a smooth ease
• Add your own zoom blocks and trim any part of the timeline by hand
• Mix in microphone narration and tab audio with independent volume control
• Draggable webcam bubble overlay
• Crash-safe: 1-second chunks save to the device as you go, so a crashed tab or a killed background page never loses the take, and Continue recording picks a session back up
• Export to WebM, beautified with the same padding, rounded corners, shadow, and gradient frame as screenshots

PRIVATE BY DESIGN
Your screenshots and recordings never leave your device. Capture, editing, recording, and export all run locally, and the extension works fully offline. No sign-up, no tracking, no third-party services, and only the minimum permissions each feature needs.

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
chrome.storage.local holds five things, all on the device: the user settings (export format and quality, PDF page size, filename template, delay), the last region rectangle so "Repeat last region" can reuse it, the capture that was just taken, which the editor page reads on open and then deletes, and a crash-safety draft (the current annotations, plus the cropped image when a crop changed the picture) that the editor saves as the user works so a closed tab or a crash does not lose unsaved edits. The extension has no server and no account, so this local store is the only place state can live. Nothing is sent anywhere.
```

**unlimitedStorage**

```
A capture is handed to the editor through chrome.storage.local as a PNG data URL. A full page screenshot of a long page is often larger than the 10 MB default quota for chrome.storage.local, so the write fails and the capture is lost without this permission. unlimitedStorage raises that limit. The extension writes one capture at a time and deletes it once the editor has loaded it.
```

**downloads**

```
Saving is the end of the workflow. The extension calls chrome.downloads.download with the filename built from the user's template so the file lands in the normal Downloads folder, either when the user exports from the editor with the generated PNG, JPEG, WebP, or PDF, or when quick mode is set to save to disk, which downloads the capture straight from the background service worker without opening the editor. The URL passed is always a local data or blob URL produced by the extension. The extension never reads, searches, or opens the user's download history.
```

**contextMenus**

```
OpenScreenShot uses contextMenus to add one "OpenScreenShot" submenu to the page right-click menu. The submenu holds the same capture actions as the toolbar popup: Full page, Visible area, Region, and Repeat last region. This gives users a second way to start a capture, next to the toolbar button and the keyboard shortcuts. The menu items are static and are created once at install time. The extension reads only the ID of the clicked menu item to select the capture mode. It does not read the page, the selected text, the link URL, or any other data from the click event. A click grants activeTab for that capture, in the same way that opening the popup does. Without this permission the right-click capture entry point cannot exist.
```

**clipboardWrite**

```
Copy to clipboard is one of the ways to get a screenshot out of the extension. The editor's Copy button and quick mode's clipboard action both build a PNG and call navigator.clipboard.write with it. A service worker has no navigator.clipboard, so the quick mode path injects a small self-contained function into the captured tab with chrome.scripting.executeScript to make that call, then removes it once the write finishes. The extension only ever writes the screenshot the user just captured or exported to the clipboard; it never reads the clipboard's existing contents.
```

**offscreen**

```
Recording the tab needs a page that can hold a live MediaRecorder and write video chunks to IndexedDB as they arrive; a service worker can be evicted mid-recording and has no such page context. chrome.offscreen creates that hidden page only while a recording, or its crash-safe write-out, is active, and closes it when the session ends. offscreen requires no user prompt and adds no install-time warning.
```

## Optional permission justifications

`tabCapture` and `<all_urls>` are declared in `optional_permissions` /
`optional_host_permissions`, requested at runtime with `chrome.permissions.request`, never at
install. The dashboard's permission-justification fields above cover the required
permissions; these two are documented here for the same review.

**tabCapture (optional)**

```
Screen recording needs the pixels, and optionally the audio, of the tab being recorded. The extension calls chrome.tabCapture.getMediaStreamId only after the user clicks Record for the first time, which raises Chrome's own permission prompt; every recording after that reuses the granted permission with no further prompt. Declaring it optional means it carries no install-time warning and never appears unless the user actually starts a recording.
```

**`<all_urls>` (optional host permission)**

```
The in-page recording control bar and cursor logger are injected into the tab being recorded. If that tab navigates to a different origin mid-recording, chrome.scripting.executeScript needs a matching host permission to re-inject there; without it the overlay and cursor log stop at the first cross-origin navigation. This permission is requested only when the user turns on "Record across sites" in settings, through a dedicated chrome.permissions.request click, and is never requested by default.
```

**Remote code**: No, I am not using remote code. All scripts are in the package.

**Data usage**: no data collected. The extension has no network code. `host_permissions` is empty at install; the optional `<all_urls>` host permission is requested only if the user turns on "Record across sites".

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
