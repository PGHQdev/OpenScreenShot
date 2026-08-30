// Vitest setupFile: stubs `chrome.i18n.getMessage` for every unit test, reading
// real strings from public/_locales/en/messages.json instead of echoing the
// key back — the same resolution the browser smokes use (see
// tests/browser/*-smoke.mjs's own installChromeStub). Several editor modules
// (keyboard.ts's announce(), palette.ts's colorName(), pin.ts's
// pinFailureReason(), frame.ts's FRAME_LOOKS/BACKGROUND_PRESETS at module
// scope) now call chrome.i18n.getMessage, so a unit test asserting their
// English output needs this in place before those modules are even imported
// — a setupFile runs before a test file's own module graph, module-scope
// calls included.
//
// Global, not per-file: it only adds `chrome.i18n`, so tests that stub their
// own `globalThis.chrome` for storage/runtime (capture-history.test.ts,
// context-menus-race.test.ts) simply replace it within their own file,
// unaffected by this.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

interface MessageEntry {
  message: string;
  placeholders?: Record<string, { content: string }>;
}

const MESSAGES_PATH = fileURLToPath(
  new URL('../../public/_locales/en/messages.json', import.meta.url),
);
const messages: Record<string, MessageEntry> = JSON.parse(readFileSync(MESSAGES_PATH, 'utf8'));

function getMessage(key: string, subs?: string | string[]): string {
  const entry = messages[key];
  if (!entry) return key;
  const list = Array.isArray(subs) ? subs : subs == null ? [] : [subs];
  let text = entry.message;
  for (const [name, placeholder] of Object.entries(entry.placeholders ?? {})) {
    const index = Number(String(placeholder.content).replace('$', '')) - 1;
    text = text.replace(new RegExp(`\\$${name}\\$`, 'gi'), list[index] ?? '');
  }
  return text;
}

const existing = (globalThis as { chrome?: Record<string, unknown> }).chrome ?? {};
(globalThis as { chrome?: unknown }).chrome = { ...existing, i18n: { getMessage } };
