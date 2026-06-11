import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/log";
import { asLocale } from "@/lib/i18n";
import { digestEmail } from "@/lib/i18n/digestEmail";
import { safeParseSyncReport, type SyncReport } from "@/lib/cv/syncReport";
import { isMailerConfigured, sendMail } from "./mailer";
import { buildUnsubscribeToken, verifyUnsubscribeToken } from "./unsubscribeToken";

/**
 * The opt-in re-sync digest: "your living CV picked up N changes" — the
 * retention loop that gives a synced-and-forgotten account a reason to return
 * (and review the disambiguation candidates). Strictly opt-in (default OFF),
 * per-user monthly at most, only when the latest sync actually changed
 * something, one-click unsubscribe in every mail (RFC 8058).
 *
 * The cron calls `sendDueDigests` daily; the per-user cadence below decides
 * who is due — so the schedule is robust to container restarts (a sleep-loop
 * cron that resets on deploy can never starve a 30-day interval).
 */

/** Per-user floor between two digests (~monthly, with slack for cron jitter). */
export const DIGEST_MIN_INTERVAL_MS = 25 * 24 * 60 * 60 * 1000;
/** How many new-item titles a digest lists before "…and {n} more". */
export const DIGEST_TITLES_MAX = 5;
const DEFAULT_BATCH = 200;

/**
 * Whether a user's latest sync report warrants a digest: it exists, is not the
 * first import (the user saw that in-session), reports actual changes, is
 * NEWER than the last digest, and the per-user monthly floor has passed.
 */
export function digestEligible(
  report: SyncReport | null,
  digestSentAt: Date | null,
  now: Date,
): report is SyncReport {
  if (!report || report.initial) return false;
  if (report.addedTotal === 0 && report.removedTotal === 0 && report.reviewCandidates === 0) {
    return false;
  }
  if (digestSentAt) {
    if (now.getTime() - digestSentAt.getTime() < DIGEST_MIN_INTERVAL_MS) return false;
    const syncedAt = Date.parse(report.syncedAt);
    if (!Number.isFinite(syncedAt) || syncedAt <= digestSentAt.getTime()) return false;
  }
  return true;
}

export interface DigestContent {
  subject: string;
  text: string;
}

/** Compose the (plain-text) digest mail for one report, in the CV's language. */
export function buildDigestContent(opts: {
  report: SyncReport;
  locale: string;
  editorUrl: string;
  unsubscribeUrl: string;
}): DigestContent {
  const { report, editorUrl, unsubscribeUrl } = opts;
  const dg = digestEmail(opts.locale);
  const n = (s: string, count: number) => s.replace("{n}", String(count));

  const lines: string[] = [dg.dgGreeting, "", dg.dgIntro, ""];
  if (report.addedTotal > 0) {
    lines.push(`• ${n(dg.dgAdded, report.addedTotal)}`);
    for (const entry of report.added.slice(0, DIGEST_TITLES_MAX)) {
      if (entry.title) lines.push(`    – ${entry.title}`);
    }
    if (report.addedTotal > DIGEST_TITLES_MAX) {
      lines.push(`    ${n(dg.dgMore, report.addedTotal - DIGEST_TITLES_MAX)}`);
    }
  }
  if (report.reviewCandidates > 0) lines.push(`• ${n(dg.dgReview, report.reviewCandidates)}`);
  if (report.removedTotal > 0) lines.push(`• ${n(dg.dgRemoved, report.removedTotal)}`);
  lines.push("", dg.dgCta, editorUrl, "", "—", dg.dgUnsub, unsubscribeUrl, "");

  return {
    subject: n(dg.dgSubject, report.addedTotal + report.removedTotal),
    text: lines.join("\n"),
  };
}

export interface DigestRunSummary {
  /** False when EMAIL_SERVER/EMAIL_FROM are unset (feature dormant). */
  configured: boolean;
  considered: number;
  sent: number;
  /** Opted-in users whose report wasn't due (no changes / too recent / stale). */
  notDue: number;
  failed: number;
}

/**
 * Send every due digest (bounded batch, sequential). Called by the internal
 * digest cron. `digestSentAt` is stamped ONLY on a successful send, so a
 * transient SMTP failure retries on the next run.
 */
export async function sendDueDigests(
  opts: { limit?: number; now?: Date } = {},
): Promise<DigestRunSummary> {
  const summary: DigestRunSummary = {
    configured: isMailerConfigured(),
    considered: 0,
    sent: 0,
    notDue: 0,
    failed: 0,
  };
  if (!summary.configured) return summary;

  const now = opts.now ?? new Date();
  const baseUrl = getEnv().AUTH_URL ?? "http://localhost:3000";
  const users = await prisma.user.findMany({
    where: { digestOptIn: true, email: { not: null } },
    select: {
      id: true,
      email: true,
      digestSentAt: true,
      cv: { select: { lastSyncReport: true, document: true } },
    },
    take: opts.limit ?? DEFAULT_BATCH,
  });

  for (const user of users) {
    summary.considered++;
    const report = safeParseSyncReport(user.cv?.lastSyncReport ?? null);
    if (!digestEligible(report, user.digestSentAt, now)) {
      summary.notDue++;
      continue;
    }
    // The digest speaks the CV's own language. Read the locale leniently from
    // the stored document (validated at write time); asLocale() neutralizes
    // anything unexpected to en-US — no need to parse the whole document.
    const rawLocale = (user.cv?.document as { display?: { locale?: unknown } } | null)?.display
      ?.locale;
    const locale = asLocale(typeof rawLocale === "string" ? rawLocale : undefined);

    const content = buildDigestContent({
      report,
      locale,
      editorUrl: `${baseUrl}/cv`,
      unsubscribeUrl: `${baseUrl}/api/email/unsubscribe?token=${buildUnsubscribeToken(user.id)}`,
    });
    const ok = await sendMail({
      to: user.email!,
      subject: content.subject,
      text: content.text,
      unsubscribeUrl: `${baseUrl}/api/email/unsubscribe?token=${buildUnsubscribeToken(user.id)}`,
    });
    if (ok) {
      summary.sent++;
      await prisma.user.update({ where: { id: user.id }, data: { digestSentAt: now } });
    } else {
      summary.failed++;
    }
  }

  logger.info("email.digest_run", { ...summary });
  return summary;
}

/** The user's digest opt-in flag (false when the user is unknown). */
export async function getDigestOptIn(userId: string): Promise<boolean> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { digestOptIn: true },
  });
  return row?.digestOptIn ?? false;
}

/** Set the digest opt-in (account-settings toggle; authenticated route). */
export async function setDigestOptIn(userId: string, optIn: boolean): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { digestOptIn: optIn } });
}

/**
 * One-click unsubscribe by signed token (no session). Idempotent; true when
 * the token verified (even if the user row is already gone — the outcome the
 * clicker wanted holds either way).
 */
export async function unsubscribeByToken(token: unknown): Promise<boolean> {
  const userId = verifyUnsubscribeToken(token);
  if (!userId) return false;
  await prisma.user.updateMany({ where: { id: userId }, data: { digestOptIn: false } });
  return true;
}
