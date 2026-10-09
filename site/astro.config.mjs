import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  outDir: '../site-dist',
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
    inlineStylesheets: 'always',
  },
  integrations: [
    sitemap({
      // /welcome/ is the tab the browser opens once, at install. It carries a
      // noindex meta for the same reason: it is a moment in a session, not a
      // page anyone should arrive at from search.
      filter: (page) => !/\/welcome\/$/.test(page),
      // lastmod comes from scripts/site-lastmod.mjs after the build, which
      // compares each page with the previous deploy.
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
    }),
  ],
});
