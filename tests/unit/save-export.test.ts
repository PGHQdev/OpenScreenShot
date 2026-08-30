import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveExport, SAVE_VERIFY_TIMEOUT_MS } from '../../src/recorder/save-export';

/**
 * `saveExport` is the fix for defects 8 and 9: the old path clicked an
 * anchor, revoked its object URL synchronously, and deleted the session —
 * all before the browser had done anything with the file. These tests drive
 * a stubbed `chrome.downloads` the same way `tests/unit/context-menus-race
 * .test.ts` stubs `chrome` globally, firing the `onChanged` listener the
 * function itself registers rather than reaching into its internals.
 */

type Listener = (delta: chrome.downloads.DownloadDelta) => void;

let downloadImpl: () => Promise<number>;
let listeners: Listener[];
let revoked: string[];
let created: string[];

function makeFakeChrome() {
  listeners = [];
  return {
    downloads: {
      download: vi.fn(() => downloadImpl()),
      onChanged: {
        addListener: vi.fn((fn: Listener) => listeners.push(fn)),
        removeListener: vi.fn((fn: Listener) => {
          listeners = listeners.filter((l) => l !== fn);
        }),
      },
    },
  };
}

function fire(delta: chrome.downloads.DownloadDelta) {
  for (const l of [...listeners]) l(delta);
}

beforeEach(() => {
  downloadImpl = () => Promise.resolve(1);
  revoked = [];
  created = [];
  vi.stubGlobal('chrome', makeFakeChrome());
  const createObjectURL = vi.fn((_blob: Blob) => {
    const url = `blob:fake/${created.length}`;
    created.push(url);
    return url;
  });
  const revokeObjectURL = vi.fn((url: string) => revoked.push(url));
  vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('saveExport', () => {
  it('resolves complete and revokes the object URL only after onChanged says so', async () => {
    const promise = saveExport(new Blob(['x']), 'clip.webm');
    // The URL must still be alive for the whole time the save dialog could
    // be showing — revoking it before onChanged fires is defect 8.
    await Promise.resolve();
    await Promise.resolve();
    expect(revoked).toEqual([]);
    fire({ id: 1, state: { current: 'complete' } });
    await expect(promise).resolves.toEqual({ state: 'complete' });
    expect(revoked).toEqual(created);
  });

  it('reports a dismissed Save dialog as cancelled, not a success', async () => {
    const promise = saveExport(new Blob(['x']), 'clip.webm');
    // `download()` resolving is itself a microtask; the listener this
    // registers only exists once that resolves.
    await Promise.resolve();
    await Promise.resolve();
    fire({ id: 1, state: { current: 'interrupted' }, error: { current: 'USER_CANCELED' } });
    await expect(promise).resolves.toEqual({ state: 'cancelled' });
  });

  it('reports another interruption by its error name', async () => {
    const promise = saveExport(new Blob(['x']), 'clip.webm');
    await Promise.resolve();
    await Promise.resolve();
    fire({ id: 1, state: { current: 'interrupted' }, error: { current: 'FILE_NO_SPACE' } });
    await expect(promise).resolves.toEqual({ state: 'interrupted', error: 'FILE_NO_SPACE' });
  });

  it('reports interrupted when download() itself rejects', async () => {
    downloadImpl = () => Promise.reject(new Error('disk full'));
    await expect(saveExport(new Blob(['x']), 'clip.webm')).resolves.toEqual({
      state: 'interrupted',
      error: 'disk full',
    });
  });

  it('ignores onChanged deltas for a different download id', async () => {
    const promise = saveExport(new Blob(['x']), 'clip.webm');
    await Promise.resolve();
    await Promise.resolve();
    fire({ id: 999, state: { current: 'complete' } });
    fire({ id: 1, state: { current: 'complete' } });
    await expect(promise).resolves.toEqual({ state: 'complete' });
  });

  it('gives up as unverified if onChanged never fires, within the bound it is given', async () => {
    vi.useFakeTimers();
    const promise = saveExport(new Blob(['x']), 'clip.webm', 1000);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(promise).resolves.toEqual({ state: 'unverified' });
    vi.useRealTimers();
  });

  it('still revokes the object URL when the wait is exhausted', async () => {
    vi.useFakeTimers();
    const promise = saveExport(new Blob(['x']), 'clip.webm', 1000);
    await vi.advanceTimersByTimeAsync(1000);
    await promise;
    expect(revoked).toEqual(created);
    vi.useRealTimers();
  });

  it('exports a default timeout generous enough that it is not mistaken for a real save budget', () => {
    expect(SAVE_VERIFY_TIMEOUT_MS).toBeGreaterThanOrEqual(60_000);
  });
});
