import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { anchoredElapsed, formatTimer } from '../../src/content/recording-overlay';

const SOURCE = readFileSync(join(__dirname, '../../src/content/recording-overlay.ts'), 'utf8');

describe('formatTimer', () => {
  it('formats seconds', () => expect(formatTimer(7_000)).toBe('0:07'));
  it('formats minutes', () => expect(formatTimer(83_000)).toBe('1:23'));
  it('formats hours', () => expect(formatTimer(5_025_000)).toBe('1:23:45'));
  it('floors ragged ms', () => expect(formatTimer(999)).toBe('0:00'));
  it('clamps negatives to zero', () => expect(formatTimer(-5)).toBe('0:00'));
});

describe('anchoredElapsed', () => {
  const mounted = { elapsedMs: 0, anchored: false };

  it('shows nothing until an anchored sync arrives', () => {
    expect(anchoredElapsed(mounted, { elapsedMs: 12_000, anchored: false })).toEqual(mounted);
  });

  it('takes the first anchored sync as the zero, however far the bar had drifted', () => {
    expect(
      anchoredElapsed({ elapsedMs: 12_000, anchored: false }, { elapsedMs: 0, anchored: true }),
    )
      // The jump the user used to see, 0:12 -> 0:00, is legal exactly once and
      // only from a bar that was never showing a number in the first place.
      .toEqual({ elapsedMs: 0, anchored: true });
  });

  it('cannot be un-anchored by a heal that raced the anchoring one', () => {
    const anchored = { elapsedMs: 4000, anchored: true };
    expect(anchoredElapsed(anchored, { elapsedMs: 30_000, anchored: false })).toEqual(anchored);
  });

  it('keeps the larger elapsed when a stale heal lands after a newer one', () => {
    expect(
      anchoredElapsed({ elapsedMs: 9000, anchored: true }, { elapsedMs: 4000, anchored: true }),
    ).toEqual({ elapsedMs: 9000, anchored: true });
  });

  it('takes a newer elapsed that is genuinely ahead', () => {
    expect(
      anchoredElapsed({ elapsedMs: 4000, anchored: true }, { elapsedMs: 9000, anchored: true }),
    ).toEqual({ elapsedMs: 9000, anchored: true });
  });

  /**
   * "Never jumps backwards" is a property, so it is checked as one: every
   * ordering of the syncs a real run produces, replayed against the same
   * starting state, asserting the displayed elapsed is non-decreasing from
   * the anchor onwards. The orderings are what a single run can genuinely
   * emit out of order — `healOverlay` re-injects on navigations, popup opens,
   * webcam denials and the anchor itself, each carrying the elapsed read at
   * its own moment, and `chrome.scripting.executeScript` gives no ordering
   * guarantee between them.
   */
  const syncs = [
    { name: 'anchor', elapsedMs: 0, anchored: true },
    { name: 'heal at 3s', elapsedMs: 3000, anchored: true },
    { name: 'heal at 7s', elapsedMs: 7000, anchored: true },
    { name: 'stale pre-anchor heal', elapsedMs: 25_000, anchored: false },
    { name: 'paused heal at 7s', elapsedMs: 7000, anchored: true },
  ];

  function permutations<T>(items: T[]): T[][] {
    if (items.length <= 1) return [items];
    return items.flatMap((item, i) =>
      permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
    );
  }

  it('never decreases once anchored, under all 120 orderings', () => {
    const orderings = permutations(syncs);
    expect(orderings).toHaveLength(120);
    for (const ordering of orderings) {
      let clock = { elapsedMs: 0, anchored: false };
      for (const sync of ordering) {
        const before = clock;
        clock = anchoredElapsed(before, sync);
        if (before.anchored) {
          expect(clock.anchored, `${sync.name} un-anchored the clock`).toBe(true);
          expect(
            clock.elapsedMs,
            `${sync.name} moved the clock back in [${ordering.map((s) => s.name).join(', ')}]`,
          ).toBeGreaterThanOrEqual(before.elapsedMs);
        }
      }
    }
  });
});

/**
 * tabCapture records every pixel of the tab, so anything the logger puts on
 * the page is in the video. The controls live in their own extension tab; the
 * injected function must not build a single element.
 */
describe('the in-page logger', () => {
  it('adds nothing to the page', () => {
    expect(SOURCE).not.toMatch(/createElement|appendChild|attachShadow|insertAdjacent/);
  });
});
