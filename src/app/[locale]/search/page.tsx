import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SearchPage from "@/components/SearchPage";
import { loadSearch, queryParam, searchRobots } from "@/app/search/searchLoad";
import { DEFAULT_UI_LOCALE, localeForSlug } from "@/lib/i18n";
import { searchStrings } from "@/lib/i18n/search";
import { localeSearchPath, searchLanguageAlternates } from "@/lib/seo";

/** Localized lookup (/fr/search, /ja/search, …); en-US lives at /search. */
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc) return {};
  const s = searchStrings(loc);
  const lookup = await loadSearch(queryParam(await searchParams));
  return {
    title: s.metaTitle,
    description: s.promise,
    robots: searchRobots(lookup),
    alternates: { canonical: localeSearchPath(loc), languages: searchLanguageAlternates() },
  };
}

export default async function LocaleSearchRoute({ params, searchParams }: Props) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  const lookup = await loadSearch(queryParam(await searchParams));
  return <SearchPage locale={loc} lookup={lookup} />;
}
