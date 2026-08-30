/**
 * useRecorderSession — loads a recording session, drives playback across its
 * segments, and owns the editor state (zoom blocks + trims).
 *
 * Playback model: one `<video>` element per segment is mounted (App.tsx keeps
 * them hidden and draws the active one into the stage canvas); this hook owns
 * which one is active, the timeline playhead, and the play/pause/seek
 * transport. Position is expressed in TIMELINE ms — the trimmed,
 * concatenated view — and mapped to a segment's own clock through
 * `timeline-math`. A rAF loop advances the playhead while playing, because
 * `timeupdate` is too coarse to stop at a trim boundary.
 *
 * A segment with a `webcamUrl` also mounts a second, hidden element (the
 * recorder-#2 blob — real webcam video, or audio-only when the camera was
 * never captured). It rides every seek/play/pause/advance the tab element
 * gets, and the playhead pump force-resyncs it past a drift threshold, the
 * same pattern `export-video.ts` uses to keep two independently playing
 * `<video>` elements from pulling apart over a long recording.
 *
 * Editor state grew, in task 10, to everything `RecorderDraft` persists:
 * `{ zoomBlocks, autoZoomDone, trims, ripple, volumes, bubble, frame }`. The
 * mutators keep the persisted fields canonical (blocks always run through
 * `normalizeBlocks`, trims always through `clampTrim`); `ripple`, `volumes`,
 * `bubble`, and `frame` are plain pass-throughs whose panels land in later
 * tasks. On load, `parseRecorderDraft(session.editorState)` hydrates this
 * state — including `autoZoomDone` — before the auto-zoom effect below can
 * run, so a session with a saved draft never re-clusters clicks.
 *
 * Undo (task 38) is the reason the mutators are split in two. `commitEditor`
 * is every edit the user makes: it banks the state being replaced on the undo
 * past before writing the new one. `applyEditor` is everything else — the
 * hydration above, the auto zoom's one seeding run, and the clamp a measured
 * segment duration forces — none of which the user did, and none of which may
 * become a step they can undo into a timeline they never had. The stacks
 * themselves live in `recorder-history.ts` and ride the draft, so an undo
 * survives a reload.
 *
 * The persistence effect must not treat hydration itself as an edit (a
 * read-only second tab would otherwise schedule a write 800ms after every
 * open), so `skipNextPersistRef` swallows exactly the one firing that
 * hydration causes; auto-zoom's own first run is a real edit and still
 * schedules a write. Switching sessions (or closing the tab) must not drop
 * an edit still sitting in the debounce window — `pendingRef` tracks the
 * latest unwritten snapshot so `flushPending` can write it synchronously
 * from the load effect's cleanup or the `visibilitychange` handler.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { loadSession } from './session-load';
import type { LoadedSegment, LoadProgress } from './session-load';
import { updateSession } from '../shared/recording-db';
import type { RecordingSession } from '../shared/recording-types';
import { normalizeClicks } from './events-map';
import {
  defaultRecorderDraft,
  parseRecorderDraft,
  RECORDER_DRAFT_DEBOUNCE_MS,
  type RecorderDraft,
  type RecorderEdit,
} from './recorder-draft';
import { emptyHistory, historyStep, pushHistory, type RecorderHistory } from './recorder-history';
import {
  autoZoomBlocks,
  EASE_MS,
  HOLD_MS,
  newBlockId,
  normalizeBlocks,
  type ZoomBlock,
} from './zoom';
import { clampTrim, locate, timelineAt, totalDuration, type SegmentTiming } from './timeline-math';

/** The editor's live state is exactly one undo step's worth of it. */
export type EditorState = RecorderEdit;

/** i18n helper (one per surface, like the rail and the timeline). */
function t(id: string, subs?: string[]): string {
  return chrome.i18n.getMessage(id, subs) ?? id;
}

/** "1 zoom block" / "4 zoom blocks" — what an undo announcement counts. */
function zoomBlockCount(total: number): string {
  return total === 1 ? t('recorderZoomBlockOne') : t('recorderZoomBlockMany', [String(total)]);
}

