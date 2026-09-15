import type { CanonicalCv } from "@/lib/canonical/schema";
import { fetchAuthorRepositories } from "@/lib/openalex/repositories";
import { answeredWithin } from "./freshness";
import { ownerDepositRepositories } from "./repositoryDirectory";

/**
 * The OWNER sync's repository pass: the places the owner's works already sit
 * (`owner.depositRepositories`), for the worklist's "your other works are already
 * in HAL" deposit route. Called from `syncCvForUser` beside the self-archiving
 * pass, never from `buildCvFromOrcid` (which the anonymous preview shares).
 *
 * Two small OpenAlex calls (`openalex/repositories.ts`), and not again for
 * {@link DEPOSIT_REPOSITORIES_REFRESH_DAYS} days after an answer. Fail-soft: a
 * failed lookup keeps what the owner had; an answer replaces it (an empty answer
 * clears it). Stores the names and links only — never the counts.
 */

export const DEPOSIT_REPOSITORIES_REFRESH_DAYS = 7;

export async function enrichCvWithDepositRepositories(
  cv: CanonicalCv,
  now: string = new Date().toISOString(),
): Promise<CanonicalCv> {
  if (
    answeredWithin(cv.owner.depositRepositoriesCheckedAt, now, DEPOSIT_REPOSITORIES_REFRESH_DAYS)
  ) {
    return cv;
  }
  const sources = await fetchAuthorRepositories(cv.owner.openAlexAuthorIds);
  if (sources === undefined) return cv;
  const repositories = ownerDepositRepositories(sources);
  return {
    ...cv,
    owner: {
      ...cv.owner,
      depositRepositories: repositories.length > 0 ? repositories : undefined,
      depositRepositoriesCheckedAt: now,
    },
  };
}
