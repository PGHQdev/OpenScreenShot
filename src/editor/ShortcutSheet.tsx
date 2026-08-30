import { useEffect, useRef } from 'preact/hooks';
import { TOOL_LIST } from './tools';
import { getFocusable, trapFocus } from './focus';
import { t } from './i18n';

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
    { label: t('editorCmdSetColor'), keys: '1–8' },
    { label: t('editorCmdPickColor'), keys: t('editorKeysStyleBar') },
    { label: t('editorCmdSquare45'), keys: isMac ? '⇧ + drag' : 'Shift + drag' },
    { label: t('editorCmdEditText'), keys: 'Double-click' },
    // The canvas keyboard model. These only fire while the canvas has focus.
    { label: t('editorCmdNextPrevLayer'), keys: '] [' },
    { label: t('editorCmdAddLayer'), keys: `${shift}] [` },
    { label: t('editorCmdSelectSeveral'), keys: `${shift}Click / drag` },
    { label: t('editorCmdPlaceTool'), keys: 'Enter' },
    { label: t('editorCmdMoveSelection'), keys: `Arrows / ${shift}Arrows` },
    { label: t('editorCmdResizeSelection'), keys: isMac ? '⌥Arrows' : 'Alt+Arrows' },
    { label: t('editorCmdDuplicateSelection'), keys: isMac ? '⌥D' : 'Alt+D' },
    { label: t('editorCmdCopyClipboard'), keys: `${mod}C` },
    { label: t('editorExport'), keys: `${mod}S` },
    { label: t('editorUndoLabel'), keys: `${mod}Z` },
    { label: t('editorRedoLabel'), keys: `${mod}${shift}Z` },
    { label: t('editorDeleteSelectedLabel'), keys: '⌫' },
    { label: t('editorCmdCropNextHandle'), keys: '] [' },
    { label: t('editorCmdCropResizeHandle'), keys: isMac ? '⌥Arrows' : 'Alt+Arrows' },
    // Both rows name the tool: the sheet is one flat list with no per-tool
    // section, so a row reading "Enter" with nothing else on it would claim a
    // key that does something different under every other tool.
    { label: t('editorCmdCutTakeOut'), keys: 'Enter' },
    { label: t('editorCmdCutPutBack'), keys: '⌫' },
    { label: t('editorCmdDeselectCancel'), keys: 'Esc' },
    { label: t('editorZoomIn'), keys: `${mod}+` },
    { label: t('editorZoomOut'), keys: `${mod}−` },
    { label: t('editorActualSize'), keys: `${mod}0` },
    { label: t('editorFitToScreen'), keys: 'F' },
    { label: t('editorCmdPan'), keys: 'Space + drag' },
    { label: t('editorCmdThisSheet'), keys: '?' },
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
        aria-label={t('editorShortcutsLabel')}
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
        <h2 class="modal-title">{t('editorShortcutsLabel')}</h2>
        <div class="sheet-grid">
          <div>
            <div class="field-label">{t('editorTools')}</div>
            {TOOL_LIST.map((tool) => (
              <div key={tool.id} class="sheet-row">
                <span>{tool.label}</span>
                <kbd>{tool.shortcut}</kbd>
              </div>
            ))}
          </div>
          <div>
            <div class="field-label">{t('editorCommands')}</div>
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
            {t('editorClose')}
          </button>
        </div>
      </div>
    </div>
  );
}
