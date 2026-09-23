import { beforeEach, expect, it, vi } from 'vitest';

const values = new Map<string, unknown>();
const session = {
  get: vi.fn(async (key: string) => ({ [key]: values.get(key) })),
  set: vi.fn(async (items: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(items)) values.set(key, value);
  }),
  remove: vi.fn(async (key: string) => values.delete(key)),
};

beforeEach(() => {
  vi.resetModules();
  values.clear();
  vi.stubGlobal('chrome', {
    runtime: { getManifest: () => ({ version: '2.1.4' }) },
    i18n: { getUILanguage: () => 'ja' },
    storage: { session },
  });
});

it('stores and clears an explicitly reportable capture failure', async () => {
  const { clearPendingCaptureError, getPendingCaptureError, setPendingCaptureError } =
    await import('../../src/shared/storage');
  await setPendingCaptureError(
    {
      type: 'CAPTURE_ERROR',
      code: 'unknown',
      message: 'Capture failed unexpectedly.',
      detail: 'Cannot access contents of the page',
    },
    { url: 'https://example.com', title: 'Example' } as chrome.tabs.Tab,
  );
  await expect(getPendingCaptureError()).resolves.toMatchObject({
    code: 'unknown',
    detail: 'Cannot access contents of the page',
    version: '2.1.4',
    locale: 'ja',
    url: 'https://example.com',
    title: 'Example',
  });
  await clearPendingCaptureError();
  await expect(getPendingCaptureError()).resolves.toBeNull();
});
