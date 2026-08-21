# Screen recorder with auto zoom — design

Date: 2026-08-18
Status: approved for planning

## Goal

Record the current tab, add zoom effects at cursor clicks automatically, let the
user edit zooms by hand, and export a video file. Everything runs locally, in
line with the project promise: no servers, no accounts, no new data collection.
Reference products: Cursorful, Screen Charm, Screen Studio, Cap.

## Decisions

| Topic | Decision |
| --- | --- |
| Capture access | `tabCapture` as an **optional permission**. No warning on update. One Chrome prompt at first recording, then one-click record. |
| Pipeline | Record raw video plus a cursor log. Edit zooms after the recording. Export re-renders the video. |
| Export format | WebM in v1 via MediaRecorder. MP4 via WebCodecs plus a muxer in a later version. |
| v1 extras | Mic narration, tab audio, click ripple, webcam bubble. |
| Structure | Offscreen-document engine, new `src/recorder/` editor page. |
| Resilience | Segment data model from day one. Crash recovery and "Continue recording" both ship in v1. |
| Screen Charm adaptations | Beautify frame on export, per-segment trim handles, `getUserMedia` noise constraints on by default. |
| Deferred | Follow-cursor zoom mode, platform size presets, MP4 export, split-and-delete inside a segment. |
| Out of scope | Cloud share links, motion blur, synthetic cursor smoothing, desktop or window capture. |

## Components

### Popup

- A Record row with toggles: mic, tab audio, webcam.
- The Record click calls `chrome.permissions.request({ permissions: ['tabCapture'] })`,
  because the prompt needs a user gesture, then messages the service worker.
- During a recording the popup shows a Stop button and the live track states.
- A settings row "Record across sites" requests the optional `<all_urls>` host
  permission once, from a click. Default: off.

### Service worker

- Orchestration only: resolves `chrome.tabCapture.getMediaStreamId`, creates the
  offscreen document, tracks session state, sets the badge (`REC`, amber `REC`
  variant when the overlay is lost).
- Re-injects the content script on same-origin navigation, on any extension
  gesture (icon click, popup open, command, context menu) via the fresh
  `activeTab` grant, and on every navigation when the host permission is on.

### Offscreen document (engine)

- Owns every stream. Gets the tab stream from the stream ID, the mic and the
  webcam via `getUserMedia` with `noiseSuppression`, `echoCancellation`, and
  `autoGainControl` on.
- An AudioContext routes tab audio back to the speakers, because capture mutes
  the tab.
- Recorder #1: tab video plus tab audio. Recorder #2: webcam plus mic, or
  audio-only when the webcam is off. One audio source per file keeps per-source
  volume adjustable at export.
- Both recorders run with a 1-second timeslice and write each chunk to
  IndexedDB, so a crash loses at most one second.
- Codec VP9, fallback VP8 via `isTypeSupported`. Video bitrate ~2.5 Mbps.

### Content script

- A shadow-DOM control bar: timer, pause, stop, cancel, live track states.
- A cursor logger: moves at ~30 Hz, clicks, viewport resizes, device pixel
  ratio, overlay-lost and overlay-healed markers. Flushed to IndexedDB each
  second.
- The webcam preview bubble is a draggable extension iframe, because only an
  extension page can hold camera permission. The iframe also hosts the one-time
  mic and camera prompts; the offscreen document cannot show prompts.

### Recorder editor (`src/recorder/`)

New Vite entry, Preact, shared tokens and controls. Opened on stop.

- Layout: video stage on top, timeline below, settings rail on the right.
- Timeline: one strip per segment in order with trim handles at each segment's
  ends; a zoom track with blocks; a playhead.
- Auto zoom: generated once when a session first opens. A click opens a block:
  ease-in 0.6 s, hold, ease-out 0.6 s. Clicks within 2.5 s and within 15% of the
  viewport width extend the hold. Default scale 2x. Target clamped so the camera stays inside
  the frame. Generated blocks become ordinary blocks. A Regenerate button
  rebuilds them.
