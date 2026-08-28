import { describe, it, expect } from 'vitest';
import { theme } from '../../src/shared/design-tokens';

/**
 * Global constraint 4 sets a 4.5:1 floor for body text. --text-2 and --text-3
 * (tokens.css) missed it against real call sites for two release cycles
 * running: task-9-report.md measured the gap, task-11's delivered scope
 * dropped it, and task-20's axe smoke rediscovered the exact same numbers
 * live. task-45 raised both tokens and moved the two call sites that painted
 * --text-3 on a surface it was never meant to clear onto a different token
 * instead (editor.css's `.empty-fallback`/`.empty-alt`, popup.css's
 * `.kbd-os` — see task-45-report.md). This is the guard that stops a fourth
 * round trip: it reads the live generated values, so a future edit to
 * tokens.css that drops either token back under the floor fails here instead
 * of waiting for the axe smoke (which needs a built `dist/` and a real
 * browser) or a human to notice.
 *
 * Only the pairings each token is actually painted on are asserted — see the
 * per-token comment above --text-2/--text-3 in tokens.css for the full list
 * and task-45-report.md for the usage matrix across every surface, including
 * the ones that fail and are why nothing paints them there.
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
  fg: 'text2' | 'text3';
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
];

describe('--text-2 / --text-3 clear the 4.5:1 body-text floor on every surface that paints them', () => {
  for (const { theme: themeName, fg, bg } of CASES) {
    it(`${themeName}: --${fg === 'text2' ? 'text-2' : 'text-3'} on --${bg.replace('surface', 'surface-')} `, () => {
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
