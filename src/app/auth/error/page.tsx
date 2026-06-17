import type { Metadata } from "next";
import Link from "next/link";
import "@/components/landing/home.css";
import { DEFAULT_UI_LOCALE } from "@/lib/i18n";
import { landingStrings } from "@/lib/i18n/landing";

/**
 * Sign-in error page (Auth.js `pages.error`). Auth.js redirects here with
 * `?error=<code>` when an OAuth/email flow fails (provider down, state mismatch,
 * user-denied, expired link…). We map the known codes to friendly, branded copy
 * and offer a clear way forward — instead of Auth.js's bare default error screen.
 *
 * Conventions matched to the rest of the app:
 *  - Static, en-US copy (the single root <html lang="en"> covers it); `lang` is
 *    declared on the wrapper like the localized marketing components.
 *  - `noindex` — an error URL must never be crawled or surfaced in search.
 *  - Accessible: a single <h1>, the message carries `role="alert"`.
 *
 * Security: we render only our own mapped copy keyed off a whitelisted code. The
 * raw `?error` value is never echoed into the DOM, so it cannot leak provider
 * internals or be used for reflected injection.
 */

export const metadata: Metadata = {
  title: landingStrings(DEFAULT_UI_LOCALE).authError.metaTitle,
  // An error URL should never be indexed or followed.
  robots: { index: false, follow: false },
};

type ErrorCode = keyof ReturnType<typeof landingStrings>["authError"]["messages"];

/**
 * Auth.js surfaces several error codes; map each to one of our copy buckets.
 * Anything unrecognised falls through to "Default". Kept as a lookup (not a
 * passthrough) so an arbitrary query value can never select arbitrary copy.
 */
function resolveCode(raw: string | undefined): ErrorCode {
  switch (raw) {
    case "Configuration":
      return "Configuration";
    case "AccessDenied":
      return "AccessDenied";
    case "Verification":
      return "Verification";
    // Provider-initiation failures (reaching the IdP, building the request).
    case "OAuthSignin":
    case "EmailSignin":
    case "Signin":
      return "OAuthSignin";
    // Callback-stage failures (state mismatch, token exchange, account link).
    case "OAuthCallback":
    case "OAuthAccountNotLinked":
    case "Callback":
    case "OAuthCreateAccount":
    case "EmailCreateAccount":
    case "SessionRequired":
      return "OAuthCallback";
    default:
      return "Default";
  }
}

type SearchParams = { searchParams: Promise<{ error?: string | string[] }> };

export default async function AuthErrorPage({ searchParams }: SearchParams) {
  const loc = DEFAULT_UI_LOCALE;
  const s = landingStrings(loc);
  const e = s.authError;

  const { error } = await searchParams;
  const raw = Array.isArray(error) ? error[0] : error;
  const code = resolveCode(raw);

  return (
    <div className="hp2 hp2-auth-page" lang={loc}>
      <main className="hp2-auth-card" id="hp2-main">
        <span className="hp2-brand-mark hp2-auth-mark" aria-hidden="true">
          Σ
        </span>
        <h1 className="hp2-auth-title">{e.metaTitle}</h1>
        <p className="hp2-auth-intro">{e.intro}</p>
        <p className="hp2-auth-msg" role="alert">
          {e.messages[code]}
        </p>
        <p className="hp2-auth-hint">{e.useOrcidHint}</p>
        <div className="hp2-auth-actions">
          <Link className="hp2-btn hp2-btn-primary hp2-auth-btn" href="/">
            {e.tryAgain}
          </Link>
          <Link className="hp2-auth-link" href="/">
            {e.backHome}
          </Link>
        </div>
      </main>
    </div>
  );
}
