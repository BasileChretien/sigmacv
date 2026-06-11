import nodemailer from "nodemailer";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/log";

/**
 * Thin outbound-mail wrapper over the SMTP transport Auth.js already uses for
 * magic-link sign-in (`EMAIL_SERVER` / `EMAIL_FROM`). Fail-SOFT by design: a
 * mail problem logs and returns false, it never throws into a caller — the
 * digest cron must keep walking its batch when one address bounces.
 */

export interface OutgoingMail {
  to: string;
  subject: string;
  /** Plain-text body (digests are deliberately text-only). */
  text: string;
  /** RFC 8058 one-click unsubscribe URL — set on every notification mail. */
  unsubscribeUrl?: string;
}

/** Whether outbound mail is configured at all (unset = the feature is dormant). */
export function isMailerConfigured(): boolean {
  const { EMAIL_SERVER, EMAIL_FROM } = getEnv();
  return Boolean(EMAIL_SERVER && EMAIL_FROM);
}

/** Send one mail. Returns false (and logs) on any failure; never throws. */
export async function sendMail(mail: OutgoingMail): Promise<boolean> {
  const { EMAIL_SERVER, EMAIL_FROM } = getEnv();
  if (!EMAIL_SERVER || !EMAIL_FROM) return false;
  try {
    const transport = nodemailer.createTransport(EMAIL_SERVER);
    await transport.sendMail({
      from: EMAIL_FROM,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      ...(mail.unsubscribeUrl
        ? {
            list: { unsubscribe: { url: mail.unsubscribeUrl, comment: "Unsubscribe" } },
            // One-click unsubscribe (RFC 8058) — mail clients POST to the URL.
            headers: { "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
          }
        : {}),
    });
    return true;
  } catch (err) {
    logger.error("email.send_failed", { err });
    return false;
  }
}
