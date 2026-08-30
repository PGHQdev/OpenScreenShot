/**
 * WebM export for the recorder editor.
 *
 * There is no offline compositor in a browser: the only way to turn a canvas
 * back into a video file is `captureStream` + `MediaRecorder`, and both run
 * on the wall clock. So the export plays each segment's hidden `<video>` at
 * 1x, redraws the composited frame on every animation frame, and records the
 * canvas while it happens. Rendering therefore takes about as long as the
 * recording is, and the tab has to stay visible — a background tab throttles
 * `requestAnimationFrame` and the render stalls.
 *
 * The frame itself comes from `drawExportFrame`, the same entry point the
 * preview stage draws through, so what the editor shows is what the file
 * gets. The clock mapping is `timeline-math`'s: a segment's own `currentTime`
 * maps to timeline ms, which is what `cameraAt` and the progress fraction
 * are expressed in.
 */
import {
  frameFromSettings,
  frameMetrics,
  type FrameMetrics,
  type FrameOptions,
} from '../editor/frame';
import { pickRecorderMime } from '../offscreen/mime';
import { DEFAULT_SETTINGS } from '../shared/types';
import { cursorAt, normalizeClicks, normalizeMoves, type NormClick } from './events-map';
import type { RecorderDraft } from './recorder-draft';
import { drawExportFrame, RIPPLE_MS } from './render';
import { fixDuration, type LoadedSession } from './session-load';
import { clampTrim, timelineAt, totalDuration, type SegmentTiming } from './timeline-math';
import { cameraAt } from './zoom';

export interface ExportProgress {
  /** 0..1 by timeline position. */
  fraction: number;
  /** Wall-clock ms left; see `remainingExportMs`. */
  remainingMs: number;
}

/**
 * Wall-clock time left in an export: the total timeline duration minus how
 * far the driven video clock has reached. A pure function of its two
 * inputs, so nothing here can keep it ticking down on its own — the export
 * loop only calls this again once a new frame actually decodes and moves
 * `timelineMs`, which is also why a hidden tab (`requestAnimationFrame`
 * stalled, see this file's header comment) freezes the figure instead of
 * racing ahead of what was actually rendered. Clamped to zero: a last frame
 * can land a hair past `total` on a sub-frame rounding.
 */
export function remainingExportMs(total: number, timelineMs: number): number {
  return Math.max(0, total - timelineMs);
}

/**
 * Cancel's armed two-step, the same idiom the session list's Delete uses
 * (`App.tsx`'s `handleDelete`): a first click arms it, a second click before
 * the disarm timer — or Escape — fires confirms the abort. Pure; the caller
 * owns the actual timer and the `AbortController`.
 */
export function nextCancelClick(armed: boolean): { armed: boolean; confirmed: boolean } {
  return armed ? { armed: false, confirmed: true } : { armed: true, confirmed: false };
}

/**
 * What an export produced. `blob` is null only for a cancel — a partial file
 * is not what was asked for.
 *
 * `skippedParts` counts *parts* the render could not use, not segments: a tab
 * video that would not play is left out of the file entirely, and a
 * recorder-#2 element that would not play costs that segment its mic and its
 * bubble, so one segment can contribute two. Either way the file is shorter
 * or quieter than the timeline says, which is what the caller tells the user;
 * nothing reads the magnitude, only whether it is above zero.
 */
export interface ExportResult {
  blob: Blob | null;
  skippedParts: number;
}

/**
 * Every draft field the renderer reads. `savedAt` is persistence bookkeeping,
 * so a caller holding live editor state does not have to invent one; a whole
 * `RecorderDraft` still satisfies it.
 */
export type ExportDraft = Omit<RecorderDraft, 'savedAt'>;

const EXPORT_FPS = 30;
const VIDEO_BITS_PER_SECOND = 2_500_000;
/** Matches the editor transport: under one frame, so a skipped seek shows nothing. */
const SEEK_EPSILON_MS = 20;
const SEEK_TIMEOUT_MS = 4000;

export interface ExportGeometry {
  /** Canvas size, beautify padding included. */
  width: number;
  height: number;
  frame: FrameOptions;
  metrics: FrameMetrics;
}

/**
 * The export canvas is the FIRST segment's pixel size plus the beautify
 * padding, matching the preview stage; a segment recorded at another size
 * letterboxes into it.
 */
