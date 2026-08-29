import { describe, it, expect } from 'vitest';
import { theme } from '../../src/shared/design-tokens';

/**
 * Global constraint 4 sets a 4.5:1 floor for body text. --text-2 and --text-3
 * (tokens.css) missed it against real call sites for two release cycles
 * running: task-9-report.md measured the gap, task-11's delivered scope
 * dropped it, and task-20's axe smoke rediscovered the exact same numbers
 * live. task-45 raised both tokens and moved the four call sites that
 * painted --text-3 on a surface it was never meant to clear onto a
 * different token instead (editor.css's `.empty-fallback`/`.empty-alt` and
 * `.zoom-item kbd`, popup.css's `.kbd-os` — see task-45-report.md). This is
 * the guard that stops a fourth round trip: it reads the live generated
 * values, so a future edit to tokens.css that drops either token back under
 * the floor fails here instead of waiting for the axe smoke (which needs a
 * built `dist/` and a real browser) or a human to notice.
 *
 * task-31 widened it past those two tokens: --text-1 and --accent-ink are
 * asserted here too, because the trust pill that rides with a permission ask
 * paints both (its label and its stroke icon) and the browser smokes scan the
 * light theme only, so the dark half of that surface has no other check. The
 * floor and the method are the same for every token in CASES; only the list
 * of pairings grew.
 *
 * Only the pairings each token is actually painted on TODAY are asserted —
 * see the per-token comment above --text-2/--text-3 in tokens.css for the
 * full list and task-45-report.md for the usage matrix across every
 * surface, including the ones that fail and are why nothing paints them
 * there.
 *
 * RESIDUAL GAP, read this before you add a new call site for any token here:
 * this test asserts fixed (theme, token, surface) triples, not "wherever
 * this token is ever painted." It does NOT know which surfaces are actually
 * used — it will stay green even if you add `color: var(--text-3)` on
 * --surface-2 or --surface-3 or --stage-bg, all of which fail today
 * (4.21:1/3.79:1, 3.85:1/3.08:1, 3.62:1/4.91:1 — light/dark) and are exactly
 * why nothing paints them. Widening this test to assert the full matrix
 * would be wrong: several cells fail by design and must stay that way. This
 * is the same failure mode as the .empty-fallback/.empty-alt bug task-45
 * found and fixed — a real call site on a real surface that no test caught
 * because nothing was asserting that specific pairing, and the a11y smoke
 * never rendered the state it appears in. Before painting --text-2 or
 * --text-3 anywhere new, check the usage matrix in task-45-report.md (or
 * recompute the ratio) yourself — this file will not do it for you.
 */
function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two hex colours, 1:1 (identical) to 21:1. */
function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexToRgb(hexA));
  const lumB = relativeLuminance(hexToRgb(hexB));
  const [lighter, darker] = lumA > lumB ? [lumA, lumB] : [lumB, lumA];
  return (lighter + 0.05) / (darker + 0.05);
}

const BODY_TEXT_FLOOR = 4.5;

const CASES: Array<{
  theme: 'light' | 'dark';
  fg: 'text1' | 'text2' | 'text3' | 'accentInk';
  bg: 'surface1' | 'surface2' | 'surface3';
}> = [
  // --text-3: every real call site sits on --surface-1 (.status-hint,
  // .zoom-item kbd, .settings-section, .token-label, .settings-hint,
  // .rec-tl-tick — task-45-report.md).
  { theme: 'light', fg: 'text3', bg: 'surface1' },
  { theme: 'dark', fg: 'text3', bg: 'surface1' },
  // --text-2: clears --surface-1 and --surface-2 with room to spare; the
  // narrow miss was always --surface-3 (.tag-optional, .mode-card kbd).
  { theme: 'light', fg: 'text2', bg: 'surface1' },
  { theme: 'dark', fg: 'text2', bg: 'surface1' },
  { theme: 'light', fg: 'text2', bg: 'surface2' },
  { theme: 'dark', fg: 'text2', bg: 'surface2' },
  { theme: 'light', fg: 'text2', bg: 'surface3' },
  { theme: 'dark', fg: 'text2', bg: 'surface3' },
  // --text-1 and --accent-ink on --surface-1/--surface-2: the popup's and
  // setup page's trust pills paint both (pill label and its stroke icon), and
  // the browser smokes scan the light theme only, so the dark half of that
  // surface has no other check.
  { theme: 'light', fg: 'text1', bg: 'surface1' },
  { theme: 'dark', fg: 'text1', bg: 'surface1' },
  // --surface-2 as well: the popup's pin nudge paints its title there.
  { theme: 'light', fg: 'text1', bg: 'surface2' },
  { theme: 'dark', fg: 'text1', bg: 'surface2' },
  { theme: 'light', fg: 'accentInk', bg: 'surface1' },
  { theme: 'dark', fg: 'accentInk', bg: 'surface1' },
  { theme: 'light', fg: 'accentInk', bg: 'surface2' },
  { theme: 'dark', fg: 'accentInk', bg: 'surface2' },
];

const TOKEN_NAME: Record<(typeof CASES)[number]['fg'], string> = {
  text1: '--text-1',
  text2: '--text-2',
  text3: '--text-3',
  accentInk: '--accent-ink',
};

describe('every foreground token clears the 4.5:1 body-text floor on the surfaces that paint it', () => {
  for (const { theme: themeName, fg, bg } of CASES) {
    it(`${themeName}: ${TOKEN_NAME[fg]} on --${bg.replace('surface', 'surface-')} `, () => {
      const fgHex = theme[themeName][fg];
      const bgHex = theme[themeName][bg];
      const ratio = contrastRatio(fgHex, bgHex);
      expect(
        ratio,
        `${fgHex} on ${bgHex} is ${ratio.toFixed(2)}:1, below the ${BODY_TEXT_FLOOR}:1 floor`,
      ).toBeGreaterThanOrEqual(BODY_TEXT_FLOOR);
    });
  }
});
