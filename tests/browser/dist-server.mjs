// Shared headless-Chrome plumbing for driving the built `dist/`: an HTTP
// server over its files, and the puppeteer-core loader that finds it beside
// the MCP server's own install instead of adding a devDependency. Used by
// every smoke test that needs a real page load (`dist/` is not servable
// as-is: extension pages assume http(s)/chrome-extension origins, not
// file://), and by `scripts/shots/render.mjs`, which drives the same real
// pages to render the marketing shots and Chrome Web Store screenshots.
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join } from 'node:path';
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
