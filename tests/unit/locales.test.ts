/**
 * Every shipped locale mirrors public/_locales/en/messages.json: the same
 * key set, the same placeholder names per key, no empty message, and the
 * manifest title/summary inside the Chrome Web Store limits. Chrome falls
 * back to `en` for a missing key, so a drifted catalog fails silently in
 * the product; this test makes it fail here instead.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'public/_locales');
const LOCALES = ['de', 'es', 'fr', 'it', 'pt_BR', 'ja', 'ko', 'zh_CN', 'zh_TW', 'ru'];
const TITLE_MAX = 75;
const SUMMARY_MAX = 132;

type Entry = {
  message: string;
  description?: string;
  placeholders?: Record<string, { content: string; example?: string }>;
};

function load(locale: string): Record<string, Entry> {
  return JSON.parse(readFileSync(join(ROOT, locale, 'messages.json'), 'utf8'));
}

function placeholderNames(entry: Entry): string[] {
  return Object.keys(entry.placeholders ?? {}).sort();
}

function placeholderRefs(message: string): string[] {
  return [...message.matchAll(/\$([A-Za-z0-9_]+)\$/g)].map((m) => m[1].toLowerCase()).sort();
}

const en = load('en');

describe('locale catalogs', () => {
  it('ships every planned locale and nothing unplanned', () => {
    const present = readdirSync(ROOT)
      .filter((d) => d !== 'en')
      .sort();
    expect(present).toEqual([...LOCALES].sort());
  });

  for (const locale of LOCALES) {
    describe(locale, () => {
      let cache: Record<string, Entry> | null = null;
      const catalog = () => (cache ??= load(locale));

      it('has exactly the en key set', () => {
        expect(Object.keys(catalog()).sort()).toEqual(Object.keys(en).sort());
      });

      it('has no empty message', () => {
        const empty = Object.entries(catalog())
          .filter(([, e]) => typeof e.message !== 'string' || e.message.trim() === '')
          .map(([k]) => k);
        expect(empty).toEqual([]);
      });

      it('declares the same placeholders as en, and references each one', () => {
        const bad: string[] = [];
        for (const [key, enEntry] of Object.entries(en)) {
          const entry = catalog()[key];
          if (!entry) continue;
          const want = placeholderNames(enEntry);
          const have = placeholderNames(entry);
          if (want.join() !== have.join()) bad.push(`${key}: declared ${have} vs en ${want}`);
          const refs = placeholderRefs(entry.message);
          if (refs.join() !== want.join())
            bad.push(`${key}: message references ${refs} vs ${want}`);
        }
        expect(bad).toEqual([]);
      });

      it('keeps the store title and summary inside the CWS limits', () => {
        expect(catalog().extName.message.length).toBeLessThanOrEqual(TITLE_MAX);
        expect(catalog().extDesc.message.length).toBeLessThanOrEqual(SUMMARY_MAX);
      });
    });
  }
});
