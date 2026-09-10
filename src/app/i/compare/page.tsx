import type { Metadata } from "next";
import InstitutionCompare from "@/components/InstitutionCompare";
import { InstitutionRateLimited } from "@/components/InstitutionPage";
import { compareKey, compareMetadata, loadInstitutionComparison } from "../institutionLoad";

/**
 * The comparison view (en-US): `/i/compare?ror=a&ror=b[&ror=c]`. Read from the
 * database on every request; never indexed (a set of near-duplicate "X beside
 * Y" pages is a crawl trap and exactly the league-table artefact the project
 * refuses), never in the sitemap. The locale twin is `/[locale]/i/compare`.
 */
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ ror?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { ror } = await searchParams;
  return compareMetadata("en-US", await loadInstitutionComparison(compareKey(ror)));
}

export default async function InstitutionCompareRoute({ searchParams }: Props) {
  const { ror } = await searchParams;
  const lookup = await loadInstitutionComparison(compareKey(ror));
  if (lookup.kind === "rate-limited") return <InstitutionRateLimited locale="en-US" />;
  return (
    <InstitutionCompare locale="en-US" comparison={lookup.comparison} picker={lookup.picker} />
  );
}
