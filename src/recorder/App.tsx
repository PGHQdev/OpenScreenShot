import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { BrandMark } from '../shared/BrandMark';
import { IconPause, IconPlay, IconRedo, IconUndo } from '../shared/icons';
import { frameFromSettings, frameToSettings, type FrameOptions } from '../editor/frame';
import { getSettings } from '../shared/storage';
import { DEFAULT_SETTINGS } from '../shared/types';
import { applyTheme, watchSystemTheme } from '../shared/theme';
import { chunkBytes, deleteSession, getSegments, listSessions } from '../shared/recording-db';
import type { RecordingSession, RecState } from '../shared/recording-types';
import { formatTimer } from '../content/recording-overlay';
import { fixDuration, trackStatuses, type LoadedSession } from './session-load';
import { useRecorderSession, type UseRecorderSession } from './useRecorderSession';
import { Timeline } from './Timeline';
import { Rail } from './Rail';
import {
  bubbleRect,
  clampBubbleCenter,
  drawExportFrame,
  fitRect,
  RIPPLE_MS,
  type FitRect,
} from './render';
import { exportGeometry, type ExportDraft } from './export-video';
import { cursorAt, normalizeClicks, normalizeMoves } from './events-map';
import { REC_FAILURE_KEY, isRecFailure, recFailureMessageKey } from '../shared/rec-failure';
import { cameraAt, EASE_MS } from './zoom';

// i18n helper
function t(id: string): string {
  return chrome.i18n.getMessage(id) ?? id;
}

