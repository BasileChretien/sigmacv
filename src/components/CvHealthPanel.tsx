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
  /**
   * Whether the viewer is the OWNER of this document (the signed-in editor).
   * Gates the owner-only information line (the self-referencing share): the
   * anonymous no-login preview renders this same panel for a visitor looking at
   * someone else's public record, who must not see it. Default false = never
   * shown unless a caller asserts ownership.
   */
  ownerInsights?: boolean;
}

/**
 * Compact "needs your attention" checklist: outstanding review candidates,
 * unresolved duplicate hints, ORCID conflicts, and visible retracted works —
 * factual counts only (no score), so curation debt doesn't silently age inside
 * collapsed sections. Each row links to the first such item. Renders nothing
 * when there is nothing to do.
 *
 * For the owner it may also carry ONE information line that is not a to-do:
 * the self-referencing share of their papers (`cv/selfReference.ts`), a fact
 * some assessment panels look at. It is shown here and nowhere else — never on
 * a CV output or the public page.
 */
export default function CvHealthPanel({
  cv,
  locale,
  onResolve,
  onConfirmAllMisattributed,
  ownerInsights = false,
}: CvHealthPanelProps) {
  const wu = workspaceUi(locale);
  const health = useMemo(() => computeCvHealth(cv), [cv]);
  const selfRef = ownerInsights ? health.selfReference : undefined;
  // Nothing outstanding = nothing to show. The rows below are already the
  // precision-first suspect list (review candidates, duplicates, ORCID conflicts,
  // likely-misattributed, visible retractions); there is deliberately NO blanket
  // "you have N works left to review" figure. Asking a researcher to re-confirm
  // 115 publications the system has no reason to doubt is busywork, and it
  // contradicts misattribution.ts's whole precision-over-recall design.
  if (health.total === 0 && !selfRef) return null;

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

  const title = rows.length > 0 ? wu.hpTitle : wu.hpInfoTitle;
  const selfRefText = selfRef
    ? wu.hpSelfRef
        .replace(
          "{pct}",
          new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(
            selfRef.share,
          ),
        )
        .replace("{n}", new Intl.NumberFormat(locale).format(selfRef.works))
    : null;

  return (
    <aside className="cv-health-panel" role="note" aria-label={title}>
      <strong className="cv-health-title">{title}</strong>
      {rows.length > 0 ? (
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
      ) : null}
      {selfRefText ? (
        <p className="cv-health-info" data-owner-only="self-reference">
          {selfRefText}
        </p>
      ) : null}
      {rows.length > 0 ? <p className="muted cv-health-hint">{wu.hpHint}</p> : null}
    </aside>
  );
}
