import { z } from "zod";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import {
  oaiFingerprint,
  oaiIdentifier,
  oaiWorkIdentifier,
  rorSetSpec,
  workRecords,
  type OaiRecordInput,
} from "@/lib/oai/oai";

/**
 * What the OAI-PMH endpoint serves for one CV, decided from its row — the ONE
 * rule the harvest readers (`listPublicCvRecords`, `getPublicCvRecord`) and
 * the writers share, so a write can tell whether it changed what harvesters
 * see, and what it stopped serving. Pure: no database, no clock.
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

/**
 * The identifiers a CV serves — its CV record and one per listed work — and
 * the set they are served in. A type, not an interface, so it is a JSON value
 * as it stands (it is stored in `Cv.oaiExposure`).
 */
export type HarvestExposure = { ids: string[]; set: string | null };

/** What a CV that serves nothing exposes. */
export const NOTHING_EXPOSED: HarvestExposure = { ids: [], set: null };

const HarvestExposureSchema = z.object({
  ids: z.array(z.string()),
  set: z.string().nullable(),
});

/** The identifiers and set a record exposes (nothing for null). */
export function harvestExposure(record: OaiRecordInput | null): HarvestExposure {
  if (!record) return NOTHING_EXPOSED;
  return {
    ids: [
      oaiIdentifier(record.slug),
      ...workRecords(record).map((w) => oaiWorkIdentifier(w.slug, w.itemId)),
    ],
    set: record.setSpec ?? null,
  };
}

/** A stored `Cv.oaiExposure`, or null when absent or not that shape (then the
 *  writer derives it from the previous document). */
export function parseHarvestExposure(raw: unknown): HarvestExposure | null {
  const parsed = HarvestExposureSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** The `setSpec` of a deletion from the repository as a whole. */
export const WHOLE_REPOSITORY = "";

/** One `OaiDeletion` key: an identifier no longer served, in the repository
 *  (`setSpec` "") or in one set. */
export interface OaiDeletionKey {
  identifier: string;
  setSpec: string;
}

/**
 * What a write stops serving. An identifier that is gone is deleted from the
 * repository AND from the set it was in, so a harvester working through that
 * set learns it too; an identifier still served but no longer in its former
 * set (the owner left the listing, or the affiliation changed) is deleted from
 * that set only.
 */
export function deletionsBetween(
  before: HarvestExposure,
  after: HarvestExposure,
): OaiDeletionKey[] {
  const still = new Set(after.ids);
  const out: OaiDeletionKey[] = [];
  for (const identifier of before.ids) {
    const gone = !still.has(identifier);
    if (gone) out.push({ identifier, setSpec: WHOLE_REPOSITORY });
    if (before.set && (gone || after.set !== before.set))
      out.push({ identifier, setSpec: before.set });
  }
  return out;
}

/** What a writer read from the row before writing. */
export interface StoredHarvestState {
  oaiFingerprint?: string | null;
  oaiExposure?: unknown;
}

/** The harvest columns a write stores beside the document. */
export interface HarvestStateColumns {
  oaiFingerprint: string;
  oaiExposure: HarvestExposure;
  /** Present only when what the endpoint serves changed. */
  publicChangedAt?: Date;
}

/** Everything a write does to the harvest: the columns it stores, the
 *  records it stops serving, what it serves (whose deletions it clears), and
 *  the set it left and the set it joined (each null when it did not), which
 *  decide what the set floor lets through (`oaiDeletions.ts`). */
export interface HarvestWrite {
  columns: HarvestStateColumns;
  deletions: OaiDeletionKey[];
  served: HarvestExposure;
  departed: string | null;
  joined: string | null;
}

/**
 * The harvest side of a write. The fingerprint of what the endpoint serves once
 * the write lands moves `publicChangedAt` to `now` only when it differs from
 * the stored one; a row that has never stored a fingerprint (written before
 * the column existed) counts as changed — one spurious re-harvest is better
 * than a missed change. The deletions are the stored exposure minus the new
 * one; a row with no stored exposure diffs against `previous()`, the record
 * its previous state served (called only then).
 */
export function harvestWrite(
  row: HarvestColumns,
  cv: CanonicalCv | null,
  stored: StoredHarvestState,
  previous: () => OaiRecordInput | null,
  now: Date,
): HarvestWrite {
  const record = harvestRecord(row, cv, now);
  const fingerprint = oaiFingerprint(record);
  const served = harvestExposure(record);
  const before = parseHarvestExposure(stored.oaiExposure) ?? harvestExposure(previous());
  return {
    columns:
      fingerprint === stored.oaiFingerprint
        ? { oaiFingerprint: fingerprint, oaiExposure: served }
        : { oaiFingerprint: fingerprint, oaiExposure: served, publicChangedAt: now },
    deletions: deletionsBetween(before, served),
    served,
    departed: before.set !== null && before.set !== served.set ? before.set : null,
    joined: served.set !== null && served.set !== before.set ? served.set : null,
  };
}
