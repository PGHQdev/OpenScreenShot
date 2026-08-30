import { describe, expect, it } from 'vitest';
import { nextCancelClick, remainingExportMs } from '../../src/recorder/export-video';

describe('remainingExportMs', () => {
  it('is the total minus how far the timeline clock has reached', () => {
    expect(remainingExportMs(10_000, 4_000)).toBe(6_000);
  });

  it('never goes negative — a last frame can land past total by rounding', () => {
    expect(remainingExportMs(10_000, 10_050)).toBe(0);
  });

  it('is the full total before any frame has drawn', () => {
    expect(remainingExportMs(10_000, 0)).toBe(10_000);
  });

  it('is zero for an empty timeline', () => {
    expect(remainingExportMs(0, 0)).toBe(0);
  });

  // A stalled render (the tab went to the background and `requestAnimationFrame`
  // stopped firing) must not look like time is still passing: nothing here reads
  // a clock, so calling it again with the same `timelineMs` — the state a stall
  // leaves it in, since no new frame decoded to advance it — reproduces the same
  // remaining time rather than counting down on its own.
  it('holds steady when called again with an unchanged timelineMs, as a stall leaves it', () => {
    const first = remainingExportMs(10_000, 4_000);
    const second = remainingExportMs(10_000, 4_000);
    expect(second).toBe(first);
  });
});

describe('nextCancelClick', () => {
  it('arms on a first click without confirming', () => {
    expect(nextCancelClick(false)).toEqual({ armed: true, confirmed: false });
  });

  it('confirms and disarms on a second click while armed', () => {
    expect(nextCancelClick(true)).toEqual({ armed: false, confirmed: true });
  });
});
