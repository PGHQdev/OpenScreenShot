import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const archive = `openscreenshot-firefox-source-v${version}.zip`;
// Include the working tree sources, including newly added files before commit.
// Restrict to build inputs so local browser profiles and credentials stay out.
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .filter((file) =>
    /^(src\/|public\/|scripts\/gen-design-tokens\.mjs$|scripts\/generate-icons\.mjs$|release\/firefox\/|\.prettierrc\.json$|package\.json$|pnpm-lock\.yaml$|pnpm-workspace\.yaml$|manifest\.json$|vite\.config\.ts$|tsconfig\.json$|README\.md$|LICENSE$)/.test(
      file,
    ),
  );
rmSync(archive, { force: true });
execFileSync('zip', ['-q', '-X', archive, '-@'], { input: files.join('\n') + '\n' });
console.log(archive);
