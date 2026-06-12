import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/log";
import { asLocale } from "@/lib/i18n";
import { digestEmail } from "@/lib/i18n/digestEmail";
import { safeParseSyncReport, type SyncReport } from "@/lib/cv/syncReport";
import { isMailerConfigured, sendMail } from "./mailer";
import { buildConfirmToken, verifyConfirmToken } from "./confirmToken";
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

/**
 * Where a user's digests go: the CONFIRMED contact address first (the
 * double-opt-in notification email), else the Auth.js login email. An
 * UNCONFIRMED contact address is never used — null means undeliverable
 * (common for ORCID-only sign-ins, which rarely carry an email).
 */
export function digestAddress(user: {
  email: string | null;
  contactEmail: string | null;
  contactEmailVerifiedAt: Date | null;
}): string | null {
  if (user.contactEmail && user.contactEmailVerifiedAt) return user.contactEmail;
  return user.email ?? null;
}

export interface DigestRunSummary {
  /** False when EMAIL_SERVER/EMAIL_FROM are unset (feature dormant). */
  configured: boolean;
  considered: number;
  sent: number;
  /** Opted-in users whose report wasn't due (no changes / too recent / stale). */
  notDue: number;
  /** Opted-in users with no deliverable address (no login email, no CONFIRMED
   *  contact email) — the gap the contact-email field exists to close. */
  noAddress: number;
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
    noAddress: 0,
    failed: 0,
  };
  if (!summary.configured) return summary;

  const now = opts.now ?? new Date();
  const baseUrl = getEnv().AUTH_URL ?? "http://localhost:3000";
  const users = await prisma.user.findMany({
    where: { digestOptIn: true },
    select: {
      id: true,
      email: true,
      contactEmail: true,
      contactEmailVerifiedAt: true,
      digestSentAt: true,
      cv: { select: { lastSyncReport: true, document: true } },
    },
    take: opts.limit ?? DEFAULT_BATCH,
  });

  for (const user of users) {
    summary.considered++;
    const to = digestAddress(user);
    if (!to) {
      summary.noAddress++;
      continue;
    }
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

    const unsubscribeUrl = `${baseUrl}/api/email/unsubscribe?token=${buildUnsubscribeToken(user.id)}`;
    const content = buildDigestContent({
      report,
      locale,
      editorUrl: `${baseUrl}/cv`,
      unsubscribeUrl,
    });
    const ok = await sendMail({
      to,
      subject: content.subject,
      text: content.text,
      unsubscribeUrl,
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

/** Everything the account-controls digest UI needs (zeroed for unknown users). */
export interface DigestPrefs {
  optIn: boolean;
  /** The user-set notification address (pending or confirmed), if any. */
  contactEmail: string | null;
  /** Whether that address has been confirmed via the emailed link. */
  contactEmailVerified: boolean;
  /** The Auth.js login email — the fallback delivery address. */
  accountEmail: string | null;
}

/** The user's digest preferences (account page / editor toggle). */
export async function getDigestPrefs(userId: string): Promise<DigestPrefs> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { digestOptIn: true, contactEmail: true, contactEmailVerifiedAt: true, email: true },
  });
  return {
    optIn: row?.digestOptIn ?? false,
    contactEmail: row?.contactEmail ?? null,
    contactEmailVerified: Boolean(row?.contactEmail && row?.contactEmailVerifiedAt),
    accountEmail: row?.email ?? null,
  };
}

/** Set the digest opt-in (account-settings toggle; authenticated route). */
export async function setDigestOptIn(userId: string, optIn: boolean): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { digestOptIn: optIn } });
}

/**
 * Set (or clear, with "") the user's contact email. A new address is stored
 * PENDING — `contactEmailVerifiedAt` is reset and a confirmation link is
 * mailed to the address itself (double opt-in: digests only ever go to an
 * address whose owner clicked that link). Returns whether the confirmation
 * mail was handed to SMTP (false also when the mailer is unconfigured).
 */
export async function requestContactEmail(
  userId: string,
  email: string,
  locale: string,
): Promise<{ confirmationSent: boolean }> {
  if (email === "") {
    await prisma.user.update({
      where: { id: userId },
      data: { contactEmail: null, contactEmailVerifiedAt: null },
    });
    return { confirmationSent: false };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { contactEmail: email, contactEmailVerifiedAt: null },
  });

  const dg = digestEmail(asLocale(locale));
  const baseUrl = getEnv().AUTH_URL ?? "http://localhost:3000";
  const confirmUrl = `${baseUrl}/api/email/confirm?token=${buildConfirmToken(userId, email)}`;
  const confirmationSent = await sendMail({
    to: email,
    subject: dg.ceSubject,
    text: [dg.dgGreeting, "", dg.ceIntro, confirmUrl, "", dg.ceIgnore, ""].join("\n"),
  });
  return { confirmationSent };
}

/**
 * Confirm a contact email from the mailed link (no session — the signed token
 * is the authorization). Only succeeds while the token's address is STILL the
 * user's pending contact email, so a stale link can never verify an address
 * the user has since replaced. Idempotent for repeat clicks.
 */
export async function confirmContactEmailByToken(
  token: unknown,
  now = Date.now(),
): Promise<boolean> {
  const verified = verifyConfirmToken(token, now);
  if (!verified) return false;
  const { count } = await prisma.user.updateMany({
    where: { id: verified.userId, contactEmail: verified.email },
    data: { contactEmailVerifiedAt: new Date(now) },
  });
  return count > 0;
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
