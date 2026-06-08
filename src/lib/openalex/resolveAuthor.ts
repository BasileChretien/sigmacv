import { fetchAuthorsByOrcid } from "./client";
import { normalizeOrcid, shortId } from "./types";

export interface ResolvedAuthorMetrics {
  "2yr_mean_citedness"?: number;
  h_index?: number;
  i10_index?: number;
  works_count?: number;
  cited_by_count?: number;
}

/** Institution + year-range inferred from OpenAlex (supplements ORCID positions). */
export interface ResolvedAffiliation {
  institution: string;
  startYear?: number;
  endYear?: number;
  /** ROR id of the canonicalized institution, set during ROR enrichment. */
  rorId?: string;
}

/** Per-year works + citation counts for the optional mini charts. */
export interface ResolvedCountsByYear {
  year: number;
  works: number;
  citations: number;
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
  /** Institutions from the primary record (supplements ORCID employments). */
  affiliations?: ResolvedAffiliation[];
  /** Per-year works/citations from the primary record (for the mini charts). */
  countsByYear?: ResolvedCountsByYear[];
}

/**
 * Resolve an ORCID iD to its OpenAlex author identifier(s).
 *
 * One ORCID can map to several OpenAlex author records (disambiguation
 * imperfections). We return ALL of them — works are pulled across the whole set
 * and self-highlighting matches against every id — and treat the record with
 * the most works as primary for the display name.
 */
export async function resolveAuthorByOrcid(orcid: string): Promise<ResolvedAuthor | null> {
  const authors = await fetchAuthorsByOrcid(orcid);
  if (authors.length === 0) return null;

  const sorted = [...authors].sort((a, b) => (b.works_count ?? 0) - (a.works_count ?? 0));

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

  const affiliations: ResolvedAffiliation[] = [];
  for (const a of primary?.affiliations ?? []) {
    const institution = a.institution?.display_name?.trim();
    if (!institution) continue;
    const years = (a.years ?? []).filter((y): y is number => typeof y === "number");
    affiliations.push({
      institution,
      startYear: years.length ? Math.min(...years) : undefined,
      endYear: years.length ? Math.max(...years) : undefined,
    });
  }

  const countsByYear: ResolvedCountsByYear[] = (primary?.counts_by_year ?? [])
    .map((c) => ({
      year: c.year,
      works: c.works_count ?? 0,
      citations: c.cited_by_count ?? 0,
    }))
    .sort((a, b) => a.year - b.year);

  return {
    orcid: normalizeOrcid(orcid),
    authorIds,
    displayName,
    metrics,
    affiliations,
    countsByYear,
  };
}
