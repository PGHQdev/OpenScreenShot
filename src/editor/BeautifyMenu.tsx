import { useEffect, useRef, useState } from 'preact/hooks';
import { BACKGROUND_PRESETS, frameMetrics, type FrameBackground, type FrameOptions } from './frame';
import { tokens } from '../shared/design-tokens';
import { getFocusable } from './focus';

export interface BeautifyMenuProps {
  frame: FrameOptions;
  disabled: boolean;
  imageSize: { w: number; h: number } | null;
  onChange: (patch: Partial<FrameOptions>) => void;
}

/**
 * Beautify lives in the topbar, not the tool rail: it is a property of the
 * whole document, so it has nothing to draw and nothing to select.
 */
export function BeautifyMenu(props: BeautifyMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  // Set by the trigger's own onMouseDown, consumed by onFocusOut: records
  // *why* focus is about to move, not just where it lands. Shift+Tab onto
  // the trigger and a mousedown-then-click on the trigger both end with
  // focus on the same element, but only the click should be left for
  // onClick's toggle to handle alone — Shift+Tab has to close here, or the
  // panel never closes on that path (a keyboard trap).
  const triggerMouseDownRef = useRef(false);

  // Non-modal by design: the panel's sliders preview live onto the canvas
  // behind it, so nothing here traps focus or hides the canvas from
  // assistive tech (no aria-modal, no trapFocus). What it still owes a
  // keyboard user: land focus inside on open, close if focus leaves the
  // panel (Tab off the last control moves out naturally — that's correct
  // non-modal behaviour, this just notices and closes), and return focus to
  // the trigger on Escape specifically, since that's the one close path with
  // no natural focus target of its own.
  useEffect(() => {
    if (!open) return;
    const popover = popoverRef.current;
    if (popover) getFocusable(popover)[0]?.focus();

    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null;
      // Focus landing on the trigger *because the user is clicking it* is
      // the lead-in to a click on it — its own onClick toggle already owns
      // that case. Closing here too would race that toggle: a functional
      // setOpen update queued from this handler, then another from onClick
      // in the same tick, compose into "closed, then immediately reopened".
      // Focus landing on the trigger for any OTHER reason — Shift+Tab off
      // the first control, most notably — has no such toggle waiting, so it
      // has to close here or the panel never closes on that path at all.
      if (next === triggerRef.current && triggerMouseDownRef.current) {
        triggerMouseDownRef.current = false;
        return;
      }
      triggerMouseDownRef.current = false;
      if (!next || !popover?.contains(next)) setOpen(false);
    };
    // Capture phase, for the same reason as ZoomMenu: the popover is not inside
    // a modal subtree, so the editor's window-level shortcut listeners would
    // otherwise see keys typed into this panel.
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey, true);
    popover?.addEventListener('focusout', onFocusOut);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey, true);
      popover?.removeEventListener('focusout', onFocusOut);
    };
  }, [open]);

  const f = props.frame;
  const m = props.imageSize ? frameMetrics(f, props.imageSize.w, props.imageSize.h) : null;
  const px = (v: number | undefined) => (v === undefined ? '' : ` · ${v}px`);
  const isSolid = f.background.kind === 'solid';
  const solidColor = isSolid ? (f.background as { color: string }).color : tokens.swatchBlack;

  function pickBackground(background: FrameBackground) {
    props.onChange({ background, enabled: true });
  }

  return (
    <div class="beautify-menu" ref={wrapRef}>
      <button
        ref={triggerRef}
        class={`btn-secondary${f.enabled ? ' is-active' : ''}`}
        disabled={props.disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Beautify: padding, corners, shadow, background"
        onMouseDown={() => {
          triggerMouseDownRef.current = true;
        }}
        onClick={() => setOpen((v) => !v)}
      >
        Beautify
      </button>
      {open ? (
        <div class="beautify-popover" role="dialog" aria-label="Beautify" ref={popoverRef}>
          <label class="beautify-toggle">
            <input
              type="checkbox"
              class="switch"
              checked={f.enabled}
              onChange={(e) => props.onChange({ enabled: (e.target as HTMLInputElement).checked })}
            />
            <span>Beautify</span>
          </label>

          <div class="beautify-group">
            <span class="stylebar-label">Padding{px(m?.pad)}</span>
            <input
              class="range"
              type="range"
              min="0"
              max="100"
              step="1"
              aria-label="Padding"
              aria-valuetext={m ? `${m.pad}px` : undefined}
              disabled={!f.enabled}
              value={f.padding}
              onInput={(e) =>
                props.onChange({ padding: Number((e.target as HTMLInputElement).value) })
              }
            />
          </div>

          <div class="beautify-group">
            <span class="stylebar-label">Corners{px(m?.radius)}</span>
            <input
              class="range"
              type="range"
              min="0"
              max="100"
              step="1"
              aria-label="Corners"
              aria-valuetext={m ? `${m.radius}px` : undefined}
              disabled={!f.enabled}
              value={f.radius}
              onInput={(e) =>
                props.onChange({ radius: Number((e.target as HTMLInputElement).value) })
              }
            />
          </div>

          <div class="beautify-group">
            <span class="stylebar-label">Shadow{px(m?.shadowBlur)}</span>
            <input
              class="range"
              type="range"
              min="0"
              max="100"
              step="1"
              aria-label="Shadow"
              aria-valuetext={m ? `${m.shadowBlur}px` : undefined}
              disabled={!f.enabled}
              value={f.shadow}
              onInput={(e) =>
                props.onChange({ shadow: Number((e.target as HTMLInputElement).value) })
              }
            />
          </div>

          <div class="beautify-group">
            <span class="stylebar-label">Background</span>
            <div class="swatches">
              {BACKGROUND_PRESETS.map((p) => (
                <button
                  key={p.id}
                  class="swatch"
                  style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                  aria-label={p.label}
                  aria-pressed={f.background.kind === 'preset' && f.background.id === p.id}
                  onClick={() => pickBackground({ kind: 'preset', id: p.id })}
                />
              ))}
              <button
                class="swatch swatch-transparent"
                aria-label="Transparent"
                aria-pressed={f.background.kind === 'transparent'}
                onClick={() => pickBackground({ kind: 'transparent' })}
              />
              <label class="swatch swatch-custom" title="Solid colour">
                <input
                  type="color"
                  aria-label="Solid background colour"
                  value={solidColor}
                  onChange={(e) =>
                    pickBackground({
                      kind: 'solid',
                      color: (e.target as HTMLInputElement).value,
                    })
                  }
                />
              </label>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
