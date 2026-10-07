import { createHash } from "node:crypto";
import { PLAUSIBLE_INIT_SCRIPT } from "@/lib/analytics/plausibleInit";
import { THEME_INIT_SHA256 } from "@/lib/themeInit";

/**
 * The app-shell Content-Security-Policy string (set on every non-API route by
 * `src/proxy.ts`). The CV *document* (preview iframe, PDF, `/p/`) ships its own.
 *
 * Production has two `script-src` shapes, because Next can only put a nonce on a
 * page it renders per request:
 *
 *  - A route RENDERED PER REQUEST gets `'nonce-…' 'strict-dynamic'`. Next reads the
 *    nonce off the request's CSP header and stamps it on every script it emits.
 *
 *  - A PRERENDERED route (built once by `next build`, served as a file) has no
 *    nonce on any `<script>`. Under `'strict-dynamic'` the `'self'` allow-list is
 *    ignored, so that policy blocks every script Next emits for the page: no
 *    hydration, no analytics (the state of every prerendered page until 2026-10).
 *    Such a route gets, instead of `'strict-dynamic'`:
 *      · `'self'`, now effective, for Next's own chunk files;
 *      · the sha256 of each inline script in that page's built HTML — the caller
 *        passes them in (`prerenderedScripts.ts` reads them off the build output);
 *      · when analytics is configured, the analytics script's exact URL and the
 *        sha256 of its init stub, which `next/script` inserts after hydration.
 *    The nonce stays in the list: a request Next renders after all (a form posted
 *    to a server action without JavaScript bypasses the prerender) carries it on
 *    every script, and the page then works under the same policy.
 *
 * Neither shape allows `'unsafe-inline'` or `'unsafe-eval'` for scripts. The
 * prerendered shape is an allow-list rather than a nonce policy, and differs
 * from the nonce shape both ways. Looser: any script FILE on our own origin may
 * load. And a policy belongs to the document, not to the route: a visitor who
 * goes from a guide to the lookup, the preview or the editor by client-side
 * navigation is still under the guide's allow-list there. So what makes `'self'`
 * safe to allow is not that prerendered pages hold no user data. It is that our
 * origin serves no JavaScript-typed response carrying user-influenced content
 * (only Next's build files are scripts), and that every response the app serves
 * carries `X-Content-Type-Options: nosniff` (`next.config.ts`), so no JSON, page
 * or export can be run as a script (`e2e/production/csp.spec.ts` checks a sample
 * of those in a browser). A route that answers with a JavaScript type and
 * includes user data would break this; `tests/no-javascript-responses.test.ts`
 * fails when one is written. Stricter: a running script cannot add an inline
 * script whose hash is not listed, which `'strict-dynamic'` permits.
 *
 * Hence, when adding an inline `<Script>` anywhere in the app: its sha256 must be
 * listed in the prerendered shape (as the analytics stub is), or it will not run
 * on a prerendered page, nor after a client-side navigation that started on one.
 *
 * And when giving a page `revalidate`: its HTML then changes while the server
 * runs, so its hashes cannot be read off the build. It is sent the nonce shape
 * and its scripts stop running. `e2e/production/csp.spec.ts` fails on a build
 * that has such a page, so that this is decided, not discovered.
 */

/** Base64 sha256 of the analytics init stub, as `next/script` inserts it. */
const PLAUSIBLE_INIT_SHA256 = createHash("sha256")
  .update(PLAUSIBLE_INIT_SCRIPT, "utf8")
  .digest("base64");

/**
 * What of a URL a CSP can carry verbatim: `;` and `,` delimit the header, and
 * the URL parser lets both through in a host as well as in a path.
 */
const CSP_SAFE_HOST = /^[A-Za-z0-9.-]+$/;
const CSP_SAFE_PATH = /^[A-Za-z0-9/._~-]+$/;

interface AnalyticsSources {
  /** For `connect-src`: the tracker posts its events to this origin. */
  origin: string;
  /** For `script-src` on prerendered routes: the tracker script itself. */
  script: string;
}

/** The analytics origin and script source, or null when unset or unusable. */
function analyticsSources(src: string | undefined): AnalyticsSources | null {
  if (!src) return null;
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  // A host that would add a directive of its own is left out altogether.
  if (!CSP_SAFE_HOST.test(url.hostname)) return null;
  // The exact script when its path can be written in a CSP as is; the origin
  // otherwise (wider, never broken).
  const script = CSP_SAFE_PATH.test(url.pathname) ? url.origin + url.pathname : url.origin;
  return { origin: url.origin, script };
}

export interface CspOptions {
  /** `next dev`: HMR needs eval, inline scripts and a websocket. */
  isDev: boolean;
  /** This request's nonce (base64). */
  nonce: string;
  /** `NEXT_PUBLIC_PLAUSIBLE_SRC`: the analytics script URL, if configured. */
  analyticsSrc?: string;
  /**
   * Base64 sha256 of each inline script of the prerendered page this request
   * resolves to; null for a route rendered per request.
   */
  prerenderedScriptHashes?: readonly string[] | null;
}

function scriptSrc({ isDev, nonce, prerenderedScriptHashes }: CspOptions, script?: string): string {
  if (isDev) return "'self' 'unsafe-eval' 'unsafe-inline'";
  if (!prerenderedScriptHashes) {
    // The theme bootstrap is inline and static (no nonce), hence its hash.
    return `'self' 'nonce-${nonce}' 'sha256-${THEME_INIT_SHA256}' 'strict-dynamic'`;
  }
  const sources = [
    "'self'",
    `'nonce-${nonce}'`,
    ...prerenderedScriptHashes.map((hash) => `'sha256-${hash}'`),
  ];
  if (script) sources.push(`'sha256-${PLAUSIBLE_INIT_SHA256}'`, script);
  return sources.join(" ");
}

export function contentSecurityPolicy(options: CspOptions): string {
  const analytics = analyticsSources(options.analyticsSrc);
  // Self-hosted analytics lives on another origin and posts pageviews there with
  // fetch(), so that origin MUST be in connect-src — otherwise `connect-src
  // 'self'` silently blocks every event.
  const connectSrc = options.isDev
    ? "'self' ws: wss:"
    : `'self'${analytics ? ` ${analytics.origin}` : ""}`;

  return [
    "default-src 'self'",
    `script-src ${scriptSrc(options, analytics?.script)}`,
    // React inline style attributes (style={{…}}) need 'unsafe-inline'; the
    // security value of CSP is overwhelmingly in script-src anyway.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${connectSrc}`,
    // The live-preview is a sandboxed srcdoc <iframe>.
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}
