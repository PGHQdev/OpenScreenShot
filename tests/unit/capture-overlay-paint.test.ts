import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { updateCaptureOverlay } from '../../src/content/capture-overlay';

let frames: Array<FrameRequestCallback>;
beforeEach(() => {
  vi.useFakeTimers();
  frames = [];
  vi.stubGlobal('window', { setTimeout });
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('capture overlay paint barrier', () => {
  it('does not allow capture until two animation frames have passed', async () => {
    let ready = false;
    const hidden = updateCaptureOverlay('hide').then(() => {
      ready = true;
    });
    await Promise.resolve();
    expect(ready).toBe(false);
    frames.shift()!(0);
    await Promise.resolve();
    expect(ready).toBe(false);
    frames.shift()!(16);
    await hidden;
    expect(ready).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects instead of capturing when a backgrounded page stops painting', async () => {
    const hidden = updateCaptureOverlay('hide');
    const rejected = expect(hidden).rejects.toThrow('stopped painting');
    await vi.advanceTimersByTimeAsync(2000);
    await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });
});
