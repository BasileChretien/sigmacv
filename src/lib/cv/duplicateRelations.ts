import type { CanonicalCv } from "@/lib/canonical/schema";
import {
  annotateDuplicates,
  relationCandidateDois,
  type DoiRelation,
} from "@/lib/canonical/duplicates";
import { fetchCrossrefRelations } from "@/lib/crossref/client";

/**
 * Layer the Crossref `relation` (Tier-2) signal onto the duplicate annotations.
 *
 * The pure build already detected identifier (`exact`) + heuristic (`strong`/
 * `weak`) duplicates. This adds the authoritative preprint↔published-version
 * link, which identifier matching CAN'T catch (those have different DOIs). It is
 * TARGETED + bounded: only the DOIs of already-ambiguous fuzzy pairs are looked
 * up (so it's O(ambiguous pairs), not O(works)), and it fails soft — a Crossref
 * hiccup just leaves the heuristic verdict in place. Re-annotation is idempotent
 * (the detector always recomputes), so this upgrades the relevant pairs to the
 * `related` tier with a typed `preprint-of`/`version-of` relationship.
 */
export async function annotateDuplicatesWithRelations(
  cv: CanonicalCv,
  mailto: string,
): Promise<CanonicalCv> {
  const dois = relationCandidateDois(cv);
  if (dois.length === 0) return cv;

  // Per-call fail-soft: one failing lookup never loses the others, and a total
  // outage just leaves the build-time (identifier + heuristic) annotations.
  const results = await Promise.all(
    dois.map((d) => fetchCrossrefRelations(d, mailto).catch(() => [] as DoiRelation[])),
  );
  const relations = new Map<string, readonly DoiRelation[]>();
  dois.forEach((doi, i) => {
    const rels = results[i];
    if (rels && rels.length > 0) relations.set(doi, rels);
  });
  if (relations.size === 0) return cv;

  return annotateDuplicates(cv, { relations });
}
