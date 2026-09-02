import { summarizeSources, type SourceLine } from "@/lib/cv/sourceSummary";
import { sourceProvenanceStrings } from "@/lib/i18n/sourceProvenance";

interface SourceProvenanceProps {
  /** Raw per-source item counts from the build (`SyncReport.sourceCounts`). */
  sourceCounts?: Record<string, number>;
  locale: string;
  /** Start expanded (the preview shows off provenance; the editor collapses it). */
  defaultOpen?: boolean;
  /**
   * Jump to a name-matched source's outstanding review candidates. When
   * provided, each review chip becomes a button; when omitted (a read-only
   * context, or a source with nothing left to decide), chips stay plain text.
   * Same contract as CvHealthPanel's `onResolve` — the editor owns navigation.
   */
  onSelectSource?: (itemSource: string) => void;
  /** Sources with no outstanding candidates left; their chips stay static. */
  resolvedSources?: ReadonlySet<string>;
}

/**
 * "Where this came from" — the per-source provenance breakdown, split into
 * identifier-matched (auto-included) and name-matched (review) sources. Renders
 * nothing when the build reported no counts. Shared by the no-login preview and
 * the signed-in editor's sync report; source names are brand nouns (never
 * translated), the framing comes from i18n/sourceProvenance.ts.
 *
 * Review chips are actionable: the panel is where a user learns a source needs
 * decisions from them, so it is also where they should be able to go and make
 * them. Identifier-matched chips are not — those items are already on the CV,
 * so there is nothing to jump to.
 */
export default function SourceProvenance({
  sourceCounts,
  locale,
  defaultOpen = false,
  onSelectSource,
  resolvedSources,
}: SourceProvenanceProps) {
  const summary = summarizeSources(sourceCounts);
  if (!summary) return null;
  const s = sourceProvenanceStrings(locale);
  const tally = s.summary
    .replace("{items}", String(summary.total))
    .replace("{sources}", String(summary.searched));

  const chip = (l: SourceLine) => (
    <>
      <span className="src-prov-name">{l.label}</span>
      <span className="src-prov-count">{l.count}</span>
    </>
  );

  const staticChip = (l: SourceLine) => (
    <span key={`${l.group} ${l.label}`} className="src-prov-chip">
      {chip(l)}
    </span>
  );

  const reviewChip = (l: SourceLine) => {
    // Nothing to jump to: no handler, no mapped item source, or every candidate
    // from this source has already been confirmed or rejected.
    const actionable = onSelectSource && l.itemSource && !resolvedSources?.has(l.itemSource);
    if (!actionable) return staticChip(l);
    const itemSource = l.itemSource as string;
    return (
      <button
        key={`${l.group} ${l.label}`}
        type="button"
        className="src-prov-chip is-actionable"
        onClick={() => onSelectSource(itemSource)}
        aria-label={s.reviewJump.replace("{source}", l.label)}
      >
        {chip(l)}
      </button>
    );
  };

  return (
    <details className="src-prov" open={defaultOpen}>
      <summary className="src-prov-summary">
        <span className="src-prov-title">{s.title}</span>
        <span className="src-prov-tally muted">{tally}</span>
      </summary>
      <div className="src-prov-body">
        <div className="src-prov-group">
          <p className="src-prov-group-label">{s.autoIncluded}</p>
          <div className="src-prov-chips">{summary.identifier.map(staticChip)}</div>
        </div>
        {summary.review.length > 0 ? (
          <div className="src-prov-group is-review">
            <p className="src-prov-group-label">{s.needsReview}</p>
            <div className="src-prov-chips">{summary.review.map(reviewChip)}</div>
          </div>
        ) : null}
      </div>
    </details>
  );
}
