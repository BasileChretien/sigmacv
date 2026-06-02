import { fetchAuthorsByOrcid } from "./client";
import { normalizeOrcid, shortId } from "./types";

export interface ResolvedAuthorMetrics {
  "2yr_mean_citedness"?: number;
  h_index?: number;
  i10_index?: number;
  works_count?: number;
  cited_by_count?: number;
}

export interface ResolvedAuthor {
  /** Bare ORCID iD. */
  orcid: string;
  /** All OpenAlex author short ids for this iD (primary first). */
  authorIds: string[];
  /** Best display name (from the record with the most works). */
  displayName: string;
  /** Metrics from the primary (most-works) record. Approximate if one iD maps
   *  to several author records. */
  metrics?: ResolvedAuthorMetrics;
}

/**
 * Resolve an ORCID iD to its OpenAlex author identifier(s).
 *
 * One ORCID can map to several OpenAlex author records (disambiguation
 * imperfections). We return ALL of them — works are pulled across the whole set
 * and self-highlighting matches against every id — and treat the record with
 * the most works as primary for the display name.
 */
export async function resolveAuthorByOrcid(
  orcid: string,
): Promise<ResolvedAuthor | null> {
  const authors = await fetchAuthorsByOrcid(orcid);
  if (authors.length === 0) return null;

  const sorted = [...authors].sort(
    (a, b) => (b.works_count ?? 0) - (a.works_count ?? 0),
  );

  const authorIds = sorted.map((a) => shortId(a.id)).filter(Boolean);
  const primary = sorted[0];
  const displayName = primary?.display_name ?? "";

  const metrics: ResolvedAuthorMetrics | undefined = primary
    ? {
        "2yr_mean_citedness": primary.summary_stats?.["2yr_mean_citedness"],
        h_index: primary.summary_stats?.h_index,
        i10_index: primary.summary_stats?.i10_index,
        works_count: primary.works_count,
        cited_by_count: primary.cited_by_count,
      }
    : undefined;

  return {
    orcid: normalizeOrcid(orcid),
    authorIds,
    displayName,
    metrics,
  };
}
