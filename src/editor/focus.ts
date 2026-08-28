/**
 * Tiny focus-management helpers for accessibility:
 *  - getFocusable: visible, enabled, tabbable descendants of a container.
 *  - trapFocus: keep Tab/Shift+Tab cycling within a container (for modals).
 *  - arrowNav: roving index arrow-key navigation for a role="toolbar" container.
 *  - syncRovingTabIndex: the tabindex half of the same pattern — exactly one
 *    member of the toolbar is a tab stop, so Tab enters and leaves the group
 *    in one step and arrowNav (which only moves focus) does the rest.
 */

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isVisible);
}

function isVisible(el: HTMLElement): boolean {
  return el.getClientRects().length > 0;
}

/** Keep focus inside `container` on Tab; call from a keydown handler. */
export function trapFocus(container: HTMLElement, e: KeyboardEvent): void {
  if (e.key !== 'Tab') return;
  const f = getFocusable(container);
  if (f.length === 0) return;
  const first = f[0];
  const last = f[f.length - 1];
  const active = document.activeElement as HTMLElement | null;
  if (e.shiftKey) {
    if (active === first || active === container || !container.contains(active)) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

/**
 * Roving-index arrow-key navigation for a toolbar. Orientation is read from the
 * container's aria-orientation (default horizontal). Range inputs keep their own
 * arrow handling (to adjust the value), so they're skipped.
 */
export function arrowNav(container: HTMLElement, e: KeyboardEvent): void {
  const f = getFocusable(container);
  if (f.length === 0) return;
  const active = document.activeElement as HTMLElement | null;
  if (active && active.tagName === 'INPUT' && (active as HTMLInputElement).type === 'range') {
    return; // let the slider adjust
  }
  const vertical = container.getAttribute('aria-orientation') === 'vertical';
  const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft';
  const nextKey = vertical ? 'ArrowDown' : 'ArrowRight';
  const idx = active ? f.indexOf(active) : -1;
  if (e.key === prevKey) {
    e.preventDefault();
    f[(idx - 1 + f.length) % f.length].focus();
  } else if (e.key === nextKey) {
    e.preventDefault();
    f[(idx + 1) % f.length].focus();
  } else if (e.key === 'Home') {
    e.preventDefault();
    f[0].focus();
  } else if (e.key === 'End') {
    e.preventDefault();
    f[f.length - 1].focus();
  }
}

/**
 * Roving tabindex for a role="toolbar" container: exactly one member gets
 * tabindex="0" (the rest get "-1"), so the group is one stop in the page's
 * Tab order per the WAI-ARIA toolbar pattern. `preferred` wins the tab stop
 * when it is still a member (arrowNav and a click both land on the element
 * the user just focused); otherwise the previous 0 survives, or member 0 by
 * default. Call it after every render that can change which members exist
 * (a tool never disappears, but the style bar's fields and swatch list do),
 * and again from a focusin handler so the stop follows focus, not selection —
 * arrow keys move focus without activating a member, so the two can differ.
 */
export function syncRovingTabIndex(container: HTMLElement, preferred?: HTMLElement | null): void {
  const f = getFocusable(container);
  if (f.length === 0) return;
  const current =
    preferred && f.includes(preferred) ? preferred : f.find((el) => el.tabIndex === 0);
  const active = current ?? f[0];
  for (const el of f) {
    el.tabIndex = el === active ? 0 : -1;
  }
}
