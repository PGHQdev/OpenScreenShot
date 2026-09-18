import { defineConfig } from 'vitest/config';
import { readFile } from 'node:fs/promises';
export default defineConfig({
  plugins: [
    {
      name: 'worker-text-assets',
      enforce: 'pre',
      async load(id) {
        if (id.endsWith('.woff2'))
          return `export default new Uint8Array(${JSON.stringify([...(await readFile(id))])}).buffer`;
        if (/\.(html|css|svg|js\.txt)$/.test(id))
          return `export default ${JSON.stringify(await readFile(id, 'utf8'))}`;
      },
    },
  ],
});
