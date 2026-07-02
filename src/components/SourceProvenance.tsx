import { summarizeSources, type SourceLine } from "@/lib/cv/sourceSummary";
import { sourceProvenanceStrings } from "@/lib/i18n/sourceProvenance";

interface SourceProvenanceProps {
  /** Raw per-source item counts from the build (`SyncReport.sourceCounts`). */
  sourceCounts?: Record<string, number>;
  locale: string;
  /** Start expanded (the preview shows off provenance; the editor collapses it). */
  defaultOpen?: boolean;
}

function chips(lines: SourceLine[]) {
  return lines.map((l) => (
    <span key={l.label} className="src-prov-chip">
      <span className="src-prov-name">{l.label}</span>
      <span className="src-prov-count">{l.count}</span>
    </span>
  ));
}

/**
 * "Where this came from" — the per-source provenance breakdown, split into
 * identifier-matched (auto-included) and name-matched (review) sources. Renders
 * nothing when the build reported no counts. Shared by the no-login preview and
 * the signed-in editor's sync report; source names are brand nouns (never
 * translated), the framing comes from i18n/sourceProvenance.ts.
 */
export default function SourceProvenance({
  sourceCounts,
  locale,
  defaultOpen = false,
}: SourceProvenanceProps) {
  const summary = summarizeSources(sourceCounts);
  if (!summary) return null;
  const s = sourceProvenanceStrings(locale);
  const tally = s.summary
    .replace("{items}", String(summary.total))
    .replace("{sources}", String(summary.searched));

  return (
    <details className="src-prov" open={defaultOpen}>
      <summary className="src-prov-summary">
        <span className="src-prov-title">{s.title}</span>
        <span className="src-prov-tally muted">{tally}</span>
      </summary>
      <div className="src-prov-body">
        <div className="src-prov-group">
          <p className="src-prov-group-label">{s.autoIncluded}</p>
          <div className="src-prov-chips">{chips(summary.identifier)}</div>
        </div>
        {summary.review.length > 0 ? (
          <div className="src-prov-group is-review">
            <p className="src-prov-group-label">{s.needsReview}</p>
            <div className="src-prov-chips">{chips(summary.review)}</div>
          </div>
        ) : null}
      </div>
    </details>
  );
}
