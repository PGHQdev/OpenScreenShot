/**
 * The recorder editor's settings rail: the cursor mode, the webcam bubble,
 * volumes, Beautify, and the export section.
 *
 * Beautify collapses its twelve controls (the enabled switch, three sliders,
 * and eight background swatches) behind one popover, the same non-modal
 * contract the screenshot editor's `BeautifyMenu` establishes (R-19a): no
 * `aria-modal`, initial focus lands inside on open, focus returns to the
 * trigger only on an Escape close, the panel closes when focus leaves it, and
 * one capture-phase keydown handler owns Escape and stops every other key
 * from reaching the page underneath. The component itself isn't imported —
 * `BeautifyMenu`'s styling lives in `editor.css`, a stylesheet the recorder
 * bundle never loads (each surface has its own entry point, see `main.tsx`)
 * — so this file ports the same interaction logic onto markup styled by
 * `recorder.css` instead.
 *
 * Export runs on the wall clock (see `export-video.ts`), so the button turns
 * into a progress bar with a Cancel next to it for the whole render, plus the
 * remaining time and a warning to keep the tab visible (the render stalls
 * otherwise — see that file's header comment). Cancel discards the partial
 * file — an aborted export produces nothing, not a short recording — so it
 * asks first, the same armed two-step the session list's Delete uses. Every
 * control here that edits the draft is `inert` (or, for a lone trigger
 * button, natively `disabled`) for the same span: it repaints the live
 * preview, but the export is already running off a copy of the draft it
 * started with, so an edit now would only make the preview lie about what
 * the file will contain.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { BACKGROUND_PRESETS, type FrameOptions } from '../editor/frame';
import { getFocusable } from '../editor/focus';
import { formatTimer } from '../content/recording-overlay';
import { deleteSession } from '../shared/recording-db';
import { getSettings } from '../shared/storage';
import { formatFilename } from '../shared/utils';
import {
  exportGeometry,
  exportVideo,
  nextCancelClick,
  type ExportDraft,
  type ExportProgress,
} from './export-video';
import { saveExport } from './save-export';
import { recFailureMessageKey } from '../shared/rec-failure';
import type { BubbleCorner, CursorMode } from './recorder-draft';
import type { LoadedSession } from './session-load';

/** Same 3 s disarm as the session list's Delete confirm (App.tsx). */
const CANCEL_DISARM_MS = 3000;

const BUBBLE_CORNERS: readonly BubbleCorner[] = ['tl', 'tr', 'bl', 'br'];
const BUBBLE_CORNER_LABEL: Record<BubbleCorner, string> = {
  tl: 'recorderBubbleTL',
  tr: 'recorderBubbleTR',
  bl: 'recorderBubbleBL',
  br: 'recorderBubbleBR',
  custom: '',
};

// Ascending "how much shows": nothing, the cursor alone, clicks alone, both.
const CURSOR_MODES: readonly { mode: CursorMode; labelKey: string }[] = [
  { mode: 'hidden', labelKey: 'recorderCursorHidden' },
  { mode: 'shown', labelKey: 'recorderCursorShown' },
  { mode: 'rippleOnly', labelKey: 'recorderCursorRippleOnly' },
  { mode: 'ripple', labelKey: 'recorderCursorRipple' },
];

function t(id: string, subs?: string[]): string {
  return chrome.i18n.getMessage(id, subs) ?? id;
}

export interface RailProps {
  loaded: LoadedSession;
  draft: ExportDraft;
  onCursor: (cursor: CursorMode) => void;
  onVolumes: (patch: Partial<{ tab: number; mic: number }>) => void;
  onBubble: (patch: Partial<ExportDraft['bubble']>) => void;
  onFrame: (patch: Partial<FrameOptions>) => void;
  onToast: (message: string, tone?: 'info' | 'error') => void;
  /** The session was deleted after a successful export; leave the editor. */
  onDeleted: () => void;
  /** Lets the stage and timeline lock their own draft-editing controls too. */
  onExportingChange: (exporting: boolean) => void;
}

