import {
  countListedCvsByRor,
  institutionsWithSnapshot,
  trustedInstitutionRecords,
  type TrustedInstitutionRecordRow,
} from "@/lib/cv/listed";
import { isRorId } from "./institutions";
import { oaShareByYear, type OaShareRow, type OaShareWithheld } from "./oaShare";
import { OPENALEX_INSTITUTION_ID_RE, parseInstitutionAggregates } from "./snapshot";

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
 * full year with a stated share (the floor in `oaShare.ts`). Ids beyond
 * {@link MAX_COMPARED} are left out and said so.
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
}

export interface CompareColumn {
  rorId: string;
  /** The trusted ROR name (or `ROR <id>`). */
  name: string;
  /** ISO 3166-1 alpha-2 from the ROR record, when recorded. */
  country: string | null;
  /** Short OpenAlex id of the counted entity. */
  openalexId: string;
  entityName: string;
  foldedCount: number;
  /** ISO timestamp of the snapshot. */
  fetchedAt: string;
  years: { from: number; to: number };
  /** The common full years (oldest first), then this column's own partial year. */
  rows: CompareShareRow[];
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
  return {
    column: {
      rorId,
      name: record.name ?? `ROR ${rorId}`,
      country: record.country,
      openalexId: record.openalexId,
      entityName: a.countedEntity.displayName,
      foldedCount: a.countedEntity.foldedIds.length,
      fetchedAt: record.openalexFetchedAt.toISOString(),
      years: a.years,
      rows: shares,
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
  columns.sort((a, b) => a.name.localeCompare(b.name, "en"));
  if (columns.length === 0) return { ...empty, dropped: out };

  const commonYears = commonFullYears(columns);
  const times = columns.map((c) => Date.parse(c.fetchedAt));
  const skewed = Math.max(...times) - Math.min(...times) > SNAPSHOT_SKEW_DAYS * DAY_MS;
  const keep = new Set(commonYears);
  const shaped = columns.map((c) => ({
    ...c,
    rows: c.rows
      .filter((r) => keep.has(r.year) || r.year === c.years.to)
      .map((r) => withholdForSkew(r, skewed)),
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
 * The organisations that can be set side by side: those with a snapshot among
 * the opted-in sets, by name. The picker's list; the index page stays a plain
 * list and never offers a selection.
 */
export async function listComparableInstitutions(): Promise<ComparableInstitution[]> {
  const [counts, rows] = await Promise.all([countListedCvsByRor(), institutionsWithSnapshot()]);
  return rows
    .filter((r) => isRorId(r.rorId) && (counts.get(r.rorId) ?? 0) >= 1)
    .map((r) => ({ rorId: r.rorId, name: r.name.trim() || `ROR ${r.rorId}` }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}
