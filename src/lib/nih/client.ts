import {
  type FunderGrant,
  matchesNameAndOrg,
  personMatch,
} from "@/lib/grants/match";
import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";

/**
 * NIH RePORTER (v2) — NIH/HHS grants where the researcher is a PI, matched by PI
 * NAME + organisation (no ORCID in RePORTER), so results are review candidates.
 * Keyless POST. Fails soft → [].
 */

const NIH_SEARCH = "https://api.reporter.nih.gov/v2/projects/Search";
const USER_AGENT = "SigmaCV (+https://github.com/BasileChretien/sigmacv)";
const MAX_BYTES = 6_000_000;

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}

/** Year from an ISO-8601 date string ("2021-09-01T00:00:00"). */
function yearFromIso(v: unknown): number | undefined {
  if (typeof v !== "string") return undefined;
  const y = Number(v.slice(0, 4));
  return Number.isFinite(y) && y > 1900 ? y : undefined;
}

export async function fetchNihGrants(
  name: string,
  orgs: string[],
): Promise<FunderGrant[]> {
  const person = personMatch(name, orgs);
  if (!person.surname || person.orgs.length === 0) return [];

  const firstName = person.nameTokens.find((t) => t !== person.surname) ?? "";
  const requestBody = {
    criteria: {
      pi_names: [{ first_name: firstName, last_name: person.surname }],
      org_names: orgs,
    },
    limit: 50,
    offset: 0,
    include_fields: [
      "ProjectNum",
      "ProjectTitle",
      "PrincipalInvestigators",
      "Organization",
      "ProjectStartDate",
      "ProjectEndDate",
      "AgencyIcAdmin",
    ],
  };

  try {
    const res = await resilientFetch(NIH_SEARCH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify(requestBody),
      next: { revalidate: 86_400 },
      timeoutMs: 12_000,
    });
    if (!res.ok) return [];
    const body = await res.text();
    /* v8 ignore next -- defensive cap on a pathological response */
    if (body.length > MAX_BYTES) return [];
    const data = JSON.parse(body) as { results?: unknown };
    const results = Array.isArray(data.results) ? data.results : [];

    const out: FunderGrant[] = [];
    for (const raw of results) {
      const rec = asRecord(raw);
      const org = asRecord(rec?.organization);
      const orgName = typeof org?.org_name === "string" ? org.org_name : undefined;
      const pis = Array.isArray(rec?.principal_investigators)
        ? rec.principal_investigators
        : [];
      const matched = pis
        .map(asRecord)
        .some(
          (pi) =>
            typeof pi?.full_name === "string" &&
            matchesNameAndOrg(person, pi.full_name, orgName),
        );
      if (!matched) continue;

      const projectNum =
        typeof rec?.project_num === "string" ? rec.project_num : undefined;
      const title =
        typeof rec?.project_title === "string" ? rec.project_title : undefined;
      if (!projectNum || !title) continue;

      const agency = asRecord(rec?.agency_ic_admin);
      out.push({
        source: "nih",
        externalId: projectNum,
        title,
        funder:
          typeof agency?.abbreviation === "string" ? agency.abbreviation : undefined,
        org: orgName,
        startYear: yearFromIso(rec?.project_start_date),
        endYear: yearFromIso(rec?.project_end_date),
      });
    }
    return out;
  } catch (err) {
    logger.warn("nih.grants_fetch_failed", { err });
    return [];
  }
}
