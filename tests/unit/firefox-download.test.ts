import { afterEach, expect, it, vi } from 'vitest';

const png = 'data:image/png;base64,iVBORw0KGgo=';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.resetModules();
});

it('downloads a Firefox image through an accessible blob URL', async () => {
  vi.stubEnv('MODE', 'firefox');
  vi.resetModules();
  vi.useFakeTimers();
  let downloaded: Blob | undefined;
  let downloadUrl = '';
  vi.stubGlobal('chrome', {
    ...chrome,
    downloads: {
      async download({ url }: { url: string }) {
        if (url.startsWith('data:')) throw new Error('Access denied for URL data:');
        downloadUrl = url;
        downloaded = await (await fetch(url)).blob();
        return 1;
      },
    },
  });
  const { downloadDataUrl } = await import('../../src/editor/export');
  await downloadDataUrl(png, 'capture.png');
  expect(downloaded?.type).toBe('image/png');
  expect(Array.from(new Uint8Array(await downloaded!.arrayBuffer()))).toEqual([
    137, 80, 78, 71, 13, 10, 26, 10,
  ]);
  await vi.advanceTimersByTimeAsync(10000);
  await expect(fetch(downloadUrl)).rejects.toThrow();
});
