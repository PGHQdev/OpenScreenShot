/**
 * The camera/mic permission frame, hosted in an extension iframe on the
 * recorded page (`src/content/recording-overlay.ts` mounts it, collapsed to
 * a 1x1, invisible dot it never grows out of — task 40).
 *
 * One job: it asks for camera/mic here, because camera permission is held
 * per extension origin and the offscreen document cannot show a prompt.
 * Once the user grants it here, the engine's own `getUserMedia` in
 * `src/offscreen/engine.ts` succeeds silently — permission is per origin,
 * not per stream, so this frame does not need to keep anything open once
 * that prompt is answered.
 *
 * With the mic on and the webcam off the overlay still mounts this page —
 * it is the only prompt surface for the mic.
 */

import './webcam-frame.css';
import type { RecState } from '../shared/recording-types';

/** A worker that never answers is treated the same as "nothing is recording". */
const QUERY_TIMEOUT_MS = 3000;

const params = new URLSearchParams(location.search);
const wantWebcam = params.get('webcam') === '1';
const wantMic = params.get('mic') === '1';

/**
 * The prompt was the whole point of opening this stream (see `main()`'s own
 * comment): it renders nothing, and the engine opens its own separate
 * camera/mic capture for the actual recording, so a live track here —
 * audio or video alike — would just be a second pointless capture and a
 * second device indicator, for whichever device this got.
 */
function dropTracks(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    track.stop();
    stream.removeTrack(track);
  }
}

/**
 * This page is web-accessible, so any site can embed it. Once the user has
 * granted the camera to the extension origin, an unguarded frame would open
 * the camera (or the mic) on demand for whoever framed it. So the worker is
 * asked first, and the answer is intersected with the query string: capture
 * happens only while a recording is live, and only for the tracks that
 * recording actually enabled.
 *
 * Returns the tracks this frame may open, or `null` to render nothing —
 * including when one requested track is enabled and the other is not, so a
 * `?webcam=1&mic=1` frame cannot ride a webcam-only session into the mic.
 */
async function effectiveTracks(): Promise<{ webcam: boolean; mic: boolean } | null> {
  try {
    const reply = await Promise.race([
      chrome.runtime.sendMessage({ type: 'REC_QUERY' }) as Promise<RecState | undefined>,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), QUERY_TIMEOUT_MS)),
    ]);
    if (!reply?.active || !reply.settings) return null;
    const webcam = wantWebcam && reply.settings.webcam;
    const mic = wantMic && reply.settings.mic;
    if (webcam !== wantWebcam || mic !== wantMic) return null;
    return { webcam, mic };
  } catch {
    return null;
  }
}

const CAMERA: MediaTrackConstraints = { width: { ideal: 1280 } };

/** A device this page cannot open is never fatal — the caller degrades. */
async function openStream(
  video: MediaTrackConstraints | false,
  audio: MediaTrackConstraints | false,
): Promise<MediaStream | null> {
  try {
    return await navigator.mediaDevices.getUserMedia({ video, audio });
  } catch {
    return null;
  }
}

let reported = false;

/**
 * Tell the worker this frame has settled, whatever the outcome. The start is
 * parked on this message: it holds the engine's own `getUserMedia` until the
 * prompt this page raises is answered, so every exit path below must report,
 * including the ones that never touch a device. Reports once — the denial path
 * reports early, on purpose, and then falls through the tail below.
 */
function reportReady(): void {
  if (reported) return;
  reported = true;
  chrome.runtime.sendMessage({ type: 'REC_FRAME_READY' }).catch(() => {});
}

async function main(): Promise<void> {
  if (!wantWebcam && !wantMic) return;

  // Every constraint below is built from these, never from the query string:
  // the intersection cannot open a track the live recording left off, even if
  // the gate above were to regress.
  const use = await effectiveTracks();
  if (!use) return;

  const audio = use.mic
    ? { noiseSuppression: true, echoCancellation: true, autoGainControl: true }
    : false;

  // One combined request first: Chrome folds camera and mic into a single
  // prompt, so asking for both at once costs the user one decision.
  let stream = await openStream(use.webcam ? CAMERA : false, audio);
  let haveCamera = use.webcam && !!stream;

  if (!stream && use.webcam && use.mic) {
    // A combined request fails as a whole when either device is missing or
    // blocked, so ask per device — otherwise one bad camera takes the mic
    // down with it, and the mic never even gets its prompt. A blocked device
    // rejects again without a second prompt.
    stream = await openStream(CAMERA, false);
    haveCamera = !!stream;
    if (!stream) stream = await openStream(false, audio);
  }

  if (use.webcam && !haveCamera) {
    // Report ready first: the denial makes the worker re-sync the overlay,
    // and that re-sync tears down this frame for having no camera track.
    reportReady();
    // The control bar surfaces the denial (task 40's `recOverlayCamDenied`
    // warning) — this only keeps the worker's stored settings (and its
    // overlay chips) truthful. The engine catches its own camera failure
    // independently.
    chrome.runtime.sendMessage({ type: 'REC_WEBCAM_DENIED' }).catch(() => {});
  }
  if (!stream) return;

  dropTracks(stream);
}

void main().finally(reportReady);