function editorFromDraft(draft: RecorderDraft): EditorState {
  return {
    zoomBlocks: draft.zoomBlocks,
    autoZoomDone: draft.autoZoomDone,
    trims: draft.trims,
    ripple: draft.ripple,
    pointer: draft.pointer,
    volumes: draft.volumes,
    bubble: draft.bubble,
    frame: draft.frame,
  };
}

export interface UseRecorderSession {
  loading: boolean;
  /** The chunk read's progress while `loading` — see `session-load.ts`'s
   *  `LoadProgress`. `total` is 0 until the count is known, which for a
   *  session with no chunks is also its final value. */
  loadProgress: LoadProgress;
  session: RecordingSession | null;
  segments: LoadedSegment[];
  /** Mirrors `LoadedSession.hasAudio`; see `session-load.ts`. */
  hasAudio: { tab: boolean; mic: boolean };
  error: string | null;
  playheadMs: number;
  playing: boolean;
  segmentIndex: number;
  timings: SegmentTiming[];
  totalMs: number;
  zoomBlocks: ZoomBlock[];
  autoZoomDone: boolean;
  trims: Record<string, { start: number; end: number }>;
  setVideoRef: (index: number, el: HTMLVideoElement | null) => void;
  videoAt: (index: number) => HTMLVideoElement | null;
  /** The segment's recorder-#2 element, when it recorded one (real webcam
   *  video or audio-only mic) — null for a segment with no `webcamUrl`. */
  setWebcamVideoRef: (index: number, el: HTMLVideoElement | null) => void;
  webcamVideoAt: (index: number) => HTMLVideoElement | null;
  updateSegmentDuration: (index: number, durationMs: number) => void;
  play: () => void;
  pause: () => void;
  seek: (timelineMs: number) => void;
  handleEnded: (index: number) => void;
  setBlocks: (blocks: ZoomBlock[]) => void;
  setTrim: (segmentId: string, patch: { start?: number; end?: number }) => void;
  /** Returns the new block's id, or null when it left no room to ease. */
  addBlockAtPlayhead: () => string | null;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** What the session view's live region reads out after an undo or a redo. */
  announcement: string;
  ripple: boolean;
  pointer: boolean;
  volumes: { tab: number; mic: number };
  bubble: EditorState['bubble'];
  frame: EditorState['frame'];
  setRipple: (ripple: boolean) => void;
  setPointer: (pointer: boolean) => void;
  setVolumes: (patch: Partial<{ tab: number; mic: number }>) => void;
  setBubble: (patch: Partial<EditorState['bubble']>) => void;
  setFrame: (frame: EditorState['frame']) => void;
}

const EMPTY_EDITOR: EditorState = editorFromDraft(defaultRecorderDraft());
const EMPTY_HAS_AUDIO = { tab: false, mic: false };
const EMPTY_LOAD_PROGRESS: LoadProgress = { loaded: 0, total: 0 };

/** Seek tolerance: under one frame, so a skipped seek changes no picture. */
const SEEK_EPSILON_MS = 20;

/**
 * Drift beyond which the webcam preview element is force-resynced to the tab
 * clock. Mirrors `export-video.ts`'s `AV_DRIFT_MS`: two independently
 * playing `<video>` elements pull apart over a long recording.
 */
const AV_DRIFT_MS = 100;

/** Segment timings under the current trims, always clampTrim-validated. */
function timingsFor(segments: LoadedSegment[], trims: EditorState['trims']): SegmentTiming[] {
  return segments.map((s) => {
    const raw = trims[s.segment.id] ?? { start: 0, end: 0 };
    const { start, end } = clampTrim(s.durationMs, raw.start, raw.end);
    return {
      segmentId: s.segment.id,
      sourceDuration: s.durationMs,
      trimStart: start,
      trimEnd: end,
    };
  });
}

