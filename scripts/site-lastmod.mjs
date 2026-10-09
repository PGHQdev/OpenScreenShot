// Give each sitemap URL a <lastmod> that moves only when that page's
// significant content changes. Google uses lastmod only while it stays
// "consistently and verifiably accurate", so a date that moves on a commit
// that changed no page teaches it to ignore the field for the whole site.
//
// Each page gets a fingerprint of what Google counts as significant: title,
// meta description and robots, canonical and alternate links, JSON-LD, and
// <main>. The nav, footer, and styles stay out. The previous deploy's
// fingerprints come from the live sitemap-lastmod.json: an unchanged page
// keeps its date, a new or changed page gets this build's time. The same
// file lists the changed and removed URLs for the IndexNow workflow.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SITE = 'https://openscreenshot.app';
const OUT = fileURLToPath(new URL('../site-dist/', import.meta.url));
const MANIFEST = 'sitemap-lastmod.json';

function fingerprint(html) {
  const head = html.match(/<head>[\s\S]*?<\/head>/i)?.[0] ?? '';
  const parts = [
    head.match(/<title>[\s\S]*?<\/title>/i)?.[0],
    ...(head.match(/<meta name="(?:description|robots)"[^>]*>/gi) ?? []),
    ...(head.match(/<link rel="(?:canonical|alternate)"[^>]*>/gi) ?? []),
    ...(html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi) ?? []),
    html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? html,
  ];
  // Astro derives scope ids from component source, so a style-only edit
  // renames them on every page that uses the component.
  const text = parts.join('\n').replace(/\s?data-astro-cid-[a-z0-9]+(?:="[^"]*")?/g, '');
  return createHash('sha256').update(text).digest('hex');
}

// A failed fetch leaves every date empty until each page next changes, so
// ride out a short blip before giving up.
async function fetchText(path) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(SITE + path, { signal: AbortSignal.timeout(10_000) });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
}

/** Last deploy's pages as { path: { hash, lastmod } }, or null when unknown. */
async function previousPages() {
  try {
    const manifest = await fetchText('/' + MANIFEST);
    if (manifest) return JSON.parse(manifest).pages;
    // First deploy with this script: take the dates the live sitemap already
    // published, with no hashes, so every page counts as unchanged once.
    const sitemap = await fetchText('/sitemap-0.xml');
    if (!sitemap) return null;
    const pages = {};
    for (const [, loc, lastmod] of sitemap.matchAll(
      /<loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g,
    )) {
      pages[new URL(loc).pathname] = { hash: null, lastmod: lastmod ?? null };
    }
    return pages;
  } catch (err) {
    console.warn(`site-lastmod: previous deploy unavailable (${err.message})`);
    return null;
  }
}

const sitemaps = (await readdir(OUT)).filter((f) => /^sitemap-\d+\.xml$/.test(f));
const xml = new Map();
for (const file of sitemaps) xml.set(file, await readFile(OUT + file, 'utf8'));

const paths = [...xml.values()].flatMap((x) =>
  [...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => new URL(loc).pathname),
);
const previous = await previousPages();
const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const pages = {};
const changed = [];

for (const path of paths) {
  const hash = fingerprint(await readFile(`${OUT}${path.slice(1)}index.html`, 'utf8'));
  const prev = previous?.[path];
  if (prev && (prev.hash === null || prev.hash === hash)) {
    pages[path] = { hash, lastmod: prev.lastmod };
  } else {
    // With no previous deploy to compare against, no date is honest.
    pages[path] = { hash, lastmod: previous ? now : null };
    if (previous) changed.push(path);
  }
}
const removed = previous ? Object.keys(previous).filter((p) => !(p in pages)) : [];

for (const [file, text] of xml) {
  const out = text.replace(/<loc>([^<]+)<\/loc>(?:<lastmod>[^<]*<\/lastmod>)?/g, (_, loc) => {
    const { lastmod } = pages[new URL(loc).pathname];
    return `<loc>${loc}</loc>` + (lastmod ? `<lastmod>${lastmod}</lastmod>` : '');
  });
  await writeFile(OUT + file, out);
}

const newest = Object.values(pages)
  .map((p) => p.lastmod)
  .filter(Boolean)
  .sort()
  .at(-1);
const index = (await readFile(OUT + 'sitemap-index.xml', 'utf8')).replace(
  /(<loc>[^<]+<\/loc>)(?:<lastmod>[^<]*<\/lastmod>)?/g,
  (_, loc) => loc + (newest ? `<lastmod>${newest}</lastmod>` : ''),
);
await writeFile(OUT + 'sitemap-index.xml', index);

await writeFile(OUT + MANIFEST, JSON.stringify({ generated: now, changed, removed, pages }));
console.log(
  `site-lastmod: ${paths.length} URLs, ${changed.length} changed, ${removed.length} removed`,
);
