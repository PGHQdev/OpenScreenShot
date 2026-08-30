import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  anchoredElapsed,
  clampBubblePosition,
  formatTimer,
  isNearBar,
  shouldShowBar,
} from '../../src/content/recording-overlay';

/**
 * The mounted bar is a closed shadow root injected into an arbitrary page —
 * no stylesheet, no rendering to inspect from a headless test with no
 * screen reader attached. Several checks below read the shipped source's
 * own text instead, the way `overlay-warning-contrast.test.ts` already
 * does for the warning chip's literal colours.
 */
const SOURCE = readFileSync(join(__dirname, '../../src/content/recording-overlay.ts'), 'utf8');

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
    focused: false,
    paused: false,
    warning: false,
  };
  it('hides when idle', () => expect(shouldShowBar(idle)).toBe(false));
  it('shows during the mount grace', () =>
    expect(shouldShowBar({ ...idle, sinceMountMs: 1000 })).toBe(true));
  it('shows after a recent reveal', () =>
    expect(shouldShowBar({ ...idle, sinceNearMs: 100 })).toBe(true));
  it('shows while hovered', () => expect(shouldShowBar({ ...idle, hovering: true })).toBe(true));
  // A bar must never vanish under the keyboard for the same reason it must
  // never vanish under the pointer: focus landing on Stop mid-Tab, past the
  // grace window, is exactly when host.inert would otherwise blur the user
  // to <body> with no way to Tab back — see mountRecordingOverlay's focusin
  // listener.
  it('shows while focused', () => expect(shouldShowBar({ ...idle, focused: true })).toBe(true));
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

describe('clampBubblePosition', () => {
  // The webcam bubble's persisted position — a spot saved before a resize,
  // or before a navigation lands on a smaller window — has to fit whatever
  // window it is applied in, not the one it was saved from.
  const size = 204; // BUBBLE_PX + HANDLE_PX * 2 in mountRecordingOverlay

  it('leaves an in-bounds position alone', () => {
    expect(clampBubblePosition({ x: 400, y: 300 }, 1920, 1080, size)).toEqual({ x: 400, y: 300 });
  });

  it('pulls a negative x back to the left edge', () => {
    expect(clampBubblePosition({ x: -50, y: 300 }, 1920, 1080, size)).toEqual({ x: 0, y: 300 });
  });

  it('pulls a negative y back to the top edge', () => {
    expect(clampBubblePosition({ x: 400, y: -50 }, 1920, 1080, size)).toEqual({ x: 400, y: 0 });
  });

  it('pulls x back onto a window narrower than where it was saved', () => {
    expect(clampBubblePosition({ x: 1800, y: 300 }, 900, 1080, size)).toEqual({
      x: 900 - size,
      y: 300,
    });
  });

  it('pulls y back onto a window shorter than where it was saved', () => {
    expect(clampBubblePosition({ x: 400, y: 1000 }, 1920, 500, size)).toEqual({
      x: 400,
      y: 500 - size,
    });
  });

  it('clamps to zero rather than negative when the window is smaller than the bubble', () => {
    expect(clampBubblePosition({ x: 400, y: 300 }, 100, 100, size)).toEqual({ x: 0, y: 0 });
  });
});

/**
 * The paused dot is a literal, like the warning chip's colours in
 * overlay-warning-contrast.test.ts, for the same reason: `mountRecordingOverlay`
 * is serialized with `toString()` into a closed shadow root over an arbitrary
 * page, so it has no stylesheet, no custom properties and no imports to read
 * a token from. This reads the rule straight out of the shipped source and
 * holds it to the two things "a real paused treatment" means: a different
 * colour from the recording dot's red, and enough contrast to actually read.
 */
