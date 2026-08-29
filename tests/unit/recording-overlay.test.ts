import { describe, expect, it } from 'vitest';
import {
  anchoredElapsed,
  formatTimer,
  isNearBar,
  shouldShowBar,
} from '../../src/content/recording-overlay';

describe('formatTimer', () => {
  it('formats seconds', () => expect(formatTimer(7_000)).toBe('0:07'));
  it('formats minutes', () => expect(formatTimer(83_000)).toBe('1:23'));
  it('formats hours', () => expect(formatTimer(5_025_000)).toBe('1:23:45'));
  it('floors ragged ms', () => expect(formatTimer(999)).toBe('0:00'));
  it('clamps negatives to zero', () => expect(formatTimer(-5)).toBe('0:00'));
});

describe('isNearBar', () => {
  it('bottom center is near', () => expect(isNearBar(960, 1000, 1920, 1080)).toBe(true));
  it('top left is far', () => expect(isNearBar(10, 10, 1920, 1080)).toBe(false));
  it('bottom corner is far', () => expect(isNearBar(0, 1079, 1920, 1080)).toBe(false));
  it('zone edges count', () => expect(isNearBar(960 + 200, 1080 - 120, 1920, 1080)).toBe(true));
  it('just past the zone is far', () => expect(isNearBar(960 + 201, 1079, 1920, 1080)).toBe(false));
});

describe('shouldShowBar', () => {
  // Every field is required, so a policy input cannot be forgotten at a call
  // site. The copy inside `mountRecordingOverlay` carries the same signature —
  // it has to be duplicated (Chrome serializes that function via toString()
  // and drops its closure), so the only thing keeping the two honest is that
  // they are spelled identically.
  const idle = {
    sinceMountMs: 60_000,
    sinceNearMs: 60_000,
    hovering: false,
    paused: false,
    warning: false,
  };
  it('hides when idle', () => expect(shouldShowBar(idle)).toBe(false));
  it('shows during the mount grace', () =>
    expect(shouldShowBar({ ...idle, sinceMountMs: 1000 })).toBe(true));
  it('shows after a recent reveal', () =>
    expect(shouldShowBar({ ...idle, sinceNearMs: 100 })).toBe(true));
  it('shows while hovered', () => expect(shouldShowBar({ ...idle, hovering: true })).toBe(true));
  it('shows while paused', () => expect(shouldShowBar({ ...idle, paused: true })).toBe(true));
  // Chunks failing to reach storage is the one failure that loses the
  // recording while it is being made, and a bar that hides three seconds
  // later takes the only live warning with it.
  it('shows while warning', () => expect(shouldShowBar({ ...idle, warning: true })).toBe(true));
  it('keeps hiding once the warning is not set', () =>
    expect(shouldShowBar({ ...idle, warning: false })).toBe(false));
  it('hides at exactly the grace boundary', () =>
    expect(shouldShowBar({ ...idle, sinceNearMs: 3000 })).toBe(false));
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
