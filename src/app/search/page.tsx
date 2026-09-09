import type { Metadata } from "next";
import SearchPage from "@/components/SearchPage";
import { searchStrings } from "@/lib/i18n/search";
import { searchLanguageAlternates } from "@/lib/seo";
import { loadSearch, queryParam, searchRobots } from "./searchLoad";

/** Live lookup against OpenAlex on every query: never static. */
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const s = searchStrings("en-US");

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lookup = await loadSearch(queryParam(await searchParams));
  return {
    title: s.metaTitle,
    description: s.promise,
    robots: searchRobots(lookup),
    // The canonical is always the bare page: a query is never a page of its own.
    alternates: { canonical: "/search", languages: searchLanguageAlternates() },
  };
}

export default async function SearchRoute({ searchParams }: Props) {
  const lookup = await loadSearch(queryParam(await searchParams));
  return <SearchPage locale="en-US" lookup={lookup} />;
}
