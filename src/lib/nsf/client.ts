import { type FunderGrant, matchesNameAndOrg, personMatch } from "@/lib/grants/match";
import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";

/**
 * NSF Award Search — NSF grants where the researcher is the lead PI, matched by
 * PI NAME + institution (no ORCID in NSF), so results are review candidates.
 * Keyless. Uses the research.gov host (the api.nsf.gov alias is broken). The API
 * blocks CORS but we call it server-side. Fails soft → [].
 */

const NSF_SEARCH = "https://www.research.gov/awardapi-service/v1/awards.json";
const USER_AGENT = "SigmaCV (+https://github.com/BasileChretien/sigmacv)";
const MAX_BYTES = 4_000_000;

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}

/** Year from an NSF "MM/DD/YYYY" date string. */
function yearFromMdy(v: unknown): number | undefined {
  if (typeof v !== "string") return undefined;
  const m = /\/(\d{4})$/.exec(v.trim());
  return m ? Number(m[1]) : undefined;
}

export async function fetchNsfGrants(name: string, orgs: string[]): Promise<FunderGrant[]> {
  const person = personMatch(name, orgs);
  if (!person.surname || person.orgs.length === 0) return [];

  const firstName = person.nameTokens.find((t) => t !== person.surname) ?? "";
  const url = new URL(NSF_SEARCH);
  // pdPIName matches as a prefix; "Last,First" is the documented form.
  url.searchParams.set("pdPIName", `${person.surname},${firstName}`);
  url.searchParams.set("rpp", "25");
  url.searchParams.set("printFields", "id,title,pdPIName,awardeeName,agency,startDate,expDate");

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
    const data = JSON.parse(body) as { response?: unknown };
    const response = asRecord(data.response);
    const awards = Array.isArray(response?.award) ? response.award : [];

    const out: FunderGrant[] = [];
    for (const raw of awards) {
      const a = asRecord(raw);
      const pi = typeof a?.pdPIName === "string" ? a.pdPIName : undefined;
      const orgName = typeof a?.awardeeName === "string" ? a.awardeeName : undefined;
      if (!pi || !matchesNameAndOrg(person, pi, orgName)) continue;

      const id = typeof a?.id === "string" ? a.id : undefined;
      const title = typeof a?.title === "string" ? a.title : undefined;
      if (!id || !title) continue;

      out.push({
        source: "nsf",
        externalId: id,
        title,
        funder: typeof a?.agency === "string" ? a.agency : "NSF",
        org: orgName,
        startYear: yearFromMdy(a?.startDate),
        endYear: yearFromMdy(a?.expDate),
      });
    }
    return out;
  } catch (err) {
    logger.warn("nsf.grants_fetch_failed", { err });
    return [];
  }
}
