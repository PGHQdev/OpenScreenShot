/**
 * The recorder editor's settings rail: the zoom controls, the click-ripple
 * toggle, and the export section.
 *
 * Export runs on the wall clock (see `export-video.ts`), so the button turns
 * into a progress bar with a Cancel next to it for the whole render. Cancel
 * discards the partial file — an aborted export produces nothing, not a short
 * recording.
 */
import { useRef, useState } from 'preact/hooks';
import { BACKGROUND_PRESETS, type FrameOptions } from '../editor/frame';
import { deleteSession } from '../shared/recording-db';
import { getSettings } from '../shared/storage';
import { formatFilename } from '../shared/utils';
import { exportGeometry, exportVideo, type ExportDraft } from './export-video';
import type { BubbleCorner } from './recorder-draft';
import type { LoadedSession } from './session-load';

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
  onVolumes: (patch: Partial<{ tab: number; mic: number }>) => void;
  onBubble: (patch: Partial<ExportDraft['bubble']>) => void;
  onFrame: (patch: Partial<FrameOptions>) => void;
  onAddZoom: () => void;
  onRegenerate: () => void;
  onToast: (message: string) => void;
  /** The session was deleted after a successful export; leave the editor. */
  onDeleted: () => void;
}

export function Rail(props: RailProps) {
  const [progress, setProgress] = useState<number | null>(null);
  const [deleteAfter, setDeleteAfter] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const exporting = progress !== null;
  const { frame, metrics } = exportGeometry(props.loaded, props.draft);
  const isSolidBg = frame.background.kind === 'solid';
  const solidColor = isSolidBg ? (frame.background as { color: string }).color : '#1d1d1f';
  const px = (v: number) => ` · ${v}px`;

  async function runExport() {
    if (exporting) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress(0);
    try {
      const blob = await exportVideo(
        props.loaded,
        props.draft,
        (p) => setProgress(p.fraction),
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

      props.onToast(t('recorderExported', [(blob.size / 1e6).toFixed(1)]));
      if (deleteAfter) {
        await deleteSession(props.loaded.session.id);
        props.onDeleted();
      }
    } catch (err) {
      console.error('[OpenScreenShot] export failed', err);
      props.onToast(t('recorderExportFailed'));
    } finally {
      abortRef.current = null;
      setProgress(null);
    }
  }

  return (
    <aside class="rail">
      <div class="rail-section">
        <button class="rec-btn" onClick={props.onAddZoom}>
          {t('recorderAddZoom')}
        </button>
        <button class="link-btn rail-link" onClick={props.onRegenerate}>
          {t('recorderRegenerate')}
        </button>
      </div>

      <div class="rail-section">
        <label class="rail-row">
          <span class="rail-row-label">{t('recorderRipple')}</span>
          <input
            type="checkbox"
            class="switch"
            checked={props.draft.ripple}
            onChange={(e) => props.onRipple((e.currentTarget as HTMLInputElement).checked)}
          />
        </label>
      </div>

      {props.loaded.segments.some((s) => s.webcamUrl !== null) ? (
        <div class="rail-section">
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

      <div class="rail-section">
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
              aria-valuenow={Math.round((progress ?? 0) * 100)}
            >
              <div class="rec-progress-fill" style={{ width: `${(progress ?? 0) * 100}%` }} />
            </div>
            <span class="rail-hint">{t('recorderExporting')}</span>
            <button class="link-btn rail-link" onClick={() => abortRef.current?.abort()}>
              {t('recorderCancel')}
            </button>
          </>
        ) : (
          <button class="rec-btn rec-btn-primary" onClick={runExport}>
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
