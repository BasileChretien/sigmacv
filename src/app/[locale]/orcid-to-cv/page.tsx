import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingPage from "@/components/LandingPage";
import { DEFAULT_UI_LOCALE, NON_DEFAULT_LOCALE_SLUGS, localeForSlug } from "@/lib/i18n";
import { landingPageStrings } from "@/lib/i18n/landingPages";
import { landingPageLanguageAlternates, localeLandingPagePath } from "@/lib/seo";

const PAGE = "orcid-to-cv" as const;

/** Localized "ORCID to CV" landing page (/fr/orcid-to-cv, …) — a crawlable URL
 *  per language with reciprocal hreflang. The default (en-US) lives at the bare
 *  "/orcid-to-cv". */
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
    // The root layout's title template appends " — SigmaCV".
    title: s.metaTitle,
    description: s.metaDescription,
    alternates: {
      canonical: localeLandingPagePath(PAGE, loc),
      languages: landingPageLanguageAlternates(PAGE),
    },
  };
}

export default async function LocaleOrcidToCvPage({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  return <LandingPage page={PAGE} locale={loc} />;
}
