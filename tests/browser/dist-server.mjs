// Shared headless-Chrome plumbing for driving the built `dist/`: the guard
// that refuses to run against a stale build, an HTTP server over its files,
// and the puppeteer-core loader that finds it beside the MCP server's own
// install instead of adding a devDependency. Used by every smoke test that
// needs a real page load (`dist/` is not servable as-is: extension pages
// assume http(s)/chrome-extension origins, not file://), and by
// `scripts/shots/render.mjs`, which drives the same real pages to render the
// marketing shots and Chrome Web Store screenshots.
import { createReadStream } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

export const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
};

/** Serves `distDir` over HTTP on a free port. Resolves once it is listening. */
export function serveDist(distDir) {
  const server = createServer((req, res) => {
    const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const file = join(distDir, path);
    if (!file.startsWith(distDir)) {
      res.writeHead(403).end();
      return;
    }
    stat(file)
      .then((info) => {
        if (!info.isFile()) throw new Error('not a file');
        res.writeHead(200, {
          'content-type': MIME[extname(file)] ?? 'application/octet-stream',
          'content-length': info.size,
        });
        createReadStream(file).pipe(res);
      })
      .catch(() => res.writeHead(404).end('not found'));
  });
  return new Promise((done) => {
    server.listen(0, '127.0.0.1', () => done(server));
  });
}

/**
 * `puppeteer-core` is not a devDependency of this package — the MCP server
 * already vendors it, so this walks up from `root` looking for that install
 * instead of adding a second copy. Falls back to a normal resolution in case
 * it is ever installed elsewhere.
 */
export async function loadPuppeteer(root) {
  let dir = root;
  for (;;) {
    const pkg = join(dir, 'mcp', 'node_modules', 'puppeteer-core', 'package.json');
    try {
      const manifest = JSON.parse(await readFile(pkg, 'utf8'));
      const entry = join(dirname(pkg), manifest.exports['.'].import);
      return (await import(pathToFileURL(entry).href)).default;
    } catch {
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  const require = createRequire(import.meta.url);
  return (await import(pathToFileURL(require.resolve('puppeteer-core')).href)).default;
}

/* -------------------------------------------------------------------------
 * dist/ freshness. Every caller here drives the *built* `dist/`, so a build
 * that was never re-run after a source edit makes the whole run measure the
 * previous version — silently, and it reads as a pass. Pure decision in
 * `checkDistFreshness`, unit-tested in tests/unit/shots-dist-freshness.test.ts;
 * the file-system walk that feeds it is `assertDistFresh`.
 * ---------------------------------------------------------------------- */

/**
 * Decides whether `dist/` is fit to drive, given nothing but file lists and
 * mtimes — no I/O, so a test can hand it fixtures directly. `sourceFiles` is
 * every file under src/, public/ and manifest.json; `distOldestMtimeMs` is the
 * *oldest* mtime anywhere under dist/ (Infinity if dist/ has no files at all).
 * The oldest, not the newest: a build writes every file in dist/ (vite empties
 * it first), so a source file newer than the oldest output is newer than the
 * build. A build that wrote some outputs and then failed leaves the untouched
 * rest carrying the previous build's mtime, and it is that older mtime the
 * source has to be compared against — against the newest output such a
 * half-written dist/ would read as fresh. Missing takes priority over stale:
 * an absent manifest means there is nothing to compare mtimes against in the
 * first place.
 */
export function checkDistFreshness({ manifestExists, sourceFiles, distOldestMtimeMs }) {
  if (!manifestExists) return { fresh: false, reason: 'missing' };
  let newest = null;
  for (const file of sourceFiles) {
    if (file.mtimeMs > distOldestMtimeMs && (!newest || file.mtimeMs > newest.mtimeMs)) {
      newest = file;
    }
  }
  if (newest) return { fresh: false, reason: 'stale', file: newest.path, mtimeMs: newest.mtimeMs };
  return { fresh: true };
}

/** Every file under `dir`, recursively, as absolute paths. */
async function listFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(full)));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

/**
 * Reads `checkDistFreshness`'s inputs off disk and throws on a missing or
 * stale `dist/`, naming the file that is newer than the build. Returns the
 * number of source files it compared, so a caller can log what it checked
 * rather than an unconditional line.
 */
export async function assertDistFresh(root) {
  const dist = join(root, 'dist');
  const manifestExists = await stat(join(dist, 'manifest.json')).then(
    () => true,
    () => false,
  );
  let distOldestMtimeMs = Infinity;
  for (const file of await listFiles(dist)) {
    const info = await stat(file);
    if (info.mtimeMs < distOldestMtimeMs) distOldestMtimeMs = info.mtimeMs;
  }

  const sourcePaths = [
    ...(await listFiles(join(root, 'src'))),
    ...(await listFiles(join(root, 'public'))),
    join(root, 'manifest.json'),
  ];
  const sourceFiles = [];
  for (const path of sourcePaths) {
    const info = await stat(path).catch(() => null);
    if (info) sourceFiles.push({ path, mtimeMs: info.mtimeMs });
  }

  const result = checkDistFreshness({ manifestExists, sourceFiles, distOldestMtimeMs });
  if (result.reason === 'missing') {
    throw new Error(`${dist}/manifest.json is missing — run "npm run build" first`);
  }
  if (result.reason === 'stale') {
    throw new Error(
      `${relative(root, result.file)} is newer than dist/ — run "npm run build" first`,
    );
  }
  return { sourceCount: sourceFiles.length };
}
