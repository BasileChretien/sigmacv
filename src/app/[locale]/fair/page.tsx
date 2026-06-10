import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FairCv from "@/components/FairCv";
import { DEFAULT_UI_LOCALE, NON_DEFAULT_LOCALE_SLUGS, localeForSlug } from "@/lib/i18n";
import { fairCvStrings } from "@/lib/i18n/fairCv";
import { fairLanguageAlternates, localeFairPath } from "@/lib/seo";

/** Localized "FAIR for your CV" page (/fr/fair, /ja/fair, …) — a crawlable URL
 *  per language with reciprocal hreflang. The default (en-US) lives at "/fair". */
export const dynamicParams = false;

export function generateStaticParams(): { locale: string }[] {
  return NON_DEFAULT_LOCALE_SLUGS.map((locale) => ({ locale }));
}

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc) return {};
  const s = fairCvStrings(loc);
  return {
    // The root layout's title template appends " — SigmaCV".
    title: s.metaTitle,
    description: s.metaDescription,
    alternates: {
      canonical: localeFairPath(loc),
      languages: fairLanguageAlternates(),
    },
  };
}

export default async function LocaleFairPage({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  return <FairCv locale={loc} />;
}
