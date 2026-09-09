import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ObjectionPage from "@/components/ObjectionPage";
import { DEFAULT_UI_LOCALE, NON_DEFAULT_LOCALE_SLUGS, localeForSlug } from "@/lib/i18n";
import { objectionStrings } from "@/lib/i18n/objection";
import { localeObjectPath, objectLanguageAlternates } from "@/lib/seo";

/** Localized objection page (/fr/object, /ja/object, …); en-US lives at /object. */
export const dynamicParams = false;

export function generateStaticParams(): { locale: string }[] {
  return NON_DEFAULT_LOCALE_SLUGS.map((locale) => ({ locale }));
}

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc) return {};
  const s = objectionStrings(loc);
  return {
    title: s.metaTitle,
    description: s.heading,
    alternates: { canonical: localeObjectPath(loc), languages: objectLanguageAlternates() },
  };
}

export default async function LocaleObjectPage({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  return <ObjectionPage locale={loc} />;
}
