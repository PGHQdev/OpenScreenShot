# Roadmap

Planned features for OpenScreenShot. Everything here stays true to the project's
core promise: **100% local, no servers, no accounts, no new data collection.**
Roadmap items are not commitments or dated promises — votes, feedback, and pull
requests are all welcome (see [CONTRIBUTING.md](./CONTRIBUTING.md)), and
[open an issue](https://github.com/pghqdev/OpenScreenShot/issues) to champion an idea.

**Status legend:** 🧭 exploring · 📋 planned · 🚧 in progress · ✅ shipped

## Capture

| Feature                                                 | Status       | Notes                                                                                      |
| ------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------ |
| Delayed capture (3s / 5s / 10s timer)                   | 📋 planned   | Capture hover states, dropdowns, and tooltips that disappear when you click the extension. |
| Capture straight to clipboard or download (skip editor) | 📋 planned   | Optional "quick mode" for high-frequency power users.                                      |
| Right-click context menu capture                        | 📋 planned   | Full page / visible / region from the page context menu.                                   |
| Repeat last region                                      | 📋 planned   | Re-capture the previous selection rect — great for iterating on docs.                      |
| Region loupe + DOM element snapping                     | 🧭 exploring | Pixel-precise crosshair magnifier; snap selection edges to element boundaries.             |
| Batch capture: list of URLs → one multi-page PDF        | 🧭 exploring | Combines existing scroll-and-stitch with existing PDF export.                              |

## Editor

| Feature                                                   | Status     | Notes                                                                |
| --------------------------------------------------------- | ---------- | -------------------------------------------------------------------- |
| Beautify mode: padding, rounded corners, shadow, gradient | 📋 planned | Polish screenshots for sharing — pure canvas compositing.            |
| Numbered step stamps (1, 2, 3…)                           | 📋 planned | Auto-incrementing counters for tutorials and support docs.           |
| Highlighter and solid-redact tools                        | 📋 planned | Variants on the existing rect/blur primitives.                       |
| Eyedropper color picker                                   | 📋 planned | Native browser EyeDropper API — match annotation colors to the page. |
| Resize / scale at export (50%, fixed width, …)            | 📋 planned | Offscreen-canvas scaling in the export dialog.                       |
| Drag & drop / paste any image into the editor             | 📋 planned | Turns the editor into a general-purpose annotation tool.             |

## Power features

| Feature                                  | Status       | Notes                                                                             |
| ---------------------------------------- | ------------ | --------------------------------------------------------------------------------- |
| Local OCR: copy text out of a screenshot | 🧭 exploring | Client-side WASM OCR, lazy-loaded on first use. No data leaves the device.        |
| Recent captures shelf                    | 🧭 exploring | Last N captures kept locally, reopenable in the editor, with a clear-all control. |
| Extra filename tokens (`{domain}`, …)    | ✅ shipped   | `{domain}` landed in v0.4.0. More tokens extend the same template engine.         |

## Performance & polish

| Feature                                              | Status       | Notes                                                              |
| ---------------------------------------------------- | ------------ | ------------------------------------------------------------------ |
| Stitch compositing in a Web Worker (OffscreenCanvas) | 🧭 exploring | Keeps the UI responsive on very long full-page captures.           |
| Prewarm the editor bundle during capture             | 🧭 exploring | Makes the editor tab open near-instantly after a capture finishes. |

## Recently shipped

| Feature                                                 | Version |
| ------------------------------------------------------- | ------- |
| `{domain}` filename token                               | v0.4.0  |
| Shortcut sheet in the editor, with Export bound to ⌘S   | v0.3.0  |
| One zoom menu, with keyboard zoom controls              | v0.3.0  |
| Named swatches, a custom colour, and recent colours     | v0.3.0  |
| Undo, redo, and delete moved to the topbar              | v0.3.0  |
| Style bar shown only when a control applies             | v0.3.0  |
| Export dialog can save its settings as the new defaults | v0.3.0  |
| Clickable filename tokens with a live preview           | v0.3.0  |
| Two-click reset to defaults in settings                 | v0.3.0  |
| One stable popup footer, and per-mode shortcut chips    | v0.3.0  |
| Ko-fi donation links (README, site, popup footer)       | v0.2.7  |

---

_Last updated for v0.4.0._
