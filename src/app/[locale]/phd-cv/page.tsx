import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingPage from "@/components/LandingPage";
import { DEFAULT_UI_LOCALE, NON_DEFAULT_LOCALE_SLUGS, localeForSlug } from "@/lib/i18n";
import { anyLandingPageStrings } from "@/lib/i18n/landingAll";
import { landingPageLanguageAlternates, localeLandingPagePath } from "@/lib/seo";

const PAGE = "phd-cv" as const;

/** Localized "PhD application CV" persona page (/fr/phd-cv, …). */
export const dynamicParams = false;

export function generateStaticParams(): { locale: string }[] {
  return NON_DEFAULT_LOCALE_SLUGS.map((locale) => ({ locale }));
}

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc) return {};
  const s = anyLandingPageStrings(PAGE, loc);
  return {
    title: s.metaTitle,
    description: s.metaDescription,
    alternates: {
      canonical: localeLandingPagePath(PAGE, loc),
      languages: landingPageLanguageAlternates(PAGE),
    },
  };
}

export default async function LocalePhdCvPage({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  return <LandingPage page={PAGE} locale={loc} />;
}
