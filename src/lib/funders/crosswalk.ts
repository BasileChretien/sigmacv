import { prisma } from "@/lib/db";
import { logger } from "@/lib/log";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { workFunderIds, type FunderRow } from "./join";

/**
 * The owner-only reader of the funder crosswalk: the `Funder` rows (written at
 * sync by `openalex/funders.ts`) for the funders printed on the owner's works,
 * loaded by the editor page beside the CV and handed to the worklist. Reads
 * Postgres only; fails soft to an empty crosswalk, in which case the join
 * still matches by award number.
 */
export async function loadFunderCrosswalk(cv: CanonicalCv): Promise<FunderRow[]> {
  const ids = workFunderIds(cv);
  if (ids.length === 0) return [];
  try {
    const rows = await prisma.funder.findMany({
      where: { openalexId: { in: ids } },
      select: { openalexId: true, fundrefDoi: true, rorId: true, wikidataId: true, name: true },
    });
    return rows.map((row) => ({
      openalexId: row.openalexId,
      ...(row.fundrefDoi ? { fundrefDoi: row.fundrefDoi } : {}),
      ...(row.rorId ? { rorId: row.rorId } : {}),
      ...(row.wikidataId ? { wikidataId: row.wikidataId } : {}),
      name: row.name,
    }));
  } catch (err) {
    logger.warn("funder.crosswalk_failed", { err });
    return [];
  }
}
