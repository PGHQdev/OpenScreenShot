import { describe, expect, it } from 'vitest';
import { formatTimer, isNearBar, shouldShowBar } from '../../src/content/recording-overlay';

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
  const idle = { sinceMountMs: 60_000, sinceNearMs: 60_000, hovering: false, paused: false };
  it('hides when idle', () => expect(shouldShowBar(idle)).toBe(false));
  it('shows during the mount grace', () =>
    expect(shouldShowBar({ ...idle, sinceMountMs: 1000 })).toBe(true));
  it('shows after a recent reveal', () =>
    expect(shouldShowBar({ ...idle, sinceNearMs: 100 })).toBe(true));
  it('shows while hovered', () => expect(shouldShowBar({ ...idle, hovering: true })).toBe(true));
  it('shows while paused', () => expect(shouldShowBar({ ...idle, paused: true })).toBe(true));
  it('hides at exactly the grace boundary', () =>
    expect(shouldShowBar({ ...idle, sinceNearMs: 3000 })).toBe(false));
});
