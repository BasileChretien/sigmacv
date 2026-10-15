import type { CanonicalCv } from "@/lib/canonical/schema";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import { oaiFingerprint, rorSetSpec, type OaiRecordInput } from "@/lib/oai/oai";

/**
 * What the OAI-PMH endpoint serves for one CV, decided from its row — the ONE
 * rule the harvest readers (`listPublicCvRecords`, `getPublicCvRecord`) and
 * the writers share, so a write can tell whether it changed what harvesters
 * see. Pure: no database, no clock.
 */

/** The columns that decide whether and how a CV is harvestable. */
export interface HarvestColumns {
  published: boolean;
  publicIndexable: boolean;
  publicSlug: string | null;
  listUnderAffiliation: boolean;
  currentRorId: string | null;
}

/** The OAI set an opted-in CV is listed under, or undefined. The opt-in is the
 *  consent gate; the key alone (a CV that merely HAS that affiliation) is not. */
export function affiliationSetSpec(
  row: Pick<HarvestColumns, "listUnderAffiliation" | "currentRorId">,
): string | undefined {
  return row.listUnderAffiliation && row.currentRorId ? rorSetSpec(row.currentRorId) : undefined;
}

/**
 * The CV record the endpoint serves for this row, or null when it serves none:
 * not published, not indexable (the consent whose copy names the endpoint),
 * no slug, or no parseable document. The document is the public projection,
 * as on the public page.
 */
export function harvestRecord(
  row: HarvestColumns,
  cv: CanonicalCv | null,
  datestamp: Date,
): OaiRecordInput | null {
  if (!row.published || !row.publicIndexable || !row.publicSlug || !cv) return null;
  return {
    slug: row.publicSlug,
    datestamp,
    cv: projectCvForPublic(cv),
    setSpec: affiliationSetSpec(row),
  };
}

/** The harvest columns a write stores beside the document. */
export interface HarvestStateColumns {
  oaiFingerprint: string;
  /** Present only when what the endpoint serves changed. */
  publicChangedAt?: Date;
}

/**
 * The `Cv.oaiFingerprint` / `Cv.publicChangedAt` pair for a write: the
 * fingerprint of what the endpoint serves once the write lands, and — only
 * when it differs from the stored one — `now` as the CV's new OAI datestamp.
 * A row that has never stored a fingerprint (written before the column
 * existed) counts as changed: one spurious re-harvest is better than a missed
 * change.
 */
export function harvestStateColumns(
  row: HarvestColumns,
  cv: CanonicalCv | null,
  previous: string | null | undefined,
  now: Date,
): HarvestStateColumns {
  const fingerprint = oaiFingerprint(harvestRecord(row, cv, now));
  return fingerprint === previous
    ? { oaiFingerprint: fingerprint }
    : { oaiFingerprint: fingerprint, publicChangedAt: now };
}
