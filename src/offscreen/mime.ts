/** MediaRecorder mime selection: VP9 preferred, VP8 fallback, then bare webm. */

const VIDEO_CANDIDATES = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];

const AUDIO_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm'];

/**
 * Picks the first candidate `supported` accepts, most-preferred first.
 * Returns `''` when nothing matches, so callers can pass no `mimeType` and
 * let `MediaRecorder` pick its own default.
 */
export function pickRecorderMime(supported: (type: string) => boolean, audioOnly: boolean): string {
  const candidates = audioOnly ? AUDIO_CANDIDATES : VIDEO_CANDIDATES;
  return candidates.find(supported) ?? '';
}
