import { prisma } from "@/lib/db";
import { validOrcidOrNull } from "@/lib/orcid/validate";

/**
 * Resolve the published SigmaCV page of the researcher an anonymous preview is
 * about — if, and only if, they published it AND opted into search indexing.
 *
 * The no-login preview is raw machine output; when the researcher has already
 * curated and published their own page, a visitor should be pointed at THAT.
 * The predicate is deliberately the sitemap's own
 * (`published && publicIndexable && publicSlug`): it surfaces exactly the URLs
 * that are already public and discoverable, so this leaks nothing new. Any
 * narrower state — "has an account", "published but not indexable" — must
 * never be revealed here: `publicIndexable` is the owner's consent to be
 * findable, and an unindexed slug is an unguessable capability URL (see
 * `coauthorLinks.ts`, which applies the same rule to co-author links).
 *
 * Resolved at REQUEST time by the page, never inside the cached preview build:
 * an unpublish or index-off takes effect on the next request, not after the
 * cache TTL. SERVER-SIDE ONLY, never a public ORCID→slug endpoint (that would be
 * a membership-enumeration oracle). FAIL-SOFT: any error yields `null`, and the
 * page renders identically whether the lookup ran or not.
 */
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

export async function resolvePublishedPreviewLink(rawOrcid: string): Promise<string | null> {
  try {
    // Checksum-valid canonical form or nothing: a malformed iD never reaches the DB.
    const orcid = validOrcidOrNull(rawOrcid);
    if (!orcid) return null;
    const row = await prisma.user.findUnique({
      where: { orcid },
      select: { cv: { select: { published: true, publicIndexable: true, publicSlug: true } } },
    });
    const cv = row?.cv;
    if (!cv?.published || !cv.publicIndexable) return null;
    const slug = cv.publicSlug ?? "";
    if (!SLUG_RE.test(slug)) return null;
    return `/p/${slug}`;
  } catch {
    return null;
  }
}
