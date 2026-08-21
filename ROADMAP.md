# Roadmap

Planned features for OpenScreenShot. Everything here stays true to the project's
core promise: **100% local, no servers, no accounts, no new data collection.**
Roadmap items are not commitments or dated promises — votes, feedback, and pull
requests are all welcome (see [CONTRIBUTING.md](./CONTRIBUTING.md)), and
[open an issue](https://github.com/pghqdev/OpenScreenShot/issues) to champion an idea.

**Status legend:** 🧭 exploring · 📋 planned · 🚧 in progress · ✅ shipped

## Capture

| Feature                                                 | Status       | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delayed capture (3s / 5s / 10s timer)                   | ✅ shipped   | Landed in v0.6.1: persistent Off / 3s / 5s / 10s row in the popup; the badge counts down; region shows its overlay after the delay.                                                                                                                                                                                                                                                                                                                                                       |
| Capture straight to clipboard or download (skip editor) | ✅ shipped   | Landed in v1.1.0: an "After capture" row in the popup picks Editor, Clipboard, or Download. The setting is read when the capture finishes, so one row covers the popup buttons, the keyboard commands, and the context menu. The clipboard write is injected into the page rather than using an offscreen document, because a service worker has no `navigator.clipboard`; the download runs in the worker. Quick save writes PNG, and the badge is the only feedback since no tab opens. |
| Right-click context menu capture                        | ✅ shipped   | Landed in v0.6.1: full page / visible / region from the page context menu, via the warning-free `contextMenus` permission; clicks grant `activeTab` and honor the delay setting; errors flash `!` on the badge.                                                                                                                                                                                                                                                                           |
| Repeat last region                                      | ✅ shipped   | Landed in v0.6.1: re-capture the previous selection rect. The rect persists in local storage; entry points are a popup footer link and a context menu item, shown once a rect exists.                                                                                                                                                                                                                                                                                                     |
| Region loupe + DOM element snapping                     | 🧭 exploring | Pixel-precise crosshair magnifier; snap selection edges to element boundaries.                                                                                                                                                                                                                                                                                                                                                                                                            |
| Batch capture: list of URLs → one multi-page PDF        | 🧭 exploring | Combines existing scroll-and-stitch with existing PDF export.                                                                                                                                                                                                                                                                                                                                                                                                                             |

## Editor

| Feature                                                   | Status     | Notes                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Straight line tool                                        | ✅ shipped | Landed in v0.5.0 as the `L` tool: the arrow shape without a head, sharing its two endpoint handles.                                                                                                                                                                                                                        |
| Solid and mosaic redaction                                | ✅ shipped | Landed in v0.6.0 as a mode on the blur annotation: soft blur, coarse mosaic, or an opaque fill that survives recompression.                                                                                                                                                                                                |
| Spotlight tool                                            | ✅ shipped | Landed in v0.6.0 as the `O` tool: rect, rounded rect, or ellipse cut-outs that merge into one dim layer.                                                                                                                                                                                                                   |
| Shift constraints while drawing                           | ✅ shipped | Landed in v0.5.0: square rectangles and blur regions, and lines and arrows snapped to 45°.                                                                                                                                                                                                                                 |
| Resize every annotation type                              | ✅ shipped | Landed in v0.6.0: pen and highlighter scale freely on their bbox; text and step badges scale uniformly from corner handles.                                                                                                                                                                                                |
| Number keys `1`–`8` set the color                         | ✅ shipped | Landed in v0.5.0 across the whole palette, matching the letter keys on the toolbar.                                                                                                                                                                                                                                        |
| Double-click a text layer to re-edit it                   | ✅ shipped | Landed in v0.5.0 on the select tool. Reopens the existing text overlay on a committed annotation.                                                                                                                                                                                                                          |
| Beautify mode: padding, rounded corners, shadow, gradient | ✅ shipped | Landed in v0.7.0: a topbar panel with padding, corner, and shadow sliders plus six gradient presets, transparent, and a custom solid. The frame previews live and travels into every export, the clipboard, and PDF. The screenshot's top-left stays image `(0,0)`, so every tool and the crop path were left untouched.   |
| Eyedropper color picker                                   | ✅ shipped | Landed in v1.1.0 as the `I` tool. It samples the rendered canvas, so a colour inside a spotlight's dim or on the beautify gradient picks as it looks, and it hands the previous tool back after one pick. A swatch-sized button on the colour row opens Chrome's screen-wide picker for everything outside the capture.    |
| Resize / scale at export (50%, fixed width, …)            | ✅ shipped | Landed in v0.7.0: 25/50/100/200% or an exact pixel width, hidden for PDF. Resamples the composed canvas through repeated halvings, and refuses sizes past Chrome's canvas limits instead of writing an empty file.                                                                                                         |
| Drag & drop / paste any image into the editor             | ✅ shipped | Landed in v1.1.0: drop an image on the stage or paste one anywhere outside a text field. An import takes the same seat a capture takes, so every tool, export path, and the beautify frame keep working, and the topbar reads `Imported`. It replaces the canvas, so it asks first whenever there are annotations to lose. |

## Recording

| Feature                                                                                 | Status       | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screen recorder with auto zoom (record tab, zoom at clicks, webcam bubble, WebM export) | ✅ shipped   | Landed in v1.2.0: `tabCapture` is an optional permission, requested once at first record, so there's no update warning. An offscreen document runs the capture engine and writes crash-safe 1 s chunks to IndexedDB. The editor (`src/recorder/`) plays the take on a timeline with automatic zoom at cursor clicks, manual zoom blocks, and per-segment trim, then re-renders the export through a canvas, mixing in mic and tab audio, click ripples, and an optional webcam bubble. |
| MP4 export                                                                              | 📋 planned   | WebCodecs plus a muxer, alongside the existing WebM path.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Follow-cursor zoom mode                                                                 | 📋 planned   | A zoom that pans to track the cursor instead of sitting on fixed auto/manual blocks.                                                                                                                                                                                                                                                                                                                                                                                                   |
| Platform size presets (YouTube, Shorts, square, …)                                      | 🧭 exploring | Export at a target aspect ratio instead of the recorded tab's own.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Split-and-delete inside a segment                                                       | 🧭 exploring | Cut a segment in two on the timeline and drop the piece you don't want, rather than trimming from an end only.                                                                                                                                                                                                                                                                                                                                                                         |

## Power features

| Feature                                  | Status       | Notes                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Crash-safe editor snapshot               | ✅ shipped   | Landed in v1.1.0: a debounced write of the annotation list and the beautify frame, plus a flush when the tab is hidden, keyed to the capture the coordinates were drawn on. A cropped image gets its own key so annotations never restore against the wrong picture. Restoring is always a click — a stale draft can never silently replace what you meant to start fresh. |
| Local OCR: copy text out of a screenshot | 🧭 exploring | Client-side WASM OCR, lazy-loaded on first use. No data leaves the device. The engine and one language file are 10–15 MB against a 44 KB package today, so size decides it.                                                                                                                                                                                                |
| Recent captures shelf                    | 🧭 exploring | Last N captures kept locally, reopenable in the editor, with a clear-all control.                                                                                                                                                                                                                                                                                          |
| Pin a capture in a floating window       | 🧭 exploring | Document Picture-in-Picture is the only always-on-top surface Chrome offers, and it closes with the tab that opened it.                                                                                                                                                                                                                                                    |
| Extra filename tokens (`{domain}`, …)    | ✅ shipped   | `{domain}` landed in v0.4.0. More tokens extend the same template engine.                                                                                                                                                                                                                                                                                                  |

## Performance & polish

| Feature                                              | Status       | Notes                                                              |
| ---------------------------------------------------- | ------------ | ------------------------------------------------------------------ |
| Stitch compositing in a Web Worker (OffscreenCanvas) | 🧭 exploring | Keeps the UI responsive on very long full-page captures.           |
| Prewarm the editor bundle during capture             | 🧭 exploring | Makes the editor tab open near-instantly after a capture finishes. |

## Out of scope

| Feature                                       | Why                                                                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Capturing desktop windows or the whole screen | Needs the `desktopCapture` permission, which adds a "capture content of your screen" install warning and a Chrome picker on every shot. OpenScreenShot ships with empty `host_permissions`, and keeping it that way is worth more than the feature. |

## Recently shipped

| Feature                                                    | Version |
| ---------------------------------------------------------- | ------- |
| Screen recorder with auto zoom, webcam bubble, WebM export | v1.2.0  |
| Quick capture: straight to clipboard or disk               | v1.1.0  |
| Eyedropper color picker (`I`), plus a screen-wide pick     | v1.1.0  |
| Drag & drop or paste any image into the editor             | v1.1.0  |
| Crash-safe editor drafts, restored on reopen               | v1.1.0  |
| Beautify mode: padding, rounded corners, shadow, gradient  | v0.7.0  |
| Resize / scale at export (25/50/100/200% or a width)       | v0.7.0  |
| Delayed capture (3s / 5s / 10s timer)                      | v0.6.1  |
| Right-click context menu capture                           | v0.6.1  |
| Repeat last region                                         | v0.6.1  |
| Solid and mosaic redaction modes on the blur tool          | v0.6.0  |
| Spotlight tool (`O`)                                       | v0.6.0  |
| Resize handles on every annotation type                    | v0.6.0  |
| Straight line tool (`L`)                                   | v0.5.0  |
| Shift constraints: square rects, 45° lines and arrows      | v0.5.0  |
| Number keys `1`–`8` set the annotation color               | v0.5.0  |
| Double-click a text layer to re-edit it                    | v0.5.0  |
| `{domain}` filename token                                  | v0.4.0  |
| Numbered step badges and the highlighter tool              | v0.3.0  |
| Shortcut sheet in the editor, with Export bound to ⌘S      | v0.3.0  |
| One zoom menu, with keyboard zoom controls                 | v0.3.0  |
| Named swatches, a custom colour, and recent colours        | v0.3.0  |
| Undo, redo, and delete moved to the topbar                 | v0.3.0  |
| Style bar shown only when a control applies                | v0.3.0  |
| Export dialog can save its settings as the new defaults    | v0.3.0  |
| Clickable filename tokens with a live preview              | v0.3.0  |
| Two-click reset to defaults in settings                    | v0.3.0  |
| One stable popup footer, and per-mode shortcut chips       | v0.3.0  |
| Ko-fi donation links (README, site, popup footer)          | v0.2.7  |

---

_Last updated for v1.2.0._
