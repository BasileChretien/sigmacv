/**
 * Collapse a build's raw per-source item counts (`SyncReport.sourceCounts`) into a
 * human-facing provenance summary: which open sources contributed, how many items
 * each returned, split by HOW the user was matched.
 *
 * The split is load-bearing (see the top-level CLAUDE.md): **identifier-matched**
 * sources (ORCID/DOI) are auto-included; **name+org-matched** registries/funders
 * are review candidates. Surfacing that split is the honest-provenance angle — we
 * never silently pass off a name match as a confirmed one.
 *
 * The raw keys are finer-grained than a user needs (`orcid.positions`,
 * `orcid.fundings`, … `crossref.grants`); this folds each family down to the one
 * source name a reader recognises. Source names are brand proper nouns kept in
 * code here (never translated) — the surrounding chrome is localised separately in
 * i18n/sourceProvenance.ts.
 */

/** How the account holder was matched to a source's items. */
export type SourceGroup = "identifier" | "review";

/** Display metadata for a raw `sourceCounts` key. */
interface SourceMeta {
  /** Brand proper noun shown to the user (never localised). */
  label: string;
  group: SourceGroup;
}

/**
 * Raw-key → display source. `orcid.*` all fold to "ORCID"; `crossref.grants` to
 * "Crossref". Identifier group = ORCID/DOI-matched (auto-included); review group =
 * name+org-matched registries/funders (surfaced as review candidates). `wikidata`
 * enriches owner identity (not a CV item) so it never appears in `sourceCounts`.
 */
const SOURCE_META: Record<string, SourceMeta> = {
  openalex: { label: "OpenAlex", group: "identifier" },
  "orcid.positions": { label: "ORCID", group: "identifier" },
  "orcid.fundings": { label: "ORCID", group: "identifier" },
  "orcid.invited": { label: "ORCID", group: "identifier" },
  "orcid.education": { label: "ORCID", group: "identifier" },
  "orcid.distinctions": { label: "ORCID", group: "identifier" },
  "orcid.service": { label: "ORCID", group: "identifier" },
  "orcid.peerReviews": { label: "ORCID", group: "identifier" },
  "orcid.discovery": { label: "ORCID", group: "identifier" },
  // ORCID self-asserted patents: identifier-matched (the owner's own iD), so the
  // AUTO-INCLUDED patent lane — distinct from EPO's name-matched review lane below.
  "orcid.patents": { label: "ORCID", group: "identifier" },
  oep: { label: "Open Editors Plus", group: "identifier" },
  datacite: { label: "DataCite", group: "identifier" },
  openaire: { label: "OpenAIRE", group: "identifier" },
  dblp: { label: "DBLP", group: "identifier" },
  "crossref.grants": { label: "Crossref", group: "identifier" },
  clinicaltrials: { label: "ClinicalTrials.gov", group: "review" },
  ctis: { label: "EU CTIS", group: "review" },
  ictrp: { label: "WHO ICTRP", group: "review" },
  ukri: { label: "UKRI", group: "review" },
  nih: { label: "NIH", group: "review" },
  nsf: { label: "NSF", group: "review" },
  epo: { label: "EPO", group: "review" },
};

/** One display source's contribution. */
export interface SourceLine {
  label: string;
  count: number;
  group: SourceGroup;
}

/** A build's provenance, ready to render. */
export interface SourceSummary {
  /** Total items contributed across every source. */
  total: number;
  /** Distinct display sources we queried (whether or not they returned items). */
  searched: number;
  /** Identifier-matched sources that returned ≥1 item (count desc, then name). */
  identifier: SourceLine[];
  /** Name+org-matched sources that returned ≥1 item (count desc, then name). */
  review: SourceLine[];
}

/**
 * Fold raw `sourceCounts` into a {@link SourceSummary}, or `null` when there's
 * nothing to show (no counts, or every source returned zero). Unknown keys are
 * ignored (forward-compatible with new sources added before this map is updated).
 */
export function summarizeSources(
  sourceCounts: Record<string, number> | undefined,
): SourceSummary | null {
  if (!sourceCounts) return null;

  // Fold raw keys into display sources, summing counts and tracking which
  // distinct sources we actually queried (a present key = a source we hit).
  const byLabel = new Map<string, SourceLine>();
  const searchedLabels = new Set<string>();
  for (const [key, rawCount] of Object.entries(sourceCounts)) {
    const meta = SOURCE_META[key];
    if (!meta) continue;
    searchedLabels.add(meta.label);
    const count = Number.isFinite(rawCount) && rawCount > 0 ? Math.floor(rawCount) : 0;
    const existing = byLabel.get(meta.label);
    if (existing) existing.count += count;
    else byLabel.set(meta.label, { label: meta.label, count, group: meta.group });
  }

  const lines = [...byLabel.values()].filter((l) => l.count > 0);
  const total = lines.reduce((n, l) => n + l.count, 0);
  if (total === 0) return null;

  const sortLines = (g: SourceGroup) =>
    lines
      .filter((l) => l.group === g)
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return {
    total,
    searched: searchedLabels.size,
    identifier: sortLines("identifier"),
    review: sortLines("review"),
  };
}
