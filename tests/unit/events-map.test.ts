import { describe, expect, it } from 'vitest';
import { cursorAt, cursorPathAt, normalizeClicks, normalizeMoves } from '../../src/recorder/events-map';
import type { CursorEvent, SegmentViewport } from '../../src/shared/recording-types';

describe('normalizeClicks', () => {
  const initial: SegmentViewport = { w: 1000, h: 500, dpr: 1 };

  it('normalizes click coordinates against the initial viewport', () => {
    const events: CursorEvent[] = [
      { kind: 'move', t: 0, x: 10, y: 10 },
      { kind: 'click', t: 100, x: 500, y: 250 },
    ];
    expect(normalizeClicks(events, initial)).toEqual([{ t: 100, nx: 0.5, ny: 0.5 }]);
  });

  it('folds a mid-segment resize into subsequent click normalization', () => {
    const events: CursorEvent[] = [
      { kind: 'click', t: 100, x: 500, y: 250 },
      { kind: 'resize', t: 200, w: 2000, h: 1000, dpr: 2 },
      { kind: 'click', t: 300, x: 1000, y: 500 },
    ];
    expect(normalizeClicks(events, initial)).toEqual([
      { t: 100, nx: 0.5, ny: 0.5 },
      { t: 300, nx: 0.5, ny: 0.5 },
    ]);
  });

  it('clamps out-of-bounds coordinates to 0..1', () => {
    const events: CursorEvent[] = [
      { kind: 'click', t: 100, x: -50, y: 2000 },
      { kind: 'click', t: 200, x: 2500, y: -20 },
    ];
    expect(normalizeClicks(events, initial)).toEqual([
      { t: 100, nx: 0, ny: 1 },
      { t: 200, nx: 1, ny: 0 },
    ]);
  });

  it('ignores non-click, non-resize events', () => {
    const events: CursorEvent[] = [
      { kind: 'overlay-lost', t: 0 },
      { kind: 'overlay-healed', t: 50 },
      { kind: 'move', t: 60, x: 1, y: 1 },
      { kind: 'click', t: 100, x: 100, y: 50 },
    ];
    expect(normalizeClicks(events, initial)).toEqual([{ t: 100, nx: 0.1, ny: 0.1 }]);
  });

  it('returns an empty array when there are no clicks', () => {
    expect(normalizeClicks([], initial)).toEqual([]);
  });
});

describe('cursorPathAt', () => {
  const initial: SegmentViewport = { w: 1000, h: 500, dpr: 1 };

  it('returns null before any move has happened', () => {
    const events: CursorEvent[] = [{ kind: 'click', t: 100, x: 1, y: 1 }];
    expect(cursorPathAt(events, initial, 50)).toBeNull();
  });

  it('returns null before the first move event', () => {
    const events: CursorEvent[] = [{ kind: 'move', t: 100, x: 100, y: 50 }];
    expect(cursorPathAt(events, initial, 50)).toBeNull();
  });

  it('returns the latest move at or before t', () => {
    const events: CursorEvent[] = [
      { kind: 'move', t: 100, x: 100, y: 50 },
      { kind: 'move', t: 300, x: 400, y: 250 },
    ];
    expect(cursorPathAt(events, initial, 150)).toEqual({ nx: 0.1, ny: 0.1 });
    expect(cursorPathAt(events, initial, 300)).toEqual({ nx: 0.4, ny: 0.5 });
    expect(cursorPathAt(events, initial, 1000)).toEqual({ nx: 0.4, ny: 0.5 });
  });

  it('maps a move through the viewport that was live at the move time', () => {
    const events: CursorEvent[] = [
      { kind: 'move', t: 100, x: 100, y: 50 },
      { kind: 'resize', t: 150, w: 2000, h: 1000, dpr: 2 },
      { kind: 'move', t: 300, x: 1000, y: 500 },
    ];
    expect(cursorPathAt(events, initial, 120)).toEqual({ nx: 0.1, ny: 0.1 });
    expect(cursorPathAt(events, initial, 350)).toEqual({ nx: 0.5, ny: 0.5 });
  });
});

describe('normalizeMoves', () => {
  const vp = { w: 100, h: 100, dpr: 1 };
  it('normalizes against the viewport live at each sample', () => {
    const moves = normalizeMoves(
      [
        { kind: 'move', t: 0, x: 50, y: 25 },
        { kind: 'resize', t: 10, w: 200, h: 200, dpr: 1 },
        { kind: 'move', t: 20, x: 50, y: 25 },
      ],
      vp,
    );
    expect(moves).toEqual([
      { t: 0, nx: 0.5, ny: 0.25 },
      { t: 20, nx: 0.25, ny: 0.125 },
    ]);
  });
  it('ignores clicks', () => {
    expect(normalizeMoves([{ kind: 'click', t: 5, x: 10, y: 10 }], vp)).toEqual([]);
  });
  it('clamps out-of-viewport samples', () => {
    expect(normalizeMoves([{ kind: 'move', t: 0, x: 150, y: -5 }], vp)).toEqual([
      { t: 0, nx: 1, ny: 0 },
    ]);
  });
});

describe('cursorAt', () => {
  const moves = [
    { t: 100, nx: 0, ny: 0 },
    { t: 200, nx: 1, ny: 0.5 },
  ];
  it('is null on an empty log', () => expect(cursorAt([], 50)).toBeNull());
  it('is null before the first sample', () => expect(cursorAt(moves, 50)).toBeNull());
  it('returns an exact sample', () => expect(cursorAt(moves, 100)).toEqual({ nx: 0, ny: 0 }));
  it('interpolates between samples', () =>
    expect(cursorAt(moves, 150)).toEqual({ nx: 0.5, ny: 0.25 }));
  it('holds the last sample', () => expect(cursorAt(moves, 900)).toEqual({ nx: 1, ny: 0.5 }));
  it('tolerates duplicate timestamps', () =>
    expect(cursorAt([{ t: 5, nx: 0.1, ny: 0.1 }, { t: 5, nx: 0.9, ny: 0.9 }], 5)).toEqual({
      nx: 0.9,
      ny: 0.9,
    }));
});
