import { prisma } from "@/lib/db";
import { logger } from "@/lib/log";
import { Prisma } from "@/generated/prisma/client";

/**
 * The institution listing's database access — and nothing else.
 *
 * Everything an institution page (`/i`, `/i/[ror]`), the sitemap, and the OAI
 * `ListSets` verb need to say about an institution is read here: how many CVs
 * are listed under a ROR id, the institution's TRUSTED name, and the stored
 * per-CV aggregates of the researchers who gave the PINNED institution-page
 * consent ({@link listedForInstitutionPage}). This module
 * imports no external client (not OpenAlex, not ROR, not the shared fetch
 * wrapper), so a public request that reaches it can never reach the network — the plan's
 * "Live proxying" veto, enforced by `tests/institutions-no-openalex.test.ts`
 * at the source level and by the pages' offline render test at runtime.
 * `sync.ts` (which pulls in every client) is deliberately NOT the home of these
 * readers, so the institutions lib never has to import it.
 *
 * The trusted name is the `Institution` row ROR's own record wrote during sync
 * — never a CV's `currentAffiliationName`: that column derives from
 * `meta.institution`, a string the owner can set on a manual position beside
 * any ROR id, so reading it would let one opted-in user title a real
 * institution's page. With no row, the callers show `ROR <id>`.
 */

/**
 * The consent gate for "listed under an institution", as a where clause: a CV
 * counts only while it is published, indexable AND opted into the affiliation
 * listing, and its current-affiliation key is that ROR. The same three flags
 * that make a CV a member of the OAI `ror:<id>` set — an institution page may
 * never count a researcher the set would not list. Backed by the
 * `[listUnderAffiliation, currentRorId]` index.
 */
function listedUnderRorWhere(rorId: string): Prisma.CvWhereInput {
  return {
    published: true,
    publicIndexable: true,
    listUnderAffiliation: true,
    currentRorId: rorId,
  };
}

/** How many CVs are listed under a bare ROR id (the institution page's only
 *  figure). A count, never the rows: the page shows no roster. */
export async function countListedCvs(rorId: string): Promise<number> {
  return prisma.cv.count({ where: listedUnderRorWhere(rorId) });
}

/**
 * Bound on the consented CVs one institution page sums. Ordered by id so the
 * bound is stable between requests; when it is hit the page says "first N".
 */
export const INSTITUTION_PAGE_ROW_LIMIT = 2000;

export interface InstitutionPageRows {
  /** One entry per consented, ACTIVE CV: its stored aggregate as `unknown`
   *  (validated by the caller — a stored row is external data to the page). */
  rows: Array<{ aggregates: unknown }>;
  /** True when the query bound was reached (the page states the bound). */
  truncated: boolean;
  /** The bound applied. */
  limit: number;
}

/**
 * The CVs an institution page COUNTS: the researchers who gave the pinned
 * institution-page consent for this ROR id (`showOnInstitutionPage` +
 * `consentedRorIds`) on a published, indexable CV — a different gate from the
 * OAI-set listing above, never mixed with it — and whose consent is still
 * ACTIVE: a consented id no longer among the visible current positions has
 * lapsed, and a lapsed CV is not counted. The lapse rule is the editor's and
 * the publish path's (`institutionPageListing`, derived from the document);
 * here it is the same rule read from the denormalised `visibleCurrentRorIds`
 * column every write rewrites from the document beside `currentRorId`, so the
 * whole filter is five columns in SQL and no document is selected — nothing
 * but the stored aggregate is read. A row written before that column existed
 * carries `[]` until its next write, so it is not counted until then (like a
 * null aggregate, which counts as pending). One row past the bound is fetched
 * so `truncated` says whether more exist, not whether the bound was reached.
 */
export async function listedForInstitutionPage(
  rorId: string,
  opts: { limit?: number } = {},
): Promise<InstitutionPageRows> {
  const limit = opts.limit ?? INSTITUTION_PAGE_ROW_LIMIT;
  const candidates = await prisma.cv.findMany({
    where: {
      showOnInstitutionPage: true,
      published: true,
      publicIndexable: true,
      consentedRorIds: { has: rorId },
      visibleCurrentRorIds: { has: rorId },
    },
    select: { institutionAggregates: true },
    orderBy: { id: "asc" },
    take: limit + 1,
  });
  const rows = candidates
    .slice(0, limit)
    .map((row) => ({ aggregates: row.institutionAggregates ?? null }));
  return { rows, truncated: candidates.length > limit, limit };
}

/** The designated frozen version: the ONE public snapshot per CV the owner
 *  chose as the source of the reconciliation export, WITH its rows already
 *  computed (a designated version whose rows are missing — a row written by
 *  an older build — is not a source until it is designated again). */
const DESIGNATED_SNAPSHOT = {
  forReconciliation: true,
  isPublic: true,
  reconciliationRows: { not: Prisma.AnyNull },
} as const;

