import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
const cfg = await fs.readFile(
  path.join(os.homedir(), 'Library/Preferences/.wrangler/config/default.toml'),
  'utf8',
);
const token = cfg.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
if (!token) throw Error('Authenticate Wrangler');
const results = [];
for (const [name, timeout] of [
  ['forced-navigation-timeout', 1],
  ['docs-normal-1', 25000],
  ['docs-normal-2', 25000],
]) {
  const started = Date.now();
  const res = await fetch(
    'https://api.cloudflare.com/client/v4/accounts/3763c12a02b16603a11283492b73b489/browser-rendering/screenshot?cacheTTL=0',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(65000),
      body: JSON.stringify({
        url: 'https://openscreenshot.app/docs/',
        viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
        screenshotOptions: { fullPage: true, type: 'png' },
        scrollPage: true,
        addStyleTag: [{ content: 'html, body, * { scroll-behavior: auto !important; }' }],
        gotoOptions: { waitUntil: 'networkidle2', timeout },
        rejectRequestPattern: [
          '^(?!https:\\/\\/(?:example\\.com|openscreenshot\\.app)(?::443)?(?:[/?#]|$)).*',
        ],
      }),
    },
  );
  const bytes = Buffer.from(await res.arrayBuffer());
  const row = {
    name,
    status: res.status,
    elapsedMs: Date.now() - started,
    browserMs: res.headers.get('x-browser-ms-used'),
    error: res.ok ? null : bytes.toString('utf8').slice(0, 2000),
  };
  results.push(row);
  console.log(JSON.stringify(row));
  await fs.writeFile(
    new URL('../docs/reliability-2026-09-13/probe.json', import.meta.url),
    JSON.stringify(results, null, 2),
  );
  if ([401, 403, 429].includes(res.status)) break;
}
