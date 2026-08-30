/**
 * Timeline — segment strips with trim handles, a zoom track, a playhead and a
 * time ruler. Every row shares one track box, so a pixel column means the
 * same timeline ms in all of them: strips are laid out by visible (trimmed)
 * duration, blocks and playhead by percentage of `totalMs`.
 *
 * Drags are plain pointer events with pointer capture. Each drag samples the
 * track box and the ms-per-pixel scale once, on pointerdown, so the geometry
 * stays stable while the rows reflow underneath.
 */
import { useRef } from 'preact/hooks';
import { formatTimer } from '../content/recording-overlay';
import { clampCenter, EASE_MS, ZOOM_SCALES, type ZoomBlock, type ZoomScale } from './zoom';
import { visibleDuration, type SegmentTiming } from './timeline-math';

// i18n helper (one per surface, like the popup and the editor)
function t(id: string): string {
  return chrome.i18n.getMessage(id) ?? id;
}

/** Shortest block that still has room for both eases. */
const MIN_BLOCK_MS = 2 * EASE_MS;

/** Keyboard step for a focused trim handle. */
const KEY_TRIM_MS = 100;

const TICK_STEPS = [1000, 2000, 5000, 10_000, 15_000, 30_000, 60_000, 120_000, 300_000, 600_000];

