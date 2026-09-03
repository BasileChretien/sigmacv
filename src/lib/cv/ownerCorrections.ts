import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";

/**
 * HONOUR A RESEARCHER'S OWN DISAMBIGUATION CORRECTIONS IN THE ANONYMOUS PREVIEW.
 *
 * `/preview/[orcid]` builds a CV fresh from public sources for whatever iD was
 * typed. That build is raw machine output: OpenAlex tunes author disambiguation
 * for recall, so some works belong to a namesake. If the researcher has a SigmaCV
 * account and has already ruled on those works, their judgement is better than any
 * heuristic we compute — and throwing it away means showing a visitor an
 * uncorrected list we know to be wrong.
 *
 * ── THE PRIVACY LINE, AND WHY IT SITS HERE ────────────────────────────────────
 * A stored CV is PRIVATE unless published, and this runs for an anonymous viewer.
 * So only two kinds of correction are read, and both are chosen because every
 * application of them REMOVES something from what a stranger sees:
 *
 *   - `notMine` — a factual correction to public data ("this is not my paper").
 *     Honouring it DROPS the work. Strictly less exposure, and it protects the
 *     subject from being credited with a stranger's work.
 *   - `reviewedAt` — the owner examined the work and kept it. Honouring it CLEARS
 *     the doubt flag. Strictly less doubt shown about them.
 *
 * Deliberately NOT read: `included` (a display choice about CV length, not a
 * correction — applying it would misrepresent the record and leak editorial
 * decisions), `notes`, `presets`, contact fields, or anything else. Nothing here
 * can ever ADD an item, a field, or a flag to what the anonymous viewer sees.
 *
 * This module is PURE — the database read lives in `fetchOwnerCorrections.ts`, so
 * a caller that only needs the transform (a component test, for instance) does not
 * pull in a database client and its environment validation.
 */

export interface OwnerCorrections {
  /** Item ids the owner asserted are not theirs. */
  notMineIds: ReadonlySet<string>;
  /** Lowercased DOIs of those works — ids can differ between builds, DOIs do not. */
  notMineDois: ReadonlySet<string>;
  /** Item ids the owner examined and kept. */
  confirmedIds: ReadonlySet<string>;
  /** Lowercased DOIs of those works. */
  confirmedDois: ReadonlySet<string>;
}

/** No corrections — the shape returned when there is no account, or on any fault. */
export const NO_CORRECTIONS: OwnerCorrections = {
  notMineIds: new Set(),
  notMineDois: new Set(),
  confirmedIds: new Set(),
  confirmedDois: new Set(),
};

/** True when no correction would change anything — lets callers skip the pass. */
export function hasCorrections(c: OwnerCorrections): boolean {
  return (
    c.notMineIds.size > 0 ||
    c.notMineDois.size > 0 ||
    c.confirmedIds.size > 0 ||
    c.confirmedDois.size > 0
  );
}

/** Normalized DOI for matching: lowercased, doi.org prefix removed. Shared with
 *  the reader so both halves compare the same way. */
export function doiOf(item: CvItem): string | undefined {
  const raw = item.meta.doi ?? item.csl?.DOI;
  return raw
    ? raw
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\/(dx\.)?doi\.org\//, "")
    : undefined;
}

/** Whether the owner ruled this work out. */
function isRejected(item: CvItem, c: OwnerCorrections): boolean {
  if (c.notMineIds.has(item.id)) return true;
  const doi = doiOf(item);
  return doi ? c.notMineDois.has(doi) : false;
}

/** Whether the owner examined this work and kept it. */
function isConfirmed(item: CvItem, c: OwnerCorrections): boolean {
  if (c.confirmedIds.has(item.id)) return true;
  const doi = doiOf(item);
  return doi ? c.confirmedDois.has(doi) : false;
}

/**
 * Apply the owner's corrections to a freshly-built preview CV.
 *
 * Rejected works are REMOVED; confirmed works keep their place but lose the doubt
 * flag, because the person whose work it is has already answered the question the
 * flag asks. Pure + immutable; returns the input unchanged when nothing applies.
 */
export function applyOwnerCorrections(cv: CanonicalCv, c: OwnerCorrections): CanonicalCv {
  if (!hasCorrections(c)) return cv;
  return {
    ...cv,
    sections: cv.sections.map((section) => ({
      ...section,
      items: section.items
        .filter((item) => !isRejected(item, c))
        .map((item) =>
          isConfirmed(item, c)
            ? { ...item, meta: { ...item.meta, reviewFlag: undefined, misattribution: undefined } }
            : item,
        ),
    })),
  };
}
