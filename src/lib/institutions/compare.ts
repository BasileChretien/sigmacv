import {
  countListedCvsByRor,
  institutionsWithSnapshot,
  trustedInstitutionRecords,
  type TrustedInstitutionRecordRow,
} from "@/lib/cv/listed";
import { isRorId, previousOf } from "./institutions";
import {
  oaShareByYear,
  previousReading,
  type OaShareRow,
  type OaShareWithheld,
  type PreviousReading,
} from "./oaShare";
import {
  OPENALEX_INSTITUTION_ID_RE,
  parseInstitutionAggregates,
  type InstitutionAggregates,
} from "./snapshot";

/**
 * The comparison view (`/i/compare?ror=a&ror=b[&ror=c]`): two or three
 * organisations' OpenAlex records set side by side, designed by the panel of
 * 2026-09-10 and built from the stored weekly snapshots alone — this module,
 * like the whole institutions lib, reads the database through `@/lib/cv/listed`
 * and never calls out.
 *
 * What makes an organisation comparable, in order: a bare ROR id; a page (at
 * least one researcher chose to be listed under it — the same gate as `/i/[ror]`,
 * used here for existence only: the listed count is a consented figure and is
 * never carried to the page); a stored snapshot that parses; and at least one
 * stated share (the floor in `oaShare.ts`) among the full years every column
 * covers. Ids beyond {@link MAX_COMPARED} are left out and said so.
 *
 * What the page never does, structurally: columns are ALPHABETICAL by name —
 * never the caller's order, so a shared URL cannot encode "X before Y" — and
 * the canonical URL is the sorted set of ids; there is no sort, no difference,
 * no third column chosen by SigmaCV. Rows are the full years every column
 * covers (each snapshot's own window ends at its fetch year), then each
 * column's own incomplete year with its counts. When the snapshots were read
 * more than {@link SNAPSHOT_SKEW_DAYS} apart, every share is withheld with that
 * reason and the counts stand.
 */

/** Columns on one page; the third is "us and two peers", a fourth reads as a table. */
export const MAX_COMPARED = 3;

/** Snapshots read further apart than this are not set beside each other as shares. */
export const SNAPSHOT_SKEW_DAYS = 30;

/** Why a row on the comparison carries no share: the share module's reasons,
 *  plus the cross-column one. */
export type CompareWithheld = OaShareWithheld | "snapshot-skew";

export interface CompareShareRow extends Omit<OaShareRow, "withheld"> {
  withheld: CompareWithheld | null;
  /** The year's OpenAlex status buckets (`closed` included), as stored. */
  statuses: Record<string, number>;
}

export interface CompareColumn {
  rorId: string;
  /** The trusted ROR name (or `ROR <id>`). */
  name: string;
  /** ISO 3166-1 alpha-2 from the ROR record, when recorded. */
  country: string | null;
  /** Short OpenAlex id of the counted entity. */
  openalexId: string;
  /** The OpenAlex entities whose works are counted (self + related + child). */
  foldedIds: string[];
  foldedCount: number;
  countedWorkTypes: string[];
  /** ISO timestamp of the snapshot. */
  fetchedAt: string;
  years: { from: number; to: number };
  /** The common full years (oldest first), then this column's own partial year. */
  rows: CompareShareRow[];
  /** The field mix, when the row was refreshed since it exists (PR #457). */
  domains: InstitutionAggregates["domains"];
  /** The last full year as the reading before this one stated it; null when
   *  there is none, either reading stated no share, the columns are skewed, or
   *  the year is not among the common full years (a column must never state a
   *  year the others do not). */
  previous: PreviousReading | null;
}

export type DroppedReason = "no-page" | "no-record" | "below-floor" | "over-cap";

