# OpenScreenShot extension design

A Workspace-inspired visual system for the capture popup, screenshot editor,
recording editor, setup page, and in-page capture controls. The product keeps
its OpenScreenShot name and viewfinder mark; no Google affiliation is implied.
The marketing website is outside this redesign.

## System

- App layout: tonal workbench, quiet app bar, rounded tool rail, white content
  surfaces, grouped settings and generous dialog corners.
- Typography: bundled Roboto variable, 400 body and headings, 500 controls.
  12px supporting text, 14px body, 18px product titles, 24–32px page headings.
  A single family is intentional, matching productivity UI. Native monospace
  remains for filenames, time values, and keyboard shortcuts.
- Colors: blue actions (#0b57d0), cool paper (#f8fafd), white panels, charcoal
  text (#202124). Light blue selection (#d3e3fd). Red is recording/error,
  green is permission success, yellow is caution. Secondary brand colors only
  appear on small icon grounds and meaningful statuses.
- Dark mode: charcoal surfaces and pale blue actions. All three body inks,
  control boundaries, selected states and keyboard focus remain accessible.
- Spacing: existing 4px scale, 8px grouped controls, 12–16px rows and workbench
  gutters, 24px content panels, 32px major separation.
- Shape: 8px small controls, 12px icon grounds, 24px panels, 28px dialogs,
  pill-shaped primary and secondary actions.
- Icons: locally bundled Material Icons Rounded SVGs on a 24px view box.
  Existing semantic component names and accessible button labels are retained.
- Editor labels: show names beside top-bar icons and below tool-rail icons,
  including at narrow widths. Prefer plain wording: Edit, Frame, Spacing and
  Line width. Wrap controls and hints as needed to keep the text readable.
- Motion: existing short feedback only; standard decelerating easing,
  reduced-motion overrides, immediate visible keyboard focus.

## Editor and settings behavior

- The editor opens with labeled tools ready. Options appear only for tools or
  selections that have settings; no empty options strip occupies the canvas.
- Captures open at Fit width with long pages aligned to the top. Wheel/trackpad
  scrolling moves through the image within its bounds; Ctrl/Command+wheel or
  pinch zooms. Fit page remains available in the zoom menu. Fitting is named
  beside the zoom control instead of in an overlay over the screenshot.
- More holds the Rate action. Native keyboard activation, Escape and focus
  leaving close the disclosure without triggering editor tool shortcuts.
- Settings uses grouped sections in a centered 760px full-tab column, with
  responsive controls and the existing compact 340px popup kept scrollable.
- Capture progress uses an isolated animated blue status card. It reports real
  tile progress and finishing status; it is hidden across a paint boundary
  before each screenshot and removed in cleanup, including failure paths.
  Reduced-motion users get a static progress indicator.

## Source of truth

`src/shared/tokens.css` owns all theme values and exports to the generated
`src/shared/design-tokens.ts` via `npm run tokens`. Keep the existing hex
format for the generator, canvas consumers and contrast tests. UI work must
extend this source rather than create a competing token file.
`src/shared/ui.css` loads Roboto from the extension package and shares button
styles; `src/shared/controls.css` owns native switches and sliders. In-page
shadow controls use matching literal colors because page styles are isolated.
Screenshot annotation ink and export frame presets are content, independent
of the UI theme. The viewfinder logo remains the existing OpenScreenShot mark.

## Sources and licensing

- [Material design](https://m3.material.io/): color, shape and layout reference.
- [Material icon guidance](https://material-web.dev/components/icon/): rounded
  icon style. Bundled SVGs are Apache-2.0; license in `public/licenses/`.
- [Roboto](https://github.com/google/fonts/tree/main/ofl/roboto): bundled
  variable font under the SIL Open Font License in `public/licenses/`.

## Verification

Build and typecheck; existing unit/contrast tests; editor, setup, recorder,
media, region and accessibility browser checks; responsive layout checks;
visual inspection of light and dark screens. No runtime network font or icon
requests, new permissions or changes to capture/export behavior.
