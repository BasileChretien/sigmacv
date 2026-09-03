"use client";

import { useMemo } from "react";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { computeCvHealth, type CvHealthCategory } from "@/lib/cv/health";

// Re-exported so existing importers keep working; the definition lives beside
// the counts and the jump targets in lib/cv/health.ts.
export type { CvHealthCategory };
import type { Locale } from "@/lib/i18n";
import { workspaceUi } from "@/lib/i18n/workspaceUi";

interface CvHealthPanelProps {
  cv: CanonicalCv;
  locale: Locale;
  /**
   * Jump to the first outstanding item of a category — expand its section and
   * scroll it into view so the user can act. When provided, each checklist row
   * becomes a button; when omitted (e.g. a read-only context), rows are plain
   * text. The editor owns the navigation (section expand + scroll/focus).
   */
  onResolve?: (category: CvHealthCategory) => void;
  /**
   * Bulk "they're all mine" for the likely-misattributed row: confirm every flagged
   * work at once (keeps them shown, stops flagging). The safe escape hatch for a
   * high-namesake user facing several flags. When omitted, the shortcut is hidden.
   */
  onConfirmAllMisattributed?: () => void;
}

/**
 * Compact "needs your attention" checklist: outstanding review candidates,
 * unresolved duplicate hints, ORCID conflicts, and visible retracted works —
 * factual counts only (no score), so curation debt doesn't silently age inside
 * collapsed sections. Each row links to the first such item. Renders nothing
 * when there is nothing to do.
 */
export default function CvHealthPanel({
  cv,
  locale,
  onResolve,
  onConfirmAllMisattributed,
}: CvHealthPanelProps) {
  const wu = workspaceUi(locale);
  const health = useMemo(() => computeCvHealth(cv), [cv]);
  // Nothing outstanding = nothing to show. The rows below are already the
  // precision-first suspect list (review candidates, duplicates, ORCID conflicts,
  // likely-misattributed, visible retractions); there is deliberately NO blanket
  // "you have N works left to review" figure. Asking a researcher to re-confirm
  // 115 publications the system has no reason to doubt is busywork, and it
  // contradicts misattribution.ts's whole precision-over-recall design.
  if (health.total === 0) return null;

  const rows: Array<{ key: CvHealthCategory; count: number; label: string }> = [
    { key: "review" as const, count: health.pendingReviewCandidates, label: wu.hpReview },
    { key: "duplicates" as const, count: health.pendingDuplicates, label: wu.hpDuplicates },
    { key: "conflicts" as const, count: health.orcidConflicts, label: wu.hpConflicts },
    {
      key: "misattributed" as const,
      count: health.likelyMisattributed,
      label: wu.hpMisattributed,
    },
    { key: "retracted" as const, count: health.retractedVisible, label: wu.hpRetracted },
  ].filter((r) => r.count > 0);

  return (
    <aside className="cv-health-panel" role="note" aria-label={wu.hpTitle}>
      <strong className="cv-health-title">{wu.hpTitle}</strong>
      <ul className="cv-health-list">
        {rows.map((r) => {
          const text = r.label.replace("{n}", String(r.count));
          return (
            <li key={r.key}>
              {onResolve ? (
                <button
                  type="button"
                  className="cv-health-link"
                  onClick={() => onResolve(r.key)}
                  title={wu.hpHint}
                >
                  {text}
                </button>
              ) : (
                text
              )}
              {r.key === "misattributed" && onConfirmAllMisattributed ? (
                <button
                  type="button"
                  className="cv-health-bulk"
                  onClick={onConfirmAllMisattributed}
                  title={wu.hpMisAllMine}
                >
                  {wu.hpMisAllMine}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="muted cv-health-hint">{wu.hpHint}</p>
    </aside>
  );
}