export interface InstitutionComparison {
  /** Alphabetical by name. */
  columns: CompareColumn[];
  /** Requested, ROR-shaped ids that have nothing to show, with why. Ids that
   *  are not ROR-shaped are dropped silently — never echoed to a page. */
  dropped: Array<{ rorId: string; reason: DroppedReason }>;
  /** Full years every column covers, oldest first. */
  commonYears: number[];
  skewed: boolean;
  /** The columns' ids, sorted: the canonical query. */
  canonicalIds: string[];
}

/** A row of the picker: an organisation that can be set side by side. */
export interface ComparableInstitution {
  rorId: string;
  name: string;
}

/**
 * The requested ids, cleaned: ROR-shaped only, deduplicated, the first
 * {@link MAX_COMPARED} kept and the rest reported as over the cap. Pure.
 */
export function normaliseCompareIds(raw: string | string[] | undefined): {
  ids: string[];
  dropped: Array<{ rorId: string; reason: "over-cap" }>;
} {
  const list = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
  const seen = new Set<string>();
  const ids: string[] = [];
  const dropped: Array<{ rorId: string; reason: "over-cap" }> = [];
  for (const value of list) {
    const id = value.trim();
    if (!isRorId(id) || seen.has(id)) continue;
    seen.add(id);
    if (ids.length < MAX_COMPARED) ids.push(id);
    else dropped.push({ rorId: id, reason: "over-cap" });
  }
  return { ids, dropped };
}

/** The canonical query for a set of ids: sorted, so every order of the same
 *  set is one URL. */
export function canonicalCompareQuery(ids: string[]): string {
  return [...ids]
    .sort()
    .map((id) => `ror=${id}`)
    .join("&");
}

const DAY_MS = 24 * 60 * 60 * 1000;

function columnOf(
  rorId: string,
  record: TrustedInstitutionRecordRow,
): { column: CompareColumn } | { reason: "no-record" | "below-floor" } {
  if (!record.openalexId || !record.openalexFetchedAt) return { reason: "no-record" };
  if (!OPENALEX_INSTITUTION_ID_RE.test(record.openalexId)) return { reason: "no-record" };
  const a = parseInstitutionAggregates(record.openalexAggregates);
  if (!a) return { reason: "no-record" };
  const shares = oaShareByYear(a);
  if (!shares.some((r) => r.percent !== null)) return { reason: "below-floor" };
  const statusesOf = (year: number): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const r of a.oaByStatusByYear) {
      if (r.year === year) out[r.status] = (out[r.status] ?? 0) + r.count;
    }
    return out;
  };
  return {
    column: {
      rorId,
      name: record.name ?? `ROR ${rorId}`,
      country: record.country,
      openalexId: record.openalexId,
      foldedIds: a.countedEntity.foldedIds,
      foldedCount: a.countedEntity.foldedIds.length,
      countedWorkTypes: a.countedWorkTypes,
      fetchedAt: record.openalexFetchedAt.toISOString(),
      years: a.years,
      rows: shares.map((r) => ({ ...r, statuses: statusesOf(r.year) })),
      domains: a.domains,
      previous: previousReading(a, previousOf(record)),
    },
  };
}

/** The full years (every year but the snapshot's own last one) shared by all. */
function commonFullYears(columns: CompareColumn[]): number[] {
  const from = Math.max(...columns.map((c) => c.years.from));
  const to = Math.min(...columns.map((c) => c.years.to - 1));
  const years: number[] = [];
  for (let y = from; y <= to; y++) years.push(y);
  return years;
}

/**
 * Resolve the comparison for the requested ids: one read of the listed counts
 * (existence only) and one read of the institution rows, then pure work.
 */
