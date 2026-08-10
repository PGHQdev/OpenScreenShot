import { expect, test } from 'vitest';
import { capture, CaptureOptions, resolveChrome } from '../src/capture';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test('schema rejects a non-url', () => {
  expect(CaptureOptions.safeParse({ url: 'not a url' }).success).toBe(false);
});

test('resolveChrome honors CHROME_PATH', () => {
  expect(resolveChrome({ CHROME_PATH: '/custom/chrome' })).toBe('/custom/chrome');
});

test('resolveChrome throws a clear error when nothing is found', () => {
  // No CHROME_PATH and a probe list that cannot exist.
  expect(() => resolveChrome({ CHROME_PATH: '', OSS_TEST_NO_CHROME: '1' })).toThrow(/Chrome/);
});

test('captures a real page as PNG bytes', async () => {
  const png = await capture(
    CaptureOptions.parse({ url: 'https://example.com', width: 800, height: 600 }),
  );
  expect(png.length).toBeGreaterThan(1000);
  expect(png.subarray(0, 8)).toEqual(PNG_MAGIC);
});
