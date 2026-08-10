import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { z } from 'zod';

export const CaptureOptions = z.object({
  url: z.string().url(),
  output: z.string().optional(),
  fullPage: z.boolean().optional().default(false),
  width: z.number().int().min(200).max(3840).optional().default(1280),
  height: z.number().int().min(200).max(2160).optional().default(800),
});
export type CaptureOptions = z.infer<typeof CaptureOptions>;

// Common Chrome/Chromium/Edge locations per OS. puppeteer-core ships no browser,
// so we point it at whatever the user already has.
const PROBE: Record<string, string[]> = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ],
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ],
};

export function resolveChrome(env: NodeJS.ProcessEnv = process.env): string {
  if (env.CHROME_PATH) return env.CHROME_PATH;
  // OSS_TEST_NO_CHROME lets the unit test force the not-found path deterministically.
  const candidates = env.OSS_TEST_NO_CHROME ? [] : (PROBE[process.platform] ?? []);
  for (const p of candidates) if (existsSync(p)) return p;
  throw new Error('Chrome not found. Install Google Chrome, or set CHROME_PATH to its executable.');
}

export async function capture(opts: CaptureOptions): Promise<Buffer> {
  const browser = await puppeteer.launch({
    executablePath: resolveChrome(),
    headless: true,
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    );
    await page.setViewport({ width: opts.width, height: opts.height });
    await page.goto(opts.url, { waitUntil: 'networkidle2', timeout: 30000 });
    const png = await page.screenshot({ fullPage: opts.fullPage, type: 'png' });
    return Buffer.from(png);
  } finally {
    await browser.close();
  }
}