export async function institutionComparison(
  raw: string | string[] | undefined,
): Promise<InstitutionComparison> {
  const { ids, dropped } = normaliseCompareIds(raw);
  const empty: InstitutionComparison = {
    columns: [],
    dropped,
    commonYears: [],
    skewed: false,
    canonicalIds: [],
  };
  if (ids.length === 0) return empty;

  const [counts, records] = await Promise.all([
    countListedCvsByRor(),
    trustedInstitutionRecords(ids),
  ]);
  const columns: CompareColumn[] = [];
  const out: InstitutionComparison["dropped"] = [...dropped];
  for (const rorId of ids) {
    if ((counts.get(rorId) ?? 0) < 1) {
      out.push({ rorId, reason: "no-page" });
      continue;
    }
    const record = records.get(rorId);
    if (!record) {
      out.push({ rorId, reason: "no-record" });
      continue;
    }
    const resolved = columnOf(rorId, record);
    if ("reason" in resolved) out.push({ rorId, reason: resolved.reason });
    else columns.push(resolved.column);
  }
  // Alphabetical by name; a tie falls back to the id, so the URL's order can
  // never decide a column's place.
  columns.sort((a, b) => a.name.localeCompare(b.name, "en") || a.rorId.localeCompare(b.rorId));

  // A column must state at least one share on the COMMON full years, not only
  // on its own window — otherwise it would sit beside the others with every
  // row "too few". Dropping one can widen the common window, so iterate.
  let cols = columns;
  let commonYears = cols.length > 0 ? commonFullYears(cols) : [];
  for (;;) {
    const keep = new Set(commonYears);
    const kept = cols.filter((c) => c.rows.some((r) => keep.has(r.year) && r.percent !== null));
    if (kept.length === cols.length) break;
    for (const c of cols) {
      if (!kept.includes(c)) out.push({ rorId: c.rorId, reason: "below-floor" });
    }
    cols = kept;
    commonYears = cols.length > 0 ? commonFullYears(cols) : [];
  }
  if (cols.length === 0) return { ...empty, dropped: out };

  const times = cols.map((c) => Date.parse(c.fetchedAt));
  const skewed = Math.max(...times) - Math.min(...times) > SNAPSHOT_SKEW_DAYS * DAY_MS;
  const keep = new Set(commonYears);
  // A previous reading is shown only for a year every column shows; the ones
  // that remain are a second cross-column pair of shares with their own dates,
  // so the same skew rule applies to them, and every share goes under skew.
  const shownPrevious = cols.map((c) =>
    c.previous && keep.has(c.previous.year) ? c.previous : null,
  );
  const prevTimes = shownPrevious.flatMap((p) => (p ? [Date.parse(p.fetchedAt)] : []));
  const prevSkewed =
    prevTimes.length > 1 &&
    Math.max(...prevTimes) - Math.min(...prevTimes) > SNAPSHOT_SKEW_DAYS * DAY_MS;
  const shaped = cols.map((c, i) => ({
    ...c,
    rows: c.rows
      .filter((r) => keep.has(r.year) || r.year === c.years.to)
      .map((r) => withholdForSkew(r, skewed)),
    previous: skewed || prevSkewed ? null : shownPrevious[i]!,
  }));
  return {
    columns: shaped,
    dropped: out,
    commonYears,
    skewed,
    canonicalIds: shaped.map((c) => c.rorId).sort(),
  };
}

/** A stated share is withheld for skew; a row already withheld keeps its own,
 *  more specific reason. */
function withholdForSkew(r: CompareShareRow, skewed: boolean): CompareShareRow {
  if (!skewed || r.withheld !== null) return r;
  return { ...r, percent: null, withheld: "snapshot-skew" };
}

/**
 * The organisations that can be set side by side: the opted-in sets that have
 * a snapshot, by name. The picker's list; the index page stays a plain list
 * and never offers a selection. The sets are read first so the row read is
 * keyed on them (bounded, capped) rather than scanning every institution.
 */
export async function listComparableInstitutions(): Promise<ComparableInstitution[]> {
  const counts = await countListedCvsByRor();
  const sets = [...counts.keys()].filter((id) => isRorId(id) && (counts.get(id) ?? 0) >= 1);
  const rows = await institutionsWithSnapshot(sets);
  return rows
    .map((r) => ({ rorId: r.rorId, name: r.name.trim() || `ROR ${r.rorId}` }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}
