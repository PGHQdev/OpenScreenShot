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
/** Kept so a test can inspect what is actually left in storage — e.g. to
 * prove no `capture-image:{id}` key survives without a row that names it. */
let storeRef: Map<string, unknown>;

beforeEach(() => {
  uuidCounter = 0;
  const stub = makeStorageStub();
  storeRef = stub.store;
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

/** A `CaptureHistoryEntry` fixture — `withCapture` is pure, so its tests
 * build these directly rather than going through storage/thumbnail at all. */
function entry(overrides: Partial<CaptureHistoryEntry> = {}): CaptureHistoryEntry {
  return {
    id: 'x',
    thumbnail: 't',
    width: 1,
    height: 1,
    mode: 'visible',
    title: 'x',
    capturedAt: 0,
    imageBytes: 0,
    ...overrides,
  };
}

describe('withCapture (eviction policy)', () => {
  it('prepends the new entry ahead of the existing ones', async () => {
    const { withCapture } = await import('../../src/shared/storage');
    const existing = [entry({ id: 'a', capturedAt: 1 })];
    const fresh = entry({ id: 'b', capturedAt: 2 });
    const { kept, evicted } = withCapture(existing, fresh, 12, 1_000_000);
    expect(kept.map((e) => e.id)).toEqual(['b', 'a']);
    expect(evicted).toEqual([]);
  });

  it('evicts exactly what falls past the count limit, oldest-appended first', async () => {
    const { withCapture } = await import('../../src/shared/storage');
    const existing = Array.from({ length: 3 }, (_, i) => entry({ id: `e${i}`, capturedAt: i }));
    const fresh = entry({ id: 'new', capturedAt: 99 });
    const { kept, evicted } = withCapture(existing, fresh, 2, 1_000_000);
    expect(kept.map((e) => e.id)).toEqual(['new', 'e0']);
    expect(evicted.map((e) => e.id)).toEqual(['e1', 'e2']);
  });

  it('evicts nothing when the list is under the count limit', async () => {
    const { withCapture } = await import('../../src/shared/storage');
    const fresh = entry({ id: 'only', capturedAt: 1 });
    const { kept, evicted } = withCapture([], fresh, 12, 1_000_000);
    expect(kept.map((e) => e.id)).toEqual(['only']);
    expect(evicted).toEqual([]);
  });
});

describe('withCapture (byte budget — R-28a)', () => {
  it('evicts nothing on bytes alone when the total already fits', async () => {
    const { withCapture } = await import('../../src/shared/storage');
    const existing = [entry({ id: 'a', imageBytes: 100, capturedAt: 1 })];
    const fresh = entry({ id: 'b', imageBytes: 100, capturedAt: 2 });
    const { kept, evicted } = withCapture(existing, fresh, 12, 1000);
    expect(kept.map((e) => e.id)).toEqual(['b', 'a']);
    expect(evicted).toEqual([]);
  });

  it('drops the oldest survivors, by bytes, until the total fits the budget', async () => {
    const { withCapture } = await import('../../src/shared/storage');
    // existing is newest-first, same convention withCapture assumes throughout.
    const existing = [
      entry({ id: 'newer', imageBytes: 400, capturedAt: 2 }),
      entry({ id: 'oldest', imageBytes: 400, capturedAt: 1 }),
    ];
    const fresh = entry({ id: 'fresh', imageBytes: 400, capturedAt: 3 });
    // next totals 1200 against a 900 budget: drop the oldest survivor (400)
    // to land at 800, which fits — one drop is enough, not two.
    const { kept, evicted } = withCapture(existing, fresh, 12, 900);
    expect(kept.map((e) => e.id)).toEqual(['fresh', 'newer']);
    expect(evicted.map((e) => e.id)).toEqual(['oldest']);
  });

  it('never evicts below one entry, even when that entry alone exceeds the budget', async () => {
    const { withCapture } = await import('../../src/shared/storage');
    const fresh = entry({ id: 'huge', imageBytes: 5000, capturedAt: 1 });
    const { kept, evicted } = withCapture([], fresh, 12, 100);
    expect(kept.map((e) => e.id)).toEqual(['huge']);
    expect(evicted).toEqual([]);
  });

  it('applies the count cap first, then trims survivors further by bytes', async () => {
    const { withCapture } = await import('../../src/shared/storage');
    const existing = [
      entry({ id: 'e0', imageBytes: 10, capturedAt: 0 }),
      entry({ id: 'e1', imageBytes: 10, capturedAt: 1 }),
      entry({ id: 'e2', imageBytes: 10, capturedAt: 2 }),
    ];
    const fresh = entry({ id: 'new', imageBytes: 10, capturedAt: 3 });
    // Count cap (limit 2) keeps [new, e0] and evicts [e1, e2] by count first.
    // Bytes (20 > 15) then trim further: e0 goes too, down to the floor of
    // one entry — the freshly-added capture always survives.
    const { kept, evicted } = withCapture(existing, fresh, 2, 15);
    expect(kept.map((e) => e.id)).toEqual(['new']);
    expect(evicted.map((e) => e.id)).toEqual(['e1', 'e2', 'e0']);
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
    const [entry1] = await storage.listCaptureHistory();
    await storage.deleteCapture(entry1.id);
    expect(await storage.listCaptureHistory()).toEqual([]);
    expect(await storage.openCapture(entry1.id)).toBeNull();
    await expect(storage.deleteCapture('nope')).resolves.toBeUndefined();
  });
});

// R-28a review, Important #1: setLastCapture was a read-modify-write across
// a long await (thumbnail encode) with no serialization. Two overlapping
// writers each read the same list, computed eviction independently, and
// the second `set` clobbered the first — a whole row, and its full-image
// key, silently vanished with nothing left to reference it. Fixed by
// `withCaptureLock`, a module-level promise queue every capture-store
// mutation runs through.
describe('capture-store concurrency (R-28a Important #1)', () => {
  it('two overlapping setLastCapture calls both land — no lost row, no orphaned image key', async () => {
    const storage = await import('../../src/shared/storage');
    await Promise.all([
      storage.setLastCapture(capture({ title: 'first', dataUrl: 'data:image/png;base64,ONE' })),
      storage.setLastCapture(capture({ title: 'second', dataUrl: 'data:image/png;base64,TWO' })),
    ]);
    const list = await storage.listCaptureHistory();
    expect(list.map((e) => e.title).sort()).toEqual(['first', 'second']);
    // Every image key actually stored is referenced by exactly one row, and
    // every row's image key actually exists — neither direction is broken.
    const referenced = new Set(list.map((e) => `openscreenshot:capture-image:${e.id}`));
    const storedImageKeys = new Set(
      [...storeRef.keys()].filter((k) => k.startsWith('openscreenshot:capture-image:')),
    );
    expect(storedImageKeys).toEqual(referenced);
  });

  it('three overlapping setLastCapture calls all land (not just two)', async () => {
    const storage = await import('../../src/shared/storage');
    await Promise.all([
      storage.setLastCapture(capture({ title: 'a' })),
      storage.setLastCapture(capture({ title: 'b' })),
      storage.setLastCapture(capture({ title: 'c' })),
    ]);
    const list = await storage.listCaptureHistory();
    expect(list.map((e) => e.title).sort()).toEqual(['a', 'b', 'c']);
  });

  it('a capture racing a delete does not resurrect the deleted row', async () => {
    const storage = await import('../../src/shared/storage');
    await storage.setLastCapture(capture({ title: 'to delete' }));
    const [existing] = await storage.listCaptureHistory();
    await Promise.all([
      storage.deleteCapture(existing.id),
      storage.setLastCapture(capture({ title: 'new one' })),
    ]);
    const list = await storage.listCaptureHistory();
    expect(list.map((e) => e.title)).toEqual(['new one']);
    expect(await storage.openCapture(existing.id)).toBeNull();
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

  it('two overlapping reads of a legacy-only store do not double-migrate it', async () => {
    // Same shape as the concurrency describe above, but for migration
    // specifically: two listCaptureHistory() calls racing the one-time
    // legacy migration must not each mint their own copy.
    const storage = await import('../../src/shared/storage');
    await chrome.storage.local.set({
      'openscreenshot:last-capture': capture({ title: 'legacy shot' }),
    });
    const [listA, listB] = await Promise.all([
      storage.listCaptureHistory(),
      storage.listCaptureHistory(),
    ]);
    expect(listA).toHaveLength(1);
    expect(listB).toHaveLength(1);
    expect(listA[0].id).toBe(listB[0].id);
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

// R-28a review, Important #2: a total encode failure fell back silently —
// indistinguishable from success except for a shelf of identical blank
// squares. `safeThumbnail` now bumps an exported counter and warns once, so
// the failure is observable even though it is still swallowed (the shelf
// row still needs to exist — see the describe block above).
describe('thumbnail fallback observability (R-28a Important #2)', () => {
  it('bumps thumbnailFallbackCount and warns once when the encode fails', async () => {
    const { makeThumbnail } = await import('../../src/shared/thumbnail');
    vi.mocked(makeThumbnail).mockRejectedValueOnce(new Error('decode failed'));
    const storage = await import('../../src/shared/storage');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const before = storage.thumbnailFallbackCount;
    await storage.setLastCapture(capture({ title: 'corrupt' }));
    expect(storage.thumbnailFallbackCount).toBe(before + 1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it('does not warn or bump the counter when the encode succeeds', async () => {
    const storage = await import('../../src/shared/storage');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const before = storage.thumbnailFallbackCount;
    await storage.setLastCapture(capture());
    expect(storage.thumbnailFallbackCount).toBe(before);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
