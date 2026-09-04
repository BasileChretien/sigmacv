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
  /**
   * The `CvItem["source"]` this key's items carry, so a provenance line can be
   * navigated back to the rows it counted. Set on review-group keys, where the
   * user has a decision to make; identifier-matched items are already on the CV
   * and need no jump.
   */
  itemSource?: string;
}

/**
 * Raw-key → display source. `orcid.*` all fold to "ORCID"; `crossref.grants` to
 * "Crossref". Identifier group = ORCID/DOI-matched (auto-included); review group =
 * name+org-matched registries/funders (surfaced as review candidates). `wikidata`
 * enriches owner identity (not a CV item) so it never appears in `sourceCounts`.
 */
const SOURCE_META: Record<string, SourceMeta> = {
  openalex: { label: "OpenAlex", group: "identifier" },
  // Live-stream alias: the build's `timed()` key for the works fetch is
  // "openalex.works", whereas the persisted `sourceCounts` folds it to "openalex".
  "openalex.works": { label: "OpenAlex", group: "identifier" },
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
  // Editorial roles whose ORCID the publisher printed on the masthead.
  oep: { label: "Open Editors Plus", group: "identifier" },
  // Editorial roles OEP attributed by inference — an ORCID propagated from
  // another row of the same unambiguous editor name, or an OpenAlex author id
  // resolved from name+institution. Still identifier-keyed, but the identifier
  // itself was inferred, so the user confirms them.
  "oep.candidates": { label: "Open Editors Plus", group: "review", itemSource: "oep" },
  datacite: { label: "DataCite", group: "identifier" },
  openaire: { label: "OpenAIRE", group: "identifier" },
  dblp: { label: "DBLP", group: "identifier" },
  "crossref.grants": { label: "Crossref", group: "identifier" },
  // Replication evidence (FReD/OSF): both DOIs are identifier data, never a name
  // match, so a hit is auto-included like the other identifier-group sources.
  forrt: { label: "FORRT", group: "identifier" },
  clinicaltrials: { label: "ClinicalTrials.gov", group: "review", itemSource: "clinicaltrials" },
  ctis: { label: "EU CTIS", group: "review", itemSource: "ctis" },
  ictrp: { label: "WHO ICTRP", group: "review", itemSource: "ictrp" },
  ukri: { label: "UKRI", group: "review", itemSource: "ukri" },
  nih: { label: "NIH", group: "review", itemSource: "nih" },
  nsf: { label: "NSF", group: "review", itemSource: "nsf" },
  epo: { label: "EPO", group: "review", itemSource: "epo" },
};

/**
 * Map a raw source key (a build `timed()` key OR a persisted `sourceCounts` key)
 * to its display source + match group, or `null` for keys that aren't user-facing
 * sources (the author-resolve prerequisite, Wikidata identity, unknown keys). The
 * streaming "searching open sources" view uses this to fold live ticks into rows.
 */
export function displaySource(key: string): { label: string; group: SourceGroup } | null {
  const meta = SOURCE_META[key];
  return meta ? { label: meta.label, group: meta.group } : null;
}

/** One display source's contribution. */
export interface SourceLine {
  label: string;
  count: number;
  group: SourceGroup;
  /** `CvItem["source"]` for this line's rows; absent when it isn't navigable. */
  itemSource?: string;
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
  //
  // Keyed by group AND label, not label alone: one source can contribute to
  // both columns. Open Editors Plus does — `oep` is identifier-matched (the
  // publisher printed the ORCID on the masthead) while `oep.candidates` is a
  // review tier (OEP inferred the identifier) — and keying on the label alone
  // silently summed the two into a single line under whichever group was seen
  // first, so the panel read "Open Editors Plus 2" beside "added
  // automatically" and never said one of them needed a decision. Keys sharing
  // a label AND a group still fold as intended (openalex/openalex.works, the
  // seven orcid.* keys).
  const byLine = new Map<string, SourceLine>();
  const searchedLabels = new Set<string>();
  for (const [key, rawCount] of Object.entries(sourceCounts)) {
    const meta = SOURCE_META[key];
    if (!meta) continue;
    // One source queried once, however many columns it lands in.
    searchedLabels.add(meta.label);
    const count = Number.isFinite(rawCount) && rawCount > 0 ? Math.floor(rawCount) : 0;
    const lineKey = `${meta.group} ${meta.label}`;
    const existing = byLine.get(lineKey);
    if (existing) existing.count += count;
    else
      byLine.set(lineKey, {
        label: meta.label,
        count,
        group: meta.group,
        itemSource: meta.itemSource,
      });
  }

  const lines = [...byLine.values()].filter((l) => l.count > 0);
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
