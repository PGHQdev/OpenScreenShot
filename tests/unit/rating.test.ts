import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The rating funnel's rules (brief, section 11): the one post-success
 * prompt is due only after RATE_PROMPT_AFTER successes, never after any
 * Rate surface was used, and never twice.
 */

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

beforeEach(() => {
  vi.stubGlobal('chrome', {
    storage: { local: makeStorageStub().local },
    tabs: { create: vi.fn(async () => ({ id: 1 })) },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function rating() {
  return import('../../src/shared/rating');
}

describe.each(['test', 'firefox'])('rate prompt gating (%s)', (mode) => {
  beforeEach(() => vi.stubEnv('MODE', mode));

  it('opens the reviews page for this browser', async () => {
    const { REVIEWS_URL } = await rating();
    expect(REVIEWS_URL).toBe(
      mode === 'firefox'
        ? 'https://addons.mozilla.org/firefox/addon/openscreenshot/reviews/'
        : 'https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp/reviews',
    );
  });
  it('opens reviews before saving the permanent dismissal', async () => {
    const r = await rating();
    vi.mocked(chrome.tabs.create).mockImplementationOnce(async () => {
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
      return { id: 1 } as chrome.tabs.Tab;
    });
    await r.openReviewPage();
    expect(chrome.tabs.create).toHaveBeenCalledWith({ url: r.REVIEWS_URL });
    for (let i = 0; i < r.RATE_PROMPT_AFTER; i++) await r.recordExportSuccess();
    expect(await r.shouldShowRatePrompt()).toBe(false);
  });

  it('keeps reminders eligible if the reviews tab cannot open', async () => {
    const r = await rating();
    vi.mocked(chrome.tabs.create).mockRejectedValueOnce(new Error('Tab failed'));
    await expect(r.openReviewPage()).rejects.toThrow('Tab failed');
    for (let i = 0; i < r.RATE_PROMPT_AFTER; i++) await r.recordExportSuccess();
    expect(await r.shouldShowRatePrompt()).toBe(true);
  });

  it('is not due before RATE_PROMPT_AFTER successes', async () => {
    const { recordExportSuccess, shouldShowRatePrompt, RATE_PROMPT_AFTER } = await rating();
    for (let i = 0; i < RATE_PROMPT_AFTER - 1; i++) {
      await recordExportSuccess();
      expect(await shouldShowRatePrompt()).toBe(false);
    }
    await recordExportSuccess();
    expect(await shouldShowRatePrompt()).toBe(true);
  });

  it('does not immediately return after being shown', async () => {
    const { recordExportSuccess, shouldShowRatePrompt, markRatePromptShown, RATE_PROMPT_AFTER } =
      await rating();
    for (let i = 0; i < RATE_PROMPT_AFTER; i++) await recordExportSuccess();
    await markRatePromptShown();
    await recordExportSuccess();
    expect(await shouldShowRatePrompt()).toBe(false);
  });

  it('never appears after a Rate surface was used', async () => {
    const { recordExportSuccess, shouldShowRatePrompt, markRatedOrDismissed, RATE_PROMPT_AFTER } =
      await rating();
    await markRatedOrDismissed(); // e.g. the Rate star in the editor header
    for (let i = 0; i < RATE_PROMPT_AFTER + 2; i++) await recordExportSuccess();
    expect(await shouldShowRatePrompt()).toBe(false);
  });
});

it.each(['test', 'firefox'])(
  'Remind me later waits for 20 more successful uses across reloads (%s)',
  async (mode) => {
    vi.stubEnv('MODE', mode);
    const r = await rating();
    for (let i = 0; i < r.RATE_PROMPT_AFTER; i++) await r.recordExportSuccess();
    await r.markRatePromptShown();
    await r.recordExportSuccess();
    await r.remindRateLater();
    vi.resetModules();
    const reloaded = await rating();
    for (let i = 1; i < 20; i++) {
      await reloaded.recordExportSuccess();
      expect(await reloaded.shouldShowRatePrompt()).toBe(false);
    }
    await reloaded.recordExportSuccess();
    expect(await reloaded.shouldShowRatePrompt()).toBe(true);
    await reloaded.markRatedOrDismissed();
    for (let i = 0; i < 21; i++) await reloaded.recordExportSuccess();
    expect(await reloaded.shouldShowRatePrompt()).toBe(false);
  },
);
