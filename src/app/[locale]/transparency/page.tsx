import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Transparency from "@/components/Transparency";
import { DEFAULT_UI_LOCALE, NON_DEFAULT_LOCALE_SLUGS, localeForSlug } from "@/lib/i18n";
import { transparencyStrings } from "@/lib/i18n/transparency";
import { localeTransparencyPath, transparencyLanguageAlternates } from "@/lib/seo";

/** Localized Transparency page (/fr/transparency, /ja/transparency, …) — a
 *  crawlable URL per language with reciprocal hreflang. The default (en-US) lives
 *  at "/transparency". */
export const dynamicParams = false;

export function generateStaticParams(): { locale: string }[] {
  return NON_DEFAULT_LOCALE_SLUGS.map((locale) => ({ locale }));
}

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc) return {};
  const s = transparencyStrings(loc);
  return {
    // The root layout's title template appends " — SigmaCV".
    title: s.metaTitle,
    description: s.metaDescription,
    alternates: {
      canonical: localeTransparencyPath(loc),
      languages: transparencyLanguageAlternates(),
    },
  };
}

export default async function LocaleTransparencyPage({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  return <Transparency locale={loc} />;
}
