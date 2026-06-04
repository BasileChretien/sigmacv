import {
  AUTHORSHIP_ROLE_LABELS,
  AUTHORSHIP_ROLES,
  type AuthorshipRole,
  type CanonicalCv,
  type CvItem,
} from "@/lib/canonical/schema";

/** One row of the authorship-summary table. */
export interface AuthorshipCount {
  role: AuthorshipRole;
  label: string;
  count: number;
  /** Peer-reviewed own publications the percentage is taken over (same for
   *  every row — it's the denominator, surfaced so callers needn't recompute). */
  total: number;
  /** count / total as a whole percent (0 when total is 0). */
  percent: number;
}

/** A citation entry that counts toward authorship: the user's own, shown, and
 *  PEER-REVIEWED (preprints / non-peer-reviewed are excluded by definition). */
function counts(item: CvItem): boolean {
  return (
    Boolean(item.csl) &&
    item.authoredBySelf &&
    item.included &&
    !item.notMine &&
    item.meta.peerReviewed !== false
  );
}

const PREDICATES: Record<AuthorshipRole, (item: CvItem) => boolean> = {
  first: (i) => i.meta.authorPosition === 1,
  second: (i) => i.meta.authorPosition === 2,
  third: (i) => i.meta.authorPosition === 3,
  // "k-th author": a generic middle position — every position EXCEPT first,
  // second, third, second-to-last and last. So p with 4 ≤ p ≤ authorCount − 2.
  // (NOT a superset of second/third/second-to-last; those are broken out.)
  middle: (i) => {
    const p = i.meta.authorPosition ?? 0;
    const n = i.meta.authorCount ?? 0;
    return p >= 4 && p <= n - 2;
  },
  "second-last": (i) =>
    (i.meta.authorCount ?? 0) > 2 &&
    i.meta.authorPosition === (i.meta.authorCount ?? 0) - 1,
  last: (i) =>
    (i.meta.authorCount ?? 0) > 1 &&
    i.meta.authorPosition === (i.meta.authorCount ?? 0),
  corresponding: (i) => i.meta.isCorresponding === true,
};

/**
 * Count peer-reviewed publications by the requested authorship roles. Roles the
 * caller didn't request are omitted; invalid role strings are ignored. A paper
 * can still satisfy a couple of roles (e.g. 3rd author of 4 is both "third" and
 * "second-to-last") — the user picks which rows to surface.
 */
export function authorshipCounts(
  cv: CanonicalCv,
  roles: readonly string[],
): AuthorshipCount[] {
  const items = cv.sections.flatMap((s) => s.items).filter(counts);
  const total = items.length;
  return roles
    .filter((r): r is AuthorshipRole =>
      (AUTHORSHIP_ROLES as readonly string[]).includes(r),
    )
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
