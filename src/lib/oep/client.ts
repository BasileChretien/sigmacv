import { prisma } from "@/lib/db";
import { logger } from "@/lib/log";
import { normalizeOrcid } from "@/lib/openalex/types";

/**
 * Open Editors Plus (OEP) adapter — journal editorial roles by identifier.
 *
 * Reads from the `OepEditorialRole` reference table, which is bulk-imported from
 * the committed OEP seed (`npm run oep:import`; see scripts/oep-import.ts). With
 * an empty table the integration is a no-op (no editorial section), so the app
 * runs without it. Every lookup fails soft (returns []) so an OEP hiccup never
 * breaks a sync.
 *
 * Two entry points, mirroring the app-wide split between identifier-matched
 * material (auto-included) and weaker matches (review candidates):
 *
 * - `fetchEditorialRoles(orcid)` — rows whose ORCID the publisher actually
 *   printed on the masthead. Auto-included.
 * - `fetchEditorialRoleCandidates({ orcid, authorIds })` — rows OEP resolved by
 *   inference: an ORCID propagated from another row of the same unambiguous
 *   name, or an OpenAlex author ID matched by name+institution. Surfaced hidden,
 *   for the user to confirm.
 *
 * Neither path ever matches a name as text. The weaker tiers still turn on an
 * identifier — it is the *provenance* of that identifier that is softer — so the
 * "someone else with my name" failure mode stays out of the CV either way.
 *
 * Why this matters: only ~38% of OEP rows carry a scraped ORCID, and the
 * shortfall is worst exactly where the roles are most significant — under two
 * fifths of editor-in-chief records have one. An ORCID-only join silently drops
 * the rest. (Reported by Delphine Le Piolet, DIBISO / Université Paris-Saclay,
 * 2026-09-01: a chief editor whose Elsevier editorship was missing from his CV
 * because that publisher prints no ORCID.)
 *
 * The OEP snapshot has no editorial-term dates, so `startYear`/`endYear` are
 * left undefined (the field stays in the type for manually-added roles + future
 * date-bearing sources).
 */

/** How OEP tied this row to a person. Ordered strongest to weakest. */
export type EditorialRoleTrust = "scraped" | "propagated" | "openalex";

/** Tiers that are inferred rather than printed, so a human confirms them. */
const CANDIDATE_TRUST: readonly EditorialRoleTrust[] = ["propagated", "openalex"];

export interface EditorialRole {
  journal: string;
  role: string;
  startYear?: number;
  endYear?: number;
  /** Absent on manually-added roles; "scraped" for auto-included OEP rows. */
  trust?: EditorialRoleTrust;
}

const SELECT = { journal: true, role: true, trust: true } as const;
const ORDER = [{ journal: "asc" }, { role: "asc" }] as const;

function toRoles(rows: { journal: string; role: string; trust: string }[]): EditorialRole[] {
  return rows.map((r) => ({
    journal: r.journal,
    role: r.role,
    trust: r.trust as EditorialRoleTrust,
  }));
}

/**
 * Editorial roles the publisher published under this exact ORCID iD.
 * Identifier-matched at the source, so these are auto-included.
 */
export async function fetchEditorialRoles(orcid: string): Promise<EditorialRole[]> {
  const bare = normalizeOrcid(orcid);
  if (!bare) return [];
  try {
    const rows = await prisma.oepEditorialRole.findMany({
      where: { orcid: bare, trust: "scraped" },
      select: SELECT,
      orderBy: [...ORDER],
    });
    return toRoles(rows);
  } catch (err) {
    // Fail soft (an OEP hiccup must never break a sync), but log at error
    // level: the caller cannot tell [] "query failed" from [] "no roles",
    // and the only other trace is a 0 in the build's sourceCounts.
    logger.error("oep.editorial_roles_failed", { err, source: "oep" });
    return [];
  }
}

/**
 * Editorial roles OEP attributed to this person by inference — a propagated
 * ORCID, or an OpenAlex author ID resolved from name + institution. Real
 * editorships, weaker attribution, so they are surfaced as review candidates
 * rather than written onto the CV.
 *
 * `authorIds` are the OpenAlex author IDs already resolved for this user, so no
 * name string is ever sent to the database.
 */
export async function fetchEditorialRoleCandidates({
  orcid,
  authorIds,
}: {
  orcid: string;
  authorIds: readonly string[];
}): Promise<EditorialRole[]> {
  const bare = normalizeOrcid(orcid);
  const ids = [...new Set(authorIds.filter(Boolean))];
  if (!bare && ids.length === 0) return [];
  const or = [
    ...(bare ? [{ orcid: bare }] : []),
    ...(ids.length ? [{ openalexAuthorId: { in: ids } }] : []),
  ];
  try {
    const rows = await prisma.oepEditorialRole.findMany({
      where: { trust: { in: [...CANDIDATE_TRUST] }, OR: or },
      select: SELECT,
      orderBy: [...ORDER],
    });
    return toRoles(rows);
  } catch (err) {
    // Same fail-soft contract as above; see the note there.
    logger.error("oep.editorial_role_candidates_failed", {
      err,
      source: "oep.candidates",
    });
    return [];
  }
}
