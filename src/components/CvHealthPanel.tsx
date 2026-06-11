"use client";

import { useMemo } from "react";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { computeCvHealth } from "@/lib/cv/health";
import type { Locale } from "@/lib/i18n";
import { workspaceUi } from "@/lib/i18n/workspaceUi";

interface CvHealthPanelProps {
  cv: CanonicalCv;
  locale: Locale;
}

/**
 * Compact "needs your attention" checklist: outstanding review candidates,
 * unresolved duplicate hints, ORCID conflicts, and visible retracted works —
 * factual counts only (no score), so curation debt doesn't silently age inside
 * collapsed sections. Renders nothing when there is nothing to do.
 */
export default function CvHealthPanel({ cv, locale }: CvHealthPanelProps) {
  const wu = workspaceUi(locale);
  const health = useMemo(() => computeCvHealth(cv), [cv]);
  if (health.total === 0) return null;

  const rows = [
    { key: "review", count: health.pendingReviewCandidates, label: wu.hpReview },
    { key: "duplicates", count: health.pendingDuplicates, label: wu.hpDuplicates },
    { key: "conflicts", count: health.orcidConflicts, label: wu.hpConflicts },
    { key: "retracted", count: health.retractedVisible, label: wu.hpRetracted },
  ].filter((r) => r.count > 0);

  return (
    <aside className="cv-health-panel" role="note" aria-label={wu.hpTitle}>
      <strong className="cv-health-title">{wu.hpTitle}</strong>
      <ul className="cv-health-list">
        {rows.map((r) => (
          <li key={r.key}>{r.label.replace("{n}", String(r.count))}</li>
        ))}
      </ul>
      <p className="muted cv-health-hint">{wu.hpHint}</p>
    </aside>
  );
}
