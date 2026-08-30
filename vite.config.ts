import { copyFileSync, mkdirSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import pkg from './package.json';

// package.json is the single source of truth for the version; the extension
// (what the Chrome Web Store reads) inherits it at build time. CI sets
// package.json from the release tag, so tag -> zip name -> manifest all match.
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    crx({ manifest: { ...manifest, version: pkg.version } }),
    {
      // src/shared/theme-init.js sets data-theme before first paint and has to
      // stay a plain classic script outside the module graph (see its own
      // module doc), so Vite's HTML transform can't bundle it — every
      // surface's index.html references it directly as /shared/theme-init.js.
      // Copy it to that path by hand.
      name: 'copy-theme-init',
      writeBundle() {
        mkdirSync('dist/shared', { recursive: true });
        copyFileSync('src/shared/theme-init.js', 'dist/shared/theme-init.js');
      },
    },
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    // chrome-extension:// pages discard crossorigin modulepreloads ("cross-world
    // extension resource mismatch" warning), so emitting them is pure noise.
    modulePreload: false,
    rollupOptions: {
      // crxjs only builds pages reachable from the manifest; the offscreen and
      // recorder pages are opened via chrome.runtime.getURL, so list them here.
      input: {
        offscreen: 'src/offscreen/index.html',
        recorder: 'src/recorder/index.html',
        webcamFrame: 'src/recorder/webcam-frame.html',
        setup: 'src/setup/index.html',
      },
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/unit/i18n-stub-setup.ts'],
  },
});
