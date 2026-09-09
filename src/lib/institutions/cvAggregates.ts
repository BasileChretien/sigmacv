import { z } from "zod";
import { itemEffectiveYear, type CanonicalCv, type CvSectionType } from "@/lib/canonical/schema";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import { OPEN_ACCESS_STATES, openAccessState, type OpenAccessState } from "@/lib/cv/worklist";
import { selectSections } from "@/lib/render/citationItems";

/**
 * One CV's contribution to its institution page's figures: COUNTS of the works
 * its public page lists, by year × open-access state and by section type.
 * Computed from the document at every write (`sync.ts` stores it in
 * `Cv.institutionAggregates` beside `currentRorId`) and summed on `/i/[ror]`
 * under k-anonymity (`aggregateSum.ts`) for the CVs whose owners gave the
 * pinned institution-page consent. Pure: no database, no clock, no network.
 *
 * The work set is EXACTLY the public page's — the same projection
 * (`projectCvForPublic`: hidden, "not mine" and view-excluded items dropped)
 * and the same list selection (`selectSections`: "peer-reviewed only", "count
 * letters", the publications cap) the OAI-PMH per-work records apply, minus
 * retracted works, which the OAI records also leave out. Nothing here re-derives
 * a visibility rule: a work absent from the page is absent from every count.
 * The four open-access states are the owner worklist's (`openAccessState`),
 * derived only from stored fields — no route, no mandate, no verdict.
 *
 * Counts only, integers only: no field is ever a share, percentage or ratio
 * (the plan's "Compliance verdicts" veto; a test greps the serialised JSON).
 */

export const CV_AGGREGATES_VERSION = 1;

/** The `byYear` key of a work with no effective year. */
export const UNKNOWN_YEAR = "unknown";

export interface CvAggregatesYear {
  total: number;
  oa: Record<OpenAccessState, number>;
}

export interface CvAggregates {
  v: typeof CV_AGGREGATES_VERSION;
  worksTotal: number;
  /** Keyed by year (`"2021"`) or {@link UNKNOWN_YEAR}; only years with a work. */
  byYear: Record<string, CvAggregatesYear>;
  /** Keyed by the section type the work sits in; only types with a work. */
  byType: Partial<Record<CvSectionType, number>>;
}

const count = z.number().int().nonnegative();
const oaCells = z.object({
  "open-cc": count,
  "open-other": count,
  "no-open-copy-found": count,
  "not-determined": count,
});

/** A `byYear` key: a year of up to four digits, or {@link UNKNOWN_YEAR}. Any
 *  other key (a tampered row) refuses the aggregate, so the page's year sort
 *  only ever sees keys it can order. */
const YEAR_KEY_RE = /^\d{1,4}$|^unknown$/;

/** The stored shape. A stored row is external data to the page, so it is
 *  parsed back before any sum ({@link parseCvAggregates}); an older or
 *  hand-edited value degrades to "not yet computed" rather than throwing. Strict
 *  objects: a field the shape does not know (a share, say) refuses the row. */
const CvAggregatesSchema = z.strictObject({
  v: z.literal(CV_AGGREGATES_VERSION),
  worksTotal: count,
  byYear: z.record(z.string().regex(YEAR_KEY_RE), z.strictObject({ total: count, oa: oaCells })),
  byType: z.record(z.string(), count),
});

function emptyOa(): Record<OpenAccessState, number> {
  const out = {} as Record<OpenAccessState, number>;
  for (const st of OPEN_ACCESS_STATES) out[st] = 0;
  return out;
}

/** The counts of the works `cv`'s public page lists. */
export function computeCvAggregates(cv: CanonicalCv): CvAggregates {
  const byYear: Record<string, CvAggregatesYear> = {};
  const byType: Partial<Record<CvSectionType, number>> = {};
  let worksTotal = 0;
  for (const { section, items } of selectSections(projectCvForPublic(cv))) {
    for (const item of items) {
      // The projection already dropped hidden and "not mine" items; the two
      // checks the OAI records still make on the projected list are the
      // citation gate and the retraction gate.
      if (!item.csl || item.notMine || item.meta.retracted) continue;
      const year = itemEffectiveYear(item);
      const key = year === undefined ? UNKNOWN_YEAR : String(year);
      const state = openAccessState(item);
      const row = byYear[key] ?? { total: 0, oa: emptyOa() };
      byYear[key] = { total: row.total + 1, oa: { ...row.oa, [state]: row.oa[state] + 1 } };
      byType[section.type] = (byType[section.type] ?? 0) + 1;
      worksTotal++;
    }
  }
  return { v: CV_AGGREGATES_VERSION, worksTotal, byYear, byType };
}

/** The stored JSON as an aggregate, or null when it is not the shape above. */
export function parseCvAggregates(input: unknown): CvAggregates | null {
  const parsed = CvAggregatesSchema.safeParse(input);
  return parsed.success ? (parsed.data as CvAggregates) : null;
}
