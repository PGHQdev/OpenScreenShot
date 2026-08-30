import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { theme } from '../../src/shared/design-tokens';

/**
 * The control bar's "NOT SAVING" chip is the one surface in this product that
 * cannot use a token: `mountRecordingOverlay` is serialized with `toString()`
 * and injected into a closed shadow root over an arbitrary page, so it has no
 * stylesheet, no custom properties and no imports. Its colours are literals
 * out of necessity.
 *
 * That makes them the one pair nothing else would catch drifting. This reads
 * the two literals straight out of the stylesheet the bar ships with, holds
 * them to the generated dark-theme tokens they are copies of, and computes the
 * ratio rather than trusting a number in a comment — task-32's report carried
 * a wrong one for a round because it was quoting the token's value while the
 * code shipped a different shade.
 */
const SOURCE = readFileSync(join(__dirname, '../../src/content/recording-overlay.ts'), 'utf8');

/** The declarations inside the `.chip.warn` rule of the injected stylesheet. */
function warnChipRule(): { background: string; color: string } {
  const block = /\.chip\.warn\s*\{([^}]*)\}/.exec(SOURCE);
  if (!block) throw new Error('no .chip.warn rule in recording-overlay.ts');
  const read = (prop: string): string => {
    const found = new RegExp(`${prop}:\\s*(#[0-9a-fA-F]{3,8})`).exec(block[1]);
    if (!found) throw new Error(`.chip.warn has no ${prop}`);
    return found[1].toLowerCase();
  };
  return { background: read('background'), color: read('color') };
}

function relativeLuminance(hex: string): number {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}

function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('the control bar warning chip', () => {
  it('paints the dark theme --danger-ink it is a copy of', () => {
    expect(warnChipRule().background).toBe(theme.dark.dangerInk.toLowerCase());
  });

  it('sets its label to the dark theme --surface-1', () => {
    expect(warnChipRule().color).toBe(theme.dark.surface1.toLowerCase());
  });

  it('clears the 4.5:1 body-text floor', () => {
    const { background, color } = warnChipRule();
    const ratio = contrastRatio(color, background);
    expect(ratio, `${color} on ${background} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  });
});
