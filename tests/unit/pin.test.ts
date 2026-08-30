import { describe, it, expect, vi } from 'vitest';
import {
  coalesceUpdates,
  hasPinWindow,
  pinFailureReason,
  pinWindowSize,
  pinWindowStyle,
  requestPinWindow,
  PIN_UNAVAILABLE_REASON,
  type PinWindowScope,
} from '../../src/editor/pin';
import { theme as designTheme } from '../../src/shared/design-tokens';

/** A stand-in for window.documentPictureInPicture that resolves with a fixed window. */
function scopeThatOpens(win: unknown): PinWindowScope {
  return {
    documentPictureInPicture: {
      requestWindow: vi.fn(() => Promise.resolve(win as Window)),
    },
  };
}

/** A stand-in that rejects, the way a denied/blocked request does. */
function scopeThatRejects(err: unknown): PinWindowScope {
  return {
    documentPictureInPicture: {
      requestWindow: vi.fn(() => Promise.reject(err)),
    },
  };
}

describe('hasPinWindow', () => {
  it('is true when the API is present', () => {
    expect(hasPinWindow(scopeThatOpens({}))).toBe(true);
  });

  it('is false on a browser without it', () => {
    expect(hasPinWindow({})).toBe(false);
  });

  it('is false when documentPictureInPicture exists but has no requestWindow', () => {
    expect(hasPinWindow({ documentPictureInPicture: {} as never })).toBe(false);
  });
});

describe('PIN_UNAVAILABLE_REASON', () => {
  it('names the missing browser feature', () => {
    expect(PIN_UNAVAILABLE_REASON).toMatch(/Document Picture-in-Picture/);
  });
});

describe('pinFailureReason', () => {
  it('names a denied/blocked request', () => {
    const err = new DOMException('blocked', 'NotAllowedError');
    expect(pinFailureReason(err)).toBe(
      'Could not open the pinned window — try clicking Pin again.',
    );
  });

  it('includes an Error message for any other failure', () => {
    expect(pinFailureReason(new Error('no activation'))).toBe(
      'Could not open the pinned window (no activation).',
    );
  });

  it('falls back to String() for a non-Error rejection', () => {
    expect(pinFailureReason('nope')).toBe('Could not open the pinned window (nope).');
  });
});

describe('pinWindowSize', () => {
  it('scales a landscape picture down to fit maxDim on its long side', () => {
    expect(pinWindowSize(1920, 1080, 480)).toEqual({ width: 480, height: 270 });
  });

  it('scales a portrait picture down to fit maxDim on its long side', () => {
    expect(pinWindowSize(1080, 1920, 480)).toEqual({ width: 270, height: 480 });
  });

  it('never upscales a picture already smaller than maxDim', () => {
    expect(pinWindowSize(200, 100, 480)).toEqual({ width: 200, height: 100 });
  });

  it('falls back to a square default for a degenerate size', () => {
    expect(pinWindowSize(0, 0, 480)).toEqual({ width: 480, height: 480 });
  });
});

describe('pinWindowStyle', () => {
  it('fits the image with no scrollbars in light theme', () => {
    const css = pinWindowStyle('light');
    expect(css).toContain('overflow:hidden');
    expect(css).toContain('object-fit:contain');
    expect(css).toContain(designTheme.light.stageBg);
  });

  it('uses the dark background in dark theme', () => {
    expect(pinWindowStyle('dark')).toContain(designTheme.dark.stageBg);
  });

  // Reading the token rather than a copied hex is the point of the change;
  // this keeps the two themes from resolving to the same one.
  it('takes each background from its own theme', () => {
    expect(pinWindowStyle('light')).not.toContain(designTheme.dark.stageBg);
    expect(pinWindowStyle('dark')).not.toContain(designTheme.light.stageBg);
  });
});

describe('requestPinWindow', () => {
  it('resolves with the window a scope opens', async () => {
    const win = { marker: 'pip' };
    const scope = scopeThatOpens(win);
    await expect(requestPinWindow(scope, { width: 480, height: 270 })).resolves.toBe(win);
    expect(scope.documentPictureInPicture!.requestWindow).toHaveBeenCalledWith({
      width: 480,
      height: 270,
    });
  });

  it("rejects with the scope's own error", async () => {
    const err = new DOMException('denied', 'NotAllowedError');
    await expect(requestPinWindow(scopeThatRejects(err), { width: 480, height: 480 })).rejects.toBe(
      err,
    );
  });
});

/**
 * A stand-in for requestAnimationFrame/cancelAnimationFrame: schedule()
 * queues a callback and returns a handle, flush() runs everything queued
 * right now (nothing queued during the run itself), cancel() drops a
 * handle before it fires. No real timers or a DOM involved.
 */
function fakeFrameQueue() {
  const queue = new Map<number, () => void>();
  let next = 1;
  return {
    schedule: (cb: () => void): number => {
      const id = next++;
      queue.set(id, cb);
      return id;
    },
    cancel: (id: number): void => {
      queue.delete(id);
    },
    flush: (): void => {
      const due = [...queue.entries()];
      queue.clear();
      for (const [, cb] of due) cb();
    },
  };
}

describe('coalesceUpdates', () => {
  it('collapses many triggers before the frame fires into one run', () => {
    const q = fakeFrameQueue();
    let runs = 0;
    const c = coalesceUpdates(
      () => {
        runs += 1;
      },
      q.schedule,
      q.cancel,
    );
    c.trigger();
    c.trigger();
    c.trigger();
    expect(runs).toBe(0); // nothing runs before the frame
    q.flush();
    expect(runs).toBe(1); // three triggers, one run
  });

  it('reads whatever state is current when the frame fires, not when trigger() was called', () => {
    const q = fakeFrameQueue();
    const seen: string[] = [];
    let latest = 'a';
    const c = coalesceUpdates(() => seen.push(latest), q.schedule, q.cancel);
    c.trigger();
    latest = 'b'; // changes after trigger(), before the frame fires
    q.flush();
    expect(seen).toEqual(['b']);
  });

  it('a trigger after a run schedules again, so a later change still lands', () => {
    const q = fakeFrameQueue();
    const seen: string[] = [];
    let latest = 'a';
    const c = coalesceUpdates(() => seen.push(latest), q.schedule, q.cancel);
    c.trigger();
    q.flush();
    latest = 'b';
    c.trigger();
    q.flush();
    expect(seen).toEqual(['a', 'b']);
  });

  it('cancel() drops a still-pending run', () => {
    const q = fakeFrameQueue();
    let runs = 0;
    const c = coalesceUpdates(
      () => {
        runs += 1;
      },
      q.schedule,
      q.cancel,
    );
    c.trigger();
    c.cancel();
    q.flush();
    expect(runs).toBe(0);
  });

  it('trigger() after cancel() schedules a fresh run', () => {
    const q = fakeFrameQueue();
    let runs = 0;
    const c = coalesceUpdates(
      () => {
        runs += 1;
      },
      q.schedule,
      q.cancel,
    );
    c.trigger();
    c.cancel();
    c.trigger();
    q.flush();
    expect(runs).toBe(1);
  });
});
