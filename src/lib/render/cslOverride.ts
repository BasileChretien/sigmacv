import type { CvItem } from "@/lib/canonical/schema";
import type { CslItem } from "@/types/csl";

/**
 * Apply the user's per-work bibliographic overrides (publication year, journal /
 * container name) to a citation item's CSL **before** it reaches citeproc, so the
 * correction appears identically in every output format — the load-bearing
 * "citations come only from citeproc" invariant. Renderers must feed citeproc the
 * result of this, never `item.csl` directly.
 *
 * Returns the item's CSL unchanged when it carries no overrides, and `undefined`
 * for a non-citation item (no CSL). The `id` is preserved so a caller's id→entry
 * map still keys correctly.
 */
export function cslForRender(item: Pick<CvItem, "csl" | "meta">): CslItem | undefined {
  const csl = item.csl;
  if (!csl) return undefined;
  const { yearOverride, venueOverride } = item.meta;
  const hasYear = typeof yearOverride === "number";
  const hasVenue = typeof venueOverride === "string" && venueOverride.length > 0;
  if (!hasYear && !hasVenue) return csl;
  const patched: CslItem = { ...csl };
  // Replace the whole date with a year-only date: the user is asserting the year,
  // and keeping a stale source month/day under a new year would be incoherent.
  if (hasYear) patched.issued = { "date-parts": [[yearOverride]] };
  if (hasVenue) patched["container-title"] = venueOverride;
  return patched;
}
