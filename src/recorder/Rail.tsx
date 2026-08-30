/**
 * The recorder editor's settings rail: the zoom controls, the click-ripple
 * toggle, and the export section.
 *
 * Export runs on the wall clock (see `export-video.ts`), so the button turns
 * into a progress bar with a Cancel next to it for the whole render, plus the
 * remaining time and a warning to keep the tab visible (the render stalls
 * otherwise — see that file's header comment). Cancel discards the partial
 * file — an aborted export produces nothing, not a short recording — so it
 * asks first, the same armed two-step the session list's Delete uses. Every
 * control here that edits the draft is `inert` for the same span: it repaints
 * the live preview, but the export is already running off a copy of the
 * draft it started with, so an edit now would only make the preview lie
 * about what the file will contain.
 */
import { useRef, useState } from 'preact/hooks';
import { BACKGROUND_PRESETS, type FrameOptions } from '../editor/frame';
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
import { recFailureMessageKey } from '../shared/rec-failure';
import type { BubbleCorner } from './recorder-draft';
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

function t(id: string, subs?: string[]): string {
  return chrome.i18n.getMessage(id, subs) ?? id;
}

export interface RailProps {
  loaded: LoadedSession;
  draft: ExportDraft;
  onRipple: (ripple: boolean) => void;
  onPointer: (pointer: boolean) => void;
  onVolumes: (patch: Partial<{ tab: number; mic: number }>) => void;
  onBubble: (patch: Partial<ExportDraft['bubble']>) => void;
  onFrame: (patch: Partial<FrameOptions>) => void;
  onAddZoom: () => void;
  onRegenerate: () => void;
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
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${base}.webm`;
      a.click();
      URL.revokeObjectURL(a.href);

      // One toast slot, so a skip takes it: the file exists either way and
      // the browser's own download shows that, but a file shorter or quieter
      // than the timeline promised is the thing the user has to be told.
      if (skippedParts > 0) props.onToast(t(recFailureMessageKey('segment-skipped')), 'error');
      else props.onToast(t('recorderExported', [(blob.size / 1e6).toFixed(1)]));
      if (deleteAfter) {
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
        <button class="btn-secondary" onClick={props.onAddZoom}>
          {t('recorderAddZoom')}
        </button>
        <button class="link-btn rail-link" onClick={props.onRegenerate}>
          {t('recorderRegenerate')}
        </button>
      </div>

      <div class="rail-section" inert={exporting}>
        <label class="rail-row">
          <span class="rail-row-label">{t('recorderRipple')}</span>
          <input
            type="checkbox"
            class="switch"
            checked={props.draft.ripple}
            onChange={(e) => props.onRipple((e.currentTarget as HTMLInputElement).checked)}
          />
        </label>
        <label class="rail-row">
          <span class="rail-row-label">{t('recorderPointer')}</span>
          <input
            type="checkbox"
            class="switch"
            checked={props.draft.pointer}
            onChange={(e) => props.onPointer((e.currentTarget as HTMLInputElement).checked)}
          />
        </label>
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

      <div class="rail-section" inert={exporting}>
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
                aria-pressed={frame.background.kind === 'preset' && frame.background.id === p.id}
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
              onClick={() => props.onFrame({ background: { kind: 'transparent' }, enabled: true })}
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
