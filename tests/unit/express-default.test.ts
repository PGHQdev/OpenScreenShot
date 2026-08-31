import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/shared/types';

/**
 * Express mode became the default in 1.6.0: a toolbar click captures the
 * full page unless the user turns it off. Stored settings persist the whole
 * object, so every install that ever wrote settings holds
 * `expressMode: false` even when the user never touched the toggle —
 * `migrateExpressDefault` flips those once and never again. These tests pin
 * the default, the one-shot flip, and the note handoff to the editor.
 */

const SETTINGS_KEY = 'openscreenshot:settings';
const MIGRATED_KEY = 'openscreenshot:express-default-migrated';
const NOTE_KEY = 'openscreenshot:express-note-pending';

/** In-memory `chrome.storage.local` accepting the string-or-array `get`
 * shapes the migration and note reads actually use. */
function makeStorageStub() {
  const store = new Map<string, unknown>();
  return {
    store,
    local: {
      get: vi.fn(async (keys: string | string[]) => {
        const list = Array.isArray(keys) ? keys : [keys];
        const out: Record<string, unknown> = {};
        for (const k of list) if (store.has(k)) out[k] = store.get(k);
        return out;
      }),
      set: vi.fn(async (items: Record<string, unknown>) => {
        for (const [k, v] of Object.entries(items)) store.set(k, v);
      }),
      remove: vi.fn(async (key: string) => void store.delete(key)),
    },
  };
}

let store: Map<string, unknown>;

beforeEach(() => {
  const stub = makeStorageStub();
  store = stub.store;
  vi.stubGlobal('chrome', { storage: { local: stub.local } });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function storage() {
  return import('../../src/shared/storage');
}

describe('expressMode default', () => {
  it('is on for a fresh install', () => {
    expect(DEFAULT_SETTINGS.expressMode).toBe(true);
  });
});

describe('migrateExpressDefault', () => {
  it('fresh install: writes only the flag, leaving stored settings empty', async () => {
    const { migrateExpressDefault } = await storage();
    await migrateExpressDefault('install');
    expect(store.get(MIGRATED_KEY)).toBe(true);
    expect(store.has(SETTINGS_KEY)).toBe(false);
    expect(store.has(NOTE_KEY)).toBe(false);
  });

  it('update with stored expressMode:false flips it on and queues the note', async () => {
    store.set(SETTINGS_KEY, { expressMode: false, quality: 0.5 });
    const { migrateExpressDefault, getSettings } = await storage();
    await migrateExpressDefault('update');
    const settings = await getSettings();
    expect(settings.expressMode).toBe(true);
    expect(settings.quality).toBe(0.5); // other stored values survive
    expect(store.get(NOTE_KEY)).toBe(true);
  });

  it('update with no stored settings flips the default on and queues the note', async () => {
    const { migrateExpressDefault, getSettings } = await storage();
    await migrateExpressDefault('update');
    expect((await getSettings()).expressMode).toBe(true);
    expect(store.get(NOTE_KEY)).toBe(true);
  });

  it('update where the user already turned express on queues no note', async () => {
    store.set(SETTINGS_KEY, { expressMode: true });
    const { migrateExpressDefault } = await storage();
    await migrateExpressDefault('update');
    expect(store.has(NOTE_KEY)).toBe(false);
  });

  it('runs once: a later update does not undo the user turning it back off', async () => {
    store.set(SETTINGS_KEY, { expressMode: false });
    const { migrateExpressDefault, setSettings, getSettings } = await storage();
    await migrateExpressDefault('update');
    await setSettings({ expressMode: false }); // the user opts back out
    await migrateExpressDefault('update'); // next extension update
    expect((await getSettings()).expressMode).toBe(false);
  });
});

describe('takeExpressNote', () => {
  it('is true exactly once after a migration that changed behavior', async () => {
    store.set(SETTINGS_KEY, { expressMode: false });
    const { migrateExpressDefault, takeExpressNote } = await storage();
    await migrateExpressDefault('update');
    expect(await takeExpressNote()).toBe(true);
    expect(await takeExpressNote()).toBe(false);
  });

  it('is false when nothing queued it', async () => {
    const { takeExpressNote } = await storage();
    expect(await takeExpressNote()).toBe(false);
  });
});
