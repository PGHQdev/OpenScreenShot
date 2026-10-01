/** MediaRecorder mime selection: VP9 preferred, VP8 fallback, then bare webm. */

import type { VideoFormat } from '../shared/types';

const VIDEO_CANDIDATES = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];

const AUDIO_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm'];

/** H.264 + AAC first: the pair QuickTime, iMovie and most editors open. */
const MP4_CANDIDATES = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4'];

/**
 * Picks the first candidate `supported` accepts, most-preferred first.
 * Returns `''` when nothing matches, so callers can pass no `mimeType` and
 * let `MediaRecorder` pick its own default.
 */
export function pickRecorderMime(supported: (type: string) => boolean, audioOnly: boolean): string {
  const candidates = audioOnly ? AUDIO_CANDIDATES : VIDEO_CANDIDATES;
  return candidates.find(supported) ?? '';
}

/** Whether this browser's MediaRecorder can write MP4 (Chrome 126+; not Firefox). */
export function canRecordMp4(supported: (type: string) => boolean): boolean {
  return MP4_CANDIDATES.some(supported);
}

/**
 * The export recorder's mime for `format`. MP4 returns `''` when unsupported,
 * so the caller can refuse instead of writing a WebM under an .mp4 name.
 */
export function pickExportMime(supported: (type: string) => boolean, format: VideoFormat): string {
  if (format === 'mp4') return MP4_CANDIDATES.find(supported) ?? '';
  return pickRecorderMime(supported, false);
}
