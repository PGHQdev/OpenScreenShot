import { getCollection, type CollectionEntry } from 'astro:content';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '../i18n';

export const GUIDE_SECTIONS = ['alternatives', 'full-page-screenshot', 'use-cases'] as const;
export type GuideSection = (typeof GUIDE_SECTIONS)[number];

type Guide = CollectionEntry<'guides'>;

/** `<section>/<locale>/<slug>` → its parts. */
export function guideParts(entry: Guide) {
  const [section, locale, slug] = entry.id.split('/') as [GuideSection, Locale, string];
  return { section, locale, slug };
}

export async function sectionGuides(section: GuideSection): Promise<Guide[]> {
  return (await getCollection('guides')).filter((g) => guideParts(g).section === section);
}

/** getStaticPaths for /<section>/<slug>/ in every locale that has the page. */
export async function guidePaths(section: GuideSection) {
  const guides = await sectionGuides(section);
  return guides.map((guide) => {
    const { locale, slug } = guideParts(guide);
    const availableLocales = LOCALES.filter((l) =>
      guides.some((g) => guideParts(g).locale === l && guideParts(g).slug === slug),
    );
    return {
      params: { lang: locale === DEFAULT_LOCALE ? undefined : locale, slug },
      props: { guide, availableLocales },
    };
  });
}

/** getStaticPaths for the /<section>/ hub in every locale with at least one page. */
export async function hubPaths(section: GuideSection) {
  const guides = await sectionGuides(section);
  return LOCALES.filter((l) => guides.some((g) => guideParts(g).locale === l)).map((locale) => ({
    params: { lang: locale === DEFAULT_LOCALE ? undefined : locale },
  }));
}
