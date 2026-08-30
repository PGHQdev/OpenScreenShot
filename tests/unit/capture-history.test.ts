import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CaptureHistoryEntry, LastCapture } from '../../src/shared/types';

/**
 * `makeThumbnail` needs OffscreenCanvas/createImageBitmap, real browser APIs
 * this suite's node environment does not have (and should not fake — the
 * built extension in headless Chrome, exercised by the browser smoke, is
 * what proves the real encode works). Storage's own logic — the eviction
 * policy and the migration — never looks at what a thumbnail contains, so a
 * fixed string stands in for it here.
 */
vi.mock('../../src/shared/thumbnail', () => ({
  makeThumbnail: vi.fn(async (dataUrl: string) => `thumb:${dataUrl}`),
}));

/** In-memory `chrome.storage.local`, single-string-key `get` only — the
 * shape every call site in storage.ts actually uses. */
function makeStorageStub() {
  const store = new Map<string, unknown>();
  return {
    store,
    local: {
      get: vi.fn(async (key: string) => (store.has(key) ? { [key]: store.get(key) } : {})),
      set: vi.fn(async (items: Record<string, unknown>) => {
        for (const [k, v] of Object.entries(items)) store.set(k, v);
      }),
      remove: vi.fn(async (key: string) => void store.delete(key)),
      getBytesInUse: vi.fn(async () => 0),
    },
  };
}

let uuidCounter: number;

