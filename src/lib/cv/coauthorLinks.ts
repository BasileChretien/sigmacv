import { prisma } from "@/lib/db";
import { visibleItems, visibleSections } from "@/lib/canonical/curate";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { normalizeOrcid } from "@/lib/openalex/types";

/**
 * A co-author who ALSO has their own published, search-indexable SigmaCV CV.
 * Surfaced only as a schema.org `knows` link in the public JSON-LD — never as an
 * inline citation hyperlink, and never name-matched.
 */
export interface CoauthorCvLink {
  /** Bare ORCID iD, e.g. "0000-0002-7483-2489". */
  orcid: string;
  /** The co-author's public CV slug (`/p/<slug>`). */
  slug: string;
  /** Display name for the `knows` Person node. */
  name: string;
}

/** Canonical bare-ORCID shape — guards the IRI built in the JSON-LD. */
const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
/** Server-minted public-slug shape (mirrors `isValidPublicSlug`, no app import). */
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
/** Bound the lookup so a hyper-authored CV can't issue an unbounded `IN (...)`. */
const MAX_LOOKUP_ORCIDS = 500;

/** Distinct co-author ORCIDs across the CV's VISIBLE items, minus the owner. */
function distinctCoauthorOrcids(cv: CanonicalCv): string[] {
  const ownerOrcid = normalizeOrcid(cv.owner.orcid);
  const out = new Set<string>();
  for (const section of visibleSections(cv)) {
    for (const item of visibleItems(section)) {
      for (const raw of item.meta.coauthorOrcids ?? []) {
        const orcid = normalizeOrcid(raw);
        if (orcid && orcid !== ownerOrcid && ORCID_RE.test(orcid)) out.add(orcid);
        if (out.size >= MAX_LOOKUP_ORCIDS) return [...out];
      }
    }
  }
  return [...out];
}

/**
 * Resolve which of a CV's co-authors also have their own published, search-
 * indexable SigmaCV CV — by ORCID identifier ONLY (never a name string).
 *
 * The `publicIndexable` gate is load-bearing: it is the co-author's own consent
 * to be publicly discoverable, so we only ever surface a link to a CV whose
 * owner opted into search indexing. Linking a published-but-unindexed page
 * would leak its unguessable capability URL — never do it.
 *
 * SERVER-SIDE ONLY — never exposed as a public ORCID→slug endpoint (that would
 * be a membership-enumeration oracle) — and FAIL-SOFT: any DB error yields an
 * empty list so a public render never breaks. The result is ephemeral: the
 * caller hands it to the JSON-LD builder; it is never persisted into the stored
 * document, so a co-author's unpublish / index-off / account deletion delinks
 * on the next render.
 */
export async function resolveCoauthorCvs(cv: CanonicalCv): Promise<CoauthorCvLink[]> {
  try {
    const orcids = distinctCoauthorOrcids(cv);
    if (orcids.length === 0) return [];
    const rows = await prisma.user.findMany({
      where: {
        orcid: { in: orcids },
        cv: { published: true, publicIndexable: true, publicSlug: { not: null } },
      },
      select: { orcid: true, name: true, cv: { select: { publicSlug: true } } },
    });
    const links: CoauthorCvLink[] = [];
    for (const row of rows) {
      const orcid = normalizeOrcid(row.orcid);
      const slug = row.cv?.publicSlug ?? "";
      if (!ORCID_RE.test(orcid) || !SLUG_RE.test(slug)) continue;
      links.push({ orcid, slug, name: row.name?.trim() || "Researcher" });
    }
    // Deterministic order (stable JSON-LD + render cache): by name, then ORCID.
    links.sort((a, b) => a.name.localeCompare(b.name) || a.orcid.localeCompare(b.orcid));
    return links;
  } catch {
    return [];
  }
}
