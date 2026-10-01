import { describe, expect, it } from 'vitest';
import {
  encodeSize,
  MP4_MAX_PIXELS,
  nextCancelClick,
  remainingExportMs,
} from '../../src/recorder/export-video';

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

describe('encodeSize', () => {
  it('leaves a WebM canvas as it is, odd sides included', () => {
    expect(encodeSize(5121, 2881, 'webm')).toEqual({ width: 5121, height: 2881 });
  });
  it('keeps an MP4 canvas under the H.264 ceiling at its own size, sides made even', () => {
    expect(encodeSize(2560, 1440, 'mp4')).toEqual({ width: 2560, height: 1440 });
    expect(encodeSize(1281, 721, 'mp4')).toEqual({ width: 1280, height: 720 });
  });
  it('scales a 5K MP4 canvas down to the ceiling, aspect kept', () => {
    const { width, height } = encodeSize(5120, 2880, 'mp4');
    expect(width * height).toBeLessThanOrEqual(MP4_MAX_PIXELS);
    expect(width).toBe(4096);
    expect(height).toBe(2304);
  });
  it('scales a tall portrait canvas by area too', () => {
    const { width, height } = encodeSize(2880, 5120, 'mp4');
    expect(width * height).toBeLessThanOrEqual(MP4_MAX_PIXELS);
    expect((width % 2) + (height % 2)).toBe(0);
  });
});
