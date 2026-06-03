import type { Metadata } from "next";
import { notFound } from "next/navigation";
import About from "@/components/About";
import {
  DEFAULT_UI_LOCALE,
  NON_DEFAULT_LOCALE_SLUGS,
  localeForSlug,
} from "@/lib/i18n";
import { aboutStrings } from "@/lib/i18n/about";
import { aboutLanguageAlternates, localeAboutPath } from "@/lib/seo";

/** Localized About page (/fr/about, /ja/about, …) — a crawlable URL per language
 *  with reciprocal hreflang. The default (en-US) lives at "/about". */
export const dynamicParams = false;

export function generateStaticParams(): { locale: string }[] {
  return NON_DEFAULT_LOCALE_SLUGS.map((locale) => ({ locale }));
}

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc) return {};
  const s = aboutStrings(loc);
  return {
    // The root layout's title template appends " — SigmaCV".
    title: s.metaTitle,
    description: s.metaDescription,
    alternates: {
      canonical: localeAboutPath(loc),
      languages: aboutLanguageAlternates(),
    },
  };
}

export default async function LocaleAboutPage({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  return <About locale={loc} />;
}