/**
 * The consent gate of the reconciliation export, as a where clause — the
 * institution-page gate above ({@link listedForInstitutionPage}: pinned
 * consent, published + indexable, the id still a visible current position —
 * the lapse rule in SQL) AND the SECOND opt-in (`shareReconciliationRows`) AND
 * an owner with an ORCID iD (the export names the researcher by identifier)
 * AND a designated public frozen version with stored rows to read from. A CV
 * missing any one of the seven is not a source — and, because the count below
 * uses the same clause, is not counted on the page either.
 */
function reconciliationWhere(rorId: string): Prisma.CvWhereInput {
  return {
    showOnInstitutionPage: true,
    shareReconciliationRows: true,
    published: true,
    publicIndexable: true,
    consentedRorIds: { has: rorId },
    visibleCurrentRorIds: { has: rorId },
    user: { orcid: { not: null } },
    snapshots: { some: DESIGNATED_SNAPSHOT },
  };
}

/**
 * Bound on the CVs one reconciliation export reads (by id, so the bound is
 * stable between requests); past it the export says `truncated`. Size
 * estimate: a stored work row is ~250 bytes of JSON, a public page lists a
 * few dozen to a few hundred works, so one source is ~10–50 KB and a full
 * export of 1,000 sources ~10–50 MB — the most one request may assemble in
 * memory and serialise; an institution past the bound reads "first 1,000".
 */
export const RECONCILIATION_ROW_LIMIT = 1000;

export interface ReconciliationSource {
  /** The owner's authenticated ORCID iD (the User row's), or null for an
   *  account with none — the export needs it and skips such a CV. */
  orcid: string | null;
  consentedRorIds: string[];
  visibleCurrentRorIds: string[];
  /** The designated frozen version: its number (for the log line) and its
   *  stored rows as `unknown` (parsed by the caller — a stored row is external
   *  data). Never the frozen document. */
  snapshot: { version: number; reconciliationRows: unknown };
}

export interface ReconciliationSources {
  sources: ReconciliationSource[];
  /** True when more CVs exist past the bound. */
  truncated: boolean;
  limit: number;
}

/**
 * The CVs whose owners opted in a SECOND time to share their reconciliation
 * rows under this ROR id, each with its designated public frozen version —
 * the only per-person read of the programme. Seven columns in SQL, no live
 * `document` and no frozen `canonical` selected: the rows are the version's
 * STORED rows, computed when it was designated. The owner's ORCID iD is read
 * from the User relation because the export names the researcher by
 * identifier; the institution PAGE never reads it. One row past the bound is
 * fetched so `truncated` says whether more exist.
 */
