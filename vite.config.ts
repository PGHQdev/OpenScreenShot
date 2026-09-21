import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json' with { type: 'json' };
import pkg from './package.json' with { type: 'json' };

// package.json is the single source of truth for the version; the extension
// (what the Chrome Web Store reads) inherits it at build time. CI sets
// package.json from the release tag, so tag -> zip name -> manifest all match.
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const firefox = mode === 'firefox';
  const outDir = firefox ? 'dist-firefox' : 'dist';
  const browserManifest = { ...manifest, version: pkg.version };
  if (firefox) {
    // CRXJS emits Firefox's module background page from this entry.
    Object.assign(browserManifest, {
      background: { scripts: ['src/background/index.ts'], type: 'module' },
      browser_specific_settings: {
        gecko: {
          id: 'openscreenshot@pghq.dev',
          strict_min_version: '140.0',
          data_collection_permissions: { required: ['none'] },
        },
      },
      permissions: manifest.permissions.filter((p) => p !== 'offscreen'),
      optional_permissions: [],
      optional_host_permissions: [],
      web_accessible_resources: [],
      commands: Object.fromEntries(
        Object.entries(manifest.commands).filter(([key]) => !key.includes('recording')),
      ),
    });
    Reflect.deleteProperty(browserManifest, 'minimum_chrome_version');
  }
  return {
    plugins: [
      preact(),
      crx({ manifest: browserManifest, browser: firefox ? 'firefox' : 'chrome' }),
      {
        // src/shared/theme-init.js sets data-theme before first paint and has to
        // stay a plain classic script outside the module graph (see its own
        // module doc), so Vite's HTML transform can't bundle it — every
        // surface's index.html references it directly as /shared/theme-init.js.
        // Copy it to that path by hand.
        name: 'copy-theme-init',
        writeBundle() {
          mkdirSync(`${outDir}/shared`, { recursive: true });
          copyFileSync('src/shared/theme-init.js', `${outDir}/shared/theme-init.js`);
        },
      },
    ],
    resolve: {
      alias: {
        '@/background/recording': fileURLToPath(
          new URL(
            firefox ? './src/background/recording-disabled.ts' : './src/background/recording.ts',
            import.meta.url,
          ),
        ),
        '@': '/src',
      },
    },
    build: {
      outDir,
      emptyOutDir: true,
      target: 'es2022',
      // chrome-extension:// pages discard crossorigin modulepreloads ("cross-world
      // extension resource mismatch" warning), so emitting them is pure noise.
      modulePreload: false,
      rollupOptions: {
        // crxjs only builds pages reachable from the manifest; the offscreen and
        // recorder pages are opened via chrome.runtime.getURL, so list them here.
        // The popup joined them when the manifest dropped `action.default_popup`
        // — the worker binds it at runtime (see syncExpressMode), so the manifest
        // no longer names it. The editor also needs an explicit entry now that
        // options_ui points to the dedicated settings page.
        input: {
          progress: 'src/progress/index.html',
          popup: 'src/popup/index.html',
          editor: 'src/editor/index.html',
          ...(!firefox
            ? {
                offscreen: 'src/offscreen/index.html',
                recorder: 'src/recorder/index.html',
                webcamFrame: 'src/recorder/webcam-frame.html',
                setup: 'src/setup/index.html',
              }
            : {}),
        },
      },
    },
    test: {
      environment: 'node',
      globals: true,
      include: ['tests/**/*.test.ts'],
      setupFiles: ['tests/unit/i18n-stub-setup.ts'],
    },
  };
});
