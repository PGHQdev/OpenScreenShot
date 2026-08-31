/**
 * Site i18n. The convention every localized page follows:
 *
 * Dictionaries
 * - One directory per locale under `src/i18n/<locale>/`. Locale directory
 *   names are the URL path segments, lowercase: en, de, es, fr, it, ja, ko,
 *   pt-br, ru, zh-cn, zh-tw.
 * - One JSON file per page, named after the page's route segment
 *   (`home.json` for `/`, `privacy.json` for `/privacy/`, ...), plus
 *   `common.json` for the shared layout (nav, footer, breadcrumb, the
 *   permission-table headers), `faq.json` and `permissions.json` for the
 *   shared data lists.
 * - `src/i18n/en/` is the source of truth. A translation copies the en file's
 *   exact shape and key names and translates only the values. `t()` deep-merges
 *   the locale file over en, so a missing file or key falls back to English.
 *   Arrays replace wholesale: translate an array completely, keep its order,
 *   and keep non-string fields (`home: true`, permission `name`s) verbatim.
 * - Values may hold inline HTML (the FAQ answers do). Keep the tags, translate
 *   the text, use double quotes on attributes, and write internal links
 *   locale-less (`href="/privacy/"`): `t()` rewrites them to the locale's
 *   prefix. `{n}`-style placeholders must survive translation.
 * - Never translated: "OpenScreenShot", "OpenScreenShot @PGHQdev", "@PGHQdev",
 *   product names (OpenTechCheck, ...), license names (MIT), permission
 *   names, code, commands, and file names.
 *
 * Routing
 * - Every localized page lives at `src/pages/[...lang]/<segment>/index.astro`
 *   (the homepage at `src/pages/[...lang]/index.astro`) and exports
 *   `export const getStaticPaths = localePaths;`. That emits English at the
 *   bare path (`/privacy/`) and every other locale under its prefix
 *   (`/de/privacy/`, `/pt-br/privacy/`).
 * - In the page: `const locale = localeFromParams(Astro.params.lang);`, then
 *   `const d = t(locale, '<page>');` and read every user-facing string from
 *   `d`. Pass `locale` and the locale-less `path` to the layout (Base or Doc);
 *   the layout renders html lang, canonical, hreflang alternates, nav, footer,
 *   and the language switcher.
 * - Build internal links with `localizePath(locale, '/support/')`.
 */

export const LOCALES = [
  'en',
  'de',
  'es',
  'fr',
  'it',
  'ja',
  'ko',
  'pt-br',
  'ru',
  'zh-cn',
  'zh-tw',
] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** BCP 47 tag per URL segment, for html lang and hreflang. */
export const LANG_TAGS: Record<Locale, string> = {
  en: 'en',
  de: 'de',
  es: 'es',
  fr: 'fr',
  it: 'it',
  ja: 'ja',
  ko: 'ko',
  'pt-br': 'pt-BR',
  ru: 'ru',
  'zh-cn': 'zh-CN',
  'zh-tw': 'zh-TW',
};

/** Each locale's own name, for the language switcher. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  'pt-br': 'Português (Brasil)',
  ru: 'Русский',
  'zh-cn': '简体中文',
  'zh-tw': '繁體中文',
};

type Dict = Record<string, unknown>;

const files = import.meta.glob('./*/*.json', { eager: true, import: 'default' }) as Record<
  string,
  Dict
>;

const isRecord = (v: unknown): v is Dict =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Locale value wins; plain objects merge per key; arrays replace wholesale. */
function merge(en: Dict, loc: Dict): Dict {
  const out: Dict = { ...en, ...loc };
  for (const key of Object.keys(en)) {
    const a = en[key];
    const b = loc[key];
    if (isRecord(a) && isRecord(b)) out[key] = merge(a, b);
  }
  return out;
}

/** Rewrites locale-less internal links in every string value: href="/x/" → href="/de/x/". */
function localizeLinks<T>(value: T, locale: Locale): T {
  if (typeof value === 'string') {
    return value.replace(/href="\//g, `href="/${locale}/`) as T;
  }
  if (Array.isArray(value)) return value.map((v) => localizeLinks(v, locale)) as T;
  if (isRecord(value)) {
    const out: Dict = {};
    for (const [k, v] of Object.entries(value)) out[k] = localizeLinks(v, locale);
    return out as T;
  }
  return value;
}

/**
 * The dictionary for one page in one locale, deep-merged over en so every
 * missing translation falls back to English. Returned untyped on purpose:
 * pages read it with plain property access, and no page has to edit this file.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see above: untyped by design
export function t(locale: Locale, page: string): any {
  const en = files[`./en/${page}.json`];
  if (!en) throw new Error(`i18n: src/i18n/en/${page}.json does not exist`);
  if (locale === 'en') return en;
  const loc = files[`./${locale}/${page}.json`];
  return localizeLinks(loc ? merge(en, loc) : en, locale);
}

/** '/support/' → '/de/support/' (en stays unprefixed). */
export function localizePath(locale: Locale, path: string): string {
  return locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
}

/** The getStaticPaths every localized page exports: en at the bare path. */
export function localePaths() {
  return LOCALES.map((locale) => ({
    params: { lang: locale === DEFAULT_LOCALE ? undefined : locale },
  }));
}

/** `Astro.params.lang` → locale. The undefined rest segment is en. */
export function localeFromParams(lang: string | undefined): Locale {
  return (lang ?? DEFAULT_LOCALE) as Locale;
}
