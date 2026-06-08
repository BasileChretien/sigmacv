import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Privacy from "@/components/Privacy";
import { DEFAULT_UI_LOCALE, NON_DEFAULT_LOCALE_SLUGS, localeForSlug } from "@/lib/i18n";
import { privacyStrings } from "@/lib/i18n/privacy";
import { localePrivacyPath, privacyLanguageAlternates } from "@/lib/seo";

/** Localized privacy notice (/fr/privacy, /ja/privacy, …) — a crawlable URL per
 *  language with reciprocal hreflang. The default (en-US) lives at "/privacy". */
export const dynamicParams = false;

export function generateStaticParams(): { locale: string }[] {
  return NON_DEFAULT_LOCALE_SLUGS.map((locale) => ({ locale }));
}

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc) return {};
  const s = privacyStrings(loc);
  return {
    title: s.metaTitle,
    description: s.metaDescription,
    alternates: {
      canonical: localePrivacyPath(loc),
      languages: privacyLanguageAlternates(),
    },
  };
}

export default async function LocalePrivacyPage({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  return <Privacy locale={loc} />;
}