beforeEach(() => {
  uuidCounter = 0;
  const stub = makeStorageStub();
  vi.stubGlobal('chrome', { storage: { local: stub.local } });
  vi.stubGlobal('crypto', {
    ...crypto,
    randomUUID: vi.fn(
      () => `id-${++uuidCounter}` as unknown as `${string}-${string}-${string}-${string}-${string}`,
    ),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

function capture(overrides: Partial<LastCapture> = {}): LastCapture {
  return {
    dataUrl: 'data:image/png;base64,AAA',
    width: 800,
    height: 600,
    mode: 'visible',
    title: 'a capture',
    capturedAt: 1000,
    ...overrides,
  };
}

describe('withCapture (eviction policy)', () => {
  it('prepends the new entry ahead of the existing ones', async () => {
    const { withCapture } = await import('../../src/shared/storage');
    const existing: CaptureHistoryEntry[] = [
      { id: 'a', thumbnail: 't', width: 1, height: 1, mode: 'visible', title: 'a', capturedAt: 1 },
    ];
    const fresh: CaptureHistoryEntry = {
      id: 'b',
      thumbnail: 't',
      width: 1,
      height: 1,
      mode: 'visible',
      title: 'b',
      capturedAt: 2,
    };
    const { kept, evicted } = withCapture(existing, fresh, 12);
    expect(kept.map((e) => e.id)).toEqual(['b', 'a']);
    expect(evicted).toEqual([]);
  });

  it('evicts exactly what falls past the limit, oldest-appended first', async () => {
    const { withCapture } = await import('../../src/shared/storage');
    const existing: CaptureHistoryEntry[] = Array.from({ length: 3 }, (_, i) => ({
      id: `e${i}`,
      thumbnail: 't',
      width: 1,
      height: 1,
      mode: 'visible' as const,
      title: `e${i}`,
      capturedAt: i,
    }));
    const fresh: CaptureHistoryEntry = {
      id: 'new',
      thumbnail: 't',
      width: 1,
      height: 1,
      mode: 'visible',
      title: 'new',
      capturedAt: 99,
    };
    const { kept, evicted } = withCapture(existing, fresh, 2);
    expect(kept.map((e) => e.id)).toEqual(['new', 'e0']);
    expect(evicted.map((e) => e.id)).toEqual(['e1', 'e2']);
  });

  it('evicts nothing when the list is under the limit', async () => {
    const { withCapture } = await import('../../src/shared/storage');
    const fresh: CaptureHistoryEntry = {
      id: 'only',
      thumbnail: 't',
      width: 1,
      height: 1,
      mode: 'visible',
      title: 'only',
      capturedAt: 1,
    };
    const { kept, evicted } = withCapture([], fresh, 12);
    expect(kept.map((e) => e.id)).toEqual(['only']);
    expect(evicted).toEqual([]);
  });
});

describe('setLastCapture (eviction, end to end)', () => {
  it('caps the shelf at CAPTURE_HISTORY_LIMIT and frees the evicted image keys', async () => {
    const storage = await import('../../src/shared/storage');
    for (let i = 0; i < storage.CAPTURE_HISTORY_LIMIT + 3; i++) {
      await storage.setLastCapture(capture({ capturedAt: i, title: `cap${i}` }));
    }
    const list = await storage.listCaptureHistory();
    expect(list).toHaveLength(storage.CAPTURE_HISTORY_LIMIT);
    // Newest first: the last write (id-15, title cap14) leads.
    expect(list[0].title).toBe(`cap${storage.CAPTURE_HISTORY_LIMIT + 2}`);
    // The three oldest captures' full-image keys are gone — not just their
    // list rows: getBytesInUse is never used for this (thumbnails already
    // make the list cheap), so this reads openCapture, which returns null
    // once the image key is removed.
    expect(await storage.openCapture('id-1')).toBeNull();
    expect(await storage.openCapture('id-2')).toBeNull();
    expect(await storage.openCapture('id-3')).toBeNull();
    // The oldest *kept* entry's image is still there.
    const oldestKept = list[list.length - 1];
    expect(await storage.openCapture(oldestKept.id)).not.toBeNull();
  });

  it('getLastCapture returns the most recently stashed capture, full image included', async () => {
    const storage = await import('../../src/shared/storage');
    await storage.setLastCapture(capture({ title: 'first', dataUrl: 'data:image/png;base64,ONE' }));
    await storage.setLastCapture(
      capture({ title: 'second', dataUrl: 'data:image/png;base64,TWO' }),
    );
    const last = await storage.getLastCapture();
    expect(last?.title).toBe('second');
    expect(last?.dataUrl).toBe('data:image/png;base64,TWO');
  });

  it('hasLastCapture is false for an empty shelf and true once something is stashed', async () => {
    const storage = await import('../../src/shared/storage');
    expect(await storage.hasLastCapture()).toBe(false);
    await storage.setLastCapture(capture());
    expect(await storage.hasLastCapture()).toBe(true);
  });

  it('deleteCapture removes the row and its image, and is a no-op for an unknown id', async () => {
    const storage = await import('../../src/shared/storage');
    await storage.setLastCapture(capture());
    const [entry] = await storage.listCaptureHistory();
    await storage.deleteCapture(entry.id);
    expect(await storage.listCaptureHistory()).toEqual([]);
    expect(await storage.openCapture(entry.id)).toBeNull();
    await expect(storage.deleteCapture('nope')).resolves.toBeUndefined();
  });
});

describe('legacy capture migration', () => {
  it('turns the old single-capture key into the newest shelf entry', async () => {
    const storage = await import('../../src/shared/storage');
    await chrome.storage.local.set({
      'openscreenshot:last-capture': capture({ title: 'legacy shot', capturedAt: 500 }),
    });
    const list = await storage.listCaptureHistory();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('legacy shot');
    expect(list[0].capturedAt).toBe(500);
    const full = await storage.getLastCapture();
    expect(full?.dataUrl).toBe('data:image/png;base64,AAA');
  });

  it('removes the legacy key only after the new list and image are written', async () => {
    const storage = await import('../../src/shared/storage');
    await chrome.storage.local.set({
      'openscreenshot:last-capture': capture({ title: 'legacy shot' }),
    });
    await storage.listCaptureHistory();
    expect(await chrome.storage.local.get('openscreenshot:last-capture')).toEqual({});
    // What it wrote first is still fully there.
    const list = await storage.listCaptureHistory();
    expect(list).toHaveLength(1);
  });

  it('is idempotent: a second read does not duplicate the migrated entry', async () => {
    const storage = await import('../../src/shared/storage');
    await chrome.storage.local.set({
      'openscreenshot:last-capture': capture({ title: 'legacy shot' }),
    });
    await storage.listCaptureHistory();
    await storage.listCaptureHistory();
    await storage.listCaptureHistory();
    const list = await storage.listCaptureHistory();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('legacy shot');
  });

  it('does not lose a capture already in the shelf when a legacy key also exists', async () => {
    const storage = await import('../../src/shared/storage');
    await storage.setLastCapture(capture({ title: 'already in the shelf' }));
    await chrome.storage.local.set({
      'openscreenshot:last-capture': capture({ title: 'legacy shot', capturedAt: 2000 }),
    });
    const list = await storage.listCaptureHistory();
    expect(list.map((e) => e.title)).toEqual(['legacy shot', 'already in the shelf']);
  });

  it('an upgrading user with no prior capture gets an empty shelf, not an error', async () => {
    const storage = await import('../../src/shared/storage');
    await expect(storage.listCaptureHistory()).resolves.toEqual([]);
  });
});

describe('a thumbnail encode failure never fails the read/write it happened inside', () => {
  it('setLastCapture still stashes the capture, with a fallback thumbnail', async () => {
    const { makeThumbnail } = await import('../../src/shared/thumbnail');
    vi.mocked(makeThumbnail).mockRejectedValueOnce(new Error('decode failed'));
    const storage = await import('../../src/shared/storage');
    await storage.setLastCapture(capture({ title: 'corrupt' }));
    const list = await storage.listCaptureHistory();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('corrupt');
    expect(list[0].thumbnail).toMatch(/^data:image\/png;base64,/);
    // The full image itself is untouched — only the thumbnail fell back.
    expect((await storage.getLastCapture())?.dataUrl).toBe(capture().dataUrl);
  });

  it('migration still completes, with a fallback thumbnail, when the legacy image will not encode', async () => {
    const { makeThumbnail } = await import('../../src/shared/thumbnail');
    vi.mocked(makeThumbnail).mockRejectedValueOnce(new Error('decode failed'));
    const storage = await import('../../src/shared/storage');
    await chrome.storage.local.set({
      'openscreenshot:last-capture': capture({ title: 'legacy corrupt' }),
    });
    const list = await storage.listCaptureHistory();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('legacy corrupt');
    expect(list[0].thumbnail).toMatch(/^data:image\/png;base64,/);
    expect(await chrome.storage.local.get('openscreenshot:last-capture')).toEqual({});
  });
});