/** A session's chunk total, human-sized — the session list's only caller. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

// Popup reads this to prefill "Continue recording" on the tab it's opened on
// (the recorder page is a separate tab and can't hand off the capture itself).
const CONTINUE_SESSION_KEY = 'openscreenshot:continue-session';

function sessionIdFromLocation(): string | null {
  return new URLSearchParams(window.location.search).get('session');
}

type ToastTone = 'info' | 'error';
interface Toast {
  message: string;
  tone: ToastTone;
}

export function App() {
  const [sessionId, setSessionIdState] = useState<string | null>(sessionIdFromLocation);
  const [hint, setHint] = useState<Toast | null>(null);

  function toast(message: string, tone: ToastTone = 'info') {
    setHint({ message, tone });
  }

  useEffect(() => {
    void getSettings().then((s) => applyTheme(s.theme));
  }, []);

  /**
   * Read out a parked 'chunk-write-failed', and only that one. Its message
   * sends the user here to check what they have, and until now this page did
   * not repeat it: they arrived at a session that is short by an unknown
   * amount with nothing on screen saying so. Every other failure belongs to
   * the popup, which is where its recovery is.
   */
  useEffect(() => {
    void (async () => {
      const stored = await chrome.storage.session.get(REC_FAILURE_KEY).catch(() => ({}));
      const failure: unknown = (stored as Record<string, unknown>)[REC_FAILURE_KEY];
      if (!isRecFailure(failure) || failure.code !== 'chunk-write-failed') return;
      await chrome.storage.session.remove(REC_FAILURE_KEY).catch(() => {});
      toast(t(recFailureMessageKey(failure.code)), 'error');
    })();
  }, []);

  // Live-update a "system" theme setting when the OS preference flips.
  useEffect(() => watchSystemTheme(() => void getSettings().then((s) => applyTheme(s.theme))), []);

  // A hint is transient; a failure is a state the user has to read, and it
  // stays until it is dismissed — the same rule the popup's toasts follow.
  useEffect(() => {
    if (!hint || hint.tone === 'error') return;
    const id = setTimeout(() => setHint(null), 4000);
    return () => clearTimeout(id);
  }, [hint]);

  function setSessionId(id: string | null) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('session', id);
    else url.searchParams.delete('session');
    window.history.replaceState(null, '', url);
    setSessionIdState(id);
  }

  async function continueRecording() {
    if (!sessionId) return;
    await chrome.storage.session.set({ [CONTINUE_SESSION_KEY]: sessionId });
    toast(t('recContinueHint'));
  }

  return (
    <div class="rec-app">
      <header class="rec-header">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">
            <BrandMark size={26} />
          </span>
          <span class="brand-name">{t('recorderTitle')}</span>
        </div>
        {sessionId ? (
          <button class="link-btn" onClick={continueRecording}>
            {t('recContinue')}
          </button>
        ) : null}
      </header>

      {/* role="alert" carries its own assertive live region and wins over the
          container's; role="status" on an error node would have left the
          container's aria-live as the only signal, and a polite one. */}
      {hint ? (
        <div class="toasts" aria-live="polite">
          <div class={`toast toast-${hint.tone}`} role={hint.tone === 'error' ? 'alert' : 'status'}>
            <span class="toast-text">{hint.message}</span>
            {hint.tone === 'error' ? (
              <button
                class="toast-dismiss"
                aria-label={t('dismiss')}
                title={t('dismiss')}
                onClick={() => setHint(null)}
              >
                ×
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {sessionId ? (
        <SessionView sessionId={sessionId} onMissing={() => setSessionId(null)} onToast={toast} />
      ) : (
        <SessionListView onOpen={setSessionId} />
      )}
    </div>
  );
}

/**
 * The id of the session being recorded right now, or null. A live session is
 * in this list like any other, and both of its actions are destructive while
 * the engine is still writing to it: Delete orphans every chunk written after
 * it, and Open runs crash recovery, which finalizes the open segment with an
 * estimate and marks the session complete mid-recording. A failed query means
 * no worker answered, which is the same answer as "nothing is recording".
 */
async function queryActiveSessionId(): Promise<string | null> {
  try {
    const state = (await chrome.runtime.sendMessage({ type: 'REC_QUERY' })) as RecState | undefined;
    return state?.active ? (state.sessionId ?? null) : null;
  } catch {
    return null;
  }
}

interface SessionRow {
  session: RecordingSession;
  segmentCount: number;
  totalDurationMs: number;
  totalBytes: number;
  /** Whether any segment has evidence of the combined mic/webcam stream —
   *  see `trackStatuses` in `session-load.ts` for why this is the ceiling
   *  of what a list row can honestly claim about those two tracks. */
  hasCamStream: boolean;
}

function SessionListView({ onOpen }: { onOpen: (id: string) => void }) {
  const [rows, setRows] = useState<SessionRow[] | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const [sessions, active] = await Promise.all([listSessions(), queryActiveSessionId()]);
    const withMeta = await Promise.all(
      sessions.map(async (session) => {
        const segments = await getSegments(session.id);
        const sizes = await Promise.all(
          segments.map((s) => Promise.all([chunkBytes(s.id, 'tab'), chunkBytes(s.id, 'webcam')])),
        );
        return {
          session,
          segmentCount: segments.length,
          totalDurationMs: segments.reduce((sum, s) => sum + s.duration, 0),
          totalBytes: sizes.reduce((sum, [tab, webcam]) => sum + tab + webcam, 0),
          hasCamStream: sizes.some(([, webcam]) => webcam > 0),
        };
      }),
    );
    setActiveId(active);
    setRows(withMeta);
  }

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId((cur) => (cur === id ? null : cur)), 3000);
      return;
    }
    setConfirmDeleteId(null);
    await deleteSession(id);
    await refresh();
  }

  // No chunk total to build a fraction from here — listing sessions and
  // summing their chunk bytes isn't the chunked read `loadSession` reports
  // progress through, just an IndexedDB read of unknown length. `aria-busy`
  // on the region plus a polite status line is the honest way to announce
  // that, against the alternative of a progressbar with a fraction it does
  // not have.
  if (rows === null) {
    return (
      <div class="rec-list" aria-busy="true">
        <h1 class="rec-list-title">{t('recorderSessions')}</h1>
        <p class="rec-list-loading" role="status">
          {t('recorderLoadingList')}
        </p>
      </div>
    );
  }

  return (
    <div class="rec-list">
      <h1 class="rec-list-title">{t('recorderSessions')}</h1>
      {rows.length === 0 ? (
        <p class="rec-empty">{t('recorderEmpty')}</p>
      ) : (
        rows.map(({ session, segmentCount, totalDurationMs, totalBytes, hasCamStream }) => {
          const live = session.id === activeId;
          // A retained failed start holds no segments — there is nothing to
          // open, only the record that the attempt happened, and a Delete.
          const failed = session.status === 'failed';
          // Requested settings are not recorded fact — a declined mic/webcam
          // degrades silently (engine.ts) and that correction never reaches
          // the stored session. `trackStatuses` draws the line at what the
          // chunk evidence can actually prove: 'off' is dropped, 'confirmed'
          // shows plain, 'requested' is hedged rather than asserted.
          const statuses = trackStatuses(session.settings, hasCamStream);
          const hedge = (label: string) => chrome.i18n.getMessage('recorderTrackRequested', label);
          const tracks = [
            statuses.mic === 'confirmed'
              ? t('recMic')
              : statuses.mic === 'requested'
                ? hedge(t('recMic'))
                : null,
            statuses.tabAudio === 'confirmed' ? t('recTabAudio') : null,
            statuses.webcam === 'confirmed'
              ? t('recWebcam')
              : statuses.webcam === 'requested'
                ? hedge(t('recWebcam'))
                : null,
          ].filter((label): label is string => label !== null);
          return (
            <div class="rec-row" key={session.id} data-session-id={session.id}>
              <div class="rec-row-info">
                <span class="rec-row-date">{new Date(session.createdAt).toLocaleString()}</span>
                {live ? (
                  <span class="pill pill-live">{t('recorderRecordingNow')}</span>
                ) : failed ? (
                  <span class="pill pill-failed">{t('recorderFailed')}</span>
                ) : session.status === 'recording' ? (
                  <span class="pill pill-recovered">{t('recorderRecovered')}</span>
                ) : null}
                <span class="rec-row-meta">
                  {segmentCount} &middot; {formatTimer(totalDurationMs)} &middot;{' '}
                  {formatBytes(totalBytes)} &middot; {t('recorderSourceTab')}
                  {tracks.length > 0 ? <> &middot; {tracks.join(', ')}</> : null}
                </span>
              </div>
              <div class="rec-row-actions">
                <button
                  class="link-btn"
                  aria-disabled={live || failed}
                  onClick={() => {
                    if (!live && !failed) onOpen(session.id);
                  }}
                >
                  {t('recorderOpen')}
                </button>
                <button
                  class="link-btn rec-delete-btn"
                  aria-disabled={live}
                  data-armed={confirmDeleteId === session.id ? 'true' : undefined}
                  onClick={() => {
                    if (!live) void handleDelete(session.id);
                  }}
                >
                  {confirmDeleteId === session.id
                    ? t('recorderDeleteConfirm')
                    : t('recorderDelete')}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function SessionView({
  sessionId,
  onMissing,
  onToast,
}: {
  sessionId: string;
  onMissing: () => void;
  onToast: (message: string, tone?: 'info' | 'error') => void;
}) {
  const sess = useRecorderSession(sessionId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // An export runs off its own copy of the draft (Rail owns the render), so
  // this only gates the stage's and timeline's own draft-editing controls —
  // dragging the bubble, the zoom target, a trim handle, or a zoom block —
  // which would otherwise repaint the live preview into something the file
  // being written no longer matches.
  const [exporting, setExporting] = useState(false);
  // Read by the undo/redo keydown handler below, which fires between renders
  // and must see the render that started the export — not the one an effect
  // has yet to re-register against.
  const exportingRef = useRef(exporting);
  exportingRef.current = exporting;

  // A session that will not load used to drop straight back to the list with
  // nothing said: the hook set `error` and no one read it, so a recording the
  // page could not read was indistinguishable from a stale link. 'not-found'
  // stays silent — a deleted session is not a failure, and the list it lands
  // on is already the answer.
  useEffect(() => {
    if (sess.loading || sess.session) return;
    if (sess.error && sess.error !== 'not-found') {
      onToast(t(recFailureMessageKey('session-load-failed')), 'error');
    }
    onMissing();
  }, [sess.loading, sess.session, sess.error]);

  // The renderer takes a draft, not the hook: the preview and the export must
  // read the same fields, and the hook's own draft is a persistence detail.
  const draft: ExportDraft = {
    zoomBlocks: sess.zoomBlocks,
    autoZoomDone: sess.autoZoomDone,
    trims: sess.trims,
    cursor: sess.cursor,
    volumes: sess.volumes,
    bubble: sess.bubble,
    frame: sess.frame,
  };

  // Applies the tab-volume and mic-volume sliders to every mounted preview
  // element — the export mixes through gain nodes, but the preview just
  // plays the elements directly (both unmuted, per createVideo's export-side
  // reasoning: some browsers key their captured level off `.volume`, not
  // just what reaches the speakers), so each element's own `.volume` is the
  // whole story.
  useEffect(() => {
    for (let i = 0; i < sess.segments.length; i++) {
      const video = sess.videoAt(i);
      if (video) video.volume = sess.volumes.tab;
    }
  }, [sess.segments, sess.volumes.tab, sess.videoAt]);

  useEffect(() => {
    for (let i = 0; i < sess.segments.length; i++) {
      const webcam = sess.webcamVideoAt(i);
      if (webcam) webcam.volume = sess.volumes.mic;
    }
  }, [sess.segments, sess.volumes.mic, sess.webcamVideoAt]);

  // Undo / redo, on the image editor's chords: Ctrl/Cmd+Z, Shift for redo,
  // and Ctrl+Y for the Windows habit. Locked for an export's duration for the
  // same reason every other draft control is — the render is already working
  // from a copy, so an edit now would only make the preview lie about it.
  // No typing-target guard: this page has no text entry to steal a chord from.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (exportingRef.current || !(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) sess.redo();
        else sess.undo();
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        sess.redo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sess.undo, sess.redo]);

  // `loadProgress.total` is a real chunk count, known before any chunk is
  // read (session-load.ts), so this is a determinate fraction, not a
  // spinner standing in for one — except a session with no chunks at all,
  // where there is nothing to count a fraction of and the bar stays
  // indeterminate (no aria-valuenow) for the instant it takes to resolve.
  if (sess.loading) {
    const { loaded, total } = sess.loadProgress;
    const pct = total > 0 ? Math.round((loaded / total) * 100) : null;
    return (
      <div class="rec-session-loading">
        <div
          class="rec-progress"
          role="progressbar"
          aria-label={t('recorderSessionLoading')}
          aria-valuemin={0}
          aria-valuemax={total > 0 ? total : undefined}
          aria-valuenow={total > 0 ? loaded : undefined}
          aria-valuetext={pct !== null ? `${pct}%` : undefined}
        >
          <div class="rec-progress-fill" style={{ width: `${pct ?? 0}%` }} />
        </div>
        <span class="rail-hint">{pct !== null ? `${pct}%` : t('recorderSessionLoading')}</span>
      </div>
    );
  }
  if (!sess.session) return null;

  const loaded: LoadedSession = {
    session: sess.session,
    segments: sess.segments,
    hasAudio: sess.hasAudio,
  };

  function addZoom() {
    const id = sess.addBlockAtPlayhead();
    setSelectedId(id);
  }

  /**
   * Selecting a block the playhead is outside of also seeks into its hold —
   * otherwise the reticle would move a target with nothing to show for it.
   */
  function selectBlock(id: string | null) {
    setSelectedId(id);
    const block = id ? sess.zoomBlocks.find((b) => b.id === id) : null;
    if (!block) return;
    if (sess.playheadMs < block.startMs || sess.playheadMs > block.endMs) {
      sess.seek(block.startMs + EASE_MS);
    }
  }

  // The Rail panel works in `FrameOptions` (frame.ts's unit shape); the draft
  // stores the frame in `Settings` shape so `frameFromSettings` — already
  // vetting sliders and backgrounds — stays the one validator it needs.
  function onFrame(patch: Partial<FrameOptions>) {
    const current = frameFromSettings({ ...DEFAULT_SETTINGS, ...sess.frame });
    sess.setFrame(frameToSettings({ ...current, ...patch }));
  }

  return (
    <div class="rec-session">
      {/* Undo and redo are the only edits here with no visible control of
          their own to confirm them, so the region names what the timeline
          holds once the step has landed. */}
      <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {sess.announcement}
      </div>
      <div class="rec-main">
        <div class="rec-stage">
          <Stage
            sess={sess}
            loaded={loaded}
            draft={draft}
            selectedId={selectedId}
            locked={exporting}
          />
          {sess.segments.map((seg, i) => (
            <video
              key={seg.segment.id}
              class="rec-video"
              src={seg.tabUrl}
              ref={(el) => sess.setVideoRef(i, el)}
              onEnded={() => sess.handleEnded(i)}
              onLoadedMetadata={(e) => {
                fixDuration(e.currentTarget as HTMLVideoElement)
                  .then((ms) => {
                    if (ms > 0) sess.updateSegmentDuration(i, ms);
                  })
                  // A session switch or an unplayable segment can reject
                  // this (see fixDuration) — the estimate already shown is
                  // an acceptable fallback, so there's nothing to surface.
                  .catch(() => {});
              }}
            />
          ))}
          {sess.segments.map((seg, i) =>
            seg.webcamUrl ? (
              <video
                key={`${seg.segment.id}-webcam`}
                class="rec-video"
                src={seg.webcamUrl}
                ref={(el) => sess.setWebcamVideoRef(i, el)}
              />
            ) : null,
          )}
        </div>

        <div class="rec-transport">
          <button
            class="rec-icon-btn rec-play-btn"
            aria-label={sess.playing ? t('recorderPause') : t('recorderPlay')}
            title={sess.playing ? t('recorderPause') : t('recorderPlay')}
            onClick={sess.playing ? sess.pause : sess.play}
          >
            {sess.playing ? <IconPause size={16} /> : <IconPlay size={16} />}
          </button>
          <span class="rec-time">
            {formatTimer(sess.playheadMs)} / {formatTimer(sess.totalMs)}
          </span>
          <button
            class="icon-btn rec-undo-btn"
            aria-label={t('recorderUndo')}
            title={t('recorderUndo')}
            disabled={exporting || !sess.canUndo}
            onClick={sess.undo}
          >
            <IconUndo size={16} />
          </button>
          <button
            class="icon-btn rec-redo-btn"
            aria-label={t('recorderRedo')}
            title={t('recorderRedo')}
            disabled={exporting || !sess.canRedo}
            onClick={sess.redo}
          >
            <IconRedo size={16} />
          </button>
        </div>

        <Timeline
          timings={sess.timings}
          totalMs={sess.totalMs}
          playheadMs={sess.playheadMs}
          blocks={sess.zoomBlocks}
          selectedId={selectedId}
          onSelect={selectBlock}
          onSeek={sess.seek}
          onTrim={sess.setTrim}
          onBlocks={sess.setBlocks}
          onAddZoom={addZoom}
          locked={exporting}
        />
      </div>

      <Rail
        loaded={loaded}
        draft={draft}
        onCursor={sess.setCursor}
        onVolumes={sess.setVolumes}
        onBubble={sess.setBubble}
        onFrame={onFrame}
        onToast={onToast}
        onDeleted={onMissing}
        onExportingChange={setExporting}
      />
    </div>
  );
}

/**
 * Canvas preview. The canvas is sized by `exportGeometry` — the FIRST
 * segment's pixel size plus the beautify padding — so segments recorded at
 * another size letterbox into it and the preview matches the exported file
 * pixel for pixel. It draws through `drawExportFrame`, the export's own
 * entry point, so the two cannot drift apart; the hidden per-segment
 * `<video>` elements stay the draw sources.
 */
function Stage({
  sess,
  loaded,
  draft,
  selectedId,
  locked,
}: {
  sess: UseRecorderSession;
  loaded: LoadedSession;
  draft: ExportDraft;
  selectedId: string | null;
  /** An export is running off its own copy of the draft; dragging the
   *  bubble or the zoom target here would only desync the live preview
   *  from the file already being written. */
  locked: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fitRef = useRef<FitRect>({ x: 0, y: 0, w: 0, h: 0 });
  // The last-drawn bubble circle, in canvas pixel space (padding included) —
  // null whenever no bubble was actually drawn, so a drag has nothing to
  // hit-test against a hidden or audio-only webcam.
  const bubbleHitRef = useRef<{ x: number; y: number; d: number } | null>(null);
  const [, redraw] = useState(0);

  const geometry = exportGeometry(loaded, draft);
  const { width, height, metrics } = geometry;

  const clicks = useMemo(
    () => sess.segments.map((s) => normalizeClicks(s.events, s.segment.viewport)),
    [sess.segments],
  );

  const moves = useMemo(
    () => sess.segments.map((s) => normalizeMoves(s.events, s.segment.viewport)),
    [sess.segments],
  );

  // A paused seek only shows up on the canvas once the video has decoded the
  // new frame, which is after the render that set `currentTime`.
  useEffect(() => {
    const video = sess.videoAt(sess.segmentIndex);
    if (!video) return;
    const bump = () => redraw((n) => n + 1);
    video.addEventListener('seeked', bump);
    video.addEventListener('loadeddata', bump);
    return () => {
      video.removeEventListener('seeked', bump);
      video.removeEventListener('loadeddata', bump);
    };
  }, [sess.segmentIndex, sess.segments]);

  // Same reasoning as the tab-video listener above, for the webcam element.
  useEffect(() => {
    const webcam = sess.webcamVideoAt(sess.segmentIndex);
    if (!webcam) return;
    const bump = () => redraw((n) => n + 1);
    webcam.addEventListener('seeked', bump);
    webcam.addEventListener('loadeddata', bump);
    return () => {
      webcam.removeEventListener('seeked', bump);
      webcam.removeEventListener('loadeddata', bump);
    };
  }, [sess.segmentIndex, sess.segments]);

  // One draw per render: the playhead pump re-renders every animation frame
  // while playing, and every seek or edit re-renders once.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    // Transparent, so the stage background shows through the letterbox bars
    // in whichever theme is active.
    ctx.clearRect(0, 0, width, height);

    const video = sess.videoAt(sess.segmentIndex);
    if (!video || video.readyState < 2 || video.videoWidth === 0) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const dst = fitRect(vw, vh, metrics.imgW, metrics.imgH);
    // In canvas coordinates, so the reticle can be placed without knowing
    // about the frame padding.
    fitRef.current = { ...dst, x: dst.x + metrics.pad, y: dst.y + metrics.pad };

    // Ripple ages come off the video's own clock, the same source the export
    // uses — the playhead can sit on a segment boundary and resolve to the
    // neighbour.
    const sourceMs = video.currentTime * 1000;

    // Mirrors export-video.ts's `draw`: an audio-only recorder-#2 element
    // never decodes a video frame, so `videoWidth` stays 0 forever — that is
    // the only portable way to tell it apart from a real webcam recording.
    //
    // Spec note: the tab video already contains a BAKED-IN live preview
    // bubble — tabCapture recorded the in-page overlay along with the rest
    // of the page. This composited bubble is a second, independent one, and
    // "Hide" only removes this one; it cannot reach into the recorded tab
    // pixels to remove the baked-in overlay. That is a consequence of the
    // in-page-overlay design the controller has parked, not a bug here.
    const webcam = sess.webcamVideoAt(sess.segmentIndex);
    const webcamReady =
      !!webcam && !draft.bubble.hidden && webcam.readyState >= 2 && webcam.videoWidth > 0;
    bubbleHitRef.current = webcamReady
      ? (() => {
          const b = bubbleRect(draft.bubble, metrics.imgW, metrics.imgH);
          return { x: metrics.pad + b.x, y: metrics.pad + b.y, d: b.d };
        })()
      : null;

    drawExportFrame(ctx, width, height, {
      tab: video,
      tabW: vw,
      tabH: vh,
      webcam: webcamReady ? webcam : null,
      webcamW: webcamReady ? webcam.videoWidth : 0,
      webcamH: webcamReady ? webcam.videoHeight : 0,
      camera: cameraAt(sess.zoomBlocks, sess.playheadMs),
      ripples:
        draft.cursor === 'ripple'
          ? (clicks[sess.segmentIndex] ?? [])
              .filter((c) => sourceMs >= c.t && sourceMs - c.t < RIPPLE_MS)
              .map((c) => ({ nx: c.nx, ny: c.ny, ageMs: sourceMs - c.t }))
          : [],
      cursor: draft.cursor !== 'hidden' ? cursorAt(moves[sess.segmentIndex] ?? [], sourceMs) : null,
      bubble: webcamReady ? draft.bubble : null,
      frame: geometry.frame,
      frameMetrics: metrics,
    });
  });

  const selected = sess.zoomBlocks.find((b) => b.id === selectedId) ?? null;

  /** Pointer position → the selected block's normalized target, clamped. */
  function moveTarget(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas || !selected) return;
    const rect = canvas.getBoundingClientRect();
    const fit = fitRef.current;
    if (rect.width === 0 || fit.w === 0 || fit.h === 0) return;
    const px = ((clientX - rect.left) / rect.width) * width;
    const py = ((clientY - rect.top) / rect.height) * height;
    // Free placement across the whole stage; cameraAt owns the frame-boundary
    // clamp, so a corner target simply shows the nearest legal view.
    const cx = Math.min(1, Math.max(0, (px - fit.x) / fit.w));
    const cy = Math.min(1, Math.max(0, (py - fit.y) / fit.h));
    sess.setBlocks(sess.zoomBlocks.map((b) => (b.id === selected.id ? { ...b, cx, cy } : b)));
  }

  function startTargetDrag(e: PointerEvent) {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => moveTarget(ev.clientX, ev.clientY);
    const stop = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', stop);
      el.removeEventListener('pointercancel', stop);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
  }

  /** Whether a point in client coordinates lands inside the drawn bubble. */
  function hitsBubble(clientX: number, clientY: number): boolean {
    const canvas = canvasRef.current;
    const hit = bubbleHitRef.current;
    if (!canvas || !hit) return false;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return false;
    const px = ((clientX - rect.left) / rect.width) * width;
    const py = ((clientY - rect.top) / rect.height) * height;
    const dx = px - hit.x;
    const dy = py - hit.y;
    return dx * dx + dy * dy <= (hit.d / 2) ** 2;
  }

  /** Pointer position → the bubble's normalized center, clamped on-canvas. */
  function moveBubble(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || metrics.imgW === 0 || metrics.imgH === 0) return;
    const px = ((clientX - rect.left) / rect.width) * width;
    const py = ((clientY - rect.top) / rect.height) * height;
    const nx = (px - metrics.pad) / metrics.imgW;
    const ny = (py - metrics.pad) / metrics.imgH;
    const { x, y } = clampBubbleCenter(nx, ny, draft.bubble.size, metrics.imgW, metrics.imgH);
    sess.setBubble({ corner: 'custom', x, y });
  }

  // Reticle and bubble share the canvas: the reticle is a separate element,
  // absolutely positioned on top, so a pointerdown that actually lands on it
  // never reaches this handler — this only ever sees the rest of the canvas,
  // which is exactly "otherwise bubble hit-test".
  function startBubbleDrag(e: PointerEvent) {
    if (locked) return;
    if (!hitsBubble(e.clientX, e.clientY)) return;
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => moveBubble(ev.clientX, ev.clientY);
    const stop = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', stop);
      el.removeEventListener('pointercancel', stop);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
  }

  // fitRef holds the rect of the last drawn frame. Anything that moves it
  // (a segment change) also re-renders, so the reticle follows within a frame.
  const fit = fitRef.current;
  const targetStyle = selected
    ? {
        left: `${((fit.x + selected.cx * fit.w) / width) * 100}%`,
        top: `${((fit.y + selected.cy * fit.h) / height) * 100}%`,
      }
    : undefined;

  return (
    <div class="rec-stage-frame">
      <canvas
        class="rec-canvas"
        ref={canvasRef}
        width={width}
        height={height}
        onPointerDown={startBubbleDrag}
      />
      {selected ? (
        <button
          class="rec-reticle"
          style={targetStyle}
          aria-label={t('recorderZoomTarget')}
          title={t('recorderZoomTarget')}
          disabled={locked}
          onPointerDown={startTargetDrag}
        />
      ) : null}
    </div>
  );
}