function tickStep(totalMs: number): number {
  return TICK_STEPS.find((step) => totalMs / step <= 8) ?? TICK_STEPS[TICK_STEPS.length - 1];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

function pct(value: number, total: number): string {
  return `${total > 0 ? (value / total) * 100 : 0}%`;
}

/** Both handles move the cut point right; the end handle trims less doing so. */
function trimPatch(
  edge: 'start' | 'end',
  from: number,
  deltaMs: number,
): { start?: number; end?: number } {
  return edge === 'start' ? { start: from + deltaMs } : { end: Math.max(0, from - deltaMs) };
}

export interface TimelineProps {
  timings: SegmentTiming[];
  totalMs: number;
  playheadMs: number;
  blocks: ZoomBlock[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onSeek: (timelineMs: number) => void;
  onTrim: (segmentId: string, patch: { start?: number; end?: number }) => void;
  onBlocks: (blocks: ZoomBlock[]) => void;
  /**
   * An export is running off its own copy of the trims and zoom blocks, so
   * editing either here would only desync the live preview from the file
   * being written. Trim handles and block dragging lock; scrubbing the
   * playhead and selecting a block do not — neither touches the draft, and
   * browsing the recording while a render plays out is harmless.
   */
  locked: boolean;
}

export function Timeline(props: TimelineProps) {
  const { timings, totalMs, playheadMs, blocks, selectedId } = props;
  const trackRef = useRef<HTMLDivElement | null>(null);
  // A trim drag changes the very scale it is measured in, so its handler reads
  // the live props (and a live track rect) instead of the pointerdown ones.
  const liveRef = useRef(props);
  liveRef.current = props;

  /**
   * Starts a pointer-captured drag. `onMove` gets the ms delta from the grab
   * point and the live pointer x.
   */
  function startDrag(e: PointerEvent, onMove: (deltaMs: number, clientX: number) => void) {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (rect.width === 0) return;
    const msPerPx = totalMs / rect.width;
    const startX = e.clientX;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => onMove((ev.clientX - startX) * msPerPx, ev.clientX);
    const stop = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', stop);
      el.removeEventListener('pointercancel', stop);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
  }

  /** Seeks to the pointer's column, then keeps seeking while it moves. */
  function startSeek(e: PointerEvent) {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (rect.width === 0) return;
    const seekTo = (clientX: number) =>
      props.onSeek(clamp(((clientX - rect.left) / rect.width) * totalMs, 0, totalMs));
    seekTo(e.clientX);
    startDrag(e, (_deltaMs, clientX) => seekTo(clientX));
  }

  /**
   * Trim drag. Each move converts only the step since the previous move, at
   * the scale in force right then: cutting time out of the timeline shortens
   * it, so a scale sampled at pointerdown would be wrong by the end of a long
   * stroke.
   */
  function startTrim(e: PointerEvent, timing: SegmentTiming, edge: 'start' | 'end') {
    e.stopPropagation();
    if (props.locked) return;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    let lastX = e.clientX;
    const move = (ev: PointerEvent) => {
      const track = trackRef.current;
      const live = liveRef.current;
      if (!track || live.totalMs === 0) return;
      const rect = track.getBoundingClientRect();
      if (rect.width === 0) return;
      const current = live.timings.find((s) => s.segmentId === timing.segmentId);
      if (!current) return;
      const deltaMs = (ev.clientX - lastX) * (live.totalMs / rect.width);
      lastX = ev.clientX;
      const from = edge === 'start' ? current.trimStart : current.trimEnd;
      live.onTrim(timing.segmentId, trimPatch(edge, from, deltaMs));
    };
    const stop = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', stop);
      el.removeEventListener('pointercancel', stop);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
  }

  function trimKeys(e: KeyboardEvent, timing: SegmentTiming, edge: 'start' | 'end') {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    if (props.locked) return;
    const from = edge === 'start' ? timing.trimStart : timing.trimEnd;
    const delta = (e.key === 'ArrowRight' ? 1 : -1) * KEY_TRIM_MS;
    props.onTrim(timing.segmentId, trimPatch(edge, from, delta));
  }

  function startBlockDrag(e: PointerEvent, block: ZoomBlock, mode: 'move' | 'start' | 'end') {
    e.stopPropagation();
    props.onSelect(block.id);
    if (props.locked) return;
    const index = blocks.findIndex((b) => b.id === block.id);
    // Neighbours bound the drag, so a block can never swallow the one next to
    // it: normalizeBlocks resolves overlaps by cutting, which would delete a
    // block the user only dragged past.
    const lower = index > 0 ? blocks[index - 1].endMs : 0;
    const upper = index < blocks.length - 1 ? blocks[index + 1].startMs : totalMs;
    startDrag(e, (deltaMs) => {
      const next = { ...block };
      if (mode === 'move') {
        const span = block.endMs - block.startMs;
        next.startMs = clamp(block.startMs + deltaMs, lower, Math.max(lower, upper - span));
        next.endMs = next.startMs + span;
      } else if (mode === 'start') {
        next.startMs = clamp(block.startMs + deltaMs, lower, block.endMs - MIN_BLOCK_MS);
      } else {
        next.endMs = clamp(block.endMs + deltaMs, block.startMs + MIN_BLOCK_MS, upper);
      }
      props.onBlocks(blocks.map((b) => (b.id === block.id ? next : b)));
    });
  }

  /** A smaller scale widens the legal target range; a larger one narrows it. */
  function setScale(block: ZoomBlock, scale: ZoomScale) {
    props.onBlocks(
      blocks.map((b) =>
        b.id === block.id
          ? { ...b, scale, cx: clampCenter(b.cx, scale), cy: clampCenter(b.cy, scale) }
          : b,
      ),
    );
  }

  function deleteBlock(block: ZoomBlock) {
    props.onSelect(null);
    props.onBlocks(blocks.filter((b) => b.id !== block.id));
  }

  const selected = blocks.find((b) => b.id === selectedId) ?? null;
  const step = tickStep(totalMs);
  const ticks: number[] = [];
  // The last label is left-aligned on its tick, so stop short of the right
  // edge instead of letting it clip.
  for (let ms = 0; ms <= totalMs * 0.94; ms += step) ticks.push(ms);

  return (
    // `timeline` is the plain hook the browser smoke test selects on;
    // `rec-timeline` carries the styles.
    <div class="rec-timeline timeline" role="group" aria-label={t('recorderTimelineAria')}>
      <div class="rec-tl-track" ref={trackRef}>
        <div class="rec-tl-segments">
          {timings.map((timing) => {
            const visible = Math.max(1, visibleDuration(timing));
            return (
              <div
                class="rec-tl-strip"
                key={timing.segmentId}
                style={{ flexGrow: visible, flexBasis: 0 }}
                onPointerDown={startSeek}
              >
                {timing.trimStart > 0 ? (
                  <span
                    class="rec-tl-trimmed rec-tl-trimmed-start"
                    style={{ width: `min(100%, ${(timing.trimStart / visible) * 100}%)` }}
                  />
                ) : null}
                {timing.trimEnd > 0 ? (
                  <span
                    class="rec-tl-trimmed rec-tl-trimmed-end"
                    style={{ width: `min(100%, ${(timing.trimEnd / visible) * 100}%)` }}
                  />
                ) : null}
                <span
                  class="rec-tl-handle rec-tl-handle-start"
                  role="slider"
                  tabIndex={0}
                  aria-label={t('recorderTrimStart')}
                  aria-valuenow={Math.round(timing.trimStart)}
                  aria-valuemin={0}
                  aria-valuemax={Math.round(timing.sourceDuration)}
                  aria-disabled={props.locked || undefined}
                  onPointerDown={(e) => startTrim(e, timing, 'start')}
                  onKeyDown={(e) => trimKeys(e, timing, 'start')}
                />
                <span
                  class="rec-tl-handle rec-tl-handle-end"
                  role="slider"
                  tabIndex={0}
                  aria-label={t('recorderTrimEnd')}
                  aria-valuenow={Math.round(timing.trimEnd)}
                  aria-valuemin={0}
                  aria-valuemax={Math.round(timing.sourceDuration)}
                  aria-disabled={props.locked || undefined}
                  onPointerDown={(e) => startTrim(e, timing, 'end')}
                  onKeyDown={(e) => trimKeys(e, timing, 'end')}
                />
              </div>
            );
          })}
        </div>

        <div class="rec-tl-zooms" onPointerDown={() => props.onSelect(null)}>
          {blocks.map((block) => {
            // A measured duration can shrink the timeline under a block that
            // was placed against the old one; draw only the part still in it.
            const from = clamp(block.startMs, 0, totalMs);
            const to = clamp(block.endMs, from, totalMs);
            return (
              <div
                class="rec-tl-zoom"
                key={block.id}
                data-selected={block.id === selectedId ? 'true' : undefined}
                style={{ left: pct(from, totalMs), width: pct(to - from, totalMs) }}
                tabIndex={0}
                role="button"
                aria-pressed={block.id === selectedId}
                aria-label={`${t('recorderZoomBlock')}, ${block.scale}×`}
                onPointerDown={(e) => startBlockDrag(e, block, 'move')}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return;
                  e.preventDefault();
                  props.onSelect(block.id);
                }}
              >
                <span class="rec-tl-zoom-label">{block.scale}&times;</span>
                <span
                  class="rec-tl-zoom-edge rec-tl-zoom-edge-start"
                  onPointerDown={(e) => startBlockDrag(e, block, 'start')}
                />
                <span
                  class="rec-tl-zoom-edge rec-tl-zoom-edge-end"
                  onPointerDown={(e) => startBlockDrag(e, block, 'end')}
                />
              </div>
            );
          })}

          {selected ? (
            <div
              class="rec-zoom-tools"
              // Kept off both edges, so a block near either end of the
              // timeline doesn't push the toolbar out of the page.
              style={{
                left: `clamp(120px, ${pct((selected.startMs + selected.endMs) / 2, totalMs)}, calc(100% - 120px))`,
              }}
              onPointerDown={(e) => e.stopPropagation()}
              inert={props.locked}
            >
              <span class="rec-zoom-tools-label">{t('recorderZoomScale')}</span>
              <div class="rec-seg">
                {ZOOM_SCALES.map((scale) => (
                  <button
                    key={scale}
                    class="rec-seg-btn"
                    aria-pressed={selected.scale === scale}
                    onClick={() => setScale(selected, scale)}
                  >
                    {scale}&times;
                  </button>
                ))}
              </div>
              <button class="link-btn rec-zoom-delete" onClick={() => deleteBlock(selected)}>
                {t('recorderDeleteZoom')}
              </button>
            </div>
          ) : null}
        </div>

        <div class="rec-tl-ruler" onPointerDown={startSeek}>
          {ticks.map((ms) => (
            <span class="rec-tl-tick" key={ms} style={{ left: pct(ms, totalMs) }}>
              {formatTimer(ms)}
            </span>
          ))}
        </div>

        <div class="rec-tl-playhead" style={{ left: pct(playheadMs, totalMs) }} />
      </div>
    </div>
  );
}
