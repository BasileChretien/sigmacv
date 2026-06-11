"use client";

import { useEffect, useState } from "react";
import type { SyncReport } from "@/lib/cv/syncReport";
import { sectionTitle, t, type Locale } from "@/lib/i18n";
import { workspaceUi } from "@/lib/i18n/workspaceUi";

/** Per-report dismissal (keyed by the report's syncedAt) survives reloads. */
const DISMISS_KEY = "sigmacv:syncReportDismissed";

interface SyncReportBannerProps {
  report: SyncReport | null;
  locale: Locale;
}

/**
 * "What changed in your last sync" — makes the living-CV behaviour observable.
 * A re-sync that merges three new works into a 400-item document is otherwise
 * invisible; this surfaces the additions (and new review candidates) once, and
 * stays dismissed for that report. Renders nothing when the sync changed nothing.
 */
export default function SyncReportBanner({ report, locale }: SyncReportBannerProps) {
  const wu = workspaceUi(locale);
  // Start hidden and reveal after mount so SSR and the first client render
  // agree (the dismissal lives in localStorage, which the server can't read).
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!report) return;
    try {
      setVisible(window.localStorage.getItem(DISMISS_KEY) !== report.syncedAt);
    } catch {
      setVisible(true); // storage unavailable — show it
    }
  }, [report]);

  if (!report || !visible) return null;
  const changed = report.addedTotal > 0 || report.removedTotal > 0;
  if (!changed) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, report.syncedAt);
    } catch {
      /* non-fatal — the banner just reappears next visit */
    }
  };

  const syncedDate = new Date(report.syncedAt);
  const dateLabel = Number.isNaN(syncedDate.getTime())
    ? report.syncedAt
    : syncedDate.toLocaleDateString(locale);

  return (
    <aside className="sync-report-banner container" role="status">
      <div className="sync-report-head">
        <strong>{wu.srLastSync}</strong>
        <span className="muted">{dateLabel}</span>
        {report.initial ? (
          <span className="sync-report-initial">
            {wu.srInitial.replace("{n}", String(report.addedTotal))}
          </span>
        ) : (
          <>
            {report.addedTotal > 0 ? (
              <span className="sync-pill is-new">
                {wu.srAdded.replace("{n}", String(report.addedTotal))}
              </span>
            ) : null}
            {report.reviewCandidates > 0 ? (
              <span className="sync-pill is-review">
                {wu.srReview.replace("{n}", String(report.reviewCandidates))}
              </span>
            ) : null}
            {report.removedTotal > 0 ? (
              <span className="sync-pill is-removed">
                {wu.srRemoved.replace("{n}", String(report.removedTotal))}
              </span>
            ) : null}
          </>
        )}
        <button
          type="button"
          className="icon-btn sync-report-dismiss"
          onClick={dismiss}
          aria-label={wu.srDismiss}
          title={wu.srDismiss}
        >
          ×
        </button>
      </div>
      {!report.initial && report.added.length > 0 ? (
        <details className="sync-report-details">
          <summary>{wu.srDetails}</summary>
          <ul className="sync-report-list">
            {report.added.map((e) => (
              <li key={e.itemId}>
                <span className="muted">{sectionTitle(locale, e.sectionType)}</span>
                {" — "}
                {e.title || wu.srNoTitle}
                {e.reviewFlag ? (
                  <span className="cv-review-badge sync-report-flag">
                    {t(locale, "reviewBadge")}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </aside>
  );
}
