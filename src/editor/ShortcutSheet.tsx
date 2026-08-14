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

export function ShortcutSheet({ onClose }: { onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const COMMANDS = buildCommands(isMacPlatform(navigator.platform));

  useEffect(() => {
    const prev = (document.activeElement as HTMLElement | null) ?? null;
    const focusable = modalRef.current ? getFocusable(modalRef.current) : [];
    focusable[0]?.focus();
    return () => {
      prev?.focus?.();
    };
  }, []);

  return (
    <div class="modal-backdrop" onMouseDown={onClose}>
      <div
        ref={modalRef}
        class="modal sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
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
