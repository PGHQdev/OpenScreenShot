import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    // `.wrangler/` is wrangler's own scratch: dev bundles and generated
    // middleware facades, already gitignored. Linting a build artefact of our
    // own worker reports the bundler's style, not ours.
    ignores: [
      'dist/**',
      'node_modules/**',
      'public/**',
      'coverage/**',
      'site/.astro/**',
      '.wrangler/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        chrome: 'readonly',
        HTMLRewriter: 'readonly', // Cloudflare Workers runtime global, used by site-worker.js
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  prettier,
);
