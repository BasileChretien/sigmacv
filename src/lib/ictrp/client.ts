import { prisma } from "@/lib/db";
import { logger } from "@/lib/log";
import { matchesNameAndOrg, personMatch } from "@/lib/grants/match";
import type { ExternalTrial } from "@/lib/trials/types";

/**
 * WHO ICTRP adapter — clinical trials from the national registries (ISRCTN, jRCT,
 * ChiCTR, CTRI, ANZCTR, …) that ClinicalTrials.gov and EU CTIS do NOT cover.
 *
 * WHO offers NO live query API, so this reads the `IctrpTrial` reference table,
 * bulk-imported from the WHO weekly export by `npm run ictrp:import` (which drops
 * CT.gov / EU rows to avoid double-listing). DORMANT by default: with an empty
 * table this is a no-op. ICTRP carries no ORCID and only "contact" (not PI) names,
 * so we match the contact person + the primary sponsor organization and surface
 * hits as REVIEW CANDIDATES. Fails soft (returns []) so an ICTRP miss never breaks
 * a sync.
 */

/** Cap the rows pulled for one researcher (the surname filter can be broad). */
const MAX_ROWS = 50;

export async function fetchIctrpTrials(name: string, orgs: string[]): Promise<ExternalTrial[]> {
  const person = personMatch(name, orgs);
  if (!person.surname || person.orgs.length === 0) return [];
  try {
    const rows = await prisma.ictrpTrial.findMany({
      where: { contactNameLower: { contains: person.surname } },
      take: MAX_ROWS,
      orderBy: { registrationYear: "desc" },
    });
    const out: ExternalTrial[] = [];
    const seen = new Set<string>();
    for (const r of rows) {
      // ICTRP has no PI field — match the contact person + the sponsor org.
      if (!matchesNameAndOrg(person, r.contactName, r.primarySponsor ?? undefined)) continue;
      if (seen.has(r.trialId)) continue;
      seen.add(r.trialId);
      out.push({
        source: "ictrp",
        registryId: r.trialId,
        title: r.publicTitle || r.scientificTitle || r.trialId,
        status: r.recruitmentStatus ?? undefined,
        sponsor: r.primarySponsor ?? undefined,
        startYear: r.registrationYear ?? undefined,
      });
    }
    return out;
  } catch (err) {
    logger.warn("ictrp.search_failed", { err });
    return [];
  }
}