export function exportGeometry(loaded: LoadedSession, draft: ExportDraft): ExportGeometry {
  const viewport = loaded.segments[0]?.segment.viewport;
  const videoW = Math.max(1, Math.round((viewport?.w ?? 1280) * (viewport?.dpr || 1)));
  const videoH = Math.max(1, Math.round((viewport?.h ?? 720) * (viewport?.dpr || 1)));
  const frame = frameFromSettings({ ...DEFAULT_SETTINGS, ...draft.frame });
  const metrics = frameMetrics(frame, videoW, videoH);
  return { width: metrics.outerW, height: metrics.outerH, frame, metrics };
}

/** Segment timings under the draft's trims, always clampTrim-validated. */
function exportTimings(loaded: LoadedSession, draft: ExportDraft): SegmentTiming[] {
  return loaded.segments.map((s) => {
    const raw = draft.trims[s.segment.id] ?? { start: 0, end: 0 };
    const { start, end } = clampTrim(s.durationMs, raw.start, raw.end);
    return {
      segmentId: s.segment.id,
      sourceDuration: s.durationMs,
      trimStart: start,
      trimEnd: end,
    };
  });
}

/**
 * An off-screen draw source. `audible` elements feed a
 * `MediaElementAudioSourceNode`: they stay unmuted at volume 1 because some
 * browsers apply `.muted`/`.volume` to what `createMediaElementSource`
 * captures, not just to what plays through the speakers — the level is the
 * gain node's job instead. Muted elements never reach the audio graph, so
 * their captured (silent) output never mixes in.
 */
function createVideo(url: string, audible = false): HTMLVideoElement {
  const video = document.createElement('video');
  video.src = url;
  video.muted = !audible;
  video.volume = 1;
  video.playsInline = true;
  video.preload = 'auto';
  // Off-screen rather than display:none — a video that is not rendered at all
  // is not guaranteed to keep decoding frames for `drawImage`.
  video.style.cssText =
    'position:fixed;left:-10000px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
  document.body.appendChild(video);
  return video;
}

/** Drift beyond which the recorder-#2 element is force-resynced to the tab clock. */
const AV_DRIFT_MS = 100;

/**
 * Resolves on the first `type` event, or on the timeout. A seek that never
 * lands must not hang the export forever; drawing a slightly wrong frame is
 * the better failure.
 */
function once(el: HTMLVideoElement, type: string): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      el.removeEventListener(type, done);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(done, SEEK_TIMEOUT_MS);
    el.addEventListener(type, done);
  });
}

async function seekTo(video: HTMLVideoElement, ms: number): Promise<void> {
  if (Math.abs(video.currentTime * 1000 - ms) <= SEEK_EPSILON_MS) return;
  const seeked = once(video, 'seeked');
  video.currentTime = ms / 1000;
  await seeked;
}

/**
 * Waits until a decoded frame exists to draw. No single event covers every
 * way of arriving here — `fixDuration` resolves while its own seek back to 0
 * is still running, and `seekTo` returns without waiting when the element is
 * already at the target — so this polls `readyState` instead of betting on
 * `canplay` or `seeked` firing again. Bounded: a source that never decodes
 * gets drawn blank rather than hanging the export.
 */
async function ready(video: HTMLVideoElement): Promise<void> {
  const deadline = Date.now() + SEEK_TIMEOUT_MS;
  while (video.readyState < 2 && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 16));
  }
}

/**
 * MediaRecorder WebM carries no duration header, so a fresh `<video>` reports
 * `Infinity` and refuses to seek until something forces the stream's end to
 * resolve. Trims are seeks, so every source is measured before the drive
 * loop starts. A source that cannot be measured is still played from 0.
 */
async function prepareVideo(video: HTMLVideoElement): Promise<void> {
  if (video.readyState < 1) await once(video, 'loadedmetadata');
  await fixDuration(video).catch(() => {});
}

/**
 * Whether a segment can be driven at all. A session can hold a segment that
 * never received a chunk — a continue whose engine died after the segment row
 * was written, or a crash before the first write — and its assembled blob is
 * zero bytes: metadata never loads, `play()` rejects, and every later export
 * of that session would die on it. One dead segment must not cost the user
 * the real recordings around it, so the export skips it instead.
 */
function isPlayable(video: HTMLVideoElement, timing: SegmentTiming): boolean {
  return timing.sourceDuration > 0 && video.readyState >= 1;
}

