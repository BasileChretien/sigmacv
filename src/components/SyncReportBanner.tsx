"use client";

import { useEffect, useState } from "react";
import {
  addedBySectionType,
  reviewEntries,
  SYNC_REPORT_SUMMARY_THRESHOLD,
  type SyncReport,
} from "@/lib/cv/syncReport";
import { sectionTitle, t, type Locale } from "@/lib/i18n";
import { workspaceUi } from "@/lib/i18n/workspaceUi";

/** Per-report dismissal (keyed by the report's syncedAt) survives reloads. */
export const SYNC_REPORT_DISMISS_KEY = "sigmacv:syncReportDismissed";

interface SyncReportBannerProps {
  report: SyncReport | null;
  locale: Locale;
  /** Held back by the onboarding sequencer so prompts don't stack. */
  suppressed?: boolean;
  /** Notifies the sequencer to advance to the next prompt. */
  onDismissed?: () => void;
  /** Jump the editor to an item — the "to review" pill cycles through the review
   *  candidates. When omitted, the review count renders as a static pill. */
  onFocusItem?: (itemId: string) => void;
}

/**
 * "What changed in your last sync" — makes the living-CV behaviour observable.
 * A re-sync that merges three new works into a 400-item document is otherwise
 * invisible; this surfaces the additions (and new review candidates) once, and
 * stays dismissed for that report. Renders nothing when the sync changed nothing.
 *
 * The review candidates are foregrounded (they're the only additions that need a
 * decision; new items are auto-included) and the "to review" pill jumps to each
 * in turn. Above {@link SYNC_REPORT_SUMMARY_THRESHOLD} additions the detail list
 * collapses to per-section counts so a big sync never floods the editor.
 */
export default function SyncReportBanner({
  report,
  locale,
  suppressed = false,
  onDismissed,
  onFocusItem,
}: SyncReportBannerProps) {
  const wu = workspaceUi(locale);
  // Start hidden and reveal after mount so SSR and the first client render
  // agree (the dismissal lives in localStorage, which the server can't read).
  const [visible, setVisible] = useState(false);
  // Which review candidate the next "to review" click jumps to (cycles, wrapping).
  const [reviewIdx, setReviewIdx] = useState(0);

  useEffect(() => {
    if (!report) return;
    try {
      setVisible(window.localStorage.getItem(SYNC_REPORT_DISMISS_KEY) !== report.syncedAt);
    } catch {
      setVisible(true); // storage unavailable — show it
    }
  }, [report]);
  // A fresh report restarts the review cycle from the first candidate.
  useEffect(() => {
    setReviewIdx(0);
  }, [report?.syncedAt]);

  if (suppressed || !report || !visible) return null;
  const changed = report.addedTotal > 0 || report.removedTotal > 0;
  if (!changed) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(SYNC_REPORT_DISMISS_KEY, report.syncedAt);
    } catch {
      /* non-fatal — the banner just reappears next visit */
    }
    onDismissed?.();
  };

  const syncedDate = new Date(report.syncedAt);
  const dateLabel = Number.isNaN(syncedDate.getTime())
    ? report.syncedAt
    : syncedDate.toLocaleDateString(locale);

  // Review candidates are the action-worthy additions → foreground them and let
  // the pill jump to each in turn. New (auto-included) items stay quiet.
  const reviews = reviewEntries(report);
  const canJumpReview = Boolean(onFocusItem) && reviews.length > 0;
  const cycleReview = () => {
    if (!canJumpReview) return;
    const entry = reviews[reviewIdx % reviews.length];
    if (entry) onFocusItem?.(entry.itemId);
    setReviewIdx((i) => i + 1);
  };

  // Many additions at once collapse to per-section counts instead of a long list.
  const summarize = report.addedTotal > SYNC_REPORT_SUMMARY_THRESHOLD;
  const sectionCounts = addedBySectionType(report);
  const extra = report.addedTotal - report.added.length; // > 0 only past the stored cap

  const reviewLabel = wu.srReview.replace("{n}", String(report.reviewCandidates));

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
            {report.reviewCandidates > 0 ? (
              canJumpReview ? (
                <button
                  type="button"
                  className="sync-pill is-review is-action"
                  onClick={cycleReview}
                  title={wu.srReviewJump}
                >
                  {reviewLabel} <span aria-hidden="true">→</span>
                </button>
              ) : (
                <span className="sync-pill is-review">{reviewLabel}</span>
              )
            ) : null}
            {report.addedTotal > 0 ? (
              <span className="sync-pill is-new">
                {wu.srAdded.replace("{n}", String(report.addedTotal))}
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
          {summarize ? (
            <p className="sync-report-summary">
              {sectionCounts.map((g, i) => (
                <span key={g.sectionType}>
                  {i > 0 ? " · " : ""}
                  {sectionTitle(locale, g.sectionType)} {g.count}
                </span>
              ))}
              {extra > 0 ? (
                <span className="muted"> · {wu.srMore.replace("{n}", String(extra))}</span>
              ) : null}
            </p>
          ) : (
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
          )}
        </details>
      ) : null}
    </aside>
  );
}
