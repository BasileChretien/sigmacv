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
  middle: (i) =>
    (i.meta.authorPosition ?? 0) > 1 &&
    (i.meta.authorPosition ?? 0) < (i.meta.authorCount ?? 0),
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
 * caller didn't request are omitted; invalid role strings are ignored. The same
 * paper can satisfy several roles (e.g. 2nd author of 5 is both "second" and
 * "middle") — the user picks which rows to surface.
 */
export function authorshipCounts(
  cv: CanonicalCv,
  roles: readonly string[],
): AuthorshipCount[] {
  const items = cv.sections.flatMap((s) => s.items).filter(counts);
  return roles
    .filter((r): r is AuthorshipRole =>
      (AUTHORSHIP_ROLES as readonly string[]).includes(r),
    )
    .map((role) => ({
      role,
      label: AUTHORSHIP_ROLE_LABELS[role],
      count: items.filter(PREDICATES[role]).length,
    }));
}
