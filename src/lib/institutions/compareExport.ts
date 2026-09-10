import { absoluteUrl } from "@/lib/siteUrl";
import {
  SNAPSHOT_SKEW_DAYS,
  type CompareColumn,
  type CompareWithheld,
  type InstitutionComparison,
} from "./compare";
import { MIN_SHARE_DENOMINATOR } from "./oaShare";

/**
 * The comparison as data (`/i/compare.json?ror=a&ror=b[&ror=c]`): the same
 * organisations, years and COUNTS the page shows, and nothing the page would
 * refuse to state. No share, no percent, no difference — the division is the
 * reuser's, and each row says why the page itself states no share for it
 * (`notStatedBecause`), so a reuser can honour the same floor and the same
 * partial-year and skew rules. Counts only, as the stored snapshot is.
 *
 * Licence: the counts are OpenAlex's (CC0); this arrangement is thin, and is
 * released under CC0 too, with a citation REQUEST (a norm, not a condition)
 * carried in the envelope. The envelope names the method version so a reuser
 * can tell which rules produced it.
 */

/** Bumped whenever the rules behind the numbers change. */
export const COMPARE_METHOD_VERSION = "sigmacv-institution-comparison/v1";

export const CC0_URL = "https://creativecommons.org/publicdomain/zero/1.0/";

export interface ComparisonExportRow {
  year: number;
  /** Works with an OpenAlex status that year — the page's stated total. */
  worksWithStatus: number;
  /** Works OpenAlex records under any status but `closed`. */
  openCopies: number;
  /** Works OpenAlex found no open copy for. */
  noneFound: number;
  /** The year's status buckets, as stored (`closed` included). */
  byStatus: Record<string, number>;
  /** Why the page states no share for this row; null where it does. */
  notStatedBecause: CompareWithheld | null;
}

export interface ComparisonExportOrganisation {
  rorId: string;
  ror: string;
  name: string;
  country: string | null;
  openalexId: string;
  openalex: string;
  /** The OpenAlex entities whose works are counted (self + related + child). */
  foldedIds: string[];
  countedWorkTypes: string[];
  /** When the snapshot was read (ISO). */
  fetchedAt: string;
  years: { from: number; to: number };
  rows: ComparisonExportRow[];
  domains: CompareColumn["domains"] | null;
}

export interface ComparisonExport {
  method: string;
  license: "CC0-1.0";
  licenseUrl: string;
  /** A request, not a condition. */
  citation: string;
  note: string;
  /** The page's own thresholds and what each `notStatedBecause` token means,
   *  so a reuser can apply the same rules without reading the page. */
  rules: {
    minWorksWithStatus: number;
    snapshotSkewDays: number;
    notStatedBecause: Record<CompareWithheld, string>;
  };
  generatedAt: string;
  /** Full years every organisation's record covers. */
  commonYears: number[];
  /** True when the records were read too far apart for the page to state shares. */
  skewed: boolean;
  organisations: ComparisonExportOrganisation[];
  dropped: InstitutionComparison["dropped"];
}

const NOTE =
  "Counts as OpenAlex records them, arranged side by side; nothing here is divided, and a division is the reuser's, subject to the same floor, partial-year and skew rules the page applies (notStatedBecause). Not an assessment or endorsement of any organisation.";

/** The envelope for a resolved comparison (two or three organisations). */
export function comparisonExport(
  comparison: InstitutionComparison,
  generatedAt: Date,
): ComparisonExport {
  const dates = [...new Set(comparison.columns.map((c) => c.fetchedAt.slice(0, 10)))].sort();
  return {
    method: COMPARE_METHOD_VERSION,
    license: "CC0-1.0",
    licenseUrl: CC0_URL,
    citation: `Data: OpenAlex (CC0), Priem, Piwowar & Orr 2022, arXiv:2205.01833; snapshots of ${dates.join(", ")}. Method: SigmaCV institution comparison v1, ${absoluteUrl("i/compare")}.`,
    note: NOTE,
    rules: {
      minWorksWithStatus: MIN_SHARE_DENOMINATOR,
      snapshotSkewDays: SNAPSHOT_SKEW_DAYS,
      notStatedBecause: {
        "partial-year": "The snapshot's own fetch year, which is not over.",
        "small-denominator": "Fewer works with a status that year than minWorksWithStatus.",
        "snapshot-skew": "The organisations' snapshots were read more than snapshotSkewDays apart.",
      },
    },
    generatedAt: generatedAt.toISOString(),
    commonYears: comparison.commonYears,
    skewed: comparison.skewed,
    organisations: comparison.columns.map(organisationOf),
    dropped: comparison.dropped,
  };
}

function organisationOf(col: CompareColumn): ComparisonExportOrganisation {
  return {
    rorId: col.rorId,
    // `rorId` passed the bare-id shape upstream: the IRI is built, never passed through.
    ror: `https://ror.org/${col.rorId}`,
    name: col.name,
    country: col.country,
    openalexId: col.openalexId,
    // `openalexId` is the job's validated short id (`I…`): the URI is built, never passed through.
    openalex: `https://openalex.org/${col.openalexId}`,
    foldedIds: col.foldedIds,
    countedWorkTypes: col.countedWorkTypes,
    fetchedAt: col.fetchedAt,
    years: col.years,
    rows: col.rows.map((r) => ({
      year: r.year,
      worksWithStatus: r.known,
      openCopies: r.open,
      noneFound: r.closed,
      byStatus: r.statuses,
      notStatedBecause: r.withheld,
    })),
    domains: col.domains ?? null,
  };
}