describe('the control bar paused dot', () => {
  function relativeLuminance(hex: string): number {
    const n = Number.parseInt(hex.replace('#', ''), 16);
    const channel = (c: number) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return (
      0.2126 * channel((n >> 16) & 255) +
      0.7152 * channel((n >> 8) & 255) +
      0.0722 * channel(n & 255)
    );
  }

  function contrastRatio(a: string, b: string): number {
    const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
    return (lighter + 0.05) / (darker + 0.05);
  }

  it('is a different colour from the recording dot, not just a dimmer one', () => {
    const recordingBg = /\.dot\s*\{[^}]*background:\s*(#[0-9a-fA-F]{3,8})/.exec(SOURCE)?.[1];
    const pausedBg = /\.dot\.paused::before[^{]*\{[^}]*background:\s*(#[0-9a-fA-F]{3,8})/.exec(
      SOURCE,
    )?.[1];
    expect(recordingBg, '.dot has no literal background').toBeTruthy();
    expect(pausedBg, '.dot.paused::before has no literal background').toBeTruthy();
    expect(pausedBg?.toLowerCase()).not.toBe(recordingBg?.toLowerCase());
  });

  it('drops the pulse animation while paused', () => {
    const block = /\.dot\.paused\s*\{([^}]*)\}/.exec(SOURCE)?.[1];
    expect(block, 'no .dot.paused rule').toBeTruthy();
    expect(block).toMatch(/animation:\s*none/);
  });

  it('clears the 3:1 non-text contrast floor against the bar', () => {
    const bg = /\.bar\s*\{[^}]*background:\s*rgba\((\d+),\s*(\d+),\s*(\d+)/.exec(SOURCE);
    expect(bg, 'no .bar background found').toBeTruthy();
    const barBg = `#${[bg![1], bg![2], bg![3]]
      .map((n) => Number(n).toString(16).padStart(2, '0'))
      .join('')}`;
    const pausedBg = /\.dot\.paused::before[^{]*\{[^}]*background:\s*(#[0-9a-fA-F]{3,8})/.exec(
      SOURCE,
    )?.[1];
    const ratio = contrastRatio(pausedBg!, barBg);
    expect(ratio, `${pausedBg} on ${barBg} is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3);
  });
});

/**
 * `mountRecordingOverlay`'s re-sync path (`win.__ossRecSync`) sets
 * `host.inert` (via `applyBarVisibility`) and mutates the live `role="alert"`
 * region's text (via `announceWarning`) in the same synchronous call. Which
 * runs first matters for assistive tech even though the *final* DOM state is
 * identical either way: a mutation to a node's accessible text while that
 * node is excluded from the accessibility tree (`inert`) is never announced,
 * and there is no replay once the node re-enters the tree a statement later.
 * That is not observable through a closed shadow root in a headless browser
 * — there is no screen reader in this harness to ask — so, like the other
 * literal checks in this block, it is read out of the source instead: the
 * two calls' order in the sync path, by their position in the file.
 */
describe('the sync path un-inerts before it announces', () => {
  it('calls applyBarVisibility before announceWarning inside __ossRecSync', () => {
    const syncBody = /win\.__ossRecSync = \([\s\S]*?\n {2}\};/.exec(SOURCE)?.[0];
    expect(syncBody, '__ossRecSync assignment not found').toBeTruthy();
    const applyIndex = syncBody!.indexOf('applyBarVisibility();');
    const announceIndex = syncBody!.indexOf('announceWarning();');
    expect(applyIndex, 'applyBarVisibility() not called in the sync path').toBeGreaterThan(-1);
    expect(announceIndex, 'announceWarning() not called in the sync path').toBeGreaterThan(-1);
    expect(
      applyIndex,
      'applyBarVisibility() must run before announceWarning(), so a hidden host is ' +
        'un-inerted before the alert text changes inside it',
    ).toBeLessThan(announceIndex);
  });
});

/**
 * The catcher has to stay mounted for the whole life of a recording (see
 * mountRecordingOverlay's own comment on why), which means whatever it
 * paints is burned into every frame — the same "no frames costs nothing"
 * reasoning `shouldShowBar`'s own docblock gives for the bar itself applies
 * here with the opposite conclusion, since this element is never actually
 * hidden. Read out of source for the same closed-shadow reason as the
 * paused dot above.
 */
describe('the reveal catcher paints nothing by default', () => {
  function gripRule(selector: string): string {
    const re = new RegExp(`\\.grip${selector}\\s*\\{([^}]*)\\}`);
    const block = re.exec(SOURCE)?.[1];
    if (!block) throw new Error(`no .grip${selector} rule in recording-overlay.ts`);
    return block;
  }

  it('is transparent at rest, so nothing from it is burned into the recording', () => {
    expect(gripRule('')).toMatch(/background:\s*transparent/);
  });

  it('only paints on hover or keyboard focus', () => {
    const active = gripRule(':hover,\\s*\\n\\s*\\.grip:focus-visible');
    expect(active).toMatch(/background:\s*rgba\(/);
  });
});
