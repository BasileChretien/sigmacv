import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuidesIndex from "@/components/GuidesIndex";
import { DEFAULT_UI_LOCALE, NON_DEFAULT_LOCALE_SLUGS, localeForSlug } from "@/lib/i18n";
import { guidesChrome } from "@/lib/i18n/guidesChrome";
import { guidesIndexLanguageAlternates, localeGuidesIndexPath } from "@/lib/seo";

/** Localized /guides index (/fr/guides, …) — one crawlable URL per language. */
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
    title: chrome.guidesIndexTitle,
    description: chrome.guidesIndexDescription,
    alternates: {
      canonical: localeGuidesIndexPath(loc),
      languages: guidesIndexLanguageAlternates(),
    },
  };
}

export default async function LocaleGuidesPage({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  return <GuidesIndex locale={loc} />;
}
