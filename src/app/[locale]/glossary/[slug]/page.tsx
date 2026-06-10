import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GlossaryTermPage from "@/components/GlossaryTermPage";
import { GLOSSARY_SLUGS, getTerm } from "@/lib/glossary/glossary";
import { DEFAULT_UI_LOCALE, NON_DEFAULT_LOCALE_SLUGS, localeForSlug } from "@/lib/i18n";
import { glossaryTermLanguageAlternates, localeGlossaryTermPath } from "@/lib/seo";

/** Localized glossary terms (/fr/glossary/{slug}, …), static per locale × slug. */
export const dynamicParams = false;

export function generateStaticParams(): { locale: string; slug: string }[] {
  return NON_DEFAULT_LOCALE_SLUGS.flatMap((locale) =>
    GLOSSARY_SLUGS.map((slug) => ({ locale, slug })),
  );
}

type Params = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: localeSlug, slug } = await params;
  const loc = localeForSlug(localeSlug);
  if (!loc) return {};
  const term = getTerm(slug, loc);
  if (!term) return {};
  return {
    title: term.title,
    description: term.description,
    alternates: {
      canonical: localeGlossaryTermPath(slug, loc),
      languages: glossaryTermLanguageAlternates(slug),
    },
  };
}

export default async function LocaleGlossaryRoute({ params }: Params) {
  const { locale: localeSlug, slug } = await params;
  const loc = localeForSlug(localeSlug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  const term = getTerm(slug, loc);
  if (!term) notFound();
  return <GlossaryTermPage term={term} locale={loc} />;
}
