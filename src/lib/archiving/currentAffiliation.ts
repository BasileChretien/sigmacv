import { prisma } from "@/lib/db";
import { logger } from "@/lib/log";
import { bareRorId, ROR_ID_PATTERN } from "@/lib/ror/id";

/**
 * The country of the owner's current affiliation — the first visible current
 * position's ROR id, as ROR recorded it in the `Institution` table at sync — for
 * the worklist's "suggest places by your current affiliation" choice. Owner-only
 * (read by the `/cv` page); fails soft to undefined, in which case the worklist
 * simply offers the affiliation on each paper.
 */
export async function loadCurrentAffiliationCountry(
  visibleCurrentRorIds: readonly string[],
): Promise<string | undefined> {
  // `bareRorId` checks the ror.org IRI shape only ("junk" passes it); the id
  // pattern is what makes it a ROR id worth a query.
  const rorId = visibleCurrentRorIds
    .map((id) => bareRorId(id))
    .find((id): id is string => !!id && ROR_ID_PATTERN.test(id));
  if (!rorId) return undefined;
  try {
    const row = await prisma.institution.findUnique({
      where: { rorId },
      select: { country: true },
    });
    const code = row?.country?.trim().toUpperCase();
    return code && /^[A-Z]{2}$/.test(code) ? code : undefined;
  } catch (err) {
    logger.warn("archiving.current_affiliation_failed", { err });
    return undefined;
  }
}
