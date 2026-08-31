import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const siteRoot = fileURLToPath(new URL('.', import.meta.url));

// Every page renders through shared layouts and global styles (Base.astro,
// Doc.astro, tokens.css, base.css, Frame.astro, FaqList.astro,
// PermissionTable.astro, faq.ts, permissions.ts, ...), so a change to almost
// any file under site/ can change almost any page's rendered output. A
// per-page "last touched" map can't stay correct against that: this file's
// first version tried one, and it went stale within its own introducing
// commit, when a Doc.astro change didn't move the lastmod of the four pages
// whose HTML it actually changed. One honest, site-wide date beats several
// page-specific ones that quietly go wrong.
//
// Computed once at config-eval time, not per sitemap entry: git only needs
// asking once, and it makes the "unavailable" case a single fallback rather
// than one per URL.
const SITE_LASTMOD = (() => {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', '.'], {
      cwd: siteRoot,
      encoding: 'utf8',
    }).trim();
    return out || undefined;
  } catch {
    // No git, no history, or the call failed for some other reason. Omit
    // lastmod rather than emit a fabricated "now" — an absent lastmod is
    // valid; an invented one is worse than no signal at all.
    return undefined;
  }
})();

export default defineConfig({
  outDir: '../docs',
  site: 'https://openscreenshot.app',
  // Locale path segments, lowercase. English serves unprefixed at the root;
  // the rest under /de/, /pt-br/, /zh-cn/, ... Pages generate their own
  // localized routes through src/i18n's localePaths(); this block keeps
  // Astro.currentLocale and the sitemap's hreflang in agreement with them.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de', 'es', 'fr', 'it', 'ja', 'ko', 'pt-br', 'ru', 'zh-cn', 'zh-tw'],
    routing: { prefixDefaultLocale: false },
  },
  // Astro's HTML compressor drops the newline between a text node and an inline
  // element, which silently swallows a real space ("the full page,<kbd>Alt+…").
  // Content fidelity on these pages is worth the few hundred gzipped bytes.
  compressHTML: false,
  build: {
    inlineStylesheets: 'auto',
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          de: 'de',
          es: 'es',
          fr: 'fr',
          it: 'it',
          ja: 'ja',
          ko: 'ko',
          'pt-br': 'pt-BR',
          ru: 'ru',
          'zh-cn': 'zh-CN',
          'zh-tw': 'zh-TW',
        },
      },
      serialize(item) {
        return SITE_LASTMOD ? { ...item, lastmod: SITE_LASTMOD } : item;
      },
    }),
  ],
});
