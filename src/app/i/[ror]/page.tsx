import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InstitutionPage, { InstitutionRateLimited } from "@/components/InstitutionPage";
import { fillInstitutionString, institutionStrings } from "@/lib/i18n/institutions";
import { institutionLanguageAlternates, localeInstitutionPath } from "@/lib/seo";
import { institutionRobots, loadInstitution } from "../institutionLoad";

/**
 * One institution's page (en-US), keyed by bare ROR id. ROR ids cannot be
 * enumerated at build time and the count changes with every opt-in, so the
 * route is fully dynamic; an id nobody is listed under is a 404.
 */
export const dynamic = "force-dynamic";
export const dynamicParams = true;

type Params = { params: Promise<{ ror: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { ror } = await params;
  const lookup = await loadInstitution(ror);
  const robots = institutionRobots(lookup);
  if (lookup.kind !== "ok") return { robots };
  const s = institutionStrings("en-US");
  return {
    // The root layout's title template appends " — SigmaCV".
    title: lookup.summary.name,
    description: fillInstitutionString(s.metaDescription, { name: lookup.summary.name }),
    robots,
    alternates: {
      canonical: localeInstitutionPath("en-US", ror),
      languages: institutionLanguageAlternates(ror),
    },
  };
}

export default async function InstitutionRoute({ params }: Params) {
  const { ror } = await params;
  const lookup = await loadInstitution(ror);
  if (lookup.kind === "rate-limited") return <InstitutionRateLimited locale="en-US" />;
  if (lookup.kind === "missing") notFound();
  return <InstitutionPage locale="en-US" summary={lookup.summary} />;
}
