import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InstitutionPage, { InstitutionRateLimited } from "@/components/InstitutionPage";
import { institutionRobots, loadInstitution } from "@/app/i/institutionLoad";
import { DEFAULT_UI_LOCALE, localeForSlug } from "@/lib/i18n";
import { fillInstitutionString, institutionStrings } from "@/lib/i18n/institutions";
import { institutionLanguageAlternates, localeInstitutionPath } from "@/lib/seo";

/** Localized institution page (/fr/i/<ror>, …). The default (en-US) lives at
 *  "/i/<ror>". ROR ids cannot be enumerated at build time, so the segment is
 *  dynamic and the route is never statically generated. */
export const dynamic = "force-dynamic";
export const dynamicParams = true;

type Params = { params: Promise<{ locale: string; ror: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: slug, ror } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) return { robots: { index: false, follow: false } };
  const lookup = await loadInstitution(ror);
  const robots = institutionRobots(lookup);
  if (lookup.kind !== "ok") return { robots };
  const s = institutionStrings(loc);
  return {
    // The root layout's title template appends " — SigmaCV".
    title: lookup.summary.name,
    description: fillInstitutionString(s.metaDescription, { name: lookup.summary.name }),
    robots,
    alternates: {
      canonical: localeInstitutionPath(loc, ror),
      languages: institutionLanguageAlternates(ror),
    },
  };
}

export default async function LocaleInstitutionRoute({ params }: Params) {
  const { locale: slug, ror } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  const lookup = await loadInstitution(ror);
  if (lookup.kind === "rate-limited") return <InstitutionRateLimited locale={loc} />;
  if (lookup.kind === "missing") notFound();
  return <InstitutionPage locale={loc} summary={lookup.summary} />;
}
