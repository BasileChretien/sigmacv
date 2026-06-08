import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Contact from "@/components/Contact";
import { DEFAULT_UI_LOCALE, NON_DEFAULT_LOCALE_SLUGS, localeForSlug } from "@/lib/i18n";
import { contactStrings } from "@/lib/i18n/contact";
import { contactLanguageAlternates, localeContactPath } from "@/lib/seo";

/** Localized contact page (/fr/contact, /ja/contact, …) — a crawlable URL per
 *  language with reciprocal hreflang. The default (en-US) lives at "/contact". */
export const dynamicParams = false;

export function generateStaticParams(): { locale: string }[] {
  return NON_DEFAULT_LOCALE_SLUGS.map((locale) => ({ locale }));
}

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc) return {};
  const s = contactStrings(loc);
  return {
    title: s.metaTitle,
    description: s.metaDescription,
    alternates: {
      canonical: localeContactPath(loc),
      languages: contactLanguageAlternates(),
    },
  };
}

export default async function LocaleContactPage({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  return <Contact locale={loc} />;
}
