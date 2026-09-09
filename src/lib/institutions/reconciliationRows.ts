import { z } from "zod";
import { itemEffectiveYear, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { doiOf } from "@/lib/cv/ownerCorrections";
import { OPEN_ACCESS_STATES, openAccessState, type OpenAccessState } from "@/lib/cv/worklist";
import { listedWorks } from "./cvAggregates";

/**
 * The per-work rows of the institution reconciliation export
 * (`/i/<ror>/reconciliation.csv|json`): for ONE researcher who opted in a
 * second time, the works their DESIGNATED frozen public version lists — "these
 * are my works, this is the open-access state SigmaCV found, this is my
 * affiliation" — endorsed by the researcher, versioned, and free of any
 * verdict. Pure: nothing here reads the live document, the database or the
 * network.
 *
 * Two halves, computed at two moments. The WORK rows
 * ({@link reconciliationWorkRows}) come from the frozen document and are
 * computed ONCE, when the owner designates the version (`snapshotStore.ts`
 * stores them in `CvSnapshot.reconciliationRows`, the way `sync.ts` stores
 * `Cv.institutionAggregates`), so no public request ever parses a frozen
 * document. The IDENTITY columns ({@link withIdentity}: the owner's ORCID iD
 * and the consented ids still current) are added per request from two
 * already-selected columns, because the lapse rule must be applied at read
 * time. A stored row is external data to the request: it is parsed back by
 * {@link parseReconciliationWorkRows} before anything is emitted.
 *
 * The work set is {@link listedWorks} — the public page's own list, the one
 * predicate every institution surface shares — so a work absent from the page
 * is absent from the export; a retracted work the page still shows is carried
 * with its flag. The columns are EXACTLY {@link RECONCILIATION_COLUMNS}: no
 * compliance state, no percentage, no funder, no citation count, and nothing
 * from `meta` beyond the listed fields (the plan's "Compliance verdicts" veto;
 * a test greps the header and every cell for the banned words).
 */

/** The column list, in order — the CSV header and the JSON row's keys. */
export const RECONCILIATION_COLUMNS = [
  "orcid",
  "ror_ids",
  "item_id",
  "doi",
  "title",
  "year",
  "section_type",
  "oa_state",
  "license",
  "oa_url",
  "retracted",
  "snapshot_version",
  "content_hash",
  "frozen_at",
] as const;

/** The columns computed from the frozen version at designation time — every
 *  column but the two identity ones. */
export const RECONCILIATION_WORK_COLUMNS = RECONCILIATION_COLUMNS.filter(
  (c) => c !== "orcid" && c !== "ror_ids",
);

export interface ReconciliationRow {
  /** The owner's authenticated ORCID iD (bare). */
  orcid: string;
  /** The consented ROR ids still current, semicolon-separated. */
  ror_ids: string;
  item_id: string;
  /** Normalised (lower-cased, doi.org prefix removed), or null. */
  doi: string | null;
  title: string | null;
  /** The effective year (the owner's override first), or null. */
  year: number | null;
  section_type: string;
  oa_state: OpenAccessState;
  /** The stored reuse-licence slug, or null. */
  license: string | null;
  /** The stored open-access URL when it is an http(s) URL, or null. */
  oa_url: string | null;
  retracted: boolean;
  snapshot_version: number;
  /** SHA-256 of the frozen document's public projection; null on versions
   *  frozen before the hash existed. */
  content_hash: string | null;
  /** When the version was frozen (ISO). */
  frozen_at: string;
}

/** A row as stored on the designated version: everything but the identity. */
export type ReconciliationWorkRow = Omit<ReconciliationRow, "orcid" | "ror_ids">;

/** What the work rows cannot read from the frozen document: the version's
 *  number, hash and date. */
export interface ReconciliationVersion {
  snapshotVersion: number;
  contentHash: string | null;
  /** ISO timestamp of the freeze. */
  frozenAt: string;
}

/** What only the request knows: the owner and the ids still current. */
export interface ReconciliationIdentity {
  orcid: string;
  /** The consented ids that are still visible current positions (the pages
   *  that list the CV) — never a lapsed one. */
  activeRorIds: readonly string[];
}

/** The whole context, for callers that build complete rows in one go. */
export type ReconciliationContext = ReconciliationVersion & ReconciliationIdentity;

/** The stored shape (`CvSnapshot.reconciliationRows`), versioned like the
 *  per-CV aggregate. */
export const RECONCILIATION_ROWS_VERSION = 1;

export interface StoredReconciliationRows {
  v: typeof RECONCILIATION_ROWS_VERSION;
  rows: ReconciliationWorkRow[];
}

function titleOf(item: CvItem): string | null {
  const title = item.csl?.title;
  return typeof title === "string" && title.trim() ? title : null;
}

/** The stored OA URL only when it is an http(s) URL — the same rule the
 *  renderers apply before emitting it as a link. */
function oaUrlOf(item: CvItem): string | null {
  const url = item.meta.oaUrl?.trim() ?? "";
  return /^https?:\/\//i.test(url) ? url : null;
}

/** The work rows of one frozen version — computed at designation time. */
export function reconciliationWorkRows(
  frozen: CanonicalCv,
  version: ReconciliationVersion,
): ReconciliationWorkRow[] {
  return listedWorks(frozen).map(({ item, sectionType }) => ({
    item_id: item.id,
    doi: doiOf(item) ?? null,
    title: titleOf(item),
    year: itemEffectiveYear(item) ?? null,
    section_type: sectionType,
    oa_state: openAccessState(item),
    license: item.meta.license?.trim() || null,
    oa_url: oaUrlOf(item),
    retracted: item.meta.retracted === true,
    snapshot_version: version.snapshotVersion,
    content_hash: version.contentHash,
    frozen_at: version.frozenAt,
  }));
}

/** The work rows as the column stores them. */
export function storedReconciliationRows(
  frozen: CanonicalCv,
  version: ReconciliationVersion,
): StoredReconciliationRows {
  return { v: RECONCILIATION_ROWS_VERSION, rows: reconciliationWorkRows(frozen, version) };
}

/** Stored work rows + the request's identity → complete rows, in column order. */
export function withIdentity(
  rows: readonly ReconciliationWorkRow[],
  identity: ReconciliationIdentity,
): ReconciliationRow[] {
  const rorIds = identity.activeRorIds.join(";");
  return rows.map((row) => ({ orcid: identity.orcid, ror_ids: rorIds, ...row }));
}

/** The complete rows of one researcher's designated frozen version, in one go
 *  (the two halves above, composed). */
export function reconciliationRows(
  frozen: CanonicalCv,
  ctx: ReconciliationContext,
): ReconciliationRow[] {
  return withIdentity(reconciliationWorkRows(frozen, ctx), ctx);
}

/** One stored work row. Strict: a field the shape does not know (a verdict,
 *  say) refuses the whole stored value, and a hand-edited value degrades to
 *  "no rows" — the source is then skipped and not counted. */
const WorkRowSchema = z.strictObject({
  item_id: z.string().min(1),
  doi: z.string().nullable(),
  title: z.string().nullable(),
  year: z.number().int().nullable(),
  section_type: z.string().min(1),
  oa_state: z.enum(OPEN_ACCESS_STATES),
  license: z.string().nullable(),
  oa_url: z.string().nullable(),
  retracted: z.boolean(),
  snapshot_version: z.number().int().positive(),
  content_hash: z.string().nullable(),
  frozen_at: z.string().min(1),
});

const StoredRowsSchema = z.strictObject({
  v: z.literal(RECONCILIATION_ROWS_VERSION),
  rows: z.array(WorkRowSchema),
});

/** The stored JSON as work rows, or null when it is not the shape above. */
export function parseReconciliationWorkRows(input: unknown): ReconciliationWorkRow[] | null {
  const parsed = StoredRowsSchema.safeParse(input);
  return parsed.success ? parsed.data.rows : null;
}

/** A cell a spreadsheet would read as a formula: one starting with `=`, `+`,
 *  `-`, `@`, a tab or a carriage return (OWASP "CSV injection"). Such a cell
 *  is prefixed with a single quote so it stays text when opened in Excel or
 *  LibreOffice — the JSON export is untouched, and a title that starts with
 *  "-" or "+" is still readable. */
const FORMULA_LEAD_RE = /^[=+\-@\t\r]/;

/** One CSV field: always quoted, inner quotes doubled (RFC 4180 §2.5–2.7);
 *  null is the empty field, booleans and numbers their JSON spelling; a string
 *  that a spreadsheet would evaluate is neutralised with a leading quote. */
function csvField(value: string | number | boolean | null): string {
  if (value === null) return '""';
  const text = typeof value === "string" && FORMULA_LEAD_RE.test(value) ? `'${value}` : value;
  return `"${String(text).replace(/"/g, '""')}"`;
}

/**
 * The rows as an RFC 4180 CSV: the header record first, every field quoted,
 * records ended by CRLF, UTF-8 with no byte-order mark. An embedded newline
 * stays inside its quoted field — only the CRLF pair separates records.
 */
export function reconciliationCsv(rows: readonly ReconciliationRow[]): string {
  const header = RECONCILIATION_COLUMNS.map(csvField).join(",");
  const records = rows.map((row) =>
    RECONCILIATION_COLUMNS.map((column) => csvField(row[column])).join(","),
  );
  return [header, ...records].map((record) => `${record}\r\n`).join("");
}
