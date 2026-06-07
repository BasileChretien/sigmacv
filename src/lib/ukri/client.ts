import {
  type FunderGrant,
  matchesNameAndOrg,
  personMatch,
} from "@/lib/grants/match";
import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";

/**
 * UKRI Gateway to Research (GtR) — grants where the researcher is a PI, matched
 * by PI NAME + organisation (no ORCID in GtR), so results are review candidates.
 * Keyless. Fails soft → []. Covers UKRI funders only (AHRC, BBSRC, EPSRC, ESRC,
 * Innovate UK, MRC, NERC, STFC, Research England).
 */

const GTR_PROJECT_SEARCH = "https://gtr.ukri.org/api/search/project";
const USER_AGENT = "SigmaCV (+https://github.com/BasileChretien/sigmacv)";
const MAX_BYTES = 4_000_000;

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}

/** Year from a GtR Unix-epoch-MILLISECONDS timestamp. */
function yearFromEpochMs(v: unknown): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  const y = new Date(v).getUTCFullYear();
  return Number.isFinite(y) ? y : undefined;
}

export async function fetchUkriGrants(
  name: string,
  orgs: string[],
): Promise<FunderGrant[]> {
  const person = personMatch(name, orgs);
  if (!person.surname || person.orgs.length === 0) return [];

  const url = new URL(GTR_PROJECT_SEARCH);
  url.searchParams.set("term", name);
  url.searchParams.set("fetchSize", "50");
  url.searchParams.set("page", "1");

  try {
    const res = await resilientFetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      next: { revalidate: 86_400 },
      timeoutMs: 12_000,
    });
    if (!res.ok) return [];
    const body = await res.text();
    if (body.length > MAX_BYTES) return [];
    const data = JSON.parse(body) as { results?: unknown };
    const results = Array.isArray(data.results) ? data.results : [];

    const out: FunderGrant[] = [];
    for (const raw of results) {
      const comp = asRecord(asRecord(raw)?.projectComposition);
      const leadOrg = asRecord(comp?.leadResearchOrganisation);
      const orgName = typeof leadOrg?.name === "string" ? leadOrg.name : undefined;
      const pis = Array.isArray(comp?.principalInvestigators)
        ? comp.principalInvestigators
        : [];
      const matched = pis
        .map(asRecord)
        .some(
          (pi) =>
            typeof pi?.fullName === "string" &&
            matchesNameAndOrg(person, pi.fullName, orgName),
        );
      if (!matched) continue;

      const project = asRecord(comp?.project);
      const title = typeof project?.title === "string" ? project.title : undefined;
      const grantRef =
        typeof project?.grantReference === "string" ? project.grantReference : undefined;
      if (!title || !grantRef) continue;

      const fund = asRecord(project?.fund);
      const funder = asRecord(fund?.funder);
      out.push({
        source: "ukri",
        externalId: grantRef,
        title,
        funder: typeof funder?.name === "string" ? funder.name : undefined,
        org: orgName,
        startYear: yearFromEpochMs(fund?.start),
        endYear: yearFromEpochMs(fund?.end),
      });
    }
    return out;
  } catch (err) {
    logger.warn("ukri.grants_fetch_failed", { err });
    return [];
  }
}
