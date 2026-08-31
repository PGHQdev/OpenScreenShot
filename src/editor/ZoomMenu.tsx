import { useEffect, useRef, useState } from 'preact/hooks';
import { IconChevronDown } from '../shared/icons';
import { arrowNav, getFocusable, syncRovingTabIndex } from './focus';
import { DUR_MID, useExitDelay } from './transition';
import { t } from './i18n';

export interface ZoomMenuProps {
  zoomPct: number;
  disabled: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onActualSize: () => void;
  onZoomTo: (zoom: number) => void;
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
        title={t('editorZoomTitle')}
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
        {/*
          No aria-live here: this span is part of the trigger's own accessible
          name, so announcing it renamed the button under the user's focus on
          every zoom step. The editor's real live region (App.tsx) announces
          the change.
        */}
        <span class="zoom-readout">{props.zoomPct}%</span>
        <IconChevronDown size={12} />
      </button>
      {mounted ? (
        <div
          class={`zoom-popover${closing ? ' is-closing' : ''}`}
          role="menu"
          aria-orientation="vertical"
          ref={popoverRef}
          // Removes the whole subtree from the a11y tree and from focus/Tab
          // order the instant it starts closing — the roving-tabindex item
          // that had tabIndex=0 while open (focus.ts's syncRovingTabIndex
          // sets that on the live DOM node directly, so it survives the
          // is-closing render on its own) would otherwise still be a real
          // Tab stop for the whole exit window.
          inert={closing}
        >
          <button
            class="zoom-item"
            role="menuitem"
            tabIndex={-1}
            onClick={() => run(props.onZoomIn)}
          >
            <span>{t('editorZoomIn')}</span>
            <kbd>⌘+</kbd>
          </button>
          <button
            class="zoom-item"
            role="menuitem"
            tabIndex={-1}
            onClick={() => run(props.onZoomOut)}
          >
            <span>{t('editorZoomOut')}</span>
            <kbd>⌘−</kbd>
          </button>
          <button class="zoom-item" role="menuitem" tabIndex={-1} onClick={() => run(props.onFit)}>
            <span>{t('editorFitToScreen')}</span>
            <kbd>F</kbd>
          </button>
          <button
            class="zoom-item"
            role="menuitem"
            tabIndex={-1}
            onClick={() => run(props.onActualSize)}
          >
            <span>{t('editorActualSize')}</span>
            <kbd>⌘0</kbd>
          </button>
          {/* Fixed steps for the long full-page shots: half and quarter size
              between Fit and 100%, no letters so no i18n entries. */}
          <button
            class="zoom-item"
            role="menuitem"
            tabIndex={-1}
            onClick={() => run(() => props.onZoomTo(0.5))}
          >
            <span>50%</span>
          </button>
          <button
            class="zoom-item"
            role="menuitem"
            tabIndex={-1}
            onClick={() => run(() => props.onZoomTo(0.25))}
          >
            <span>25%</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
