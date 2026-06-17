import type { Metadata } from "next";
import Link from "next/link";
import "@/components/landing/home.css";
import { DEFAULT_UI_LOCALE } from "@/lib/i18n";
import { landingStrings } from "@/lib/i18n/landing";

/**
 * Magic-link "check your inbox" confirmation (Auth.js `pages.verifyRequest`).
 * Auth.js redirects here after a successful `signIn("email", …)`, so the user
 * gets explicit feedback that a one-time link was sent instead of being dropped
 * back on the homepage. Email login is gated behind `EMAIL_LOGIN_ENABLED` (off
 * in prod) — this page is simply never reached while that's disabled.
 *
 * Same conventions as the error page: static en-US copy, `lang` on the wrapper,
 * `noindex`, a single <h1>.
 */

export const metadata: Metadata = {
  title: landingStrings(DEFAULT_UI_LOCALE).checkInboxTitle,
  robots: { index: false, follow: false },
};

export default function CheckEmailPage() {
  const loc = DEFAULT_UI_LOCALE;
  const s = landingStrings(loc);

  return (
    <div className="hp2 hp2-auth-page" lang={loc}>
      <main className="hp2-auth-card" id="hp2-main">
        <span className="hp2-brand-mark hp2-auth-mark" aria-hidden="true">
          Σ
        </span>
        <h1 className="hp2-auth-title">{s.checkInboxTitle}</h1>
        <p className="hp2-auth-msg" role="status">
          {s.checkInboxBody}
        </p>
        <div className="hp2-auth-actions">
          <Link className="hp2-auth-link" href="/">
            {s.authError.backHome}
          </Link>
        </div>
      </main>
    </div>
  );
}