export async function reconciliationSources(
  rorId: string,
  opts: { limit?: number } = {},
): Promise<ReconciliationSources> {
  const limit = opts.limit ?? RECONCILIATION_ROW_LIMIT;
  const rows = await prisma.cv.findMany({
    where: reconciliationWhere(rorId),
    select: {
      consentedRorIds: true,
      visibleCurrentRorIds: true,
      user: { select: { orcid: true } },
      snapshots: {
        where: DESIGNATED_SNAPSHOT,
        select: { version: true, reconciliationRows: true },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
    orderBy: { id: "asc" },
    take: limit + 1,
  });
  const sources: ReconciliationSource[] = [];
  for (const row of rows.slice(0, limit)) {
    const snapshot = row.snapshots[0];
    /* v8 ignore next -- the where clause requires a designated snapshot */
    if (!snapshot) continue;
    sources.push({
      orcid: row.user.orcid ?? null,
      consentedRorIds: row.consentedRorIds,
      visibleCurrentRorIds: row.visibleCurrentRorIds,
      snapshot,
    });
  }
  return { sources, truncated: rows.length > limit, limit };
}

/** How many CVs are reconciliation sources under this ROR id — the page's one
 *  line about the export (a count; the rows themselves are the export's). The
 *  same clause as the reader's, so the page's count and the export's
 *  `contributorCount` agree except for a stored value that no longer parses. */
export async function countReconciliationSources(rorId: string): Promise<number> {
  return prisma.cv.count({ where: reconciliationWhere(rorId) });
}

/** Listed-CV counts per ROR key, for the institution index — one grouped query
 *  under the same consent gate, instead of one count per set. */
export async function countListedCvsByRor(): Promise<Map<string, number>> {
  const groups = await prisma.cv.groupBy({
    by: ["currentRorId"],
    where: {
      published: true,
      publicIndexable: true,
      listUnderAffiliation: true,
      currentRorId: { not: null },
    },
    _count: { _all: true },
  });
  const counts = new Map<string, number>();
  for (const g of groups) {
    /* v8 ignore next -- the where clause already excludes null keys */
    if (!g.currentRorId) continue;
    counts.set(g.currentRorId, g._count._all);
  }
  return counts;
}

/**
 * One institution's row as the page reads it: the trusted (ROR-recorded) name,
 * trimmed (blank → null, callers then show `ROR <id>`), and the OpenAlex
 * snapshot columns the internal resync job wrote — the stored JSON is returned
 * as `unknown` for the caller to validate; nothing here is fetched. Null when
 * no sync has recorded the institution yet.
 */
export interface TrustedInstitutionRecord {
  name: string | null;
  openalexId: string | null;
  openalexAggregates: unknown;
  openalexFetchedAt: Date | null;
}

export async function trustedInstitutionRecord(
  rorId: string,
): Promise<TrustedInstitutionRecord | null> {
  const row = await prisma.institution.findUnique({
    where: { rorId },
    select: { name: true, openalexId: true, openalexAggregates: true, openalexFetchedAt: true },
  });
  if (!row) return null;
  return {
    name: row.name.trim() || null,
    openalexId: row.openalexId ?? null,
    openalexAggregates: row.openalexAggregates ?? null,
    openalexFetchedAt: row.openalexFetchedAt ?? null,
  };
}

/** One row as the comparison view reads it: the record above plus the ROR
 *  id and the country ROR recorded (ISO 3166-1 alpha-2, or null). */
export interface TrustedInstitutionRecordRow extends TrustedInstitutionRecord {
  rorId: string;
  country: string | null;
}

/** The records of many bare ROR ids at once (the comparison view): a map
 *  holding only the ids with a recorded row. One query for all of them. */
export async function trustedInstitutionRecords(
  rorIds: string[],
): Promise<Map<string, TrustedInstitutionRecordRow>> {
  const out = new Map<string, TrustedInstitutionRecordRow>();
  if (rorIds.length === 0) return out;
  const rows = await prisma.institution.findMany({
    where: { rorId: { in: rorIds } },
    select: {
      rorId: true,
      name: true,
      country: true,
      openalexId: true,
      openalexAggregates: true,
      openalexFetchedAt: true,
    },
  });
  for (const row of rows) {
    out.set(row.rorId, {
      rorId: row.rorId,
      name: row.name.trim() || null,
      country: row.country?.trim() || null,
      openalexId: row.openalexId ?? null,
      openalexAggregates: row.openalexAggregates ?? null,
      openalexFetchedAt: row.openalexFetchedAt ?? null,
    });
  }
  return out;
}

/** Among the given bare ROR ids (the opted-in sets), the rows with a stored
 *  OpenAlex snapshot (id + name): the comparison picker's universe. Keyed on
 *  the primary key and capped, so a landing on the picker never scans the
 *  whole `Institution` table (every ROR any position ever resolved). */
const INSTITUTIONS_WITH_SNAPSHOT_LIMIT = 500;

export async function institutionsWithSnapshot(
  rorIds: string[],
): Promise<Array<{ rorId: string; name: string }>> {
  if (rorIds.length === 0) return [];
  return prisma.institution.findMany({
    where: { rorId: { in: rorIds }, openalexFetchedAt: { not: null } },
    select: { rorId: true, name: true },
    orderBy: { name: "asc" },
    take: INSTITUTIONS_WITH_SNAPSHOT_LIMIT,
  });
}

/** Trusted names for many bare ROR ids at once (index, sitemap, ListSets):
 *  a map holding only the ids with a recorded row. */
export async function trustedInstitutionNames(rorIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (rorIds.length === 0) return names;
  const rows = await prisma.institution.findMany({
    where: { rorId: { in: rorIds } },
    select: { rorId: true, name: true },
  });
  for (const row of rows) {
    const name = row.name.trim();
    if (name) names.set(row.rorId, name);
  }
  return names;
}

/** What the ROR client resolved for an institution, as the writer needs it:
 *  the ROR id (bare or as its `https://ror.org/<id>` IRI) and the display name. */
export interface RecordedInstitution {
  id: string;
  name: string;
  countryCode?: string;
}

const ROR_IRI_PREFIX = "https://ror.org/";
/** The bare ROR id shape (leading 0, six Crockford base32 characters, two check
 *  digits) — the same rule as `isRorId` in the institutions lib. */
const BARE_ROR_RE = /^0[a-hj-km-np-tv-z0-9]{6}\d{2}$/;

/** The bare id from either form, or null when it is not ROR-shaped. */
function bareRorId(id: string): string | null {
  const trimmed = id.trim();
  const bare = trimmed.startsWith(ROR_IRI_PREFIX) ? trimmed.slice(ROR_IRI_PREFIX.length) : trimmed;
  return BARE_ROR_RE.test(bare) ? bare : null;
}

/**
 * Record ROR's own name for each resolved institution (upsert by ROR id). Called
 * from sync with every confident ROR match on the owner's positions, so a
 * listed institution has a trusted name by the time it can have a page.
 * Fail-soft: a database hiccup is logged and never fails the sync. Entries
 * whose id is not ROR-shaped or whose name is blank are skipped — only what
 * ROR itself returned is ever written.
 */
export async function recordInstitutions(orgs: readonly RecordedInstitution[]): Promise<void> {
  const seen = new Set<string>();
  const fetchedAt = new Date();
  for (const org of orgs) {
    const rorId = bareRorId(org.id);
    const name = org.name.trim();
    if (!rorId || !name || seen.has(rorId)) continue;
    seen.add(rorId);
    const country = org.countryCode?.trim() || null;
    try {
      await prisma.institution.upsert({
        where: { rorId },
        create: { rorId, name, country, source: "ror", fetchedAt },
        update: { name, country, source: "ror", fetchedAt },
      });
    } catch (err) {
      logger.warn("institution.record_failed", { rorId, err });
    }
  }
}