- Manual zoom: "Add zoom" drops a block at the playhead. Drag the block for
  time, its edges for duration, a reticle on the video for target. Scales:
  1.5x, 2x, 3x.
- Rail: webcam bubble position and size (drag, corner presets, hide), ripple
  toggle, two volume sliders (tab, mic), Beautify panel (padding, corner
  radius, shadow, six gradient presets) shared with the image editor's frame
  model.
- Session list with per-session delete. "Continue recording" appends a segment
  via the popup flow.
- Editor state (zoom blocks, bubble, ripple, trim, Beautify) saves per session,
  debounced, in the `draft.ts` pattern.

## Data model (IndexedDB, `src/shared/recording-db.ts`)

No library. `unlimitedStorage` is already granted.

- `sessions`: `{ id, createdAt, status: 'recording' | 'complete', settings: { mic, tabAudio, webcam, ripple }, segmentIds }`
- `segments`: `{ id, sessionId, index, startedAt, duration, viewport: { w, h, dpr }, hasWebcam }`
- `chunks`: key `[segmentId, kind, seq]`, value one Blob. `kind`: `tab` | `webcam`.
- `events`: key `[segmentId, seq]`, value a batch of cursor entries with
  timestamps relative to the segment start.

The chunks of one recorder run concatenate into a valid WebM. MediaRecorder
omits the duration header; the editor forces duration with the seek-to-end
trick on load.

Recovery rule: a session with status `recording` and no live engine is
recoverable. The popup and the editor both surface it; everything up to the
last written second plays.

## Export render

- Canvas at the first segment's pixel size plus Beautify padding. Segments with
  other sizes letterbox.
- Hidden video elements play each segment at 1x; the webcam element syncs by
  the shared clock. Each frame draws: background, video under the interpolated
  zoom camera with cubic easing, ripples at click times, bubble.
- Audio mixes through an AudioContext with the two gain values.
- `canvas.captureStream(30)` plus MediaRecorder writes the WebM. Render time is
  about the video length; progress bar and cancel. Cancel discards the file.
- Download from the editor page with the existing filename template engine.
  Export offers "delete recording", off by default.

## Failure handling

- Permission prompt declined: one line in the popup, nothing starts.
- Mic or camera declined: recording starts without that track; the control bar
  shows the live tracks.
- Restricted pages (`chrome://`, the Web Store): Record disabled with the same
  message pattern the capture buttons use.
- Recording tab closed: stream ends, engine finalizes, editor opens.
- Cross-origin navigation without host permission: overlay and logger stop, the
  video continues, the badge turns amber. Any extension gesture heals the
  overlay. The stop command heals before it stops. Manual zooms cover the gap,
  because they need no cursor data.
- Engine or browser crash: recovery rule applies.
- Resize or device-pixel-ratio change: logged; the render maps coordinates per
  timestamp.

## Manifest diff

- `minimum_chrome_version`: 99 → 116 (MV3 `tabCapture` support).
- `permissions` += `offscreen` (warning-free).
- `optional_permissions`: `["tabCapture"]`.
- `optional_host_permissions`: `["<all_urls>"]`.
- `commands` += `stop-recording` (fourth command).
- `web_accessible_resources` for the webcam preview iframe.

## Testing

- Vitest units: click clustering into zoom blocks, camera interpolation,
  coordinate mapping across resizes, segment order and trim math.
- Browser smoke test on the existing headless pattern: seed a fixture session
  into IndexedDB, load the recorder editor from `dist/`, assert the timeline
  renders, export a 2-second fixture, assert a non-empty WebM.
- Live tab capture cannot run headless; the record path gets a short manual
  checklist per release.

## Milestones

Each milestone is shippable.

1. Popup Record row, engine, raw tab-video WebM on stop. Proves the capture path.
2. IndexedDB storage, segments, crash recovery, continue.
3. Editor page: playback, timeline, auto and manual zoom, trim, export render.
4. Audio: tab audio routing, mic, volume sliders.
5. Webcam bubble: preview iframe, recording, compositing.
6. Ripple, Beautify frame, i18n strings, docs surfaces, roadmap and version sync.
