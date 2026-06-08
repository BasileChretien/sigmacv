import { workTopDecile } from "@/lib/openalex/deriveMetrics";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import { workToCsl } from "@/lib/openalex/toCsl";
import { normalizeOrcid, type OpenAlexWork } from "@/lib/openalex/types";
import {
  authorRoleLabel,
  isPeerReviewed,
  isPreprint,
  makeSelfMatcher,
  reviewFlagFor,
  selfNameVariants,
} from "./build";
import type { CvItem } from "./schema";

/**
 * Build a CvItem from a work the user is CLAIMING by DOI (a work OpenAlex didn't
 * attribute to their author profile). The metadata — year, citations, FWCI,
 * author position, peer-reviewed status — comes ENTIRELY from OpenAlex, so the
 * figures stay source-driven and un-paddable; only the *ownership* is asserted.
 *
 * Attribution: if the fetched work already carries the user's ORCID / OpenAlex
 * author id we use that (matchBasis orcid/openalex-id/both); otherwise the user
 * names which author is them (`selfAuthorIndex`) and matchBasis is "claimed".
 * Either way `meta.claimed` is set so re-sync preserves it and the
 * disambiguation study can use the false-negative correction signal.
 */

/** One author of a fetched work, for the "which author are you?" picker. */
export interface ClaimAuthor {
  /** 1-based position among the authors (what the authorship table reads). */
  position: number;
  /** Display name as printed on the work. */
  name: string;
  /** True when this authorship already carries the user's ORCID / OpenAlex id. */
  isSelfById: boolean;
}

/** The author list of a fetched work, for the picker. */
export function claimAuthors(work: OpenAlexWork, resolved: ResolvedAuthor): ClaimAuthor[] {
  const { matches } = makeSelfMatcher(resolved);
  return (work.authorships ?? []).map((a, i) => ({
    position: i + 1,
    name: a.author?.display_name ?? a.raw_author_name ?? `Author ${i + 1}`,
    isSelfById: matches(a),
  }));
}

/** 0-based index of the author identified by ORCID / OpenAlex id, or -1. */
export function selfIndexById(work: OpenAlexWork, resolved: ResolvedAuthor): number {
  const { matches } = makeSelfMatcher(resolved);
  return (work.authorships ?? []).findIndex(matches);
}

export interface ClaimOptions {
  /** 0-based author index the user asserted is them, when there's no id match. */
  selfAuthorIndex?: number;
}

/** Whether a claimed work belongs in the Preprints section (vs Publications). */
export function claimedIsPreprint(work: OpenAlexWork): boolean {
  return isPreprint(work);
}

export function buildClaimedItem(
  work: OpenAlexWork,
  resolved: ResolvedAuthor,
  opts: ClaimOptions = {},
): CvItem {
  const csl = workToCsl(work);
  const authorships = work.authorships ?? [];
  const { matches, basisFor } = makeSelfMatcher(resolved);

  const byId = authorships.findIndex(matches);
  let selfIndex = -1;
  let matchBasis: CvItem["meta"]["matchBasis"];
  if (byId >= 0) {
    selfIndex = byId;
    matchBasis = basisFor(authorships[byId]!) ?? undefined;
  } else if (
    opts.selfAuthorIndex !== undefined &&
    opts.selfAuthorIndex >= 0 &&
    opts.selfAuthorIndex < authorships.length
  ) {
    selfIndex = opts.selfAuthorIndex;
    matchBasis = "claimed";
  }

  const selfAuth = selfIndex >= 0 ? authorships[selfIndex] : undefined;
  const authoredBySelf = Boolean(selfAuth);

  // For a "claimed" (no-id) self-author the matcher won't flag it, so take the
  // printed name straight from the chosen author; otherwise use the id-matched
  // variants (covers every printed spelling on this work).
  const variants: string[] = !authoredBySelf
    ? []
    : matchBasis === "claimed"
      ? [selfAuth!.author?.display_name ?? selfAuth!.raw_author_name].filter((x): x is string =>
          Boolean(x),
        )
      : selfNameVariants(work, matches);

  return {
    id: csl.id,
    source: "openalex",
    sourceId: work.id,
    csl,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf,
    selfNameVariants: variants,
    meta: {
      year: work.publication_year ?? undefined,
      type: work.type ?? undefined,
      doi: csl.DOI,
      citedByCount: work.cited_by_count,
      fwci: typeof work.fwci === "number" ? work.fwci : undefined,
      topDecile: workTopDecile(work),
      oaStatus:
        work.open_access?.is_oa && work.open_access.oa_status
          ? work.open_access.oa_status
          : undefined,
      authorRole: authorRoleLabel(selfAuth),
      authorCount: authorships.length || undefined,
      authorPosition: authoredBySelf ? selfIndex + 1 : undefined,
      isCorresponding: selfAuth?.is_corresponding === true ? true : undefined,
      matchBasis,
      peerReviewed: isPeerReviewed(work),
      // The orcid-conflict heuristic only makes sense for an id match.
      reviewFlag:
        authoredBySelf && matchBasis !== "claimed"
          ? reviewFlagFor(selfAuth, normalizeOrcid(resolved.orcid))
          : undefined,
      claimed: true,
    },
  };
}
