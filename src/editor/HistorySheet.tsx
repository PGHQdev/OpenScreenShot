import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { deleteCapture, listCaptureHistory } from '../shared/storage';
import type { CaptureHistoryEntry } from '../shared/types';
import { arrowNav, getFocusable, syncRovingTabIndex, trapFocus } from './focus';
import { labelForSource } from './capture-label';

/** The date string shared by a row's own label and its Open/Delete names. */
function capturedLabel(entry: CaptureHistoryEntry): string {
  return new Date(entry.capturedAt).toLocaleString();
}

/**
 * The capture history shelf: last N captures instead of one (src/shared/
 * storage.ts owns the bounded list). Follows the recorder's SessionListView
 * (src/recorder/App.tsx) — a plain list of rows, each with its own Open and
 * two-tap Delete — inside the editor's own modal chrome (ShortcutSheet.tsx's
 * pattern), not the recorder's page-level layout.
 */
export function HistorySheet({
  onOpen,
  onClose,
  closing,
}: {
  onOpen: (entry: CaptureHistoryEntry) => void;
  onClose: () => void;
  closing: boolean;
}) {
  const [entries, setEntries] = useState<CaptureHistoryEntry[] | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  async function refresh() {
    setEntries(await listCaptureHistory());
  }

  useEffect(() => {
    void refresh();
  }, []);

  // Same consolidated focus effect as ShortcutSheet/ImportConfirm — re-runs
  // on any closing -> not-closing edge, not just the true mount, so a fast
  // reopen (this sheet closing, then History pressed again before the exit
  // timer unmounts it) survives as the same instance under useExitDelay.
  useEffect(() => {
    if (closing) {
      prevFocusRef.current?.focus?.();
      return;
    }
    prevFocusRef.current = (document.activeElement as HTMLElement | null) ?? null;
    const focusable = modalRef.current ? getFocusable(modalRef.current) : [];
    focusable[0]?.focus();
  }, [closing]);

  /**
   * Review R-28a, Important #4: twelve rows x two buttons was 24 individual
   * Tab stops inside a focus-*trapped* modal — a keyboard user could not
   * Tab past the list, only through it. `.history-list`'s buttons now rove
   * as one flat sequence, the same mechanical pattern `App.tsx`'s tool rail
   * uses (`arrowNav`/`syncRovingTabIndex`, unmodified) — `getFocusable`
   * (focus.ts) already excludes `tabindex="-1"` elements, so `trapFocus` and
   * this sheet's own Tab cycle see exactly one stop for the whole list,
   * for free, with no change to focus.ts itself.
   *
   * This is deliberately *not* the row as the atomic stop (arrow keys do
   * not move row-to-row with a separate within-row step to reach Open vs.
   * Delete). `arrowNav`/`syncRovingTabIndex` are single-level: one flat set
   * of members, one axis. A true row-level scheme needs either a second
   * navigation level (row, then across to its two actions — effectively an
   * ARIA grid, `role="row"`/`"gridcell"`, matched children throughout) or
   * an ad hoc secondary key to enter a row's actions — both meaningfully
   * more machinery than these two generic helpers provide, and reusing
   * `role="toolbar"` here would mislabel a list of history rows as a
   * command bar. `role="group"` (the same role `App.tsx`'s
   * `.topbar-actions` already uses for a plain button cluster) keeps the
   * label honest — until axe's `aria-allowed-attr` rule pointed out that
   * `aria-orientation` (needed for vertical Up/Down, since these rows stack
   * vertically) is not a valid attribute on `role="group"` at all; the ARIA
   * spec restricts it to a handful of roles, `toolbar` among them, which is
   * also the one this codebase already uses for the exact same vertical
   * roving-tabindex shape (`App.tsx`'s tool rail: `role="toolbar"
   * aria-orientation="vertical"`). `role="toolbar"` is not a perfect label
   * for a list of history rows, but it is a valid one — every member here
   * genuinely is a command (Open, Delete) — and matching the codebase's own
   * only precedent for this exact interaction model beats shipping a real
   * ARIA-attribute violation to keep a marginally better-fitting label.
   * Either way, the mechanics are what matters here: the container's Tab
   * footprint drops from 24 stops to 1, and every Open and every Delete
   * stays reachable, via arrow keys (Home/End included) instead of Tab.
   */
  useEffect(() => {
    if (listRef.current) syncRovingTabIndex(listRef.current);
  }, [entries]);

  // A deleted row's own Delete button was the focused element that
  // triggered this — removing it from the DOM drops focus to <body> (per
  // the HTML spec's focus-loss-on-removal behaviour), which is outside the
  // dialog. A keydown only reaches this modal's onKeyDown by bubbling up
  // from the focused element, so once focus is on <body>, Escape and the
  // Tab trap both go silently dead until the user clicks back inside.
  // Reclaiming focus on the dialog itself (tabIndex=-1, so it is a valid
  // target) keeps it the owner of the keyboard the same way it was before
  // the row disappeared. Runs after every entries change, not just delete's
  // (the effect cannot tell them apart), but is a no-op whenever focus is
  // still inside the modal — which covers the initial load.
  // useLayoutEffect, not useEffect: this must land before the browser's
  // next paint, or a key pressed right after the delete (a fast, deliberate
  // Escape in particular) can reach <body> instead of the dialog — a
  // passive effect is deferred to an idle tick that a same-frame keydown
  // can beat, so an assertion this fast is not a smoke-test artifact, it is
  // the real race a fast typist would hit too.
  useLayoutEffect(() => {
    if (entries === null) return;
    if (modalRef.current && !modalRef.current.contains(document.activeElement)) {
      modalRef.current.focus();
    }
  }, [entries]);

  async function handleDelete(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId((cur) => (cur === id ? null : cur)), 3000);
      return;
    }
    setConfirmDeleteId(null);
    await deleteCapture(id);
    await refresh();
  }

  return (
    <div class={`modal-backdrop${closing ? ' is-closing' : ''}`} onMouseDown={onClose}>
      <div
        ref={modalRef}
        class={`modal${closing ? ' is-closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Capture history"
        tabIndex={-1}
        inert={closing}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (closing) return; // let keys bubble normally during the exit fade
          e.stopPropagation();
          trapFocus(modalRef.current!, e);
          if (e.key === 'Escape') onClose();
        }}
      >
        <h2 class="modal-title">Capture history</h2>
        {entries === null ? null : entries.length === 0 ? (
          <p class="modal-text">No captures yet.</p>
        ) : (
          <div
            class="history-list"
            ref={listRef}
            role="toolbar"
            aria-label="Captures"
            aria-orientation="vertical"
            onKeyDown={(e) => arrowNav(e.currentTarget as HTMLElement, e)}
            onFocusIn={(e) =>
              syncRovingTabIndex(e.currentTarget as HTMLElement, e.target as HTMLElement)
            }
          >
            {entries.map((entry) => (
              <div class="history-row" key={entry.id}>
                <img class="history-thumb" src={entry.thumbnail} alt="" width={64} height={48} />
                <div class="history-row-info">
                  <span class="history-row-date">{capturedLabel(entry)}</span>
                  <span class="history-row-meta">
                    {labelForSource(entry.mode)} &middot; {entry.width} &times; {entry.height}px
                  </span>
                </div>
                <div class="history-row-actions">
                  <button
                    class="text-btn"
                    onClick={() => onOpen(entry)}
                    aria-label={`Open, captured ${capturedLabel(entry)}`}
                  >
                    Open
                  </button>
                  <button
                    class="text-btn history-delete-btn"
                    data-armed={confirmDeleteId === entry.id ? 'true' : undefined}
                    onClick={() => void handleDelete(entry.id)}
                    aria-label={
                      confirmDeleteId === entry.id
                        ? `Confirm delete, captured ${capturedLabel(entry)}`
                        : `Delete, captured ${capturedLabel(entry)}`
                    }
                  >
                    {confirmDeleteId === entry.id ? 'Confirm delete' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
