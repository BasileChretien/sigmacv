import type { Metadata } from "next";
import InstitutionIndex from "@/components/InstitutionIndex";
import { InstitutionRateLimited } from "@/components/InstitutionPage";
import { institutionStrings } from "@/lib/i18n/institutions";
import { institutionsIndexLanguageAlternates } from "@/lib/seo";
import { institutionRobots, loadInstitutionIndex } from "./institutionLoad";

/** The institution index (en-US): read from the database on every request —
 *  it changes whenever a researcher opts in or out. */
export const dynamic = "force-dynamic";

const s = institutionStrings("en-US");

export async function generateMetadata(): Promise<Metadata> {
  // Shares the request's one rate-limit check with the body (React `cache`);
  // a rate-limited notice is marked noindex rather than indexed as the index.
  const robots = institutionRobots(await loadInstitutionIndex());
  return {
    // The root layout's title template appends " — SigmaCV".
    title: s.indexMetaTitle,
    description: s.indexMetaDescription,
    robots,
    alternates: { canonical: "/i", languages: institutionsIndexLanguageAlternates() },
  };
}

export default async function InstitutionsIndexPage() {
  const lookup = await loadInstitutionIndex();
  if (lookup.kind === "rate-limited") return <InstitutionRateLimited locale="en-US" />;
  return <InstitutionIndex locale="en-US" institutions={lookup.institutions} />;
}
