import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GlossaryIndex from "@/components/GlossaryIndex";
import { DEFAULT_UI_LOCALE, NON_DEFAULT_LOCALE_SLUGS, localeForSlug } from "@/lib/i18n";
import { guidesChrome } from "@/lib/i18n/guidesChrome";
import { glossaryIndexLanguageAlternates, localeGlossaryIndexPath } from "@/lib/seo";

/** Localized /glossary index (/fr/glossary, …) — one crawlable URL per language. */
export const dynamicParams = false;

export function generateStaticParams(): { locale: string }[] {
  return NON_DEFAULT_LOCALE_SLUGS.map((locale) => ({ locale }));
}

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc) return {};
  const chrome = guidesChrome(loc);
  return {
    title: chrome.glossaryIndexTitle,
    description: chrome.glossaryIndexDescription,
    alternates: {
      canonical: localeGlossaryIndexPath(loc),
      languages: glossaryIndexLanguageAlternates(),
    },
  };
}

export default async function LocaleGlossaryPage({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  return <GlossaryIndex locale={loc} />;
}
