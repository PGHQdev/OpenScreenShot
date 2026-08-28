import { useEffect, useRef, useState } from 'preact/hooks';
import { BACKGROUND_PRESETS, frameMetrics, type FrameBackground, type FrameOptions } from './frame';
import { tokens } from '../shared/design-tokens';

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

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    // Capture phase, for the same reason as ZoomMenu: the popover is not inside
    // a modal subtree, so the editor's window-level shortcut listeners would
    // otherwise see keys typed into this panel.
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey, true);
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
        class={`btn-secondary${f.enabled ? ' is-active' : ''}`}
        disabled={props.disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Beautify: padding, corners, shadow, background"
        onClick={() => setOpen((v) => !v)}
      >
        Beautify
      </button>
      {open ? (
        <div class="beautify-popover" role="dialog" aria-label="Beautify">
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
