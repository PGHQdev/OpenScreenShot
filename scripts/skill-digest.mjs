import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const buf = readFileSync('site/public/skills/capture-screenshot.md');
process.stdout.write('sha256:' + createHash('sha256').update(buf).digest('hex') + '\n');
