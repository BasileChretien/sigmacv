import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InstitutionIndex from "@/components/InstitutionIndex";
import { InstitutionRateLimited } from "@/components/InstitutionPage";
import { institutionRobots, loadInstitutionIndex } from "@/app/i/institutionLoad";
import { DEFAULT_UI_LOCALE, localeForSlug } from "@/lib/i18n";
import { institutionStrings } from "@/lib/i18n/institutions";
import { institutionsIndexLanguageAlternates, localeInstitutionsIndexPath } from "@/lib/seo";

/** Localized institution index (/fr/i, /ja/i, …) — a crawlable URL per language
 *  with reciprocal hreflang. The default (en-US) lives at "/i". Dynamic like
 *  it: the list changes with every opt-in. */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) return { robots: { index: false, follow: false } };
  const robots = institutionRobots(await loadInstitutionIndex());
  const s = institutionStrings(loc);
  return {
    // The root layout's title template appends " — SigmaCV".
    title: s.indexMetaTitle,
    description: s.indexMetaDescription,
    robots,
    alternates: {
      canonical: localeInstitutionsIndexPath(loc),
      languages: institutionsIndexLanguageAlternates(),
    },
  };
}

export default async function LocaleInstitutionsIndexPage({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  const lookup = await loadInstitutionIndex();
  if (lookup.kind === "rate-limited") return <InstitutionRateLimited locale={loc} />;
  return <InstitutionIndex locale={loc} institutions={lookup.institutions} />;
}
