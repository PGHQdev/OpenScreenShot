import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

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
  integrations: [sitemap()],
});
