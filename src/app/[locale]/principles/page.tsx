import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Principles from "@/components/Principles";
import { DEFAULT_UI_LOCALE, NON_DEFAULT_LOCALE_SLUGS, localeForSlug } from "@/lib/i18n";
import { principlesStrings } from "@/lib/i18n/principles";
import { localePrinciplesPath, principlesLanguageAlternates } from "@/lib/seo";

/** Localized Standards-&-principles page (/fr/principles, /ja/principles, …) — a
 *  crawlable URL per language with reciprocal hreflang. The default (en-US) lives
 *  at "/principles". */
export const dynamicParams = false;

export function generateStaticParams(): { locale: string }[] {
  return NON_DEFAULT_LOCALE_SLUGS.map((locale) => ({ locale }));
}

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc) return {};
  const s = principlesStrings(loc);
  return {
    // The root layout's title template appends " — SigmaCV".
    title: s.metaTitle,
    description: s.metaDescription,
    alternates: {
      canonical: localePrinciplesPath(loc),
      languages: principlesLanguageAlternates(),
    },
  };
}

export default async function LocalePrinciplesPage({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  return <Principles locale={loc} />;
}
