import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  outDir: '../docs',
  site: 'https://openscreenshot.app',
  build: {
    inlineStylesheets: 'auto',
  },
  integrations: [sitemap()],
});
