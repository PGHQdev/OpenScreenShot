import { writeFileSync } from 'node:fs';
import { capture, CaptureOptions } from './capture.js';

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}

export async function runCli(argv: string[]): Promise<number> {
  const [cmd, url] = argv;
  if (cmd !== 'shot' || !url) {
    process.stderr.write(
      'usage: openscreenshot shot <url> [--out file|-] [--full] [--width n] [--height n]\n',
    );
    return 2;
  }
  const parsed = CaptureOptions.safeParse({
    url,
    fullPage: argv.includes('--full'),
    width: flag(argv, 'width') ? Number(flag(argv, 'width')) : undefined,
    height: flag(argv, 'height') ? Number(flag(argv, 'height')) : undefined,
  });
  if (!parsed.success) {
    process.stderr.write(
      'invalid arguments: ' + parsed.error.issues.map((i) => i.message).join('; ') + '\n',
    );
    return 2;
  }
  try {
    const png = await capture(parsed.data);
    const out = flag(argv, 'out') ?? 'screenshot.png';
    if (out === '-') process.stdout.write(png);
    else writeFileSync(out, png);
    return 0;
  } catch (err) {
    process.stderr.write('capture failed: ' + String(err) + '\n');
    return 1;
  }
}
