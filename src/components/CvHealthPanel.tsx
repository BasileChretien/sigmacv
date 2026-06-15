"use client";

import { useMemo } from "react";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { computeCvHealth } from "@/lib/cv/health";
import type { Locale } from "@/lib/i18n";
import { workspaceUi } from "@/lib/i18n/workspaceUi";

/** The four outstanding-decision categories the panel surfaces. */
export type CvHealthCategory = "review" | "duplicates" | "conflicts" | "retracted";

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
}

/**
 * Compact "needs your attention" checklist: outstanding review candidates,
 * unresolved duplicate hints, ORCID conflicts, and visible retracted works —
 * factual counts only (no score), so curation debt doesn't silently age inside
 * collapsed sections. Each row links to the first such item. Renders nothing
 * when there is nothing to do.
 */
export default function CvHealthPanel({ cv, locale, onResolve }: CvHealthPanelProps) {
  const wu = workspaceUi(locale);
  const health = useMemo(() => computeCvHealth(cv), [cv]);
  if (health.total === 0) return null;

  const rows: Array<{ key: CvHealthCategory; count: number; label: string }> = [
    { key: "review" as const, count: health.pendingReviewCandidates, label: wu.hpReview },
    { key: "duplicates" as const, count: health.pendingDuplicates, label: wu.hpDuplicates },
    { key: "conflicts" as const, count: health.orcidConflicts, label: wu.hpConflicts },
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
            </li>
          );
        })}
      </ul>
      <p className="muted cv-health-hint">{wu.hpHint}</p>
    </aside>
  );
}
