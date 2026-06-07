import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";
import { matchesNameAndOrg, personMatch } from "@/lib/grants/match";
import type { ExternalTrial } from "@/lib/trials/types";

/**
 * EU CTIS (Clinical Trials Information System) — the EMA's public trials portal.
 *
 * There is no ORCID and investigator names are NOT in the search index — they
 * live only in each trial's detail record (Part II trial sites). So we search by
 * the researcher's SURNAME + organization to get a small candidate set, then
 * fetch each candidate's detail (bounded) and keep a trial only when a site
 * principal investigator matches the person by NAME + site organization. Every
 * hit is therefore a REVIEW CANDIDATE. Public, no auth; undocumented + unversioned,
 * so every field is treated as optional and the client fails soft → [].
 */

const SEARCH_ENDPOINT = "https://euclinicaltrials.eu/ctis-public-api/search";
const RETRIEVE_ENDPOINT = "https://euclinicaltrials.eu/ctis-public-api/retrieve";
const USER_AGENT = "SigmaCV (+https://github.com/BasileChretien/sigmacv)";
const MAX_SEARCH_BYTES = 4_000_000;
const MAX_DETAIL_BYTES = 8_000_000; // a detail record is ~300 KB but can be larger
/** Cap the per-trial detail fetches (the N+1) so one sync can't fan out unbounded. */
const MAX_DETAILS = 10;

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}
function toArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}
/** Year from an ISO-ish date string (e.g. "2022-06-16T10:52:58"). */
function yearFromIso(v: unknown): number | undefined {
  const s = str(v);
  const m = s ? /^(\d{4})/.exec(s) : null;
  return m ? Number(m[1]) : undefined;
}

/**
 * Fetch one trial's detail and return it as an {@link ExternalTrial} IF a site
 * investigator matches the person (name + site org); else null.
 */
async function fetchMatchingTrial(
  ctNumber: string,
  person: ReturnType<typeof personMatch>,
): Promise<ExternalTrial | null> {
  const res = await resilientFetch(`${RETRIEVE_ENDPOINT}/${encodeURIComponent(ctNumber)}`, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    next: { revalidate: 86_400 },
    timeoutMs: 12_000,
  });
  if (!res.ok) return null;
  const body = await res.text();
  if (body.length > MAX_DETAIL_BYTES) return null;
  const data = JSON.parse(body) as Record<string, unknown>;

  const app = asRecord(data.authorizedApplication);
  const partI = asRecord(app?.authorizedPartI);
  const title =
    str(
      asRecord(asRecord(asRecord(partI?.trialDetails)?.clinicalTrialIdentifiers))?.fullTitle,
    ) ?? str(data.ctNumber);
  const sponsor = str(
    asRecord(asRecord(toArray(partI?.sponsors)[0])?.organisation)?.name,
  );
  const startYear = yearFromIso(data.startDateEU) ?? yearFromIso(data.decisionDate);
  const status = str(data.ctStatus);

  for (const rawPart of toArray(app?.authorizedPartsII)) {
    for (const rawSite of toArray(asRecord(rawPart)?.trialSites)) {
      const site = asRecord(rawSite);
      const pi = asRecord(site?.personInfo);
      const fullName = [str(pi?.firstName), str(pi?.lastName)].filter(Boolean).join(" ");
      const siteOrg = str(
        asRecord(asRecord(site?.organisationAddressInfo)?.organisation)?.name,
      );
      if (fullName && matchesNameAndOrg(person, fullName, siteOrg)) {
        return {
          source: "ctis",
          registryId: ctNumber,
          title: title ?? ctNumber,
          status,
          role: "INVESTIGATOR",
          sponsor,
          org: siteOrg,
          startYear,
        };
      }
    }
  }
  return null;
}

/**
 * EU CTIS trials where the account holder is a site investigator, matched by
 * name + organization. Review candidates. Fails soft → [].
 */
export async function fetchCtisTrials(
  name: string,
  orgs: string[],
): Promise<ExternalTrial[]> {
  const person = personMatch(name, orgs);
  if (!person.surname || person.orgs.length === 0) return [];

  try {
    const res = await resilientFetch(SEARCH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      // Investigator names aren't indexed; narrow the candidate set with surname
      // + the primary organization (containAll = every word must appear).
      body: JSON.stringify({
        pagination: { page: 1, size: 30 },
        searchCriteria: { containAll: `${person.surname} ${orgs[0]}` },
      }),
      timeoutMs: 12_000,
    });
    if (!res.ok) return [];
    const body = await res.text();
    if (body.length > MAX_SEARCH_BYTES) return [];
    const data = JSON.parse(body) as { data?: unknown };
    const ctNumbers = toArray(data.data)
      .map((d) => str(asRecord(d)?.ctNumber))
      .filter((x): x is string => Boolean(x))
      .slice(0, MAX_DETAILS);

    const out: ExternalTrial[] = [];
    const seen = new Set<string>();
    for (const ctNumber of ctNumbers) {
      if (seen.has(ctNumber)) continue;
      seen.add(ctNumber);
      const trial = await fetchMatchingTrial(ctNumber, person);
      if (trial) out.push(trial);
    }
    return out;
  } catch (err) {
    logger.warn("ctis.search_failed", { err });
    return [];
  }
}