export function Rail(props: RailProps) {
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [deleteAfter, setDeleteAfter] = useState(false);
  const [cancelArmed, setCancelArmed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const cancelDisarmRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The announced figure, not the raw one: `progress.remainingMs` updates on
  // every driven frame, but the live region only needs to speak once a
  // second — re-announcing 30x/s would bury a screen-reader user in noise.
  const [announcedRemainingMs, setAnnouncedRemainingMs] = useState(0);
  const lastAnnouncedSecRef = useRef(-1);
  const exporting = progress !== null;
  const { frame, metrics } = exportGeometry(props.loaded, props.draft);
  const isSolidBg = frame.background.kind === 'solid';
  const solidColor = isSolidBg ? (frame.background as { color: string }).color : '#1d1d1f';
  const px = (v: number) => ` · ${v}px`;

  const [beautifyOpen, setBeautifyOpen] = useState(false);
  const beautifyWrapRef = useRef<HTMLDivElement>(null);
  const beautifyTriggerRef = useRef<HTMLButtonElement>(null);
  const beautifyPopoverRef = useRef<HTMLDivElement>(null);
  // Same mousedown/click race BeautifyMenu documents: a click on the trigger
  // fires onFocusOut (focus lands back on the trigger, whose mousedown just
  // ran) before it fires onClick's own toggle, so onFocusOut has to know a
  // click on the trigger is in flight and leave closing to onClick instead —
  // otherwise the panel closes and reopens in the same gesture.
  const beautifyTriggerDownRef = useRef(false);

  // R-19a: non-modal, so nothing here traps focus or hides the canvas
  // preview it draws over live. On open: focus lands inside. Escape: closes
  // and returns focus to the trigger — the one close path with no natural
  // focus target of its own. Any other close (a click outside, or Tab
  // carrying focus out the far end): closes without moving focus, since
  // focus already went somewhere the user chose.
  useEffect(() => {
    if (!beautifyOpen) return;
    const popover = beautifyPopoverRef.current;
    if (popover) getFocusable(popover)[0]?.focus();

    const onDown = (e: MouseEvent) => {
      if (!beautifyWrapRef.current?.contains(e.target as Node)) setBeautifyOpen(false);
    };
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null;
      if (next === beautifyTriggerRef.current && beautifyTriggerDownRef.current) return;
      if (!next || !popover?.contains(next)) setBeautifyOpen(false);
    };
    const onUp = () => {
      setTimeout(() => {
        if (beautifyTriggerDownRef.current) {
          beautifyTriggerDownRef.current = false;
          setBeautifyOpen(false);
        }
      }, 0);
    };
    // Capture phase: the popover sits outside any modal subtree, so it stops
    // every key here from also reaching the page's own shortcuts (undo,
    // play/pause) underneath — not just Escape.
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        setBeautifyOpen(false);
        beautifyTriggerRef.current?.focus();
      }
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('keydown', onKey, true);
    popover?.addEventListener('focusout', onFocusOut);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('keydown', onKey, true);
      popover?.removeEventListener('focusout', onFocusOut);
    };
  }, [beautifyOpen]);

  // Belt and braces alongside the focus-leave close above: an export starting
  // is reason enough on its own to close a panel that edits the very draft
  // the export just started copying.
  useEffect(() => {
    if (exporting) setBeautifyOpen(false);
  }, [exporting]);

  function clearCancelTimer() {
    if (cancelDisarmRef.current) clearTimeout(cancelDisarmRef.current);
    cancelDisarmRef.current = null;
  }

  function handleCancelClick() {
    const next = nextCancelClick(cancelArmed);
    clearCancelTimer();
    setCancelArmed(next.armed);
    if (next.armed) {
      cancelDisarmRef.current = setTimeout(() => setCancelArmed(false), CANCEL_DISARM_MS);
    }
    if (next.confirmed) abortRef.current?.abort();
  }

  function handleCancelKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Escape' || !cancelArmed) return;
    clearCancelTimer();
    setCancelArmed(false);
  }

  async function runExport() {
    if (exporting) return;
    const controller = new AbortController();
    abortRef.current = controller;
    lastAnnouncedSecRef.current = -1;
    setAnnouncedRemainingMs(0);
    setProgress({ fraction: 0, remainingMs: 0 });
    props.onExportingChange(true);
    try {
      const { blob, skippedParts } = await exportVideo(
        props.loaded,
        props.draft,
        (p) => {
          setProgress(p);
          const sec = Math.floor(p.remainingMs / 1000);
          if (sec !== lastAnnouncedSecRef.current) {
            lastAnnouncedSecRef.current = sec;
            setAnnouncedRemainingMs(p.remainingMs);
          }
        },
        controller.signal,
      );
      // null is a cancel, which the user already knows about.
      if (!blob) return;

      const { width, height } = exportGeometry(props.loaded, props.draft);
      const settings = await getSettings();
      const base = formatFilename(settings.filenameTemplate, {
        title: 'recording',
        width,
        height,
      });
      const outcome = await saveExport(blob, `${base}.webm`);

      // One toast slot. What it shows depends on whether the file actually
      // reached disk: a skip only matters once there is a file to be short —
      // reporting it on a cancelled or interrupted save would bury the fact
      // that nothing saved at all.
      if (outcome.state === 'complete') {
        if (skippedParts > 0) props.onToast(t(recFailureMessageKey('segment-skipped')), 'error');
        else props.onToast(t('recorderExported', [(blob.size / 1e6).toFixed(1)]));
      } else if (outcome.state === 'cancelled') {
        props.onToast(t('recorderSaveCancelled'));
      } else if (outcome.state === 'unverified') {
        props.onToast(t(recFailureMessageKey('save-unverified')), 'error');
      } else {
        props.onToast(t(recFailureMessageKey('save-interrupted'), [outcome.error]), 'error');
      }

      // Deleting the session is only safe once the download is confirmed on
      // disk — a cancelled, interrupted or unverified save must not be the
      // thing that also destroys the only other copy.
      if (deleteAfter && outcome.state === 'complete') {
        await deleteSession(props.loaded.session.id);
        props.onDeleted();
      }
    } catch (err) {
      console.error('[OpenScreenShot] export failed', err);
      props.onToast(t(recFailureMessageKey('export-failed')), 'error');
    } finally {
      abortRef.current = null;
      clearCancelTimer();
      setCancelArmed(false);
      setProgress(null);
      props.onExportingChange(false);
    }
  }

  return (
    <aside class="rail">
      <div class="rail-section" inert={exporting}>
        <span class="rail-row-label">{t('recorderCursorMode')}</span>
        <div class="rec-seg" role="group" aria-label={t('recorderCursorMode')}>
          {CURSOR_MODES.map(({ mode, labelKey }) => (
            <button
              key={mode}
              type="button"
              class="rec-seg-btn"
              aria-pressed={props.draft.cursor === mode}
              onClick={() => props.onCursor(mode)}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      {props.loaded.segments.some((s) => s.webcamUrl !== null) ? (
        <div class="rail-section" inert={exporting}>
          <span class="rail-row-label">{t('recorderBubble')}</span>
          <div class="rec-bubble-corners" role="group" aria-label={t('recorderBubble')}>
            {BUBBLE_CORNERS.map((corner) => (
              <button
                key={corner}
                type="button"
                class="rec-bubble-corner"
                data-corner={corner}
                aria-pressed={props.draft.bubble.corner === corner}
                aria-label={t(BUBBLE_CORNER_LABEL[corner])}
                title={t(BUBBLE_CORNER_LABEL[corner])}
                onClick={() => props.onBubble({ corner })}
              />
            ))}
          </div>
          <div class="rail-slider">
            <span class="rail-row-label">{t('recorderBubbleSize')}</span>
            <input
              type="range"
              class="range"
              min="0.12"
              max="0.35"
              step="0.01"
              aria-label={t('recorderBubbleSize')}
              aria-valuetext={`${Math.round(props.draft.bubble.size * 100)}%`}
              value={props.draft.bubble.size}
              onInput={(e) =>
                props.onBubble({ size: Number((e.currentTarget as HTMLInputElement).value) })
              }
            />
          </div>
          <label class="rail-row">
            <span class="rail-row-label">{t('recorderBubbleHide')}</span>
            <input
              type="checkbox"
              class="switch"
              checked={props.draft.bubble.hidden}
              onChange={(e) =>
                props.onBubble({ hidden: (e.currentTarget as HTMLInputElement).checked })
              }
            />
          </label>
        </div>
      ) : null}

      {props.loaded.hasAudio.tab || props.loaded.hasAudio.mic ? (
        <div class="rail-section">
          {props.loaded.hasAudio.tab ? (
            <div class="rail-slider">
              <span class="rail-row-label">{t('recorderVolTab')}</span>
              <input
                type="range"
                class="range"
                min="0"
                max="1"
                step="0.05"
                aria-label={t('recorderVolTab')}
                aria-valuetext={`${Math.round(props.draft.volumes.tab * 100)}%`}
                value={props.draft.volumes.tab}
                disabled={exporting}
                onInput={(e) =>
                  props.onVolumes({ tab: Number((e.currentTarget as HTMLInputElement).value) })
                }
              />
            </div>
          ) : null}
          {props.loaded.hasAudio.mic ? (
            <div class="rail-slider">
              <span class="rail-row-label">{t('recorderVolMic')}</span>
              <input
                type="range"
                class="range"
                min="0"
                max="1"
                step="0.05"
                aria-label={t('recorderVolMic')}
                aria-valuetext={`${Math.round(props.draft.volumes.mic * 100)}%`}
                value={props.draft.volumes.mic}
                disabled={exporting}
                onInput={(e) =>
                  props.onVolumes({ mic: Number((e.currentTarget as HTMLInputElement).value) })
                }
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div class="rail-section rec-beautify" ref={beautifyWrapRef}>
        <button
          ref={beautifyTriggerRef}
          type="button"
          class={`btn-secondary${frame.enabled ? ' is-active' : ''}`}
          disabled={exporting}
          aria-haspopup="dialog"
          aria-expanded={beautifyOpen}
          onMouseDown={() => {
            beautifyTriggerDownRef.current = true;
          }}
          onClick={() => {
            beautifyTriggerDownRef.current = false;
            setBeautifyOpen((v) => !v);
          }}
        >
          {t('recorderBeautify')}
        </button>
        {beautifyOpen ? (
          <div
            class="rec-beautify-popover"
            role="dialog"
            aria-label={t('recorderBeautify')}
            ref={beautifyPopoverRef}
          >
            <label class="rail-row">
              <span class="rail-row-label">{t('recorderBeautify')}</span>
              <input
                type="checkbox"
                class="switch"
                checked={frame.enabled}
                onChange={(e) =>
                  props.onFrame({ enabled: (e.currentTarget as HTMLInputElement).checked })
                }
              />
            </label>

            <div class="rail-slider">
              <span class="rail-row-label">
                {t('recorderBeautifyPadding')}
                {px(metrics.pad)}
              </span>
              <input
                type="range"
                class="range"
                min="0"
                max="100"
                step="1"
                aria-label={t('recorderBeautifyPadding')}
                aria-valuetext={`${metrics.pad}px`}
                disabled={!frame.enabled}
                value={frame.padding}
                onInput={(e) =>
                  props.onFrame({ padding: Number((e.currentTarget as HTMLInputElement).value) })
                }
              />
            </div>

            <div class="rail-slider">
              <span class="rail-row-label">
                {t('recorderBeautifyCorners')}
                {px(metrics.radius)}
              </span>
              <input
                type="range"
                class="range"
                min="0"
                max="100"
                step="1"
                aria-label={t('recorderBeautifyCorners')}
                aria-valuetext={`${metrics.radius}px`}
                disabled={!frame.enabled}
                value={frame.radius}
                onInput={(e) =>
                  props.onFrame({ radius: Number((e.currentTarget as HTMLInputElement).value) })
                }
              />
            </div>

            <div class="rail-slider">
              <span class="rail-row-label">
                {t('recorderBeautifyShadow')}
                {px(metrics.shadowBlur)}
              </span>
              <input
                type="range"
                class="range"
                min="0"
                max="100"
                step="1"
                aria-label={t('recorderBeautifyShadow')}
                aria-valuetext={`${metrics.shadowBlur}px`}
                disabled={!frame.enabled}
                value={frame.shadow}
                onInput={(e) =>
                  props.onFrame({ shadow: Number((e.currentTarget as HTMLInputElement).value) })
                }
              />
            </div>

            <div class="rail-slider">
              <span class="rail-row-label">{t('recorderBeautifyBackground')}</span>
              <div class="swatches">
                {BACKGROUND_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    class="swatch"
                    style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                    aria-label={p.label}
                    aria-pressed={
                      frame.background.kind === 'preset' && frame.background.id === p.id
                    }
                    onClick={() =>
                      props.onFrame({ background: { kind: 'preset', id: p.id }, enabled: true })
                    }
                  />
                ))}
                <button
                  type="button"
                  class="swatch swatch-transparent"
                  aria-label={t('recorderBeautifyTransparent')}
                  aria-pressed={frame.background.kind === 'transparent'}
                  onClick={() =>
                    props.onFrame({ background: { kind: 'transparent' }, enabled: true })
                  }
                />
                <label class="swatch swatch-custom" title={t('recorderBeautifyCustom')}>
                  <input
                    type="color"
                    aria-label={t('recorderBeautifyCustom')}
                    value={solidColor}
                    onChange={(e) =>
                      props.onFrame({
                        background: {
                          kind: 'solid',
                          color: (e.currentTarget as HTMLInputElement).value,
                        },
                        enabled: true,
                      })
                    }
                  />
                </label>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div class="rail-section rail-export">
        {exporting ? (
          <>
            <div
              class="rec-progress"
              role="progressbar"
              aria-label={t('recorderExporting')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((progress?.fraction ?? 0) * 100)}
            >
              <div
                class="rec-progress-fill"
                style={{ width: `${(progress?.fraction ?? 0) * 100}%` }}
              />
            </div>
            <span class="rail-hint">{t('recorderExporting')}</span>
            {/* Throttled to whole seconds above; role="timer" plus an explicit
                aria-live so a screen reader picks up each change without
                re-announcing on every driven frame. */}
            <span class="rail-hint rec-export-remaining" role="timer" aria-live="polite">
              {t('recorderExportRemaining', [formatTimer(announcedRemainingMs)])}
            </span>
            <p class="rec-export-warning">{t('recorderExportStayVisible')}</p>
            <button
              class="link-btn rail-link rec-cancel-btn"
              data-armed={cancelArmed ? 'true' : undefined}
              onClick={handleCancelClick}
              onKeyDown={handleCancelKeyDown}
            >
              {cancelArmed ? t('recorderCancelConfirm') : t('recorderCancel')}
            </button>
          </>
        ) : (
          <button class="btn-secondary rec-btn-primary" onClick={runExport}>
            {t('recorderExport')}
          </button>
        )}
        <label class="rail-check">
          <input
            type="checkbox"
            checked={deleteAfter}
            disabled={exporting}
            onChange={(e) => setDeleteAfter((e.currentTarget as HTMLInputElement).checked)}
          />
          <span>{t('recorderDeleteAfter')}</span>
        </label>
      </div>
    </aside>
  );
}
