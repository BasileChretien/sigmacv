import type { CanonicalCv } from "@/lib/canonical/schema";
import { provenanceLedger } from "@/lib/cv/provenanceLedger";
import { summarizeSources, type SourceLine } from "@/lib/cv/sourceSummary";
import { renderStrings } from "@/lib/i18n/render";
import { sourceProvenanceStrings } from "@/lib/i18n/sourceProvenance";
import { ledgerLines } from "@/lib/render/provenanceLedgerHtml";

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
  /**
   * The document, for the provenance LEDGER (`cv/provenanceLedger.ts`): how
   * verifiable what it shows is, line by line with denominators. Omitted → no
   * ledger (the per-source breakdown alone). Must be the stored document or the
   * preview projection — both keep the attribution/review signals the ledger
   * counts; the public projection does not.
   */
  cv?: CanonicalCv | null;
}

/**
 * "Where this came from" — the per-source provenance breakdown, split into
 * identifier-matched (auto-included) and name-matched (review) sources, and,
 * when the document is supplied, the provenance ledger beneath it. Renders
 * nothing when the build reported no counts. Shared by the no-login preview and
 * the signed-in editor's sync report; source names are brand nouns (never
 * translated), the framing comes from i18n/sourceProvenance.ts and the ledger
 * labels from i18n/render.ts (the same lines the opt-in CV footer prints).
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
  cv,
}: SourceProvenanceProps) {
  const summary = summarizeSources(sourceCounts);
  if (!summary) return null;
  const s = sourceProvenanceStrings(locale);
  const tally = s.summary
    .replace("{items}", String(summary.total))
    .replace("{sources}", String(summary.searched));
  const rs = renderStrings(locale);
  const ledger = cv ? ledgerLines(provenanceLedger(cv), locale) : [];

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
        {ledger.length > 0 ? (
          <div className="src-prov-group src-prov-ledger-group">
            <p className="src-prov-group-label">{rs.provLedgerTitle}</p>
            <table className="src-prov-ledger">
              <tbody>
                {ledger.map((l) => (
                  <tr key={l.key} data-ledger={l.key}>
                    <td>{l.label}</td>
                    <td className="src-prov-ledger-figure">{l.figure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted src-prov-ledger-note">{rs.provLedgerNote}</p>
          </div>
        ) : null}
      </div>
    </details>
  );
}
