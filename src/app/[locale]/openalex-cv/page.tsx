import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingPage from "@/components/LandingPage";
import {
  DEFAULT_UI_LOCALE,
  NON_DEFAULT_LOCALE_SLUGS,
  localeForSlug,
} from "@/lib/i18n";
import { landingPageStrings } from "@/lib/i18n/landingPages";
import {
  landingPageLanguageAlternates,
  localeLandingPagePath,
} from "@/lib/seo";

const PAGE = "openalex-cv" as const;

/** Localized "OpenAlex CV" landing page — a crawlable URL per language with
 *  reciprocal hreflang. The default (en-US) lives at the bare path. */
export const dynamicParams = false;

export function generateStaticParams(): { locale: string }[] {
  return NON_DEFAULT_LOCALE_SLUGS.map((locale) => ({ locale }));
}

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc) return {};
  const s = landingPageStrings(PAGE, loc);
  return {
    title: s.metaTitle,
    description: s.metaDescription,
    alternates: {
      canonical: localeLandingPagePath(PAGE, loc),
      languages: landingPageLanguageAlternates(PAGE),
    },
  };
}

export default async function LocaleOpenAlexCvPage({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  return <LandingPage page={PAGE} locale={loc} />;
}