/** All clicks of all segments, on the timeline clock, clustered into blocks. */
function buildAutoZoom(segments: LoadedSegment[], timings: SegmentTiming[]): ZoomBlock[] {
  const clicks = segments.flatMap((seg, i) => {
    const timing = timings[i];
    const visibleEnd = timing.sourceDuration - timing.trimEnd;
    return normalizeClicks(seg.events, seg.segment.viewport)
      .filter((c) => c.t >= timing.trimStart && c.t <= visibleEnd)
      .map((c) => ({ ...c, t: timelineAt(timings, i, c.t) }));
  });
  return autoZoomBlocks(clicks, totalDuration(timings));
}

/** Cuts blocks back into a shortened timeline; `normalizeBlocks` drops the stubs. */
function clampBlocksTo(blocks: ZoomBlock[], totalMs: number): ZoomBlock[] {
  return normalizeBlocks(
    blocks.map((b) => ({
      ...b,
      startMs: Math.min(b.startMs, totalMs),
      endMs: Math.min(b.endMs, totalMs),
    })),
  );
}

export function useRecorderSession(sessionId: string | null): UseRecorderSession {
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState<LoadProgress>(EMPTY_LOAD_PROGRESS);
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [segments, setSegments] = useState<LoadedSegment[]>([]);
  const [hasAudio, setHasAudio] = useState(EMPTY_HAS_AUDIO);
  const [error, setError] = useState<string | null>(null);
  const [playheadMs, setPlayheadMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR);
  const [history, setHistory] = useState<RecorderHistory>(emptyHistory);
  const [announcement, setAnnouncement] = useState('');
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const webcamRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Eager mirrors, written beside their state rather than synced from an
  // effect: a keydown that reads them has to see the keydown before it, not
  // the previous frame. Same convention `useEditor` documents for its own
  // undo stacks.
  const editorRef = useRef(editor);
  const historyRef = useRef(history);
  // One pointer press, or one held key, is one undo step: `open` spans the
  // gesture, `pushed` remembers whether it already banked one.
  const gestureRef = useRef({ open: false, pushed: false });

  // Persistence bookkeeping (see the module doc above for why each exists).
  const skipNextPersistRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const pendingRef = useRef<{
    editor: EditorState;
    history: RecorderHistory;
    sessionId: string;
  } | null>(null);

  const writeDraft = useCallback((state: EditorState, stack: RecorderHistory, id: string) => {
    const draft: RecorderDraft = { ...state, history: stack, savedAt: Date.now() };
    void updateSession(id, { editorState: draft });
  }, []);

  /** Cancels the debounce timer without writing (a write is about to replace it). */
  const cancelPending = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingRef.current = null;
  }, []);

  /** Writes whatever the debounce hasn't gotten to yet, then forgets it. */
  const flushPending = useCallback(() => {
    const pending = pendingRef.current;
    cancelPending();
    if (pending) writeDraft(pending.editor, pending.history, pending.sessionId);
  }, [cancelPending, writeDraft]);

  /** State the user did not edit: hydration, the auto zoom, the duration
   *  clamp. It moves the editor without leaving a step behind it. */
  const applyEditor = useCallback((next: EditorState) => {
    editorRef.current = next;
    setEditor(next);
  }, []);

  /** The one way the undo stacks change. */
  const applyHistory = useCallback((next: RecorderHistory) => {
    historyRef.current = next;
    setHistory(next);
  }, []);

  /**
   * Every edit the user makes. The state being replaced joins the past first,
   * unless this edit is riding a gesture that already banked one — which is
   * what makes a whole trim drag, or a held arrow key, undo in one go.
   */
  const commitEditor = useCallback(
    (update: (prev: EditorState) => EditorState) => {
      const prev = editorRef.current;
      const next = update(prev);
      // An edit that changed nothing is not a step: a trim already at the end
      // of its travel would otherwise fill the stack with identical entries.
      if (next === prev) return;
      const gesture = gestureRef.current;
      applyHistory(pushHistory(historyRef.current, prev, gesture.open && gesture.pushed));
      gesture.pushed = true;
      applyEditor(next);
    },
    [applyEditor, applyHistory],
  );

  /*
   * Gesture boundaries, read off the window rather than wired into each
   * control. Every edit between a pointerdown and its release — a trim handle,
   * a zoom block, a rail slider, the bubble on the canvas — belongs to one
   * step, and there are a dozen such controls across three components. A
   * capture-phase pair here covers all of them and cannot be forgotten at a
   * new one. Key repeat holds a gesture open the same way `useEditor` holds
   * one across a held arrow key.
   */
  useEffect(() => {
    const open = () => {
      gestureRef.current.open = true;
    };
    const close = () => {
      gestureRef.current.open = false;
      gestureRef.current.pushed = false;
    };
    window.addEventListener('pointerdown', open, true);
    window.addEventListener('pointerup', close, true);
    window.addEventListener('pointercancel', close, true);
    window.addEventListener('keydown', open, true);
    window.addEventListener('keyup', close, true);
    return () => {
      window.removeEventListener('pointerdown', open, true);
      window.removeEventListener('pointerup', close, true);
      window.removeEventListener('pointercancel', close, true);
      window.removeEventListener('keydown', open, true);
      window.removeEventListener('keyup', close, true);
    };
  }, []);

  useEffect(() => {
    videoRefs.current = [];
    webcamRefs.current = [];
    setPlayheadMs(0);
    setPlaying(false);
    setSegmentIndex(0);
    setSession(null);
    setSegments([]);
    setHasAudio(EMPTY_HAS_AUDIO);
    applyEditor(EMPTY_EDITOR);
    applyHistory(emptyHistory());
    setAnnouncement('');
    setError(null);
    setLoadProgress(EMPTY_LOAD_PROGRESS);

    if (!sessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let loadedUrls: string[] = [];
    setLoading(true);

    loadSession(sessionId, (p) => {
      if (!cancelled) setLoadProgress(p);
    })
      .then((loaded) => {
        if (!loaded) {
          if (cancelled) return;
          setError('not-found');
          setLoading(false);
          return;
        }
        const urls = loaded.segments.flatMap((s) =>
          s.webcamUrl ? [s.tabUrl, s.webcamUrl] : [s.tabUrl],
        );
        if (cancelled) {
          // sessionId changed (or the component unmounted) while this load
          // was in flight — the effect cleanup below already ran and won't
          // run again for it, so these just-created object URLs would
          // otherwise leak for the life of the page. Revoke them right here.
          for (const url of urls) URL.revokeObjectURL(url);
          return;
        }
        loadedUrls = urls;
        setSession(loaded.session);
        setSegments(loaded.segments);
        setHasAudio(loaded.hasAudio);
        const draft =
          parseRecorderDraft(loaded.session.editorState) ??
          defaultRecorderDraft(loaded.session.settings.ripple);
        // Hydration is not an edit — the persistence effect's next firing,
        // caused by this very setEditor, must not schedule a write.
        skipNextPersistRef.current = true;
        applyEditor(editorFromDraft(draft));
        applyHistory(draft.history);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });

    return () => {
      cancelled = true;
      for (const url of loadedUrls) URL.revokeObjectURL(url);
      // Switching sessions (or leaving the page) must not drop an edit still
      // sitting in the debounce window.
      flushPending();
    };
  }, [sessionId, flushPending, applyEditor, applyHistory]);

  const timings = useMemo(() => timingsFor(segments, editor.trims), [segments, editor.trims]);
  const totalMs = useMemo(() => totalDuration(timings), [timings]);

  // Mirrors of the render state for the rAF loop and the imperative transport,
  // which both run outside a render pass and must see the latest values.
  const segmentsRef = useRef(segments);
  const timingsRef = useRef(timings);
  const playheadRef = useRef(playheadMs);
  const activeRef = useRef(segmentIndex);
  const playingRef = useRef(playing);
  segmentsRef.current = segments;
  timingsRef.current = timings;
  playheadRef.current = playheadMs;
  activeRef.current = segmentIndex;
  playingRef.current = playing;

  // Auto zoom runs once per session, on first open. Not a step: undoing it
  // would leave the user staring at a timeline they never emptied, and the
  // seeding is the state their first real edit is measured against.
  useEffect(() => {
    if (loading || segments.length === 0) return;
    const prev = editorRef.current;
    if (prev.autoZoomDone) return;
    applyEditor({
      ...prev,
      zoomBlocks: buildAutoZoom(segments, timingsFor(segments, prev.trims)),
      autoZoomDone: true,
    });
  }, [loading, segments, applyEditor]);

  const setPosition = useCallback((index: number, sourceMs: number, timelineMs: number) => {
    activeRef.current = index;
    playheadRef.current = timelineMs;
    setSegmentIndex(index);
    setPlayheadMs(timelineMs);
    const video = videoRefs.current[index];
    if (video && Math.abs(video.currentTime * 1000 - sourceMs) > SEEK_EPSILON_MS) {
      video.currentTime = sourceMs / 1000;
    }
    // The webcam element is a second, independent source on the same
    // segment's own clock — every seek that moves the tab video has to move
    // it too, or the bubble (and its mic audio) shows the wrong instant.
    const webcam = webcamRefs.current[index];
    if (webcam && Math.abs(webcam.currentTime * 1000 - sourceMs) > SEEK_EPSILON_MS) {
      webcam.currentTime = sourceMs / 1000;
    }
  }, []);

  const seek = useCallback(
    (timelineMs: number) => {
      const current = timingsRef.current;
      if (current.length === 0) return;
      const clamped = Math.max(0, Math.min(timelineMs, totalDuration(current)));
      const { index, sourceMs } = locate(current, clamped);
      if (index !== activeRef.current) {
        videoRefs.current[activeRef.current]?.pause();
        webcamRefs.current[activeRef.current]?.pause();
      }
      setPosition(index, sourceMs, clamped);
      if (playingRef.current) {
        void videoRefs.current[index]?.play().catch(() => {});
        void webcamRefs.current[index]?.play().catch(() => {});
      }
    },
    [setPosition],
  );

  /** Moves to the next segment, or parks at the end of the timeline. */
  const advance = useCallback(
    (from: number) => {
      const current = timingsRef.current;
      videoRefs.current[from]?.pause();
      webcamRefs.current[from]?.pause();
      const next = from + 1;
      if (next >= current.length) {
        playingRef.current = false;
        setPlaying(false);
        const end = totalDuration(current);
        playheadRef.current = end;
        setPlayheadMs(end);
        return;
      }
      setPosition(
        next,
        current[next].trimStart,
        timelineAt(current, next, current[next].trimStart),
      );
      if (playingRef.current) {
        void videoRefs.current[next]?.play().catch(() => {});
        void webcamRefs.current[next]?.play().catch(() => {});
      }
    },
    [setPosition],
  );

  // Playhead pump: reads the active video's own clock, stops it at the trim.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const current = timingsRef.current;
      const index = activeRef.current;
      const timing = current[index];
      const video = videoRefs.current[index];
      if (!timing || !video) return;
      const sourceMs = video.currentTime * 1000;
      if (sourceMs >= timing.sourceDuration - timing.trimEnd) {
        advance(index);
        return;
      }
      // The tab element is the shared clock, same as the export loop.
      const webcam = webcamRefs.current[index];
      if (webcam && !webcam.paused && !webcam.ended) {
        const webcamMs = webcam.currentTime * 1000;
        if (Math.abs(webcamMs - sourceMs) > AV_DRIFT_MS) webcam.currentTime = sourceMs / 1000;
      }
      const at = timelineAt(current, index, Math.max(sourceMs, timing.trimStart));
      playheadRef.current = at;
      setPlayheadMs(at);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, advance]);

  // A trim can pull the end of the timeline behind the playhead.
  useEffect(() => {
    if (totalMs > 0 && playheadRef.current > totalMs) seek(totalMs);
  }, [totalMs, seek]);

  const setVideoRef = useCallback((index: number, el: HTMLVideoElement | null) => {
    videoRefs.current[index] = el;
  }, []);

  const videoAt = useCallback((index: number) => videoRefs.current[index] ?? null, []);

  const setWebcamVideoRef = useCallback((index: number, el: HTMLVideoElement | null) => {
    webcamRefs.current[index] = el;
  }, []);

  const webcamVideoAt = useCallback((index: number) => webcamRefs.current[index] ?? null, []);

  const updateSegmentDuration = useCallback(
    (index: number, durationMs: number) => {
      // Every segment measures itself, and two results can land in one flush —
      // so the segment merge has to build on the queued state, never on a ref
      // that refreshes at render. The merged array is stashed for the clamp
      // below, which reads the eager editorRef instead: that one is written by
      // the writers above, so it already carries any edit still queued.
      let merged: LoadedSegment[] | null = null;
      setSegments((prev) => {
        merged = prev.map((s, i) => (i === index ? { ...s, durationMs } : s));
        return merged;
      });
      // A measured duration can come in shorter than the estimate the blocks
      // were generated against, which would leave them past the end.
      const source = merged ?? segmentsRef.current;
      // Measurement, not an edit — it leaves no undo step behind it.
      const prev = editorRef.current;
      applyEditor({
        ...prev,
        zoomBlocks: clampBlocksTo(prev.zoomBlocks, totalDuration(timingsFor(source, prev.trims))),
      });
    },
    [applyEditor],
  );

  const play = useCallback(() => {
    const current = timingsRef.current;
    if (current.length === 0) return;
    const total = totalDuration(current);
    // Parked at the end: start over rather than sitting on the last frame.
    const at = playheadRef.current >= total ? 0 : playheadRef.current;
    const { index, sourceMs } = locate(current, at);
    setPosition(index, sourceMs, at);
    playingRef.current = true;
    setPlaying(true);
    void videoRefs.current[index]?.play().catch(() => {});
    void webcamRefs.current[index]?.play().catch(() => {});
  }, [setPosition]);

  const pause = useCallback(() => {
    playingRef.current = false;
    setPlaying(false);
    videoRefs.current[activeRef.current]?.pause();
    webcamRefs.current[activeRef.current]?.pause();
  }, []);

  /** The source ran out before the computed trim end (measured duration drift). */
  const handleEnded = useCallback(
    (index: number) => {
      if (index !== activeRef.current) return;
      advance(index);
    },
    [advance],
  );

  const setBlocks = useCallback(
    (blocks: ZoomBlock[]) => {
      commitEditor((prev) => ({ ...prev, zoomBlocks: normalizeBlocks(blocks) }));
    },
    [commitEditor],
  );

  const setTrim = useCallback(
    (segmentId: string, patch: { start?: number; end?: number }) => {
      commitEditor((prev) => {
        const segment = segmentsRef.current.find((s) => s.segment.id === segmentId);
        if (!segment) return prev;
        const current = prev.trims[segmentId] ?? { start: 0, end: 0 };
        const next = clampTrim(
          segment.durationMs,
          patch.start ?? current.start,
          patch.end ?? current.end,
        );
        if (next.start === current.start && next.end === current.end) return prev;
        const trims = { ...prev.trims, [segmentId]: next };
        const total = totalDuration(timingsFor(segmentsRef.current, trims));
        return { ...prev, trims, zoomBlocks: clampBlocksTo(prev.zoomBlocks, total) };
      });
    },
    [commitEditor],
  );

  const addBlockAtPlayhead = useCallback((): string | null => {
    const total = totalDuration(timingsRef.current);
    const span = Math.min(2 * EASE_MS + HOLD_MS, total);
    if (span < 2 * EASE_MS) return null;
    const startMs = Math.max(0, Math.min(playheadRef.current - EASE_MS, total - span));
    const block: ZoomBlock = {
      id: newBlockId(),
      startMs,
      endMs: startMs + span,
      scale: 2,
      cx: 0.5,
      cy: 0.5,
    };
    commitEditor((prev) => ({
      ...prev,
      zoomBlocks: normalizeBlocks([...prev.zoomBlocks, block]),
    }));
    return block.id;
  }, [commitEditor]);

  /** Undo (-1) or redo (1), and say what the timeline holds afterwards. */
  const travel = useCallback(
    (dir: -1 | 1) => {
      const step = historyStep(historyRef.current, editorRef.current, dir);
      if (!step) return;
      applyHistory(step.history);
      applyEditor(step.entry);
      // The alternating trailing space is load-bearing, the same as the image
      // editor's: two undos in a row can produce the same sentence, and an
      // identical string is not a state change, so the region would say
      // nothing the second time.
      const text = t(dir === -1 ? 'recorderUndoAnnounce' : 'recorderRedoAnnounce', [
        zoomBlockCount(step.entry.zoomBlocks.length),
      ]);
      setAnnouncement((prev) => (prev === text ? `${text} ` : text));
    },
    [applyEditor, applyHistory],
  );

  const undo = useCallback(() => travel(-1), [travel]);
  const redo = useCallback(() => travel(1), [travel]);

  const setRipple = useCallback(
    (ripple: boolean) => {
      commitEditor((prev) => (prev.ripple === ripple ? prev : { ...prev, ripple }));
    },
    [commitEditor],
  );

  const setPointer = useCallback(
    (pointer: boolean) => {
      commitEditor((prev) => (prev.pointer === pointer ? prev : { ...prev, pointer }));
    },
    [commitEditor],
  );

  const setVolumes = useCallback(
    (patch: Partial<{ tab: number; mic: number }>) => {
      commitEditor((prev) => ({ ...prev, volumes: { ...prev.volumes, ...patch } }));
    },
    [commitEditor],
  );

  const setBubble = useCallback(
    (patch: Partial<EditorState['bubble']>) => {
      commitEditor((prev) => ({ ...prev, bubble: { ...prev.bubble, ...patch } }));
    },
    [commitEditor],
  );

  const setFrame = useCallback(
    (frame: EditorState['frame']) => {
      commitEditor((prev) => ({ ...prev, frame }));
    },
    [commitEditor],
  );

  // Session ref for the visibilitychange flush below, which runs outside a
  // render pass and must see the latest value. (The editor and history refs
  // are the eager ones written by the writers above.)
  const sessionRef = useRef(session);
  sessionRef.current = session;

  // Debounced crash-safety net: any editor-state change lands in the session
  // record `RECORDER_DRAFT_DEBOUNCE_MS` after the last edit. The firing this
  // effect makes right after hydration is not an edit, so it is swallowed —
  // but a subsequent edit (auto-zoom's own first run included) still lands.
  useEffect(() => {
    if (loading || !session) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    pendingRef.current = { editor, history, sessionId: session.id };
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      pendingRef.current = null;
      writeDraft(editor, history, session.id);
    }, RECORDER_DRAFT_DEBOUNCE_MS);
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [editor, history, loading, session, writeDraft]);

  // A closing tab does not wait out the debounce. `beforeunload` is not
  // used: a storage write started there is not guaranteed to land.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'hidden') return;
      if (loading || !sessionRef.current) return;
      // Supersede the debounce timer instead of racing it: it would otherwise
      // still fire later with the same value, a harmless but pointless write.
      cancelPending();
      writeDraft(editorRef.current, historyRef.current, sessionRef.current.id);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [loading, writeDraft, cancelPending]);

  return {
    loading,
    loadProgress,
    session,
    segments,
    hasAudio,
    error,
    playheadMs,
    playing,
    segmentIndex,
    timings,
    totalMs,
    zoomBlocks: editor.zoomBlocks,
    autoZoomDone: editor.autoZoomDone,
    trims: editor.trims,
    setVideoRef,
    videoAt,
    setWebcamVideoRef,
    webcamVideoAt,
    updateSegmentDuration,
    play,
    pause,
    seek,
    handleEnded,
    setBlocks,
    setTrim,
    addBlockAtPlayhead,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    announcement,
    ripple: editor.ripple,
    pointer: editor.pointer,
    volumes: editor.volumes,
    bubble: editor.bubble,
    frame: editor.frame,
    setRipple,
    setPointer,
    setVolumes,
    setBubble,
    setFrame,
  };
}
