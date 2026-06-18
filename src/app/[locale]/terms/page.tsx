import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Terms from "@/components/Terms";
import { DEFAULT_UI_LOCALE, NON_DEFAULT_LOCALE_SLUGS, localeForSlug } from "@/lib/i18n";
import { termsStrings } from "@/lib/i18n/terms";
import { localeTermsPath, termsLanguageAlternates } from "@/lib/seo";

/** Localized terms of use (/fr/terms, /ja/terms, …) — a crawlable URL per
 *  language with reciprocal hreflang. The default (en-US) lives at "/terms". */
export const dynamicParams = false;

export function generateStaticParams(): { locale: string }[] {
  return NON_DEFAULT_LOCALE_SLUGS.map((locale) => ({ locale }));
}

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc) return {};
  const s = termsStrings(loc);
  return {
    title: s.metaTitle,
    description: s.metaDescription,
    alternates: {
      canonical: localeTermsPath(loc),
      languages: termsLanguageAlternates(),
    },
  };
}

export default async function LocaleTermsPage({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  return <Terms locale={loc} />;
}
