import { NextResponse, type NextRequest } from "next/server";

/**
 * App-shell Content-Security-Policy.
 *
 * The CV *document* (preview iframe + PDF) already ships its own strict CSP;
 * this header secures the Next.js app shell (landing + /cv editor). We use a
 * per-request nonce + `strict-dynamic` so Next can nonce its own hydration
 * scripts (it reads the CSP from the request header). In development we relax
 * script-src (HMR needs eval) and allow the HMR websocket, so the dev server
 * isn't broken — production gets the strict policy.
 *
 * Excludes /api (JSON), Next static assets, and /p/ (the public CV document,
 * which carries its own CSP) — see `config.matcher`.
 *
 * Next 16 renamed the `middleware` file convention to `proxy` (same request
 * interception, same `config` export); this is that file.
 */
export function proxy(request: NextRequest): NextResponse {
  const isDev = process.env.NODE_ENV !== "production";
  // Base64 of 16 RAW random bytes (128 bits) — stronger and more standard than
  // base64-ing the 36-char UUID *string* (which only encodes hex ASCII).
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));

  // Self-hosted analytics (Plausible) lives on a different origin and posts
  // pageviews there via fetch(), so its origin MUST be in connect-src — otherwise
  // the hardened `connect-src 'self'` silently blocks every event. Derived from
  // the configured script URL (build-time-inlined); unset/blank → no addition.
  let analyticsOrigin = "";
  try {
    const analyticsSrc = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC;
    if (analyticsSrc) analyticsOrigin = new URL(analyticsSrc).origin;
  } catch {
    analyticsOrigin = "";
  }

  const scriptSrc = isDev
    ? "'self' 'unsafe-eval' 'unsafe-inline'"
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;
  const connectSrc = isDev
    ? "'self' ws: wss:"
    : `'self'${analyticsOrigin ? ` ${analyticsOrigin}` : ""}`;

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
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

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next reads the request CSP to apply the nonce to its own scripts.
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|p/).*)",
    },
  ],
};
