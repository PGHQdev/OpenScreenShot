import { useEffect, useRef } from 'preact/hooks';
import { TOOL_LIST } from './tools';
import { getFocusable, trapFocus } from './focus';

/** True on macOS, where the command modifier renders as ⌘ rather than Ctrl. */
export function isMacPlatform(platform: string): boolean {
  return /mac/i.test(platform);
}

/** Render a shortcut using the right modifier word for the platform. */
export function modKey(isMac: boolean): string {
  return isMac ? '⌘' : 'Ctrl+';
}

/** Commands that are not tools. Tool rows come from TOOL_LIST. */
function buildCommands(isMac: boolean): { label: string; keys: string }[] {
  const mod = modKey(isMac);
  const shift = isMac ? '⇧' : 'Shift+';
  return [
    { label: 'Set color', keys: '1–8' },
    { label: 'Pick a color from the screen', keys: 'Style bar' },
    { label: 'Square / 45° constraint', keys: isMac ? '⇧ + drag' : 'Shift + drag' },
    { label: 'Edit a text layer', keys: 'Double-click' },
    // The canvas keyboard model. These only fire while the canvas has focus.
    { label: 'Next / previous layer', keys: '] [' },
    { label: 'Place the active tool', keys: 'Enter' },
    { label: 'Move selection 1px / 10px', keys: `Arrows / ${shift}Arrows` },
    { label: 'Resize selection', keys: isMac ? '⌥Arrows' : 'Alt+Arrows' },
    { label: 'Copy to clipboard', keys: `${mod}C` },
    { label: 'Export', keys: `${mod}S` },
    { label: 'Undo', keys: `${mod}Z` },
    { label: 'Redo', keys: `${mod}${shift}Z` },
    { label: 'Delete selected', keys: '⌫' },
    { label: 'Deselect / cancel crop', keys: 'Esc' },
    { label: 'Zoom in', keys: `${mod}+` },
    { label: 'Zoom out', keys: `${mod}−` },
    { label: 'Actual size', keys: `${mod}0` },
    { label: 'Fit to screen', keys: 'F' },
    { label: 'Pan', keys: 'Space + drag' },
    { label: 'This sheet', keys: '?' },
  ];
}

export function ShortcutSheet({ onClose, closing }: { onClose: () => void; closing: boolean }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const COMMANDS = buildCommands(isMacPlatform(navigator.platform));

  useEffect(() => {
    // See ExportDialog's own consolidated focus effect (App.tsx) for why
    // this must re-run on any closing -> not-closing edge, not just the
    // true mount — a fast reopen (this sheet closing, then ? pressed again
    // before the exit timer unmounts it) survives as the same instance
    // under useExitDelay.
    if (closing) {
      prevFocusRef.current?.focus?.();
      return;
    }
    prevFocusRef.current = (document.activeElement as HTMLElement | null) ?? null;
    const focusable = modalRef.current ? getFocusable(modalRef.current) : [];
    focusable[0]?.focus();
  }, [closing]);

  return (
    <div class={`modal-backdrop${closing ? ' is-closing' : ''}`} onMouseDown={onClose}>
      <div
        ref={modalRef}
        class={`modal sheet${closing ? ' is-closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        inert={closing}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (closing) return; // let keys bubble normally during the exit fade
          // A modal owns the keyboard while it is open. Without this, window-level
          // shortcuts (⌘S, ⌘C, tool letters) still fire behind it.
          e.stopPropagation();
          trapFocus(modalRef.current!, e);
          if (e.key === 'Escape' || e.key === '?') onClose();
        }}
      >
        <h2 class="modal-title">Keyboard shortcuts</h2>
        <div class="sheet-grid">
          <div>
            <div class="field-label">Tools</div>
            {TOOL_LIST.map((t) => (
              <div key={t.id} class="sheet-row">
                <span>{t.label}</span>
                <kbd>{t.shortcut}</kbd>
              </div>
            ))}
          </div>
          <div>
            <div class="field-label">Commands</div>
            {COMMANDS.map((c) => (
              <div key={c.label} class="sheet-row">
                <span>{c.label}</span>
                <kbd>{c.keys}</kbd>
              </div>
            ))}
          </div>
        </div>
        <div class="modal-actions">
          <span class="modal-actions-spacer" />
          <button class="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
