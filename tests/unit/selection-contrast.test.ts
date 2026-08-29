import { describe, it, expect } from 'vitest';

/**
 * src/editor/annotations.ts's drawSelection paints its outline over an
 * arbitrary screenshot, so no single flat colour is guaranteed visible
 * against it — the old #2f80ed blue included. It alternates opaque black and
 * white instead. This proves the two claims that justify that choice:
 *  - the pairing clears the 3:1 UI-boundary floor against every possible
 *    flat background (WCAG contrast is a function of relative luminance
 *    only, not hue, so sweeping every grey 0..255 covers every colour's
 *    worst case exactly);
 *  - a single flat colour does not.
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

const UI_BOUNDARY_FLOOR = 3;

const GREYS = Array.from({ length: 256 }, (_, v) => {
  const hex = v.toString(16).padStart(2, '0');
  return `#${hex}${hex}${hex}`;
});

function worstCase(colors: string[]): { ratio: number; against: string } {
  let ratio = Infinity;
  let against = '';
  for (const bg of GREYS) {
    const best = Math.max(...colors.map((c) => contrastRatio(c, bg)));
    if (best < ratio) {
      ratio = best;
      against = bg;
    }
  }
  return { ratio, against };
}

describe('selection outline: black/white two-tone survives an arbitrary background', () => {
  it('max(contrast to black, contrast to white) clears 3:1 against every flat background', () => {
    const { ratio, against } = worstCase(['#000000', '#ffffff']);
    expect(ratio, `worst case is against ${against}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
      UI_BOUNDARY_FLOOR,
    );
  });

  it('negative control: a single flat colour does not survive every background', () => {
    // The old selection blue (#2f80ed) and a plausible "just theme it"
    // stand-in (light --accent-ink, #bd3722) both fail somewhere in the
    // sweep — this is what "a single flat colour will not do" means, and
    // why the two-tone pairing above is required instead.
    for (const flat of ['#2f80ed', '#bd3722']) {
      const { ratio, against } = worstCase([flat]);
      expect(
        ratio,
        `${flat} should fail somewhere in the sweep (worst case ${ratio.toFixed(2)}:1 against ${against}) ` +
          `— if it now passes, the "flat colour will not do" claim needs re-checking`,
      ).toBeLessThan(UI_BOUNDARY_FLOOR);
    }
  });
});