export async function exportVideo(
  loaded: LoadedSession,
  draft: ExportDraft,
  onProgress: (p: ExportProgress) => void,
  signal: AbortSignal,
): Promise<ExportResult> {
  if (loaded.segments.length === 0) return { blob: null, skippedParts: 0 };

  const timings = exportTimings(loaded, draft);
  const total = totalDuration(timings);
  const { width, height, frame, metrics } = exportGeometry(loaded, draft);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('export canvas unavailable');

  // Clicks are normalized once per segment, on the segment's own clock —
  // the same source `rippleAt` ages against.
  const clicks: NormClick[][] = loaded.segments.map((s) =>
    draft.ripple ? normalizeClicks(s.events, s.segment.viewport) : [],
  );
  const moves: NormClick[][] = loaded.segments.map((s) =>
    draft.pointer ? normalizeMoves(s.events, s.segment.viewport) : [],
  );

  const videos = loaded.segments.map((s) => createVideo(s.tabUrl, loaded.hasAudio.tab));
  // A segment's `webcamUrl` is the recorder-#2 blob: real webcam video when
  // recorded, audio-only WebM (mic) when it was not. The bubble is only a
  // draw concern (handled in `draw` via `webcamReady`) — the element itself
  // has to exist whenever there is mic audio to mix in, bubble hidden or not.
  const webcams = loaded.segments.map((s) =>
    s.webcamUrl ? createVideo(s.webcamUrl, loaded.hasAudio.mic) : null,
  );

  const stream = canvas.captureStream(EXPORT_FPS);

  // One AudioContext for the whole export, connected only to a
  // MediaStreamAudioDestinationNode — never to `audioCtx.destination` — so
  // the mix is captured into the recording without also playing to the
  // speakers. `createMediaElementSource` can only be called once per
  // element (a second call throws), but each element here is created fresh
  // for this export and read from exactly once, so no cache is needed.
  const hasAnyAudio = loaded.hasAudio.tab || loaded.hasAudio.mic;
  let audioCtx: AudioContext | null = null;
  if (hasAnyAudio) {
    audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    for (let i = 0; i < videos.length; i++) {
      if (loaded.hasAudio.tab) {
        const gain = audioCtx.createGain();
        gain.gain.value = draft.volumes.tab;
        audioCtx.createMediaElementSource(videos[i]).connect(gain).connect(dest);
      }
      const webcam = webcams[i];
      if (loaded.hasAudio.mic && webcam) {
        const gain = audioCtx.createGain();
        gain.gain.value = draft.volumes.mic;
        audioCtx.createMediaElementSource(webcam).connect(gain).connect(dest);
      }
    }
    // Added before the recorder is constructed: MediaRecorder snapshots the
    // stream's tracks at construction time, so a track added after would be
    // silently absent from the file.
    for (const track of dest.stream.getAudioTracks()) stream.addTrack(track);
  }

  const mime = pickRecorderMime(MediaRecorder.isTypeSupported, false);
  const recorder = new MediaRecorder(stream, {
    ...(mime ? { mimeType: mime } : {}),
    videoBitsPerSecond: VIDEO_BITS_PER_SECOND,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  /** One composited frame at a segment's own source ms. */
  function draw(index: number, sourceMs: number): void {
    const video = videos[index];
    if (video.readyState < 2 || video.videoWidth === 0) return;
    const timing = timings[index];
    const timelineMs = timelineAt(timings, index, Math.max(sourceMs, timing.trimStart));
    const webcam = webcams[index];
    // `webcamW/H` come out at 0 for an audio-only element on their own, but
    // that no longer follows from the element existing (audio needs it too)
    // — hiding the bubble has to be checked explicitly here now.
    const webcamReady =
      !!webcam && !draft.bubble.hidden && webcam.readyState >= 2 && webcam.videoWidth > 0;

    drawExportFrame(ctx!, width, height, {
      tab: video,
      tabW: video.videoWidth,
      tabH: video.videoHeight,
      webcam: webcamReady ? webcam : null,
      webcamW: webcamReady ? webcam.videoWidth : 0,
      webcamH: webcamReady ? webcam.videoHeight : 0,
      camera: cameraAt(draft.zoomBlocks, timelineMs),
      ripples: clicks[index]
        .filter((c) => sourceMs >= c.t && sourceMs - c.t < RIPPLE_MS)
        .map((c) => ({ nx: c.nx, ny: c.ny, ageMs: sourceMs - c.t })),
      cursor: cursorAt(moves[index], sourceMs),
      bubble: webcamReady ? draft.bubble : null,
      frame,
      frameMetrics: metrics,
    });
    onProgress({
      fraction: total > 0 ? Math.min(1, Math.max(0, timelineMs / total)) : 0,
      remainingMs: remainingExportMs(total, timelineMs),
    });
  }

  /** Parks a segment on its first visible frame and paints it. */
  async function enter(index: number): Promise<void> {
    const timing = timings[index];
    await seekTo(videos[index], timing.trimStart);
    const webcam = webcams[index];
    if (webcam) await seekTo(webcam, timing.trimStart);
    // Readiness is established, never assumed: `draw` no-ops on an
    // undecoded source, and the first segment's frame is what the recorder
    // starts on.
    await ready(videos[index]);
    draw(index, timing.trimStart);
  }

  /** Plays a segment through to its trim end, drawing every animation frame. */
  function run(index: number): Promise<void> {
    const timing = timings[index];
    const endMs = timing.sourceDuration - timing.trimEnd;
    const video = videos[index];
    const webcam = webcams[index];
    return new Promise<void>((resolve) => {
      const tick = () => {
        if (signal.aborted) {
          resolve();
          return;
        }
        const sourceMs = video.currentTime * 1000;
        // `paused` covers a source that stalled or was cut short; `ended`
        // covers a measured duration that ran past the real stream end.
        if (sourceMs >= endMs || video.ended || video.paused) {
          resolve();
          return;
        }
        // The tab element is the shared clock; two independently playing
        // <video> elements drift apart over a long recording, which would
        // slowly pull the mic audio (and the bubble) out of sync.
        if (webcam && !webcam.paused && !webcam.ended) {
          const webcamMs = webcam.currentTime * 1000;
          if (Math.abs(webcamMs - sourceMs) > AV_DRIFT_MS) webcam.currentTime = sourceMs / 1000;
        }
        draw(index, sourceMs);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  let skippedParts = 0;
  try {
    await Promise.all([
      ...videos.map(prepareVideo),
      ...webcams.filter((v): v is HTMLVideoElement => v !== null).map(prepareVideo),
    ]);

    for (let i = 0; i < videos.length && !signal.aborted; i++) {
      if (!isPlayable(videos[i], timings[i])) {
        console.warn(`[OpenScreenShot] segment ${i} has no playable video; skipping it`);
        skippedParts += 1;
        continue;
      }
      await enter(i);
      if (signal.aborted) break;
      // `enter` has painted the first frame by now, so the file does not
      // open on the untouched, transparent canvas. Keyed on the recorder's
      // own state rather than `i === 0`, because segment 0 can be the one
      // that got skipped.
      if (recorder.state === 'inactive') recorder.start();
      const webcam = webcams[i];
      // Both plays are awaited, and both rejections are handled the same way:
      // a decode error, a blob-load race or an autoplay quirk on one segment
      // costs that segment, never the whole export. Losing the tab element
      // loses the segment (it is the export's timing source); losing the
      // recorder-#2 element only drops that segment's mic and bubble.
      const [tabPlaying] = await Promise.all([
        videos[i]
          .play()
          .then(() => true)
          .catch((err: unknown) => {
            console.warn(`[OpenScreenShot] segment ${i} failed to play; skipping it`, err);
            return false;
          }),
        webcam
          ? webcam.play().catch((err: unknown) => {
              console.error(
                `[OpenScreenShot] segment ${i} mic/webcam failed to play; exporting without it`,
                err,
              );
              skippedParts += 1;
            })
          : Promise.resolve(),
      ]);
      if (!tabPlaying) {
        skippedParts += 1;
        webcams[i]?.pause();
        continue;
      }
      await run(i);
      videos[i].pause();
      webcams[i]?.pause();
    }
  } finally {
    // An abort before the first frame never started the recorder, and
    // `onstop` would never fire — awaiting it then would hang the export.
    if (recorder.state !== 'inactive') {
      recorder.stop();
      await stopped;
    }
    for (const track of stream.getTracks()) track.stop();
    for (const video of [...videos, ...webcams]) {
      if (!video) continue;
      video.pause();
      video.removeAttribute('src');
      video.remove();
    }
    if (audioCtx) await audioCtx.close().catch(() => {});
  }

  // A cancel discards the file: a half-length recording is not what was asked
  // for, and keeping it would look like the export finished early.
  if (signal.aborted) return { blob: null, skippedParts };
  if (chunks.length === 0) throw new Error('export produced no data');

  onProgress({ fraction: 1, remainingMs: 0 });
  return { blob: new Blob(chunks, { type: mime || 'video/webm' }), skippedParts };
}
