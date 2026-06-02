/**
 * Minimal typings for the subset of the OpenAlex API we consume.
 * Full schema: https://docs.openalex.org/api-entities/works/work-object
 */

export interface OpenAlexSummaryStats {
  "2yr_mean_citedness"?: number;
  h_index?: number;
  i10_index?: number;
}

export interface OpenAlexAuthorAffiliation {
  institution?: { id?: string; display_name?: string | null } | null;
  /** Years the author was affiliated, per OpenAlex (descending). */
  years?: number[];
}

export interface OpenAlexCountsByYear {
  year: number;
  works_count?: number;
  cited_by_count?: number;
}

export interface OpenAlexAuthor {
  /** URL form, e.g. "https://openalex.org/A5001069481". */
  id: string;
  display_name?: string;
  /** URL form, e.g. "https://orcid.org/0000-0002-7483-2489". */
  orcid?: string | null;
  works_count?: number;
  cited_by_count?: number;
  summary_stats?: OpenAlexSummaryStats;
  /** Institutions inferred from the author's works (supplements ORCID positions). */
  affiliations?: OpenAlexAuthorAffiliation[];
  /** Per-year works + citation counts (drives the optional mini charts). */
  counts_by_year?: OpenAlexCountsByYear[];
}

export interface OpenAlexAuthorship {
  author_position?: string;
  author?: {
    id?: string;
    display_name?: string;
    orcid?: string | null;
  };
  /** Name exactly as printed on the work. */
  raw_author_name?: string;
}

export interface OpenAlexSource {
  id?: string;
  display_name?: string;
  issn_l?: string | null;
  type?: string;
}

export interface OpenAlexWork {
  /** URL form, e.g. "https://openalex.org/W2741809807". */
  id: string;
  doi?: string | null;
  title?: string | null;
  display_name?: string | null;
  publication_year?: number | null;
  publication_date?: string | null;
  type?: string | null;
  type_crossref?: string | null;
  language?: string | null;
  cited_by_count?: number;
  /** Field-Weighted Citation Impact for this work (not always populated). */
  fwci?: number | null;
  /** Percentile of citations for the work's field+year (value 0..100). */
  cited_by_percentile_year?: { min?: number; max?: number; value?: number } | null;
  authorships?: OpenAlexAuthorship[];
  primary_location?: { source?: OpenAlexSource | null } | null;
  biblio?: {
    volume?: string | null;
    issue?: string | null;
    first_page?: string | null;
    last_page?: string | null;
  } | null;
  ids?: {
    openalex?: string;
    doi?: string;
    pmid?: string;
    mag?: string;
  } | null;
}

export interface OpenAlexListResponse<T> {
  results: T[];
  meta?: {
    count?: number;
    next_cursor?: string | null;
    per_page?: number;
  };
}

/** "https://openalex.org/A5001069481" → "A5001069481". */
export function shortId(url: string | undefined | null): string {
  if (!url) return "";
  const trimmed = url.trim().replace(/\/+$/, "");
  const slash = trimmed.lastIndexOf("/");
  return slash >= 0 ? trimmed.slice(slash + 1) : trimmed;
}

/** Normalize any ORCID form to the bare iD "0000-0002-7483-2489". */
export function normalizeOrcid(orcid: string | undefined | null): string {
  if (!orcid) return "";
  const m = /(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i.exec(orcid);
  const captured = m?.[1];
  return captured ? captured.toUpperCase() : orcid.trim();
}
