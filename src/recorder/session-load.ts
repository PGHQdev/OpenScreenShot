/**
 * Loads a recording session for the recorder editor: assembles each
 * segment's chunks into playable object URLs and normalizes a session left
 * mid-recording by a crash (worker died, browser closed) into a finished one.
 */
import {
  countChunks,
  finalizeSegment,
  getSegments,
  getSession,
  readChunks,
  readEvents,
  updateSession,
} from '../shared/recording-db';
import type { CursorEvent, RecordingSegment, RecordingSession } from '../shared/recording-types';

export interface LoadedSegment {
  segment: RecordingSegment;
  tabUrl: string;
  webcamUrl: string | null;
  durationMs: number;
  events: CursorEvent[];
}

export interface LoadedSession {
  session: RecordingSession;
  segments: LoadedSegment[];
  /**
   * Whether the export/preview have an audio source to route. `tab` is
   * `session.settings.tabAudio` as recorded. `mic` also requires at least
   * one segment's recorder-#2 blob to exist: `settings.mic` can be true with
   * nothing actually captured, because a declined/unavailable mic does not
   * fail the recording (see `offscreen/engine.ts`) — it just leaves every
   * segment's `webcamUrl` null.
   */
  hasAudio: { tab: boolean; mic: boolean };
}

/** MediaRecorder writes one WebM chunk per second, so this is a rough stand-in
 * for a segment's real duration until it has been finalized or measured. */
export function estimateDuration(chunkCount: number): number {
  return chunkCount * 1000;
}

/** Concatenate chunks in append order into a single playable WebM blob. */
export function assembleBlob(chunks: Blob[]): Blob {
  return new Blob(chunks, { type: 'video/webm' });
}

const FIX_DURATION_TIMEOUT_MS = 4000;

/**
 * MediaRecorder WebM omits the duration header, so a freshly loaded
 * `<video>` reports `Infinity` until something forces it to resolve the
 * stream's end. Seeking past the real end does that; the true, finite
 * duration is readable once `seeked` fires. Resets `currentTime` to 0 so
 * playback starts from the beginning.
 *
 * A session switch (or unmount) can swap out or detach the video before
 * `seeked` ever fires — a bare `await new Promise(resolve => ...)` would
 * hang forever with its listener still attached. This settles either way:
 * `error` rejects immediately, and a timeout rejects as a last resort, both
 * always removing their listeners/timer first.
 */
export function fixDuration(video: HTMLVideoElement): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      clearTimeout(timer);
    };
    const onSeeked = () => {
      if (settled) return;
      settled = true;
      cleanup();
      const { duration } = video;
      video.currentTime = 0;
      resolve(Number.isFinite(duration) && duration > 0 ? Math.round(duration * 1000) : 0);
    };
    const onError = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('video errored while measuring duration'));
    };
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('timed out measuring duration'));
    }, FIX_DURATION_TIMEOUT_MS);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    video.currentTime = Number.MAX_SAFE_INTEGER;
  });
}

/** Progress through `loadSession`'s chunk read: `total` is known before the
 *  first chunk is read, never grows partway through. */
export interface LoadProgress {
  loaded: number;
  total: number;
}

export async function loadSession(
  id: string,
  onProgress?: (progress: LoadProgress) => void,
): Promise<LoadedSession | null> {
  const session = await getSession(id);
  if (!session) return null;

  // A session still marked 'recording' when it's being opened here means the
  // recorder never got to stop it cleanly (crash, browser close) — this load
  // is the recovery.
  const crashed = session.status === 'recording';

  const rawSegments = await getSegments(id);

  // Every segment's chunk count is a cheap IndexedDB `count()`, so the total
  // is known before any chunk is actually read — that's what makes the
  // progress below a real fraction instead of a spinner.
  const chunkCounts = await Promise.all(
    rawSegments.map(async (s) => ({
      tab: await countChunks(s.id, 'tab'),
      webcam: await countChunks(s.id, 'webcam'),
    })),
  );
  const total = chunkCounts.reduce((sum, c) => sum + c.tab + c.webcam, 0);
  let loaded = 0;
  onProgress?.({ loaded, total });
  const onChunk = () => {
    loaded += 1;
    onProgress?.({ loaded, total });
  };

  const segments: LoadedSegment[] = [];
  for (let i = 0; i < rawSegments.length; i++) {
    const rawSegment = rawSegments[i];
    const [tabChunks, events] = await Promise.all([
      readChunks(rawSegment.id, 'tab', onChunk),
      readEvents(rawSegment.id),
    ]);
    const tabUrl = URL.createObjectURL(assembleBlob(tabChunks));
    const webcamUrl =
      chunkCounts[i].webcam > 0
        ? URL.createObjectURL(assembleBlob(await readChunks(rawSegment.id, 'webcam', onChunk)))
        : null;

    let segment = rawSegment;
    if (crashed && segment.duration === 0) {
      const estimate = estimateDuration(tabChunks.length);
      await finalizeSegment(segment.id, estimate);
      segment = { ...segment, duration: estimate };
    }

    segments.push({
      segment,
      tabUrl,
      webcamUrl,
      durationMs: segment.duration || estimateDuration(tabChunks.length),
      events,
    });
  }

  if (crashed) {
    await updateSession(id, { status: 'complete' });
  }

  return {
    session: crashed ? { ...session, status: 'complete' } : session,
    segments,
    hasAudio: {
      tab: session.settings.tabAudio,
      mic: session.settings.mic && segments.some((s) => s.webcamUrl !== null),
    },
  };
}
