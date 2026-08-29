import { useEffect, useRef, useState } from 'preact/hooks';
import { IconChevronDown } from '../shared/icons';
import { arrowNav, getFocusable, syncRovingTabIndex } from './focus';
import { DUR_MID, useExitDelay } from './transition';

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
  const { mounted, closing } = useExitDelay(open, DUR_MID);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  // Which end to land on when the menu opens: first for a click, Enter or
  // Space on the trigger (native button activation, handled by onClick
  // alone), last when the trigger was opened with ArrowUp.
  const openEndRef = useRef<'first' | 'last'>('first');

  useEffect(() => {
    if (!open) return;
    const popover = popoverRef.current;
    const items = popover ? getFocusable(popover) : [];
    const initial = openEndRef.current === 'last' ? items[items.length - 1] : items[0];
    initial?.focus();
    if (popover) syncRovingTabIndex(popover, initial);

    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    // Keeps the roving tabindex's tab stop in step with wherever arrowNav (or
    // any other focus move within the menu) actually left focus — the
    // pattern focus.ts's own doc comment recommends.
    const onFocusIn = () => {
      if (popover) syncRovingTabIndex(popover, document.activeElement as HTMLElement | null);
    };
    // Capture phase, so this runs and stops propagation before the editor's
    // own bubble-phase window listeners (⌘Z, tool letters, ⌘S, ?) see the
    // event — the popover isn't inside a modal's DOM subtree the way the
    // export dialog and shortcut sheet are, so a bubble-phase stopPropagation
    // on the popover element wouldn't reach a listener that's already on
    // window.
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key === 'Tab') {
        // Let Tab do its normal thing — the roving item under focus is the
        // only tab stop inside the menu, so it moves on to whatever's next
        // in the page. No restore: focus is already headed somewhere real.
        setOpen(false);
        return;
      }
      if (
        popover &&
        (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End')
      ) {
        arrowNav(popover, e);
      }
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey, true);
    popover?.addEventListener('focusin', onFocusIn);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey, true);
      popover?.removeEventListener('focusin', onFocusIn);
    };
  }, [open]);

  function run(action: () => void) {
    action();
    setOpen(false);
    triggerRef.current?.focus();
  }

  function openMenu(end: 'first' | 'last') {
    openEndRef.current = end;
    setOpen(true);
  }

  return (
    <div class="zoom-menu" ref={wrapRef}>
      <button
        ref={triggerRef}
        class="zoom-trigger"
        disabled={props.disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Zoom"
        onClick={() => (open ? setOpen(false) : openMenu('first'))}
        onKeyDown={(e) => {
          if (open) return; // the window listener above owns keys once it's open
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            openMenu('first');
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            openMenu('last');
          }
        }}
      >
        <span class="zoom-readout" aria-live="polite">
          {props.zoomPct}%
        </span>
        <IconChevronDown size={12} />
      </button>
      {mounted ? (
        <div
          class={`zoom-popover${closing ? ' is-closing' : ''}`}
          role="menu"
          aria-orientation="vertical"
          ref={popoverRef}
        >
          <button
            class="zoom-item"
            role="menuitem"
            tabIndex={-1}
            onClick={() => run(props.onZoomIn)}
          >
            <span>Zoom in</span>
            <kbd>⌘+</kbd>
          </button>
          <button
            class="zoom-item"
            role="menuitem"
            tabIndex={-1}
            onClick={() => run(props.onZoomOut)}
          >
            <span>Zoom out</span>
            <kbd>⌘−</kbd>
          </button>
          <button class="zoom-item" role="menuitem" tabIndex={-1} onClick={() => run(props.onFit)}>
            <span>Fit to screen</span>
            <kbd>F</kbd>
          </button>
          <button
            class="zoom-item"
            role="menuitem"
            tabIndex={-1}
            onClick={() => run(props.onActualSize)}
          >
            <span>Actual size</span>
            <kbd>⌘0</kbd>
          </button>
        </div>
      ) : null}
    </div>
  );
}
