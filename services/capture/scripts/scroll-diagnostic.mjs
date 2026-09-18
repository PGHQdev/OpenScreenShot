import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const out = new URL('../docs/mobile-fix-2026-09-13/', import.meta.url);
const cfg = await fs.readFile(
  path.join(os.homedir(), 'Library/Preferences/.wrangler/config/default.toml'),
  'utf8',
);
const token = cfg.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
if (!token) throw Error('Authenticate Wrangler first');
const results = [];
const docs = process.argv.includes('--docs');
const variants = [
  ['baseline', {}],
  [
    'instant-scroll',
    { addStyleTag: [{ content: 'html, body, * { scroll-behavior: auto !important; }' }] },
  ],
  [
    'instant-scroll-repeat',
    { addStyleTag: [{ content: 'html, body, * { scroll-behavior: auto !important; }' }] },
  ],
];
for (const [name, extra] of docs ? [['docs', variants[1][1]]] : variants) {
  const payload = {
    url: docs ? 'https://openscreenshot.app/docs/' : 'https://openscreenshot.app/',
    viewport: { width: docs ? 1440 : 390, height: docs ? 900 : 844, deviceScaleFactor: 1 },
    screenshotOptions: { fullPage: true, type: 'png' },
    scrollPage: true,
    gotoOptions: { waitUntil: 'networkidle2', timeout: 25000 },
    rejectRequestPattern: [
      '^(?!https:\\/\\/(?:example\\.com|openscreenshot\\.app)(?::443)?(?:[/?#]|$)).*',
    ],
    ...extra,
  };
  const start = Date.now();
  const res = await fetch(
    'https://api.cloudflare.com/client/v4/accounts/3763c12a02b16603a11283492b73b489/browser-rendering/screenshot?cacheTTL=0',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(65000),
    },
  );
  const bytes = Buffer.from(await res.arrayBuffer());
  const row = {
    name,
    payload,
    status: res.status,
    elapsedMs: Date.now() - start,
    browserMs: res.headers.get('x-browser-ms-used'),
    bytes: bytes.length,
  };
  if (res.ok && bytes.subarray(1, 4).toString() === 'PNG') {
    row.width = bytes.readUInt32BE(16);
    row.height = bytes.readUInt32BE(20);
    await fs.writeFile(new URL(`${name}.png`, out), bytes);
  }
  if (!res.ok) row.providerError = bytes.toString('utf8').slice(0, 1000);
  results.push(row);
  await fs.writeFile(
    new URL(docs ? 'docs-diagnostic.json' : 'diagnostic.json', out),
    JSON.stringify(results, null, 2),
  );
  console.log(JSON.stringify(row));
  if (!res.ok) break;
}
