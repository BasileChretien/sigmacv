import { matchesNameAndOrg, personMatch } from "@/lib/grants/match";
import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";
import type { ExternalTrial } from "@/lib/trials/types";

/**
 * ClinicalTrials.gov API v2 — trials where the researcher is an investigator,
 * matched by investigator NAME + affiliation (the registry has no ORCID), so
 * results are review candidates. Keyless. Fails soft → [].
 *
 * Investigators appear in two places, both checked: `overallOfficials[]` (named
 * PIs / study directors) and an individual `responsibleParty`.
 */

const CTGOV_API = "https://clinicaltrials.gov/api/v2/studies";
const USER_AGENT = "SigmaCV (+https://github.com/BasileChretien/sigmacv)";
const MAX_BYTES = 12_000_000;

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}
function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}
/** Year from a partial ISO date ("2021-02-23" | "2021-02" | "2021"). */
function year(v: unknown): number | undefined {
  const s = str(v);
  if (!s) return undefined;
  const y = Number(s.slice(0, 4));
  return Number.isFinite(y) && y > 1900 ? y : undefined;
}

interface Match {
  role?: string;
  org?: string;
}

/** The matched investigator role + affiliation for this study, or null. */
function matchInvestigator(
  ps: Record<string, unknown>,
  person: ReturnType<typeof personMatch>,
): Match | null {
  const contacts = asRecord(ps.contactsLocationsModule);
  const officials = Array.isArray(contacts?.overallOfficials) ? contacts.overallOfficials : [];
  for (const raw of officials) {
    const o = asRecord(raw);
    const name = str(o?.name);
    const aff = str(o?.affiliation);
    if (name && matchesNameAndOrg(person, name, aff)) {
      return { role: str(o?.role), org: aff };
    }
  }
  const rp = asRecord(asRecord(ps.sponsorCollaboratorsModule)?.responsibleParty);
  const rpName = str(rp?.investigatorFullName);
  const rpAff = str(rp?.investigatorAffiliation);
  if (rpName && matchesNameAndOrg(person, rpName, rpAff)) {
    return { role: str(rp?.type), org: rpAff };
  }
  return null;
}

export async function fetchClinicalTrials(name: string, orgs: string[]): Promise<ExternalTrial[]> {
  const person = personMatch(name, orgs);
  if (!person.surname || person.orgs.length === 0) return [];

  const url = new URL(CTGOV_API);
  // Scope the search to the official-name field; the strict name+org filter runs
  // client-side over the results (a bare surname query is otherwise far too wide).
  url.searchParams.set("query.term", `AREA[OverallOfficialName]${person.surname}`);
  url.searchParams.set("pageSize", "30");

  try {
    const res = await resilientFetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      next: { revalidate: 86_400 },
      timeoutMs: 12_000,
    });
    if (!res.ok) return [];
    const body = await res.text();
    /* v8 ignore next -- defensive cap on a pathological response */
    if (body.length > MAX_BYTES) return [];
    const data = JSON.parse(body) as { studies?: unknown };
    const studies = Array.isArray(data.studies) ? data.studies : [];

    const out: ExternalTrial[] = [];
    for (const raw of studies) {
      const ps = asRecord(asRecord(raw)?.protocolSection);
      if (!ps) continue;
      const match = matchInvestigator(ps, person);
      if (!match) continue;

      const ident = asRecord(ps.identificationModule);
      const registryId = str(ident?.nctId);
      const title = str(ident?.briefTitle);
      if (!registryId || !title) continue;

      const status = asRecord(ps.statusModule);
      const phases = asRecord(ps.designModule)?.phases;
      out.push({
        source: "clinicaltrials",
        registryId,
        title,
        status: str(status?.overallStatus),
        phase: Array.isArray(phases) ? str(phases[0]) : undefined,
        role: match.role,
        sponsor: str(asRecord(asRecord(ps.sponsorCollaboratorsModule)?.leadSponsor)?.name),
        org: match.org,
        startYear: year(asRecord(status?.startDateStruct)?.date),
        endYear: year(asRecord(status?.completionDateStruct)?.date),
      });
    }
    return out;
  } catch (err) {
    logger.warn("clinicaltrials.fetch_failed", { err });
    return [];
  }
}
