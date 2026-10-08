// Write a Markdown copy beside every indexable page in site-dist/ and link
// it from the page's <head>. Agents and LLM crawlers read Markdown more
// reliably than the rendered HTML; the Worker sends a canonical Link header
// on each copy so search engines keep the HTML as the indexed URL.
//
// The input is our own Astro output, so a small tag-by-tag converter covers
// it: headings, paragraphs, lists, tables, code, links, and inline emphasis.
import { readdir, readFile, writeFile, access } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://openscreenshot.app';
const OUT = fileURLToPath(new URL('../site-dist/', import.meta.url));

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

function decode(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, e) => {
    if (e[0] === '#') {
      const code =
        e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

function absolute(href, pageUrl) {
  try {
    return new URL(decode(href), pageUrl).href;
  } catch {
    return href;
  }
}

function attr(attrs, name) {
  return attrs.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
}

/** Inline markup only: the result has no block structure. */
function inline(html, pageUrl) {
  return decode(
    html
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<img\b([^>]*)>/gi, (_, a) => attr(a, 'alt') ?? '')
      .replace(
        /<(code|kbd)\b[^>]*>(.*?)<\/\1>/gis,
        (_, _t, c) => `\`${c.replace(/<[^>]+>/g, '')}\``,
      )
      .replace(/<(strong|b)\b[^>]*>(.*?)<\/\1>/gis, (_, _t, c) => `**${c.trim()}**`)
      .replace(/<(em|i)\b[^>]*>(.*?)<\/\1>/gis, (_, _t, c) => `*${c.trim()}*`)
      .replace(/<a\b([^>]*)>(.*?)<\/a>/gis, (_, a, c) => {
        const href = attr(a, 'href');
        const text = c.replace(/<[^>]+>/g, '').trim();
        return href && text ? `[${text}](${absolute(href, pageUrl)})` : text;
      })
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function table(html, pageUrl) {
  const rows = [...html.matchAll(/<tr\b[^>]*>(.*?)<\/tr>/gis)].map((r) =>
    [...r[1].matchAll(/<t[hd]\b[^>]*>(.*?)<\/t[hd]>/gis)].map((c) =>
      inline(c[1], pageUrl).replace(/\|/g, '\\|'),
    ),
  );
  if (!rows.length) return '';
  const width = Math.max(...rows.map((r) => r.length));
  const line = (cells) =>
    `| ${Array.from({ length: width }, (_, i) => cells[i] ?? '').join(' | ')} |`;
  return `\n\n${line(rows[0])}\n|${' --- |'.repeat(width)}\n${rows.slice(1).map(line).join('\n')}\n\n`;
}

export function toMarkdown(mainHtml, pageUrl) {
  const blocks = [];
  const hold = (md) => `\uE000${blocks.push(md) - 1}\uE000`;
  let html = mainHtml
    .replace(/<(script|style|svg|noscript|template|form|button|select|textarea)\b.*?<\/\1>/gis, '')
    .replace(/<!--.*?-->/gs, '')
    .replace(/<pre\b[^>]*>(.*?)<\/pre>/gis, (_, c) =>
      hold(`\n\n\`\`\`\n${decode(c.replace(/<[^>]+>/g, '')).replace(/\n+$/, '')}\n\`\`\`\n\n`),
    )
    .replace(/<table\b[^>]*>(.*?)<\/table>/gis, (_, c) => hold(table(c, pageUrl)))
    .replace(/\s+/g, ' ');

  html = html
    .replace(/<ol\b[^>]*>(.*?)<\/ol>/gis, (_, c) => {
      let n = 0;
      return `\n\n${c.replace(/<li\b[^>]*>(.*?)<\/li>/gis, (_m, li) => `\n${++n}. ${inline(li, pageUrl)}`)}\n\n`;
    })
    .replace(/<li\b[^>]*>(.*?)<\/li>/gis, (_, c) => `\n- ${inline(c, pageUrl)}`)
    .replace(
      /<h([1-6])\b[^>]*>(.*?)<\/h\1>/gis,
      (_, n, c) => `\n\n${'#'.repeat(+n)} ${inline(c, pageUrl)}\n\n`,
    )
    .replace(
      /<(p|dt|dd|figcaption|summary)\b[^>]*>(.*?)<\/\1>/gis,
      (_, _t, c) => `\n\n${inline(c, pageUrl)}\n\n`,
    )
    .replace(
      /<blockquote\b[^>]*>(.*?)<\/blockquote>/gis,
      (_, c) => `\n\n> ${inline(c, pageUrl)}\n\n`,
    )
    .replace(
      /<\/?(ul|div|section|article|header|footer|aside|nav|details|dl|figure)\b[^>]*>/gi,
      '\n\n',
    );

  return html
    .split('\n')
    .map((l) => (l.includes('\uE000') ? l.trim() : inline(l, pageUrl)))
    .join('\n')
    .replace(/\uE000(\d+)\uE000/g, (_, i) => blocks[+i])
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function* pages(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* pages(path);
    else if (entry.name === 'index.html') yield path;
  }
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

let written = 0;
for await (const file of pages(OUT)) {
  const html = await readFile(file, 'utf8');
  if (/<meta name="robots" content="[^"]*noindex/i.test(html)) continue;
  const main = html.match(/<main\b[^>]*>(.*)<\/main>/is)?.[1];
  if (!main) continue;
  const dir = relative(OUT, file).split(sep).slice(0, -1).join('/');
  const path = dir ? `/${dir}/` : '/';
  const pageUrl = `${SITE}${path}`;
  const mdFile = file.replace(/index\.html$/, 'index.md');
  // The homepage's Markdown is hand-written in site/public/index.md.
  if (!(path === '/' && (await exists(mdFile)))) {
    await writeFile(mdFile, `${toMarkdown(main, pageUrl)}\n\n---\n\nCanonical page: ${pageUrl}\n`);
    written++;
  }
  const link = `<link rel="alternate" type="text/markdown" href="${path}index.md" />`;
  if (!html.includes(link))
    await writeFile(file, html.replace('</head>', `\n    ${link}\n  </head>`));
}
console.log(`site-markdown: wrote ${written} Markdown pages`);
