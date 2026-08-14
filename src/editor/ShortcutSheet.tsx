import { useEffect, useRef } from 'preact/hooks';
import { TOOL_LIST } from './tools';
import { getFocusable, trapFocus } from './focus';

/** Commands that are not tools. Tool rows come from TOOL_LIST. */
const COMMANDS: { label: string; keys: string }[] = [
  { label: 'Copy to clipboard', keys: '⌘C' },
  { label: 'Export', keys: '⌘S' },
  { label: 'Undo', keys: '⌘Z' },
  { label: 'Redo', keys: '⌘⇧Z' },
  { label: 'Delete selected', keys: '⌫' },
  { label: 'Deselect / cancel crop', keys: 'Esc' },
  { label: 'Zoom in', keys: '⌘+' },
  { label: 'Zoom out', keys: '⌘−' },
  { label: 'Actual size', keys: '⌘0' },
  { label: 'Fit to screen', keys: 'F' },
  { label: 'Pan', keys: 'Space + drag' },
  { label: 'This sheet', keys: '?' },
];

export function ShortcutSheet({ onClose }: { onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);

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
          trapFocus(modalRef.current!, e);
          if (e.key === 'Escape') onClose();
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
