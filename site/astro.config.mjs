import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const siteRoot = fileURLToPath(new URL('.', import.meta.url));

// Each URL's lastmod is its page file's own last commit date, not a single
// build-time stamp — a rebuild that touches an unrelated page must not move
// every other page's lastmod along with it.
const PAGE_FILES = {
  '/': 'src/pages/index.astro',
  '/docs/': 'src/pages/docs/index.astro',
  '/roadmap/': 'src/pages/roadmap/index.astro',
  '/support/': 'src/pages/support/index.astro',
  '/privacy/': 'src/pages/privacy/index.astro',
  '/cool-stuff/': 'src/pages/cool-stuff/index.astro',
};

function lastCommitIso(relFile) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', relFile], {
      cwd: siteRoot,
      encoding: 'utf8',
    }).trim();
    return out || undefined;
  } catch {
    return undefined;
  }
}

export default defineConfig({
  outDir: '../docs',
  site: 'https://openscreenshot.app',
  // Astro's HTML compressor drops the newline between a text node and an inline
  // element, which silently swallows a real space ("the full page,<kbd>Alt+…").
  // Content fidelity on these pages is worth the few hundred gzipped bytes.
  compressHTML: false,
  build: {
    inlineStylesheets: 'auto',
  },
  integrations: [
    sitemap({
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        const file = PAGE_FILES[pathname];
        const lastmod = file && lastCommitIso(file);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
});
