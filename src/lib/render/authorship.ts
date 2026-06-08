import {
  AUTHORSHIP_ROLE_LABELS,
  AUTHORSHIP_ROLES,
  type AuthorshipRole,
  type CanonicalCv,
  type CvItem,
} from "@/lib/canonical/schema";
import { countableWorks } from "./countable";

/** One row of the authorship-summary table. */
export interface AuthorshipCount {
  role: AuthorshipRole;
  label: string;
  count: number;
  /** Own publications the percentage is taken over (same for every row — it's
   *  the denominator, surfaced so callers needn't recompute). */
  total: number;
  /** count / total as a whole percent (0 when total is 0). */
  percent: number;
}

/**
 * The SINGLE position role a paper's self-author falls into, so the position
 * roles PARTITION the corpus — each paper counts once, and the shares sum to
 * 100% (modulo rounding) when all are shown. Precedence: first wins position 1,
 * last wins the final position (so 2nd-of-2 is the senior LAST author, not a
 * "second" author), then the front ordinals (second, third) win ties over
 * second-to-last; the remaining interior positions are the generic "k-th"
 * middle (4 ≤ p ≤ authorCount − 2). "corresponding" is NOT a position role.
 */
function positionRole(i: CvItem): AuthorshipRole | null {
  const p = i.meta.authorPosition ?? 0;
  const n = i.meta.authorCount ?? 0;
  /* v8 ignore next -- defensive: counted items always carry a self position */
  if (p < 1 || n < 1) return null;
  if (p === 1) return "first";
  if (p === n) return "last";
  if (p === 2) return "second";
  if (p === 3) return "third";
  if (p === n - 1) return "second-last";
  return "middle";
}

const PREDICATES: Record<AuthorshipRole, (item: CvItem) => boolean> = {
  first: (i) => positionRole(i) === "first",
  second: (i) => positionRole(i) === "second",
  third: (i) => positionRole(i) === "third",
  middle: (i) => positionRole(i) === "middle",
  "second-last": (i) => positionRole(i) === "second-last",
  last: (i) => positionRole(i) === "last",
  // Orthogonal to position (a paper can be first AND corresponding), so it is
  // deliberately outside the partition and may overlap any position role.
  corresponding: (i) => i.meta.isCorresponding === true,
};

/**
 * Count the account holder's own publications by the requested authorship roles.
 * The counted set follows the figures' rule (see countableWorks): kept works,
 * preprints excluded, letters/non-peer-reviewed included only when the
 * `countLetters` option is on. Roles the caller didn't request are omitted;
 * invalid role strings are ignored. The six POSITION roles are mutually
 * exclusive (see positionRole) so their shares sum to 100% when all are shown;
 * "corresponding" is orthogonal and may overlap.
 */
export function authorshipCounts(cv: CanonicalCv, roles: readonly string[]): AuthorshipCount[] {
  const items = countableWorks(cv).filter((it) => it.authoredBySelf);
  const total = items.length;
  return roles
    .filter((r): r is AuthorshipRole => (AUTHORSHIP_ROLES as readonly string[]).includes(r))
    .map((role) => {
      const count = items.filter(PREDICATES[role]).length;
      return {
        role,
        label: AUTHORSHIP_ROLE_LABELS[role],
        count,
        total,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });
}
