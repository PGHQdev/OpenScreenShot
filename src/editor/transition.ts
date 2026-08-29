/**
 * Entrance/exit timing for the editor's transient panels (popovers, modals,
 * notices). Entrance is plain CSS `animation` on each surface's own rule in
 * editor.css — it plays automatically the moment the element is inserted, so
 * it needs no help from here. Exit is the hard part: `{active ? <div/> :
 * null}` unmounts the node in the same frame `active` goes false, which
 * yanks it out of the DOM before any exit CSS has a chance to paint. The
 * hook below is what keeps the node around for exactly its exit animation's
 * duration, then lets it go.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { tokens } from '../shared/design-tokens';

/** ms, read off tokens.css (see gen-design-tokens.mjs) so these can never
 * drift from what editor.css's own --dur-* declarations say. */
export const DUR_FAST = parseInt(tokens.durFast, 10);
export const DUR_MID = parseInt(tokens.durMid, 10);
export const DUR_SLOW = parseInt(tokens.durSlow, 10);

function reducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * `mounted` tracks whether the caller should render the node at all;
 * `closing` is true for the tail window after `active` goes false, so the
 * caller can add an `.is-closing` modifier class that editor.css transitions
 * back to its closed state. `mounted` is derived as `active || closing`.
 *
 * `closing` flips to true (or back to false, on a fast reopen) inside the
 * render body itself, via the "adjust state during rendering" pattern —
 * comparing `active` against a copy of its own last-rendered value stored in
 * state, and calling the setters below when they differ — not inside a
 * useEffect. That is not a style choice: a first version of this hook set
 * `closing` from an effect, one render after `active` actually flipped, and
 * for that one render `mounted` (active || closing) was `false || false` —
 * genuinely unmounted, not just visually closing. Preact tore the node down,
 * then the effect ran and set `closing = true`, which mounted a *new* node
 * with its entrance animation playing again, right as it was supposed to be
 * exiting. That remount was real, not theoretical: it surfaced as a
 * beautify-popover the reduced-motion browser smoke caught still reporting a
 * non-zero animation-duration — a fresh instance, not the closing one — and
 * is exactly why the smoke reads geometry/computed-style from a real run
 * rather than asserting a hook "should" behave a certain way. Updating
 * `closing` synchronously in the same render `active` changes closes that
 * gap: `mounted` never has a render where it's false between the old node
 * closing and the timer below actually releasing it.
 *
 * The timer that eventually flips `closing` back to false — the one genuine
 * side effect here — still lives in a useEffect. Reduced motion collapses
 * `durationMs` to 0 there: `closing` still flips, `mounted` still goes false
 * right after, but nothing waits on transitionend or animationend to get
 * there, so there is nothing to hang on. See editor.css's reduced-motion
 * block, which independently turns the CSS animation/transition themselves
 * off — this hook and that rule are two separate guarantees, not one
 * relying on the other.
 */
export function useExitDelay(
  active: boolean,
  durationMs: number,
): { mounted: boolean; closing: boolean } {
  const [renderedActive, setRenderedActive] = useState(active);
  const [closing, setClosing] = useState(false);
  const timerRef = useRef<number | null>(null);

  if (active !== renderedActive) {
    setRenderedActive(active);
    setClosing(!active);
  }

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (active) return;
    const ms = reducedMotion() ? 0 : durationMs;
    timerRef.current = window.setTimeout(() => {
      setClosing(false);
      timerRef.current = null;
    }, ms);
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [active, durationMs]);

  return { mounted: active || closing, closing };
}

/**
 * Holds on to the last value seen while `active` was true. A panel closing
 * under useExitDelay stays mounted past the moment its own source state
 * clears (dismiss/confirm/cancel null it in the same tick the close begins),
 * so reading that source directly during the exit paints blank content under
 * a still-visible, still-animating panel. This freezes what to show instead.
 */
export function useFrozenWhileClosing<T>(value: T, active: boolean): T {
  const ref = useRef(value);
  if (active) ref.current = value;
  return ref.current;
}
