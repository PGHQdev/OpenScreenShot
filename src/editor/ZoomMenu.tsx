import { useEffect, useRef, useState } from 'preact/hooks';
import { IconChevronDown } from '../shared/icons';

export interface ZoomMenuProps {
  zoomPct: number;
  disabled: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onActualSize: () => void;
}

/**
 * The zoom readout doubles as the menu trigger. Frequent zoom lives on the
 * keyboard and the wheel, so the topbar carries one control rather than five.
 */
export function ZoomMenu(props: ZoomMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    // Capture phase, so this runs and stops propagation before the editor's
    // own bubble-phase window listeners (⌘Z, tool letters, ⌘S, ?) see the
    // event — the popover isn't inside a modal's DOM subtree the way the
    // export dialog and shortcut sheet are, so a bubble-phase stopPropagation
    // on the popover element wouldn't reach a listener that's already on
    // window.
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

  function run(action: () => void) {
    action();
    setOpen(false);
  }

  return (
    <div class="zoom-menu" ref={wrapRef}>
      <button
        class="zoom-trigger"
        disabled={props.disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Zoom"
        onClick={() => setOpen((v) => !v)}
      >
        <span class="zoom-readout" aria-live="polite">
          {props.zoomPct}%
        </span>
        <IconChevronDown size={12} />
      </button>
      {open ? (
        <div class="zoom-popover" role="menu">
          <button class="zoom-item" role="menuitem" onClick={() => run(props.onZoomIn)}>
            <span>Zoom in</span>
            <kbd>⌘+</kbd>
          </button>
          <button class="zoom-item" role="menuitem" onClick={() => run(props.onZoomOut)}>
            <span>Zoom out</span>
            <kbd>⌘−</kbd>
          </button>
          <button class="zoom-item" role="menuitem" onClick={() => run(props.onFit)}>
            <span>Fit to screen</span>
            <kbd>F</kbd>
          </button>
          <button class="zoom-item" role="menuitem" onClick={() => run(props.onActualSize)}>
            <span>Actual size</span>
            <kbd>⌘0</kbd>
          </button>
        </div>
      ) : null}
    </div>
  );
}
