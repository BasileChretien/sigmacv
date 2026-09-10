import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InstitutionCompare from "@/components/InstitutionCompare";
import { InstitutionRateLimited } from "@/components/InstitutionPage";
import { compareKey, compareMetadata, loadInstitutionComparison } from "@/app/i/institutionLoad";
import { DEFAULT_UI_LOCALE, localeForSlug } from "@/lib/i18n";

/** Localized comparison view (/fr/i/compare, …). The default (en-US) lives at
 *  "/i/compare". Never indexed, never in the sitemap. */
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ror?: string | string[] }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) return { robots: { index: false, follow: false } };
  const { ror } = await searchParams;
  return compareMetadata(loc, await loadInstitutionComparison(compareKey(ror)));
}

export default async function LocaleInstitutionCompareRoute({ params, searchParams }: Props) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  const { ror } = await searchParams;
  const lookup = await loadInstitutionComparison(compareKey(ror));
  if (lookup.kind === "rate-limited") return <InstitutionRateLimited locale={loc} />;
  return <InstitutionCompare locale={loc} comparison={lookup.comparison} picker={lookup.picker} />;
}
