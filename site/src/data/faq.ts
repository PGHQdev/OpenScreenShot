/**
 * Every question the site answers, in one list per locale.
 *
 * The text lives in `src/i18n/<locale>/faq.json` (en is the source of truth);
 * this module is the typed accessor. The homepage renders the items flagged
 * `home`; the Support page renders all of them. Each page derives its FAQPage
 * JSON-LD from the same list it renders, so the rendered count and the
 * structured-data count cannot drift apart.
 *
 * `a` is a fragment of HTML. It is rendered with `set:html` and passed verbatim
 * into the JSON-LD answer text, which schema.org permits. Write links
 * site-relative and locale-less in the JSON; `t()` prefixes them per locale.
 */
import { t, DEFAULT_LOCALE, type Locale } from '../i18n';

export type FaqItem = {
  q: string;
  a: string;
  /** Marks one of the eight the homepage shows. */
  home?: boolean;
};

export const getFaq = (locale: Locale = DEFAULT_LOCALE): FaqItem[] =>
  t(locale, 'faq').items as FaqItem[];

/** The eight the homepage renders, and the source of its FAQPage JSON-LD. */
export const getHomeFaq = (locale: Locale = DEFAULT_LOCALE): FaqItem[] =>
  getFaq(locale).filter((item) => item.home);

/** English lists, for pages not yet localized. */
export const faq: FaqItem[] = getFaq();
export const homeFaq: FaqItem[] = getHomeFaq();
