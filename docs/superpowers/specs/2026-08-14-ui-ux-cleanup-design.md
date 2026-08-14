# OpenScreenShot UI/UX Cleanup — Design

**Date:** 2026-08-14
**Surfaces:** popup (`src/popup`), settings view (inside the popup), editor (`src/editor`)

## Purpose

Remove defects, duplication, and dead surface area from the three UI surfaces.
The work changes no capture, export, or annotation behaviour. It changes what
the user sees and which keys work.

## Global constraints

- Preact, not React. Use `preact/hooks` and the `class` attribute.
- Popup strings go through `chrome.i18n.getMessage` via the local `t()` helper.
  Every new popup string needs a key in `public/_locales/en/messages.json`.
- Editor strings stay plain English. The editor has no i18n layer.
- Colours, spacing, radius, and shadows come from `src/shared/tokens.css`.
  Add a token before writing a raw value in a surface stylesheet.
- Brand accent is coral (`--accent`). Danger is amber (`--danger`). The blue in
  `COLOR_PALETTE` is annotation content and stays.
- No new runtime or dev dependencies.
- Vitest runs with `environment: 'node'` and `include: ['tests/**/*.test.ts']`.
  There is no DOM test harness. Logic that needs a test moves into a pure
  module under `src/shared/` or `src/editor/`. Markup and CSS changes get a
  written manual check.

## Findings and decisions

### Fix

1. **Region shortcut chip lies.** `manifest.json` gave `capture-region` both a
   `default` and a `mac` key, but both were `Ctrl+Shift+R` / `Cmd+Shift+R`,
   which Chrome reserves for hard reload and silently refuses to assign.
   Chrome reports no binding for region, so `popup/App.tsx` falls back to the
   digit `3`. The column then mixes two OS shortcuts and one popup-local key.
   Digits 1/2/3 work for all three modes, and two rows hide that.
   **Decision:** move region to `Ctrl+Shift+E` / `Command+Shift+E`, and always
   show the digit on every row. Show the OS binding as a second chip only when
   Chrome reports one.

2. **Format segmented control breaks.** `.seg-wrap` wraps four options onto two
   rows. Row one keeps a trailing border and row two leaves a dead cell.
   **Decision:** move the label onto its own line and lay the four options out
   as a 4-column grid across the full popup width.

3. **Screenshot has no edge.** `.stage` uses `--surface-2` and the canvas draws
   no border. A light screenshot merges into the stage.
   **Decision:** add a `--stage-bg` token that is darker than `--surface-2`, and
   draw a shadow plus a 1px frame around the image rect in `canvas.ts`.

4. **Bare `0` in the tool rail.** The annotation count renders with no label and
   no icon.
   **Decision:** hide the count at zero. Above zero, show a layers icon, the
   number, and a `title` that names the unit.

5. **Error toast disappears.** Every toast clears after 4 seconds. A protected
   page is a state the user must read.
   **Decision:** errors persist and carry a dismiss button. Info and success
   keep the 4-second timeout.

6. **Toast grows the popup.** The toast area sits under the footer links, so the
   window height jumps.
   **Decision:** move the toast area directly under the header, above the mode
   list.

7. **Copy button shifts the topbar.** The label moves between three widths.
   **Decision:** fixed minimum width, and shorten `Copy failed` to `Failed`.

8. **Swatch labels are hex.** A screen reader announces `#ff3b30`.
   **Decision:** a hex-to-name map in a new `src/editor/palette.ts`.

9. **Fit leaves no margin.** `canvas.ts` uses the raw viewport ratio, so the
   image touches all four stage edges.
   **Decision:** extract the zoom maths into `src/editor/viewport.ts` and leave
   24 CSS px on each side.

### Simplify

10. **"Customize keyboard shortcuts" appears twice.** Popup footer and settings
    row. **Decision:** drop the settings row. Keep the footer link.

11. **Ko-fi link appears twice.** Popup footer and settings footer.
    **Decision:** drop the settings copy.

12. **Zoom percent appears twice in the editor.** Topbar readout and statusbar.
    **Decision:** drop the statusbar copy.

13. **Every PDF option appears twice.** Popup settings and export dialog.
    **Decision:** drop the popup's PDF defaults section. Add a "Remember these
    settings" control to the export dialog that writes format, quality, and the
    four PDF fields back to settings.

14. **The editor topbar holds five zoom widgets.**
    **Decision:** one readout button that opens a menu with Zoom in, Zoom out,
    Fit, and Actual size. Add `⌘+`, `⌘-`, `⌘0`, and `F` so frequent zoom stays
    on the keyboard.

15. **The popup footer wraps onto two rows,** and "Reopen last capture" appears
    and disappears with the stash.
    **Decision:** one row, three items, shortened labels, and a disabled state
    for "Reopen last capture" so the row never changes shape.

16. **The stylebar stays full-width when nothing uses it.**
    **Decision:** a pure `stylebarFields(tool, selectedType)` rule decides which
    groups apply. The bar renders nothing when no group applies.

### Improve

17. **Bind `⌘S` to Export and `?` to a shortcut sheet.** Tool letters live only
    in tooltips. Add a `?` button in the topbar so the sheet is discoverable.

18. **Promote Copy.** Copy takes the primary style. Export takes the secondary
    style. Positions stay.

19. **Add a custom colour and recent colours.** A native colour input plus up to
    five remembered custom colours, stored in settings.

20. **Make filename tokens clickable** and show a live preview of the resolved
    name under the input.

21. **Add "Reset to defaults"** to settings, behind a two-click confirm. The
    reset keeps `showOnboarding` so the welcome card does not return.

22. **Give the editor empty state a button.** It calls
    `chrome.action.openPopup()` and falls back to a written instruction when the
    call fails.

23. **Move undo, redo, and delete out of the tool rail.** They act on the
    document, so they belong in the topbar.

## Out of scope

- Region-select overlay styling.
- The onboarding welcome card.
- Any change to capture, stitching, export encoding, or PDF layout.
- The `Alt+Shift+V` / `Ctrl+Shift+S` defaults for the two commands that already
  bind. Users depend on them.
